"""YK 소개 「업무사례」 탭에 보일 홈페이지 업무사례를 받아 firm_cases.json 에 채운다(2026-11-16).

실제 서비스에서는 강주용님이 사건 태그로 업무사례를 불러온다. POC는 profile_extra.works 에 모아 둔
홈페이지 /case-study/<분류>/<번호> 상세에서 분류·의뢰인 지위·제목·부제·날짜·담당 변호사·태그·요약·
사건 결과 요약(사건 유형·쟁점·결과·대응 포인트)을 가져와 같은 모양으로 둔다. HTML 원문은 저장하지 않는다.

실행: python3 tools/firm_cases_refresh.py  → server/data · app/public/data 의 firm_cases.json
그다음 python3 tools/snapshot.py
"""
import html as html_lib
import json
import re
import time
from pathlib import Path

from advisors_refresh import fetch, text_lines

ROOT = Path(__file__).resolve().parents[1]
OUTS = [ROOT / "server" / "data", ROOT / "app" / "public" / "data"]
CASE_RE = re.compile(r"/case-study/([a-z0-9-]+)/(\d+)")


def clean(s: str) -> str:
    return html_lib.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def summary_rows(page: str) -> dict:
    rows = re.findall(r'<th class="case-summary-label[^"]*"[^>]*>(.*?)</th><td class="case-summary-value[^"]*">(.*?)</td>', page, re.S)
    return {clean(k): clean(v) for k, v in rows}


def detail(href: str) -> dict:
    page = fetch(href)
    lines = text_lines(page)
    head = lines[lines.index("상세") + 1:]
    title_at = next(i for i, x in enumerate(head) if " | " in x)
    cat, role = head[0], head[1] if title_at > 1 else ""
    title, _, sub = head[title_at].partition(" | ")
    rest = head[title_at + 1:]
    date = rest[0] if re.fullmatch(r"\d{4}\.\d{2}\.\d{2}", rest[0]) else ""
    lawyers, tags = [], []
    for x in rest[1 if date else 0:]:
        if x == "YK SUCCESS CASE":
            break
        if x == "#":
            continue
        if x.endswith("변호사") and not tags:
            lawyers.append(x.removesuffix("변호사").strip())
        else:
            tags.append(x)
    lead = re.search(r'<p class="preview-lead">(.*?)</p>', page, re.S)
    overview = re.search(r'<div class="lead" id="section-overview">(.*?)</div>', page, re.S)
    body = [clean(lead.group(1))] if lead else []
    if overview:
        body += [clean(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", overview.group(1), re.S)]
    rows = summary_rows(page)
    role_value = re.search(r'<span class="case-role-value">(.*?)</span>', page)
    m = CASE_RE.search(href)
    return {
        "id": m.group(2), "key": m.group(1), "href": href,
        "cat": cat, "role": clean(role_value.group(1)) if role_value else role,
        "title": title.strip(), "sub": sub.strip(), "date": date,
        "lawyers": lawyers, "tags": tags, "body": [b for b in body if b],
        "kind": rows.get("사건 유형", ""), "issue": rows.get("쟁점", ""),
        "result": rows.get("결과", ""), "point": rows.get("대응 포인트", ""),
    }


def main() -> None:
    extra = json.loads((OUTS[0] / "profile_extra.json").read_text(encoding="utf-8"))
    hrefs = list(dict.fromkeys(w["href"] for v in extra.values() for w in v.get("works") or [] if CASE_RE.search(w["href"])))
    cases = []
    for href in hrefs:
        try:
            cases.append(detail(href))
        except Exception as e:  # 한 건 실패로 전체를 멈추지 않는다
            print("skip", href, e)
        time.sleep(0.3)
    cases.sort(key=lambda c: c["date"], reverse=True)
    for out in OUTS:
        (out / "firm_cases.json").write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"firm_cases {len(cases)} / {len(hrefs)}")


if __name__ == "__main__":
    main()
