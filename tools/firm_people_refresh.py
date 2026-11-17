"""YK 소개 탭(법원·검찰·경찰 경력 변호사, 지사 소속 변호사)과 분야별 전문 센터를 홈페이지 기준으로 채운다(2026-11-17).

고재완 11-17(강주용 2차 내부 시연 피드백): 탭은 법원 경력 변호사 / 검찰 경력 변호사 / 경찰 경력 변호사 / 고문 및 전문위원 / 방문한 사무소 변호사.
법원·검찰·경찰은 한 사람이 한 탭에만(법원 > 검찰 > 경찰 순으로 먼저 걸린 곳). 방문 사무소 탭은 이 공통 탭과 겹치지 않는 사람.
순서는 탭마다 직함(대표 → 고문 → 파트너 → 변호사), 같은 직함 안은 사법연수원 기수 → 로스쿨(변시 회차) → 기수 모름.
- 구성원: https://www.yklawfirm.co.kr/member/lawyer 에 실린 JSON(lawyers 312명, 경력 구분·직함·사진).
- 지사: /location/all 의 분사무소 링크 → /office/<지역>/<지사> 상세에 나온 분사무소장·변호사. 주사무소는 뺀다.
- 센터: 홈페이지 아래 「센터」 목록 이름 그대로. 묶음(형사·가사·민사 · 기업·노동 · 산업)은 CENTER_GROUPS.

실행: python3 tools/firm_people_refresh.py  → server/data · app/public/data 의 firm_intro.json
그다음 python3 tools/snapshot.py
"""
import json
import re
import time
from pathlib import Path

from advisors_refresh import BASE, fetch, text_lines

ROOT = Path(__file__).resolve().parents[1]
OUTS = [ROOT / "server" / "data", ROOT / "app" / "public" / "data"]
# 군판사·군검사·군사경찰 경력은 각 탭에 넣지 않는다.
TABS = [
    ("bench", re.compile(r"(?<!군)판사|대법관|재판관|법원 경력")),
    ("prosecution", re.compile(r"(?<!군)검사 역임|(?<!군)검사장|고검장")),
    ("policeLawyers", re.compile(r"(?<!군사)경찰 경력")),
]
MAIN_OFFICE = "서울 강남 주사무소"
CENTER_GROUPS = {
    "형사": ["형사센터", "군형사센터", "교통사고센터", "성범죄센터", "마약센터", "학교폭력센터"],
    "가사": ["이혼센터", "가사상속센터"],
    "민사 · 기업": ["기업총괄센터", "법인 회생·파산센터", "부동산·건설센터", "민사센터", "환경·에너지전략센터"],
    "노동 · 산업": ["노동센터", "의료센터", "중대재해센터"],
}


def rsc(page: str) -> str:
    return "".join(json.loads(f'"{c}"') for c in re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)</script>', page, re.S))


def lawyers() -> list[dict]:
    raw = rsc(fetch(f"{BASE}/member/lawyer"))
    at = raw.index('"lawyers":[') + len('"lawyers":')
    rows, _ = json.JSONDecoder().raw_decode(raw[at:])

    def resolve(v):
        # "$8:props:lawyers:0:careerClassification:0" 처럼 앞에 나온 값을 가리키는 참조를 푼다.
        if isinstance(v, str) and v.startswith("$8:props:lawyers:"):
            o = rows
            for k in v.split(":")[3:]:
                o = o[int(k)] if k.isdigit() else o[k]
            return resolve(o)
        return v

    out = []
    for r in rows:
        careers = [resolve(c)["name"] for c in r.get("careerClassification") or []]
        pos = resolve(r.get("commonCodeMembershipClassificationChild")) or {}
        out.append({"n": r["name"], "pos": pos.get("name", ""), "careers": careers,
                    "tr": r.get("judicialTrainingClass") or 0, "bar": r.get("barExamClass") or 0,
                    "photo": f"{BASE}{r['imagesUrl']}" if r.get("imagesUrl") else ""})
    # 탭마다 직함 순(대표 → 고문 → 파트너 → 변호사), 같은 직함 안에서는 사법연수원 기수 → 로스쿨(변시 회차) → 기수 모름(고재완 11-17).
    # 같은 기수는 홈페이지 구성원 순서. sorted는 안정 정렬이라 홈페이지 순서가 그대로 남는다.
    rank = {"대표변호사": 0, "고문변호사": 1, "파트너변호사": 2, "변호사": 3}
    return sorted(out, key=lambda p: (rank.get(p["pos"], 4),) + ((0, p["tr"]) if p["tr"] else (1, p["bar"]) if p["bar"] else (2, 0)))


