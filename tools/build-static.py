#!/usr/bin/env python3
"""app/ 을 정적 호스팅용 단일 HTML 로 합친다 — dist/index.html

tools/build.mjs 와 목적이 다르다. build.mjs 는 아티팩트 임베드용이라
<html>/<head>/<body> 를 벗겨내지만, 이 스크립트는 그대로 둔다.
호스팅에 올리거나 브라우저로 직접 열어야 하므로 완전한 문서여야 한다.

실행:  python3 tools/build-static.py   →  dist/index.html

웹폰트(Google Fonts)와 브랜드 영상(yklawfirm.co.kr)은 외부 링크로 남긴다.
인물 사진은 data/portraits.js 에 base64 로 들어 있어 별도 처리가 없다.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP, OUT = ROOT / "app", ROOT / "dist" / "index.html"


def guard(code, tag):
    """인라인 코드 안의 종료 태그가 문서를 끊지 않게 막는다."""
    return re.sub(rf"</({tag})", r"<\\/\1", code, flags=re.I)


html = (APP / "index.html").read_text(encoding="utf-8")

scripts = re.findall(r'(<script src="([^"]+)"></script>)', html)

# 인라인 대상 밖에 남는 로컬 참조가 있으면 단일 파일이 성립하지 않는다.
# 검사는 스크립트를 넣기 전에 한다. app.js 의 템플릿 문자열까지 훑지 않도록.
known = {"styles.css"} | {src.split("?")[0] for _, src in scripts}
left = {
    r.split("?")[0]
    for r in re.findall(r'(?:src|href)="(?!https?:|data:|#)([^"]+)"', html)
} - known
if left:
    raise SystemExit(f"인라인되지 않은 로컬 참조가 남았다: {sorted(left)}")

css = (APP / "styles.css").read_text(encoding="utf-8")
html = re.sub(
    r'<link rel="stylesheet" href="styles\.css[^"]*">',
    lambda _: f"<style>\n{guard(css, 'style')}</style>",
    html,
)

for tag, src in scripts:
    code = (APP / src.split("?")[0]).read_text(encoding="utf-8")
    html = html.replace(tag, f"<script>\n{guard(code, 'script')}</script>", 1)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print(f"  ✓ {OUT.relative_to(ROOT)}  {len(html.encode()) / 1024:.0f} KB")
