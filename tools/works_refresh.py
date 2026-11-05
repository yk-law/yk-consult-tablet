"""변호사 홈페이지 상세의 case-study 목록으로 profile_extra.works 를 갱신한다.

각 변호사의 profile URL 에서 /case-study/<분류>/<번호> 링크를 순서대로 모으고
(최대 6건), 사례 페이지에서 제목·요약을 채운다. 옛 /case/ 항목은 페이지에
없으면 빠진다. HTML 원문은 저장하지 않는다.

    python3 tools/works_refresh.py
"""
from __future__ import annotations

import html as html_lib
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "server" / "data" / "profile_extra.json"
PUBLIC = ROOT / "app" / "public" / "data" / "profile_extra.json"

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
BASE = "https://www.yklawfirm.co.kr"
CASE_RE = re.compile(r"^/case-study/([a-z0-9-]+)/(\d+)/?$")
TITLE_SUFFIX = " | 법무법인 YK"
MAX_WORKS = 6
SLEEP = 0.35

# 요약에 실명·사건번호·연락처가 보이면 s 를 비운다.
PII_RE = re.compile(
    r"("
    r"01[016789]-?\d{3,4}-?\d{4}"  # 휴대전화
    r"|\d{2,3}-\d{3,4}-\d{4}"  # 일반전화
    r"|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"  # 이메일
    r"|\d{4}\s*[가-힣]{1,4}\s*\d{2,6}"  # 사건번호 (2024고단1234 등)
    r"|[가-힣]{2,4}\s*(?:씨|님|씨께서|님께서)"  # 실명 호칭
    r")"
)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def sleep() -> None:
    time.sleep(SLEEP)


def abs_case_href(href: str) -> str | None:
    if not href:
        return None
    full = urljoin(BASE + "/", href.strip())
    parsed = urlparse(full)
    if parsed.hostname != "www.yklawfirm.co.kr":
        return None
    m = CASE_RE.match(parsed.path or "")
    if not m:
        return None
    return f"{BASE}/case-study/{m.group(1)}/{m.group(2)}"


def collect_case_hrefs(profile_html: str) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in re.findall(r"""href=["']([^"']+)["']""", profile_html, flags=re.I):
        href = abs_case_href(raw)
        if not href or href in seen:
            continue
        seen.add(href)
        out.append(href)
        if len(out) >= MAX_WORKS:
            break
    return out


def meta_content(html: str, name: str) -> str:
    pat = re.compile(
        rf"""<meta[^>]+(?:name|property)=["']{re.escape(name)}["'][^>]*content=["']([^"']*)["']"""
        rf"""|<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']{re.escape(name)}["']""",
        re.I,
    )
    m = pat.search(html)
    if not m:
        return ""
    return html_lib.unescape((m.group(1) or m.group(2) or "").strip())


def page_title(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, flags=re.I | re.S)
    if not m:
        return ""
    title = html_lib.unescape(re.sub(r"\s+", " ", m.group(1)).strip())
    if title.endswith(TITLE_SUFFIX):
        title = title[: -len(TITLE_SUFFIX)].rstrip()
    return title


def first_body_summary(html: str) -> str:
    """본문 앞쪽 p 태그에서 네비/메타가 아닌 첫 요약 문장을 고른다."""
    for raw in re.findall(r"<p[^>]*>(.*?)</p>", html, flags=re.I | re.S):
        text = html_lib.unescape(re.sub(r"<[^>]+>", " ", raw))
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) < 40:
            continue
        if text.startswith("YK ") or "HOME" in text[:20]:
            continue
        return text
    return ""


def summarize(desc: str) -> str:
    text = re.sub(r"\s+", " ", (desc or "").strip())
    if not text:
        return ""
    # 문장 단위로 1~2문장, 120자 이내
    parts = re.split(r"(?<=[.。!?？])\s+", text)
    picked: list[str] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        cand = " ".join(picked + [part]).strip()
        if len(cand) > 120:
            if not picked:
                return part[:120].rstrip()
            break
        picked.append(part)
        if len(picked) >= 2:
            break
    out = " ".join(picked).strip()
    return out[:120].rstrip() if out else text[:120].rstrip()


def scrub_summary(s: str) -> str:
    if not s:
        return ""
    if PII_RE.search(s):
        return ""
    return s


def fetch_work(href: str) -> dict | None:
    try:
        html = fetch(href)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"  ! fetch fail {href}: {e}")
        return None
    title = page_title(html)
    if not title:
        return None
    desc = meta_content(html, "description") or meta_content(html, "og:description")
    if not desc:
        desc = first_body_summary(html)
    s = scrub_summary(summarize(desc))
    item = {"title": title, "href": href}
    if s:
        item["s"] = s
    return item


def refresh_lawyer(name: str, entry: dict) -> list[dict]:
    profile = (entry.get("profile") or "").strip()
    if not profile:
        print(f"- {name}: profile 없음 → works []")
        return []
    print(f"- {name}: {profile}")
    sleep()
    try:
        profile_html = fetch(profile)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"  ! profile fail: {e}")
        return list(entry.get("works") or [])
    hrefs = collect_case_hrefs(profile_html)
    print(f"  case-study {len(hrefs)}건")
    works: list[dict] = []
    for href in hrefs:
        sleep()
        item = fetch_work(href)
        if item:
            works.append(item)
            print(f"  + {item['title'][:60]}")
    return works


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    for name, entry in data.items():
        if not isinstance(entry, dict):
            continue
        entry["works"] = refresh_lawyer(name, entry)
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    SRC.write_text(text, encoding="utf-8")
    if PUBLIC.parent.is_dir():
        PUBLIC.write_text(text, encoding="utf-8")
    total = sum(len(v.get("works") or []) for v in data.values() if isinstance(v, dict))
    old = sum(
        1
        for v in data.values()
        if isinstance(v, dict)
        for w in (v.get("works") or [])
        if str((w or {}).get("href") or "").startswith(f"{BASE}/case/")
        and "/case-study/" not in str((w or {}).get("href") or "")
    )
    print(f"done works={total} old_/case/_href={old} → {SRC}")


if __name__ == "__main__":
    main()