def offices() -> list[tuple[str, str]]:
    page = fetch(f"{BASE}/location/all")
    hrefs = list(dict.fromkeys(re.findall(r'(/office/[a-z-]+/[a-z-]+)', page)))
    out = []
    for href in hrefs:
        lines = text_lines(fetch(BASE + href))
        name = next((x for x in lines if x.endswith("분사무소 | 법무법인 YK")), "").split(" | ")[0]
        if name:
            out.append((name, href))
        time.sleep(0.3)
    return out


def office_members(href: str, known: set[str]) -> list[str]:
    lines = text_lines(fetch(BASE + href))
    stop = lines.index("전체 구성원 보기") if "전체 구성원 보기" in lines else len(lines)
    return [x for i, x in enumerate(lines[:stop]) if x in known and i + 1 < stop and lines[i + 1].endswith(("분사무소장", "변호사"))]


def centers() -> list[dict]:
    lines = text_lines(fetch(f"{BASE}/member/lawyer"))
    a = lines.index("브랜드사이트") + 1
    names = lines[a: lines.index("전국 사무소", a) - 1]
    group_of = {c: g for g, cs in CENTER_GROUPS.items() for c in cs}
    unknown = [n for n in names if n not in group_of]
    if unknown:
        raise SystemExit(f"CENTER_GROUPS에 없는 센터: {unknown}")
    return [{"t": g, "centers": [{"n": n} for n in names if group_of[n] == g]} for g in CENTER_GROUPS]


def main() -> None:
    people = lawyers()
    by_name = {p["n"]: p for p in people}
    firm = json.loads((OUTS[0] / "firm_intro.json").read_text(encoding="utf-8"))
    placed: set[str] = set()
    photos = dict(firm.get("photos") or {})
    for key, rule in TABS:
        rows = []
        for p in people:
            hit = next((c for c in p["careers"] if rule.search(c)), "")
            if hit and p["n"] not in placed:
                rows.append({"n": p["n"], "pos": p["pos"], "title": hit})
                placed.add(p["n"])
        firm[key] = rows
    # 방문 사무소 탭(고재완 11-17): 위 공통 탭(법원·검찰·경찰, 고문 및 전문위원)과 겹치지 않는, 고객이 방문한 사무소의 변호사.
    # 분사무소는 홈페이지 분사무소 상세의 구성원. 주사무소(서울 강남)는 상세에 구성원 목록이 없어,
    # 어느 분사무소에도 없는 변호사를 주사무소 소속으로 본다(추정).
    placed |= {a["n"] for a in (firm.get("advisors") or []) + (firm.get("police") or [])}
    branches = []
    in_branch: set[str] = set()
    for office, href in offices():
        members = set(office_members(href, set(by_name)))
        in_branch |= members
        rows = [{"n": p["n"], "pos": p["pos"], "title": office} for p in people if p["n"] in members and p["n"] not in placed]
        if rows:
            branches.append({"office": office, "people": rows})
        time.sleep(0.3)
    main_rows = [{"n": p["n"], "pos": p["pos"], "title": MAIN_OFFICE} for p in people if p["n"] not in in_branch and p["n"] not in placed]
    branches.insert(0, {"office": MAIN_OFFICE, "people": main_rows})
    shown = {r["n"] for k, _ in TABS for r in firm[k]} | {r["n"] for g in branches for r in g["people"]}
    firm["branches"] = branches
    for n in shown:
        if by_name[n]["photo"]:
            photos[n] = by_name[n]["photo"]
    firm["photos"] = photos
    firm["centerGroups"] = centers()
    # 위 숫자 「분야별 전문 센터 N개」도 아래 센터 목록 수와 맞춘다(옛 값 18 ≠ 홈페이지 16).
    for x in firm["stats"]:
        if x["label"] == "분야별 전문 센터":
            x["n"] = sum(len(g["centers"]) for g in firm["centerGroups"])
    for out in OUTS:
        (out / "firm_intro.json").write_text(json.dumps(firm, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("법원", len(firm["bench"]), "검찰", len(firm["prosecution"]), "경찰", len(firm["policeLawyers"]),
          "지사", sum(len(b["people"]) for b in branches), f"({len(branches)}곳)",
          "센터", sum(len(g["centers"]) for g in firm["centerGroups"]))


if __name__ == "__main__":
    main()
