"""바인더#3 정적 화면의 고정 데이터를 만든다. YKOS 백엔드 폴더에서 실행한다.

    cd ~/sources/YKOS/apps/backend
    python ~/sources/yk-consult-tablet/binder3-static/_build/build_data.py

콜 내용은 dummy_cases.json 의 더미다. 변호사·전문 인력·YK 소개·사례는 DB 와 홈페이지 공개 정보다.
"""
import concurrent.futures as cf
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, ".")
logging.disable(logging.WARNING)

from sqlalchemy import text  # noqa: E402

from db.database import SessionLocal  # noqa: E402
from services import visit_binder_confirm_service as confirm  # noqa: E402
from services.visit_binder_case_body import load_case_body  # noqa: E402
from services.visit_binder_counsel_service import load_counsel_view  # noqa: E402
from services.visit_binder_firm_service import get_firm_view_cached  # noqa: E402
from services.visit_binder_seniors_service import load_seniors_view  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "data.js"
TOPICS = Path("../console/src/pages/visit/binder3/binder3Topics.json")
VISIT_LABEL = "2026년 11월 1일 (일) 오후 2:00"
PLACE_LABEL = "서초 본사 3번 상담실"
CUSTOMER = "홍길동"
LAWYER_COUNT = 10
MAX_WORKS = 8
FIELD_ALIASES = {"민사·행정": "민사", "가사상속(가업승계)": "가사상속", "부동산/건설": "부동산·건설", "기업": "기업법무", "군법무": "군형사"}


def norm(value):
    return "".join(str(value).split())


def find_topic(table, small, middle):
    key = table["_alias"].get(small, small)
    if key and not key.startswith("_") and key in table:
        return key, table[key]
    middle_key = norm(table["_middle_alias"].get(middle, middle))
    for name, topic in table["_middle"].items():
        if norm(name) == middle_key:
            return f"_middle:{name}", topic
    return "_default", table["_default"]


def role_steps(topic, role):
    source = topic if not role or role == topic.get("base_role") else topic["roles"][role]
    return [tuple(step) for step in source["steps"]]


def roles_of(topic):
    if not topic.get("base_role"):
        return [""]
    return list(dict.fromkeys([topic["base_role"], *(topic.get("roles") or {})]))


def category_of(db, small, middle):
    row = db.execute(
        text(
            "SELECT homepage_category_1 FROM incident_category "
            "WHERE small_category = :small AND middle_category = :middle LIMIT 1"
        ),
        {"small": small, "middle": middle},
    ).first()
    name = (row[0] or "").strip() if row else ""
    return FIELD_ALIASES.get(name, name)


def choose_lawyers(db, fields):
    """사건 분야를 넓게 덮도록 사례가 많은 변호사 10명을 고른다."""
    rows = db.execute(
        text(
            """
            SELECT l.emp_id FROM lawyer l
            LEFT JOIN homepage_common_code m ON m.seq = l.common_code_membership_classification_child_id_seq
            WHERE l.deleted = 0 AND l.use_status = 'ENABLED' AND l.emp_id IS NOT NULL
              AND m.name IN ('대표변호사', '파트너변호사', '변호사')
            ORDER BY l.seq
            """
        )
    ).fetchall()
    views = {}
    for (emp_id,) in rows:
        view = load_counsel_view(db, int(emp_id))
        if view and view.get("photo") and view.get("works"):
            views[int(emp_id)] = view
    chosen = []
    for field in fields:
        if len(chosen) >= LAWYER_COUNT:
            break
        if any(field in views[e]["fields"] for e in chosen):
            continue
        fit = [e for e, v in views.items() if field in v["fields"] and e not in chosen]
        if fit:
            chosen.append(max(fit, key=lambda e: len(views[e]["works"])))
    for emp_id in sorted(views, key=lambda e: -len(views[e]["works"])):
        if len(chosen) >= LAWYER_COUNT:
            break
        if emp_id not in chosen:
            chosen.append(emp_id)
    return {e: views[e] for e in chosen}


