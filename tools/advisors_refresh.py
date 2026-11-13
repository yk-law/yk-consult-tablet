"""고문·전문위원 상세를 홈페이지 구성원 상세에서 다시 받아 advisors.json 에 채운다(2026-11-13).

POC 데이터에는 고문·전문위원 경력이 한 줄(「정부기관 경력」 등)뿐이라, 상담에 함께 들어올 때(시연 피드백 4번)
소개 화면이 비어 보였다. 홈페이지 https://www.yklawfirm.co.kr/member/all 의 구성원 목록에서 이름으로 id를 찾고
/member/advisory/<id> 상세의 대표 경력·학력·경력·주요 업무 실적·수상 실적·인사말을 가져온다. 이메일은 받지 않는다.

실행: python3 tools/advisors_refresh.py  → server/data · app/public/data 의 advisors.json
그다음 python3 tools/snapshot.py
"""
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTS = [ROOT / "server" / "data", ROOT / "app" / "public" / "data"]
BASE = "https://www.yklawfirm.co.kr"
UA = "Mozilla/5.0 (YK consult-tablet POC data refresh)"
SECTIONS = {"대표 경력", "업무분야", "주요 업무 실적", "수상 실적", "학력", "경력", "논문", "저서"}
TABS = {"학력/경력", "업무사례", "의뢰인 후기"}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def text_lines(html: str) -> list[str]:
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", html, flags=re.S)
    t = re.sub(r"<[^>]+>", "\n", t).replace("&amp;", "&")
    return [x.strip() for x in t.split("\n") if x.strip()]


def member_ids() -> dict[str, str]:
    """구성원 목록 페이지에 실린 JSON에서 이름 → id."""
    s = fetch(BASE + "/member/all").replace('\\"', '"')
    ids: dict[str, str] = {}
    for m in re.finditer(r'\{"id":(\d+),"name":"([^"]+)","imagesUrl":"', s):
        ids.setdefault(m.group(2), m.group(1))
    return ids


def detail(name: str, member_id: str) -> dict:
    lines = text_lines(fetch(f"{BASE}/member/advisory/{member_id}"))
    body = lines[lines.index("구성원 상세") + 1:]
    # 본문 끝에 이름·직함이 한 번 더 나온다. 그 앞까지만 본다.
    body = body[: body.index(name, 1)] if name in body[1:] else body
    quote = ""
    if "&quot;" in body:
        a = body.index("&quot;")
        b = body.index("&quot;", a + 1)
        quote = " ".join(body[a + 1: b])
    sections: dict[str, list[str]] = {}
    current = None
    for line in body[2:]:
        if "@" in line or line == "&quot;" or line in TABS or line == quote:
            continue
        if line in SECTIONS:
            current = line
            sections.setdefault(current, [])
        elif current:
            sections[current].append(line)
    return {"quote": quote, **sections}


def main() -> None:
    ids = member_ids()
    advisors = json.loads((OUTS[0] / "advisors.json").read_text(encoding="utf-8"))
    filled = 0
    for a in advisors:
        member_id = ids.get(a["n"])
        if not member_id:
            continue
        d = detail(a["n"], member_id)
        time.sleep(0.4)
        if d.get("대표 경력"):
            a["titles"] = d["대표 경력"]
        if d.get("경력"):
            a["career"] = d["경력"]
        if d.get("학력"):
            a["edu"] = " · ".join(d["학력"])
        if d.get("주요 업무 실적"):
            a["cases"] = d["주요 업무 실적"]
        if d.get("수상 실적"):
            a["awards"] = d["수상 실적"]
        if d["quote"] and not a.get("quote"):
            a["quote"] = d["quote"]
        filled += 1
    for out in OUTS:
        (out / "advisors.json").write_text(json.dumps(advisors, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"advisors {len(advisors)} · 홈페이지 상세 {filled}")


if __name__ == "__main__":
    main()
