"""목업 카탈로그 — 추천 점수와 계약서 초안은 여기서 계산한다."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

DATA = Path(__file__).resolve().parent / "data"

ROLE_HINT = {
    "사건 당사자": "본인 사건으로 오셨습니다",
    "사건 위임인": "당사자를 대신해 위임하러 오셨습니다",
    "추천인": "다른 분을 소개하러 오셨습니다",
    "기타": "그 밖의 사유로 오셨습니다",
}


def load(name: str):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


@lru_cache
def catalog() -> dict:
    fields = load("fields.json")
    return {
        "bookings": load("bookings.json"),
        "lawyers": load("lawyers.json"),
        "advisors": load("advisors.json"),
        "fee": load("fee.json"),
        "scenarios": load("scenarios.json"),
        "firm": load("firm.json"),
        "sign": load("sign.json"),
        "cases": load("cases.json"),
        "reviews": load("reviews.json"),
        "portraits": load("portraits.json"),
        "videos": load("videos.json"),
        "profileExtra": load("profile_extra.json"),
        "FIELD": fields["FIELD"],
        "NEAR": fields["NEAR"],
        "roleHint": ROLE_HINT,
        "counts": {"lawyers": 318, "advisors": 98, "offices": 31},
    }


def booking(bid: str) -> dict | None:
    return next((b for b in catalog()["bookings"] if b["id"] == bid or b["name"] == bid), None)


def lawyer(name: str) -> dict | None:
    return next((l for l in catalog()["lawyers"] if l["n"] == name), None)


def fee_for(key: str) -> dict:
    fee = catalog()["fee"]
    return fee.get(key) or fee["__all"]


def score(l: dict, field: str, court: str) -> dict:
    cat = catalog()
    parts: dict = {}
    s = 0
    hit = field in l["f"]
    if hit:
        s += 100
        parts["field"] = 100
    near = [c for c in cat["NEAR"].get(field, []) if c in l["f"]]
    if near:
        parts["near"] = min(len(near) * 8, 24)
        s += parts["near"]
    d = l.get("d") or {}
    blob = " ".join(d.get("career") or []) + " " + " ".join(x.get("t", "") for x in d.get("links") or [])
    court_hit = bool(d and court in blob)
    if court_hit:
        s += 40
        parts["court"] = 40
    pv = {"대표변호사": 10, "파트너변호사": 6, "고문변호사": 4}.get(l["pos"], 0)
    if pv:
        s += pv
        parts["pos"] = pv
    if d:
        s += 6
        parts["detail"] = 6
    s += len(l["f"])
    return {"s": s, "parts": parts, "court": court_hit, "hit": hit, "near": near}


def reasons(l: dict, field: str, court: str) -> list[dict]:
    cat = catalog()
    sc = score(l, field, court)
    out = []
    if sc["hit"]:
        out.append({"t": cat["FIELD"][field][0] + " 담당"})
    if sc["court"]:
        out.append({"t": court + " 근무 이력"})
    if sc["near"]:
        out.append({"t": "관련 " + " · ".join(cat["FIELD"][c][0] for c in sc["near"][:2]), "k": "s"})
    if l.get("o"):
        out.append({"t": l["o"] + " 출신", "k": "s"})
    return out[:3]


def hay(l: dict) -> str:
    cat = catalog()
    p = [l["n"], l["pos"], l.get("o") or ""]
    p += [cat["FIELD"][c][0] + " " + cat["FIELD"][c][1] for c in l["f"] if c in cat["FIELD"]]
    d = l.get("d") or {}
    if d:
        p += [d.get("edu") or "", d.get("tr") or "", " ".join(d.get("career") or []), " ".join(d.get("cases") or [])]
    return " ".join(p)


def ranked(field: str, court: str, q: str = "", limit: int = 25) -> list[dict]:
    rows = catalog()["lawyers"]
    if q:
        ql = q.lower()
        rows = [l for l in rows if ql in hay(l).lower()]
    else:
        rows = [l for l in rows if field in l["f"]]
    rows = sorted(rows, key=lambda l: (-score(l, field, court)["s"], l["n"]))
    out = []
    for l in rows[:limit]:
        item = {**l, "score": score(l, field, court), "reasons": reasons(l, field, court)}
        item.pop("d", None)  # 목록에는 상세 본문을 빼 용량을 줄인다. photo 키는 유지.
        out.append(item)
    return out


def contract_for(b: dict, favs: list[str] | None = None) -> dict:
    fee = fee_for(b["feeKey"])
    criminal = bool(re.search(r"형사|고소", b["cat1"]))
    opp = {
        "손해배상": "상대 운전자 (가명)",
        "사실혼관계해소": "사실혼 상대방 (가명)",
        "이혼": "배우자 (가명)",
        "양육비": "전 배우자 (가명)",
        "대여금": "차용인 (가명)",
        "경제범죄고소": "피의자 (가명)",
    }.get(b["cat2"], "상대방 (가명)")
    if re.search(r"가사", b["cat1"]):
        org1 = "본사 가사팀"
    elif re.search(r"고소|형사", b["cat1"]):
        org1 = "본사 형사팀"
    elif re.search(r"기업", b["cat1"]):
        org1 = "본사 기업법무팀"
    else:
        org1 = "본사 민사팀"
    opinion = f"{b['cat1']} {b['cat2']} 수행 요청. 상담은 {b['branch']}."
    if favs:
        opinion += f" 고객 관심 변호사: {' · '.join(favs)}."
    return {
        "engId": b["id"],
        "template": "criminal" if criminal else "civil",
        "major": b["cat1"],
        "minor": b["cat2"],
        "civil": not criminal,
        "caseNo": "미접수",
        "caseName": f"{b['cat1']} > {b['cat2']}",
        "client": b["name"],
        "opponent": opp,
        "jurisdiction": b["court"],
        "litigationAmount": "",
        "retainer": {
            "timing": "소송위임계약시",
            "amount": fee["mid"],
            "vat": "별도",
            "installments": "",
            "method": "계좌이체",
            "feeN": fee["n"],
            "feeKey": b["feeKey"],
        },
        "success": {
            "timing": "합의시(조정시)\n또는 판결\n정본영수시",
            "fixed": "",
            "pct": "10",
            "vat": "별도",
        },
        "travel": {"daily": "", "deposit": ""},
        "delegation": f"{b['cat1']} {b['cat2']} 사건의 처리(당해 심급)",
        "special": "",
        "phone": b["tel"],
        "email": "",
        "address": "",
        "agreement": ["delegation"],
        "fee": ["retainer", "success"],
        "org1": org1,
        "org2": "",
        "org3": "",
        "opinion": opinion,
    }


SENIOR_POS = {"대표변호사", "파트너변호사"}
SENIOR_MARK = ("부장판사", "부장검사", "대법관", "검사장", "고검장", "지검장")


def is_senior(l: dict) -> bool:
    """내부 전관 정의. 고객 화면 카피에는 이 말을 쓰지 않는다."""
    if (l.get("pos") or "") not in SENIOR_POS:
        return False
    o = l.get("o") or ""
    return any(m in o for m in SENIOR_MARK)


def is_specialist_lawyer(l: dict) -> bool:
    if (l.get("pos") or "") == "고문변호사":
        return True
    return is_senior(l)


def frame_of(l: dict, role: str | None = None) -> str:
    """사진 프레임. 변호사 직위 우열 + 고문·위원 별도."""
    pos = l.get("pos") or ""
    r = role or l.get("r") or ""
    if pos == "대표변호사":
        return "rep"
    if pos == "고문변호사":
        return "counsel"
    if pos == "파트너변호사":
        return "partner"
    if r == "고문":
        return "advisor"
    if r == "전문위원":
        return "expert"
    if r == "자문위원":
        return "consultant"
    return "assoc"


def profile_bits(name: str) -> dict:
    """홈페이지 수상·업무사례·논문. 이메일·전화·결과는 넣지 않는다."""
    extra = (catalog().get("profileExtra") or {}).get(name) or {}
    awards = [a for a in (extra.get("awards") or []) if a]
    papers = []
    for a in extra.get("papers") or []:
        t = " ".join(str(a).split())
        if t:
            papers.append(t)
    areas = []
    for a in extra.get("areas") or []:
        group = " ".join((a.get("group") or "").split())
        area_name = " ".join((a.get("name") or "").split())
        if group and area_name:
            areas.append({"group": group, "name": area_name})
    works = []
    for w in extra.get("works") or []:
        title = " ".join((w.get("title") or "").split())
        href = w.get("href") or ""
        if title and href.startswith("https://www.yklawfirm.co.kr/case/"):
            works.append({"title": title, "href": href})
    return {"awards": awards, "works": works, "areas": areas, "papers": papers}


# 프레임 색 우열 (대표 > 고문변호사 > 파트너 > …). 시각 등급용 — 바꾸지 않음.
FRAME_RANK = {
    "rep": 0,
    "counsel": 1,
    "partner": 2,
    "assoc": 3,
    "advisor": 4,
    "expert": 5,
    "consultant": 6,
}

# 전문인력 그리드 나열 순서 (2026-09-22). 프레임 색 우열과 별개.
# 대표 > 파트너 > 고문변호사 > 고문 > 전문위원. 자문위원은 목록에서 빼 둠 (2026-09-22).
LIST_RANK = {
    "rep": 0,
    "partner": 1,
    "counsel": 2,
    "assoc": 3,
    "advisor": 4,
    "expert": 5,
    "consultant": 6,
}

ADVISOR_ROLE_ORDER = ("고문", "전문위원")


# 같은 직군이면 가장 높은 직위만. 긴 직함부터 맞춰 부장검사가 검사로 깎이지 않게 한다.
_TITLE_FAMILIES = (
    ("court", ("대법관", "헌법재판관", "법원행정처장", "고등법원장", "법원장", "수석부장판사", "부장판사", "판사")),
    ("pros", ("검찰총장", "고검장", "지검장", "검사장", "차장검사", "부장검사", "검사")),
    ("police", ("경찰청장", "치안정감", "치안감", "경무관", "총경", "경정", "경감", "경위", "경사", "경장", "순경")),
)


def _title_rank(title: str):
    stem = (title or "").replace("역임", "").strip()
    found = None
    for fam, ranks in _TITLE_FAMILIES:
        for i, rank in enumerate(ranks):
            if stem == rank or stem.endswith(rank):
                if found is None or len(rank) > found[0]:
                    found = (len(rank), fam, i)
    if not found:
        return None
    return found[1], found[2]


def prominent_titles(titles) -> list:
    """동일 직군(법원·검찰·경찰)은 최고 직위 하나만. 다른 직군끼리는 모두 남긴다."""
    best = {}
    order = []
    rest = []
    for t in titles or []:
        hit = _title_rank(t)
        if not hit:
            rest.append(t)
            continue
        fam, idx = hit
        if fam not in best:
            order.append(fam)
            best[fam] = (idx, t)
        elif idx < best[fam][0]:
            best[fam] = (idx, t)
    return [best[fam][1] for fam in order] + rest


def public_profile(l: dict) -> dict:
    """고객 화면용. 처분권자 접점(links)은 빼 둔다."""
    d = l.get("d") or {}
    clips = {c["name"]: c for c in catalog()["videos"]["clips"]}
    clip = clips.get(l["n"])
    bits = profile_bits(l["n"])
    return {
        "n": l["n"],
        "pos": l["pos"],
        "o": l.get("o") or "",
        "f": l.get("f") or [],
        "edu": d.get("edu") or "",
        "exam": d.get("exam") or "",
        "tr": d.get("tr") or "",
        "career": d.get("career") or [],
        "cases": d.get("cases") or [],
        "awards": bits["awards"],
        "works": bits["works"],
        "areas": bits["areas"],
        "papers": bits["papers"],
        "quote": (d.get("quote") or "").strip(),
        "titles": prominent_titles(d.get("titles") or []),
        "photo": bool(l.get("photo")),
        "videoId": clip["id"] if clip else None,
        "videoTitle": clip["title"] if clip else None,
        "grade": frame_of(l),
        "kind": "lawyer",
        "pitch": pitch_of(l),
    }


def pitch_of(l: dict) -> str:
    q = " ".join(((l.get("d") or {}).get("quote") or l.get("quote") or "").split())
    if q:
        return q
    return "내 일처럼 진심을 다하겠습니다."


def helper_view(b: dict) -> dict:
    """고객 태블릿 사건요약. 네 칸 구조(관계·경과·입장·확인하고 싶은 점)는 유지하되 어체는 고객향."""
    role = f"{b['role']} · {b['rel']}" if b.get("rel") else b.get("role") or ""
    sections = b.get("overview") or []
    return {
        "engId": b["id"],
        "title": "말씀하신 내용을 이렇게 정리했습니다",
        "facts": b.get("memo") or [],
        "sections": sections,
        "emptyNote": b.get("memoNote") or "",
        "rows": [
            ["사건 종류", f"{b['cat1']} > {b['cat2']}"],
            ["관할", b.get("court") or ""],
            ["고객 유형", b.get("type") or ""],
            ["고객 역할", role],
            ["방문", b.get("at") or ""],
            ["상담실", b.get("branch") or ""],
        ],
    }


def advisor_cards() -> list[dict]:
    """예시로 고문·전문위원 각 1인. 자문위원은 빼 둔다."""
    portraits = catalog()["portraits"]
    by_role = {}
    for a in catalog()["advisors"]:
        r = a.get("r") or ""
        if r not in ADVISOR_ROLE_ORDER or r in by_role:
            continue
        label = (a.get("c") or "").strip()
        titles = prominent_titles([t for t in (a.get("titles") or ([label] if label else [])) if t])
        career = list(a.get("career") or [])
        quote = " ".join((a.get("quote") or "").split())
        highlight = next((line for line in career if line and line != label), "")
        # 기업자문·경찰 경력 같은 분류 라벨 자리에는 경력 하이를 올린다.
        if highlight and (not titles or set(titles) <= {label}):
            titles = [highlight]
        if quote and quote != label and quote not in titles:
            pitch = quote
        else:
            rest = [line for line in career if line not in titles and line != label]
            pitch = rest[0] if rest else ""
        if not career and label:
            career = [label]
        tags = [label] if label and label not in titles else []
        bits = profile_bits(a["n"])
        by_role[r] = {
            "n": a["n"],
            "pos": r,
            "o": "",
            "f": [],
            "edu": "",
            "exam": "",
            "tr": "",
            "career": career,
            "cases": [],
            "awards": bits["awards"],
            "works": [],
            "areas": [],
            "papers": bits["papers"],
            "quote": pitch,
            "titles": titles,
            "tags": tags,
            "photo": a["n"] in portraits,
            "videoId": None,
            "videoTitle": None,
            "grade": frame_of({}, r),
            "kind": "advisor",
            "pitch": pitch,
            "reasons": [],
            "match": "advisor",
        }
        if len(by_role) == len(ADVISOR_ROLE_ORDER):
            break
    return [by_role[r] for r in ADVISOR_ROLE_ORDER if r in by_role]


def seniors_for(field: str, court: str, limit: int = 5, counsel_name: str | None = None) -> tuple[list[dict], str]:
    """전문인력. 내부적으로는 전관 변호사 + 고문변호사 + 고문·위원."""
    cat = catalog()
    scored = []
    for l in cat["lawyers"]:
        if not is_specialist_lawyer(l):
            continue
        sc = score(l, field, court)
        if not (sc["hit"] or sc["near"] or sc["court"]):
            continue
        p = public_profile(l)
        p["reasons"] = reasons(l, field, court)
        p["match"] = "field" if sc["hit"] else ("court" if sc["court"] else "near")
        p["_s"] = sc["s"]
        p["_court"] = sc["court"]
        p["_list"] = LIST_RANK.get(p["grade"], 9)
        scored.append(p)
    if any(x["match"] == "field" for x in scored):
        scored = [x for x in scored if x["match"] == "field"]
    scored.sort(key=lambda x: (
        x["_list"],
        0 if x["match"] == "field" else 1 if x["match"] == "court" else 2,
        0 if x["_court"] else 1,
        -x["_s"],
        x["n"],
    ))
    out = scored[:limit]
    if counsel_name:
        pinned = next((x for x in scored if x["n"] == counsel_name), None)
        if pinned and all(x["n"] != counsel_name for x in out):
            out = out[: max(limit - 1, 0)] + [pinned]
        # 포함만 보장하고 나열 순서(LIST_RANK)는 유지
        out.sort(key=lambda x: (
            x["_list"],
            0 if x["match"] == "field" else 1 if x["match"] == "court" else 2,
            0 if x["_court"] else 1,
            -x["_s"],
            x["n"],
        ))
        out = out[:limit]
    for x in out:
        x.pop("_s", None)
        x.pop("_court", None)
        x.pop("_list", None)
    # 변호사 뒤에 예시 고문·전문위원
    out = out + advisor_cards()
    return out, "법무법인 YK의 전문인력입니다"


def seniors() -> list[dict]:
    return [public_profile(l) for l in catalog()["lawyers"] if is_senior(l)]


def visit_for(bid: str | None = None) -> dict:
    c = catalog()
    b = booking(bid) if bid else c["bookings"][0]
    if not b:
        return {}
    counsel = lawyer(b.get("counsel") or "")
    senior_rows, senior_headline = seniors_for(b.get("field") or "K", b.get("court") or "", counsel_name=b.get("counsel"))
    portraits = c["portraits"]
    names = {b.get("counsel")} | {s["n"] for s in senior_rows}
    return {
        "booking": b,
        "helper": helper_view(b),
        "counsel": public_profile(counsel) if counsel else None,
        "seniors": senior_rows,
        "seniorHeadline": senior_headline,
        "videos": c["videos"],
        "FIELD": c["FIELD"],
        "counts": c["counts"],
        "portraits": {n: portraits[n] for n in names if n and n in portraits},
        "bookings": [{"id": x["id"], "name": x["name"], "at": x["at"], "cat2": x["cat2"]} for x in c["bookings"]],
    }