def main():
    cases = json.loads((HERE / "dummy_cases.json").read_text(encoding="utf-8"))
    table = json.loads(TOPICS.read_text(encoding="utf-8"))
    db = SessionLocal()
    firm = get_firm_view_cached(db)
    # 공개 구성원 수는 DB 집계 대신 브랜드사이트의 노출 기준을 사용한다.
    brand = json.loads((HERE / "brand_members.json").read_text(encoding="utf-8"))
    firm["stats"].update(members=brand["members"], asOf=brand["asOf"])
    advisors = {person["name"]: person for person in firm["advisors"]}
    for person in brand["additionalAdvisors"]:
        advisors.setdefault(person["name"], person)
    firm["advisors"] = list(advisors.values())
    for case in cases:
        case["field"] = category_of(db, case["small"], case["middle"])
    lawyers = choose_lawyers(db, [c["field"] for c in cases if c["field"]])
    print("변호사", [v["name"] for v in lawyers.values()], flush=True)

    used = {e: 0 for e in lawyers}
    people = {f"lawyer-{e}": v for e, v in lawyers.items()}
    topics = {}
    out = []
    for case in cases:
        fit = [e for e, v in lawyers.items() if case["field"] in v["fields"]] or list(lawyers)
        counsel = min(fit, key=lambda e: used[e])
        used[counsel] += 1
        seniors = []
        for person in load_seniors_view(db, case["field"], counsel, f"static-{case['id']}"):
            key = f"p-{person['name']}-{person['position']}"
            people.setdefault(key, person)
            seniors.append(key)
        topic_key, topic = find_topic(table, case["small"], case["middle"])
        topics[topic_key] = topic
        source = confirm.ConfirmSource(
            category=" > ".join(x for x in (case["field"], case["middle"], case["small"]) if x),
            party_roles=("사건 당사자",),
            call_content=case["call"],
            report={},
        )
        material = confirm.build_material(source)
        questions = confirm.generate_questions(material, confirm._gemma_ask(0))
        party, role, items = "", "", []
        if questions:
            roles = roles_of(topic)
            options = [(r, role_steps(topic, r)) for r in roles]
            party = confirm.generate_party(material, [o for o in options if o[0] and o[0] != "공통"])
            role = party or ("공통" if "공통" in roles else roles[0])
            items = confirm.generate_rewrites(role, questions, role_steps(topic, role))
        out.append(
            {
                "id": case["id"],
                "customerName": CUSTOMER,
                "visitLabel": VISIT_LABEL,
                "placeLabel": PLACE_LABEL,
                "field": case["field"],
                "middle": case["middle"],
                "small": case["small"],
                "call": case["call"],
                "topic": topic_key,
                "questions": questions,
                "party": party,
                "rewriteRole": role,
                "rewrites": items,
                "counsel": f"lawyer-{counsel}",
                "seniors": seniors,
            }
        )
        print(case["id"], case["field"], "문항", len(questions), "지위", party or "-", "설명", len(items), flush=True)
    db.close()

    ids = sorted({w["id"] for p in people.values() for w in p.get("works", []) if w.get("href")})
    bodies = {}

    def fetch(case_id):
        try:
            return case_id, load_case_body(case_id)
        except Exception:  # noqa: BLE001 - 못 받은 사례는 목록에서 뺀다
            return case_id, None

    with cf.ThreadPoolExecutor(6) as pool:
        for case_id, body in pool.map(fetch, ids):
            if body:
                bodies[str(case_id)] = body
    print("사례", len(bodies), "/", len(ids), flush=True)
    for person in people.values():
        works = person.get("works", [])
        person["works"] = [w for w in works if w.get("href") and str(w["id"]) in bodies][:MAX_WORKS]
    kept = {str(w["id"]) for p in people.values() for w in p["works"]}
    bodies = {k: v for k, v in bodies.items() if k in kept}

    data = {
        "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "firm": firm,
        "topics": topics,
        "people": people,
        "caseBodies": bodies,
        "cases": out,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"), default=str).replace("</", "<\\/")
    # 홈페이지 원본 학력 오타를 고객 화면에서만 바로잡는다(11-12 UI 점검).
    payload = payload.replace("대학교  법학전문대학교", "대학교 법학전문대학원").replace("법학전문대학교", "법학전문대학원")
    OUT.write_text(f"window.BINDER3_DATA = {payload};\n", encoding="utf-8")
    print("저장", OUT, OUT.stat().st_size, flush=True)


if __name__ == "__main__":
    main()
