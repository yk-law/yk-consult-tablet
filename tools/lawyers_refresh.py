"""변호사 프로필을 홈페이지 구성원 상세에서 다시 받아 lawyers.json·profile_extra.json 에 채운다(2026-11-13).

고재완 11-13 「모든 변호사 프로필 전부 실제 데이터로」. 홈페이지 https://www.yklawfirm.co.kr/member/all 의
구성원 목록에서 이름으로 id를 찾고 /member/lawyer/<id> 상세의 대표 경력·학력·경력·주요 업무 실적·논문 및 저서·
수상 실적·인사말을 가져온다. 이메일·전화는 받지 않는다. 홈페이지에 없는 항목은 기존 값을 그대로 둔다.

실행: python3 tools/lawyers_refresh.py  → server/data · app/public/data 의 lawyers.json·profile_extra.json
그다음 python3 tools/snapshot.py
"""
import json
import re
import time
from pathlib import Path

from advisors_refresh import BASE, fetch, member_ids, text_lines

ROOT = Path(__file__).resolve().parents[1]
OUTS = [ROOT / "server" / "data", ROOT / "app" / "public" / "data"]
SECTIONS = {
    "대한변호사협회 등록 전문분야", "대표 경력", "업무분야", "학력", "경력", "주요 업무 실적",
    "논문 및 저서", "수상 실적", "자격 취득",
}
TABS = {"학력/경력", "의뢰인 후기"}
# 「업무사례」 제목이 나오면 사례 카드 목록이라 그 뒤는 보지 않는다(사례는 works_refresh.py 몫).
STOP = "업무사례"


def detail(name: str, member_id: str) -> dict:
    lines = text_lines(fetch(f"{BASE}/member/lawyer/{member_id}"))
    body = lines[lines.index("구성원 상세") + 1:]
    body = body[: body.index(name, 1)] if name in body[1:] else body
    quote = ""
    if "&quot;" in body:
        a = body.index("&quot;")
        b = body.index("&quot;", a + 1)
        quote = " ".join(body[a + 1: b])
    sections: dict[str, list[str]] = {}
    current = None
    for line in body[2:]:
        if "@" in line or line == "&quot;" or line == quote:
            continue
        if line in TABS:
            continue
        # 탭 줄(학력/경력 · 주요 업무 실적 · 업무사례 · 의뢰인 후기)의 「업무사례」는 건너뛰고, 학력·경력을 읽은 뒤의 「업무사례」에서 멈춘다.
        if line == STOP:
            if sections.get("학력") or sections.get("경력"):
                break
            continue
        if line in SECTIONS:
            current = line
            sections.setdefault(current, [])
        elif current:
            sections[current].append(line)
    return {"quote": quote, **sections}


def exam_and_training(lines: list[str]) -> tuple[str, str]:
    exam = next((x for x in lines if re.search(r"사법시험|변호사시험|군법무관\s*임용\s*시험", x)), "")
    tr = next((x for x in lines if "사법연수원" in x and re.search(r"\d+\s*기", x)), "")
    return exam, tr


def main() -> None:
    ids = member_ids()
    lawyers = json.loads((OUTS[0] / "lawyers.json").read_text(encoding="utf-8"))
    extra = json.loads((OUTS[0] / "profile_extra.json").read_text(encoding="utf-8"))
    filled = 0
    for l in lawyers:
        member_id = ids.get(l["n"])
        if not member_id:
            continue
        try:
            d = detail(l["n"], member_id)
        except Exception as e:  # 한 사람 실패로 전체를 멈추지 않는다
            print("skip", l["n"], e)
            continue
        time.sleep(0.3)
        cur = dict(l.get("d") or {})
        edu = d.get("학력") or []
        career = d.get("경력") or []
        if edu:
            cur["edu"] = " · ".join(x for x in edu if not re.search(r"사법시험|변호사시험|사법연수원", x))
        exam, tr = exam_and_training(edu + career)
        if exam:
            cur["exam"] = exam
        if tr:
            cur["tr"] = tr
        if career:
            cur["career"] = [x for x in career if x not in (exam, tr)]
        if d.get("주요 업무 실적"):
            cur["cases"] = d["주요 업무 실적"]
        if d.get("대표 경력"):
            cur["titles"] = d["대표 경력"]
        if d["quote"]:
            cur["quote"] = d["quote"]
        if cur:
            l["d"] = cur
        e = dict(extra.get(l["n"]) or {})
        e["profile"] = f"{BASE}/member/lawyer/{member_id}"
        if d.get("논문 및 저서"):
            e["papers"] = d["논문 및 저서"]
        if d.get("수상 실적"):
            e["awards"] = d["수상 실적"]
        extra[l["n"]] = e
        filled += 1
    for out in OUTS:
        (out / "lawyers.json").write_text(json.dumps(lawyers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (out / "profile_extra.json").write_text(json.dumps(extra, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"lawyers {len(lawyers)} · 홈페이지 상세 {filled}")


if __name__ == "__main__":
    main()
