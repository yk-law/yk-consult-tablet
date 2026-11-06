"""2뎁스 템플릿 As-is·To-be 비교 페이지를 만든다.

    python3 tools/topics_compare/build.py [기준 커밋=c31429d]   # → docs/2뎁스-비교.html

As-is는 기준 커밋의 server/data/topics.json, To-be는 지금 작업 폴더의 server/data/topics.json이다.
소분류 목록(categories.tsv)은 YK-OS `/v1/incident_category`(2026-11-06 조회)의 대분류·중분류·소분류다.
조회 규칙은 server/catalog.py topic_by_kind·with_role 과 같다(소분류 → _alias → _middle → _default).
"""
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / "docs" / "2뎁스-비교.html"


def norm(s):
    return "".join(str(s).split())


def resolve(table, small, middle):
    key = table.get("_alias", {}).get(small, small)
    if key and not key.startswith("_") and key in table:
        return table[key], ("소분류" if key == small else f"별칭→{key}")
    mids = {norm(k): (k, v) for k, v in table.get("_middle", {}).items()}
    mid = table.get("_middle_alias", {}).get(middle, middle)
    hit = mids.get(norm(mid))
    if hit:
        return hit[1], f"중분류 공통({hit[0]})"
    return table.get("_default"), "기본"


def view(t, role):
    if not t:
        return None
    if role and role != t.get("base_role"):
        v = (t.get("roles") or {}).get(role)
        if v:
            t = {**t, **v}
    return {x: t.get(x, []) for x in ("steps", "flow", "ask", "bring")}


def rows_for(asis, tobe):
    rows, seen = [], set()
    generic = lambda s: s.startswith("중분류") or s == "기본"
    for line in (HERE / "categories.tsv").read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) != 3 or (parts[1], parts[2]) in seen:
            continue
        major, middle, small = parts
        seen.add((middle, small))
        a, asrc = resolve(asis, small, middle)
        b, bsrc = resolve(tobe, small, middle)
        roles = [b.get("base_role") or ""] + [r for r in (b.get("roles") or {}) if r != b.get("base_role")]
        variants = [{"role": r or "단일", "asis": view(a, r), "tobe": view(b, r), "changed": view(a, r) != view(b, r)} for r in roles]
        if generic(asrc) and not generic(bsrc):
            kind = "신규 추가"
        elif any(v["changed"] for v in variants):
            kind = "문구 보강"
        else:
            kind = "변화 없음"
        rows.append({"major": major, "middle": middle, "small": small, "asisSrc": asrc, "tobeSrc": bsrc, "kind": kind, "variants": variants})
    return rows


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "c31429d"
    asis = json.loads(subprocess.check_output(["git", "show", f"{base}:server/data/topics.json"], cwd=ROOT))
    tobe = json.loads((ROOT / "server" / "data" / "topics.json").read_text(encoding="utf-8"))
    head = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True).strip()
    rows = rows_for(asis, tobe)
    meta = {"text": f"As-is: {base} · To-be: 작업 폴더({head} 기준) · 분류 기준: YK-OS 사건 분류(2026-11-06 조회) · 문구는 법무 검수 전 시연용"}
    data = json.dumps(rows, ensure_ascii=False).replace("</", "<\\/")
    html = (HERE / "template.html").read_text(encoding="utf-8")
    html = html.replace("/*DATA*/", data).replace("/*META*/", json.dumps(meta, ensure_ascii=False).replace("</", "<\\/"))
    # 브라우저에서 바로 열 수 있게 문서 골격을 붙인다(아티팩트로 올릴 때는 template.html 그대로 쓴다).
    OUT.write_text('<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n' + html + "\n</html>\n", encoding="utf-8")
    print(OUT.relative_to(ROOT), len(rows), dict(Counter(r["kind"] for r in rows)))


if __name__ == "__main__":
    main()
