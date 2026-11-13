"""바인더#3 검토본 사건 26건(data/binder3_cases.json)으로 시연 예약을 다시 만든다(2026-11-13).

원본은 binder3-static/data.js 였다. 정적 검토본을 지우면서 사건·구성원만 data/ 로 옮겼다.

검토본은 26건이 모두 「홍길동 · 11-01 14:00 · 서초 본사 3번 상담실」이라 YK-OS 방문 예정 목록에서
구분되지 않는다. 사건 내용(문항·지위·맞춤 설명·상담 변호사·전문 인력 명단)은 그대로 두고
고객명은 가명으로, 시각은 하루 두 날 30분 간격으로, 상담실은 세 곳으로 나눈다.

실행: python3 tools/import_binder3.py  → server/data · app/public/data 의 bookings·lawyers·advisors·portraits
그다음 python3 tools/snapshot.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTS = [ROOT / "server" / "data", ROOT / "app" / "public" / "data"]
SITE = "https://www.yklawfirm.co.kr/"

# 가명 26개. 실제 의뢰인 이름을 쓰지 않는다(AGENTS 전제 6).
NAMES = [
    "한지우", "오세린", "문태오", "서하람", "윤도겸", "임채원", "강시후", "백나연", "조은호", "신유나",
    "권하준", "남궁별", "황보람", "차은솔", "류지안", "탁서진", "모하늘", "변시온", "석다온", "우라희",
    "진태율", "편소율", "길예준", "도해솔", "구민채", "여은결",
]
DAYS = [("2026-11-02", "월"), ("2026-11-03", "화")]
LOCATION = "서초 본사"
ROOMS = ["1번", "2번", "3번"]
# YK-OS 콜 중분류 가운데 형사(YKOS.jsx 「형사」 탭과 같은 목록).
CRIMINAL = {"강력범죄", "경제범죄", "고소, 고발", "교통범죄", "군형사", "도박", "마약범죄", "부패범죄", "성범죄", "소년사건", "일반형사", "학교폭력"}
# 선임 계약 화면(SignForm)을 보여 줄 수 있게 상담 내용 작성을 마친 예약. 약정금표가 있는 사건 종류만.
WROTE = {"divorce", "dui"}
# 콜 단계에서 상담 변호사를 정해 두지 않은 예약. 실장이 YK-OS에서 지정해야 바인더가 열린다.
UNASSIGNED = {"inherit", "admin", "religion", "gambling", "juvenile"}


def load_binder3() -> dict:
    return json.loads((ROOT / "data" / "binder3_cases.json").read_text(encoding="utf-8"))


def read(name: str):
    return json.loads((OUTS[0] / name).read_text(encoding="utf-8"))


def write(name: str, value) -> None:
    body = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    for out in OUTS:
        (out / name).write_text(body, encoding="utf-8")


def main() -> None:
    d = load_binder3()
    field_code = {v[0]: k for k, v in read("fields.json")["FIELD"].items()}
    fee = read("fee.json")
    people = d["people"]

    # 검토본 순서는 민사·가사 다음 형사라, 그대로 나누면 하루가 한쪽뿐이다. 엇갈려 두 날 모두 형사·민가사가 섞이게 한다.
    civil = [c for c in d["cases"] if c["middle"] not in CRIMINAL]
    crim = [c for c in d["cases"] if c["middle"] in CRIMINAL]
    mixed = [c for pair in zip(civil, crim) for c in pair] + civil[len(crim):] + crim[len(civil):]

    bookings = []
    for i, c in enumerate(mixed):
        day, dow = DAYS[i // 13]
        minutes = 9 * 60 + (i % 13) * 30
        time = f"{minutes // 60:02d}:{minutes % 60:02d}"
        room = ROOMS[i % len(ROOMS)]
        counsel = people[c["counsel"]]["name"]
        b = {
            "id": str(229001 + i),
            "key": c["id"],
            "name": NAMES[i],
            "tel": f"010-0000-{4101 + i * 37:04d}",
            "date": day,
            "at": f"{day} ({dow}) {time}",
            "time": time,
            "branch": f"{LOCATION} {room} 상담실",
            "location": LOCATION,
            "room": room,
            "type": "개인",
            "role": "사건 당사자",
            "rel": "",
            "cat1": c["middle"],
            "cat2": c["small"],
            "field": field_code.get(c["field"]) or field_code.get(c["middle"]) or "K",
            "feeKey": c["small"] if c["small"] in fee else "",
            "court": "",
            "form": "신규",
            "inflow": "유선상담",
            "kw": "",
            # 검토본의 더미 콜 내용. 고객 화면에는 쓰지 않는다.
            "memo": [line.lstrip("• ").strip() for line in c["call"].splitlines() if line.strip()],
            # 1뎁스: 검토본 문항(네/아니오로 답하는 질문형).
            "summary": c["questions"],
            # 콜 내용으로 고른 지위(검토본 Gemma 결과). 고객이 태블릿에서 바꿀 수 있다.
            "party": c.get("party") or "",
            # 맞춤 설명: rewriteRole 지위에서, 쓰인 문항에 모두 「네」면 그 단계 설명을 바꾼다.
            "rewriteRole": c.get("rewriteRole") or "",
            "rewrites": c.get("rewrites") or [],
            "counsel": counsel,
            "seniors": [people[k]["name"] for k in c["seniors"]],
            # 검토본 명단은 YK-OS 6칸 규칙 결과라 다시 고르지 않는다(catalog.seniors_for fixed).
            "seniorsFixed": True,
            "wrote": c["id"] in WROTE,
        }
        if c["id"] in UNASSIGNED:
            b["counselAssigned"] = False
        bookings.append(b)
    write("bookings.json", bookings)

    # 검토본 명단 가운데 이 저장소에 프로필이 없는 3명을 더한다.
    lawyers = read("lawyers.json")
    advisors = read("advisors.json")
    known = {l["n"] for l in lawyers} | {a["n"] for a in advisors}
    for p in people.values():
        if p["name"] in known:
            continue
        known.add(p["name"])
        if p.get("group") == "expert":
            label = (p.get("titles") or [""])[0]
            advisors.append({"n": p["name"], "r": p["position"], "c": label, "titles": p.get("titles") or [],
                             "career": p.get("career") or [], "photo": False, "quote": p.get("greeting") or ""})
        else:
            lawyers.append({
                "n": p["name"],
                "f": [field_code[f] for f in p.get("fields") or [] if f in field_code],
                "pos": p["position"],
                "o": "",
                "d": {
                    "edu": " · ".join(p.get("education") or []),
                    "exam": p.get("qualification") or "",
                    "tr": "",
                    "career": p.get("career") or [],
                    "cases": p.get("performance") or [],
                    "quote": p.get("greeting") or "",
                    "titles": p.get("titles") or [],
                },
                "photo": False,
            })
    write("lawyers.json", lawyers)
    write("advisors.json", advisors)

    # 사진이 없는 구성원은 검토본처럼 홈페이지 공개 프로필 사진 주소를 쓴다.
    portraits = read("portraits.json")
    for p in people.values():
        if p.get("photo") and p["name"] not in portraits:
            portraits[p["name"]] = SITE + p["photo"].lstrip("/")
    write("portraits.json", portraits)
    print(f"bookings {len(bookings)} · lawyers {len(lawyers)} · advisors {len(advisors)} · portraits {len(portraits)}")


if __name__ == "__main__":
    main()
