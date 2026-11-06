#!/usr/bin/env python3
"""사건 요약 2뎁스 템플릿(topics.json) 문구 규칙 점검기.

문장은 고치지 않고 위반만 보고한다.

    python3 tools/topics_lint.py [경로]
    python3 tools/topics_lint.py --json [경로]

종료 코드: FORBIDDEN·SHAPE·ALIAS 위반이 있으면 1, 아니면 0.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PATH = ROOT / "server" / "data" / "topics.json"

META = {"_note", "_alias", "_middle_alias", "_middle", "_default"}
FIELDS = ("steps", "flow", "ask", "bring")
PAIR_FIELDS = ("steps", "flow")
LIST_FIELDS = ("ask", "bring")

COUNT_RANGE = {
    "steps": (4, 5),
    "flow": (4, 4),
    "ask": (4, 5),
    "bring": (4, 5),
}

# '보장' 단독은 잡지 않는다. 결과·승소 약속·책임 표현만 FORBIDDEN.
FORBIDDEN_TOKENS = ("%", "전관", "승소율", "성공률", "반드시", "무조건", "100%")
FORBIDDEN_PATTERNS = (
    re.compile(r"(?:결과|승소)\s*를?\s*보장"),
    re.compile(r"보장합니다"),
    re.compile(r"보장하겠습니다"),
    re.compile(r"보장해\s*드립니다"),
    re.compile(r"보장해\s*드릴게요"),
    re.compile(r"책임지고.{0,24}해\s*드립니다"),
)
ENGLISH_ALLOW = {"CCTV", "SNS", "DNA", "PC", "AI", "ID"}
ENGLISH_RE = re.compile(r"[A-Za-z]+")

RULES = (
    "FORBIDDEN",
    "ENGLISH",
    "COUNT",
    "SHAPE",
    "LENGTH",
    "ENDING",
    "DUP_IN",
    "DUP_ACROSS",
    "ALIAS",
)
FATAL = {"FORBIDDEN", "SHAPE", "ALIAS"}


def _as_list(value: Any) -> list:
    return value if isinstance(value, list) else []


def _texts_in_payload(payload: dict) -> list[tuple[str, int, str]]:
    """(필드, 순번, 문장) — steps/flow는 제목·설명을 각각, ask/bring은 항목."""
    out: list[tuple[str, int, str]] = []
    for field in PAIR_FIELDS:
        for i, item in enumerate(_as_list(payload.get(field)), start=1):
            if isinstance(item, (list, tuple)) and len(item) >= 1:
                out.append((field, i, str(item[0]) if item[0] is not None else ""))
                if len(item) >= 2:
                    out.append((field, i, str(item[1]) if item[1] is not None else ""))
            elif isinstance(item, str):
                out.append((field, i, item))
            else:
                out.append((field, i, "" if item is None else str(item)))
    for field in LIST_FIELDS:
        for i, item in enumerate(_as_list(payload.get(field)), start=1):
            out.append((field, i, "" if item is None else str(item)))
    return out


def _pair_parts(item: Any) -> tuple[str | None, str | None, bool]:
    """(제목, 설명, shape_ok). shape_ok=False면 2칸 구조가 아님."""
    if not isinstance(item, (list, tuple)) or len(item) != 2:
        return None, None, False
    title, desc = item[0], item[1]
    if not isinstance(title, str) or not isinstance(desc, str):
        return (
            "" if title is None else str(title),
            "" if desc is None else str(desc),
            False,
        )
    return title, desc, True


def lint_payload(cat: str, role: str, payload: dict) -> list[dict]:
    hits: list[dict] = []

    def add(rule: str, field: str, index: int | str, sentence: str) -> None:
        hits.append(
            {
                "rule": rule,
                "category": cat,
                "role": role,
                "field": field,
                "index": index,
                "sentence": sentence,
            }
        )

    # COUNT
    for field, (lo, hi) in COUNT_RANGE.items():
        n = len(_as_list(payload.get(field)))
        if n < lo or n > hi:
            add("COUNT", field, "-", f"{n}개 (허용 {lo}~{hi})")

    # SHAPE / LENGTH / ENDING on steps·flow
    for field in PAIR_FIELDS:
        for i, item in enumerate(_as_list(payload.get(field)), start=1):
            title, desc, ok = _pair_parts(item)
            if not ok:
                add("SHAPE", field, i, repr(item))
                continue
            if title == "" or desc == "":
                add("SHAPE", field, i, f"[{title!r}, {desc!r}]")
            if len(title) > 12:
                add("LENGTH", field, i, title)
            if len(desc) < 15 or len(desc) > 70:
                add("LENGTH", field, i, desc)
            if not desc.endswith("니다."):
                add("ENDING", field, i, desc)

    # LENGTH on ask·bring
    for field in LIST_FIELDS:
        for i, item in enumerate(_as_list(payload.get(field)), start=1):
            text = "" if item is None else str(item)
            if len(text) > 40:
                add("LENGTH", field, i, text)

    # FORBIDDEN / ENGLISH on every text unit
    for field, index, sentence in _texts_in_payload(payload):
        if not sentence:
            continue
        forbidden = any(token in sentence for token in FORBIDDEN_TOKENS) or any(
            pat.search(sentence) for pat in FORBIDDEN_PATTERNS
        )
        if forbidden:
            add("FORBIDDEN", field, index, sentence)
        for word in ENGLISH_RE.findall(sentence):
            if word.upper() not in ENGLISH_ALLOW:
                add("ENGLISH", field, index, sentence)
                break

    # DUP_IN — 같은 필드 안 동일 문장만 (steps 제목 ↔ flow 단계명 교차는 제외)
    seen: dict[tuple[str, str], list[int]] = defaultdict(list)
    for field, index, sentence in _texts_in_payload(payload):
        if not sentence:
            continue
        seen[(field, sentence)].append(index)
    for (field, sentence), indices in seen.items():
        if len(indices) < 2:
            continue
        for index in indices:
            add("DUP_IN", field, index, sentence)

    return hits


def iter_units(data: dict) -> list[tuple[str, str, dict, bool]]:
    """(소분류표시, 지위, payload, DUP_ACROSS대상여부)."""
    units: list[tuple[str, str, dict, bool]] = []

    for key, val in data.items():
        if key in META or not isinstance(val, dict):
            continue
        base_role = val.get("base_role") or "기본"
        units.append((key, base_role, val, True))
        roles = val.get("roles")
        if isinstance(roles, dict):
            for role, payload in roles.items():
                if isinstance(payload, dict):
                    units.append((key, role, payload, True))

    middle = data.get("_middle")
    if isinstance(middle, dict):
        for key, val in middle.items():
            if not isinstance(val, dict):
                continue
            cat = f"_middle/{key}"
            base_role = val.get("base_role") or "기본"
            units.append((cat, base_role, val, False))
            roles = val.get("roles")
            if isinstance(roles, dict):
                for role, payload in roles.items():
                    if isinstance(payload, dict):
                        units.append((cat, role, payload, False))

    default = data.get("_default")
    if isinstance(default, dict):
        units.append(("_default", default.get("base_role") or "기본", default, False))
        roles = default.get("roles")
        if isinstance(roles, dict):
            for role, payload in roles.items():
                if isinstance(payload, dict):
                    units.append(("_default", role, payload, False))

    return units


def lint_alias(data: dict) -> list[dict]:
    hits: list[dict] = []
    alias = data.get("_alias")
    if not isinstance(alias, dict):
        return hits
    valid = {k for k in data if k not in META}
    for src, target in alias.items():
        if target not in valid:
            hits.append(
                {
                    "rule": "ALIAS",
                    "category": src,
                    "role": "-",
                    "field": "_alias",
                    "index": "-",
                    "sentence": str(target),
                }
            )
    return hits


def lint_dup_across(units: list[tuple[str, str, dict, bool]], alias: dict) -> list[dict]:
    """서로 다른 소분류·같은 지위 steps 묶음이 완전 동일하면 위반. 별칭 키는 제외."""
    alias_keys = set(alias) if isinstance(alias, dict) else set()
    groups: dict[tuple[str, str], list[str]] = defaultdict(list)

    for cat, role, payload, for_across in units:
        if not for_across:
            continue
        if cat in alias_keys:
            continue
        steps = payload.get("steps")
        if not isinstance(steps, list):
            continue
        key = (role, json.dumps(steps, ensure_ascii=False, sort_keys=True))
        if cat not in groups[key]:
            groups[key].append(cat)

    hits: list[dict] = []
    for (role, steps_json), cats in groups.items():
        if len(cats) < 2:
            continue
        cats_sorted = sorted(cats)
        others = ", ".join(cats_sorted)
        for cat in cats_sorted:
            hits.append(
                {
                    "rule": "DUP_ACROSS",
                    "category": cat,
                    "role": role,
                    "field": "steps",
                    "index": "-",
                    "sentence": f"동일 steps: {others}",
                }
            )
    return hits


def lint_topics(data: dict) -> list[dict]:
    units = iter_units(data)
    hits: list[dict] = []
    for cat, role, payload, _ in units:
        hits.extend(lint_payload(cat, role, payload))
    hits.extend(lint_dup_across(units, data.get("_alias") or {}))
    hits.extend(lint_alias(data))
    return hits


def summarize(hits: list[dict]) -> dict[str, int]:
    counts = {rule: 0 for rule in RULES}
    for h in hits:
        rule = h["rule"]
        if rule in counts:
            counts[rule] += 1
    return counts


def format_text(counts: dict[str, int], hits: list[dict]) -> str:
    lines = ["규칙별 건수"]
    for rule in RULES:
        lines.append(f"  {rule}: {counts[rule]}")
    lines.append(f"  합계: {sum(counts.values())}")
    lines.append("")
    lines.append("위반 목록")
    if not hits:
        lines.append("  (없음)")
    else:
        for h in hits:
            lines.append(
                f"  {h['category']} · {h['role']} · {h['field']} · {h['index']} · {h['sentence']} · {h['rule']}"
            )
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="topics.json 2뎁스 템플릿 문구 점검")
    parser.add_argument("path", nargs="?", default=str(DEFAULT_PATH), help="topics.json 경로")
    parser.add_argument("--json", action="store_true", help="JSON으로 출력")
    args = parser.parse_args(argv)

    path = Path(args.path)
    data = json.loads(path.read_text(encoding="utf-8"))
    hits = lint_topics(data)
    counts = summarize(hits)
    fatal = any(h["rule"] in FATAL for h in hits)

    if args.json:
        print(
            json.dumps(
                {"counts": counts, "hits": hits, "fatal": fatal},
                ensure_ascii=False,
                indent=2,
            )
        )
    else:
        sys.stdout.write(format_text(counts, hits))

    return 1 if fatal else 0


if __name__ == "__main__":
    raise SystemExit(main())
