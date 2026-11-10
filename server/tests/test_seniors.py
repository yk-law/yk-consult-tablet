"""catalog.seniors_for 전문인력 6칸 선정 규칙 단위 테스트."""
from __future__ import annotations

from server.catalog import (
    ADVISOR_ROLE_ORDER,
    EXPERT_SLOTS,
    LAWYER_SLOTS,
    LIST_RANK,
    advisor_pool,
    catalog,
    frame_of,
    seniors_for,
)


def _lawyers_in(rows: list[dict]) -> list[dict]:
    return [r for r in rows if r.get("kind") == "lawyer"]


def _advisors_in(rows: list[dict]) -> list[dict]:
    return [r for r in rows if r.get("kind") == "advisor"]


def _fake_roster(counsel_name: str) -> list[str]:
    """직위가 섞인 가짜 시연 명단. counsel_name 을 의도적으로 포함해 제외를 검증한다."""
    c = catalog()
    by_grade: dict[str, list[str]] = {}
    for l in c["lawyers"]:
        by_grade.setdefault(frame_of(l), []).append(l["n"])
    pool_names = [a["n"] for a in advisor_pool()]
    # 순서를 섞어 LIST_RANK 재정렬이 드러나게 한다.
    lawyers = (
        by_grade.get("assoc", [])[:1]
        + by_grade.get("partner", [])[:2]
        + by_grade.get("rep", [])[:2]
        + by_grade.get("counsel", [])[:1]
    )
    roster = [n for n in lawyers if n != counsel_name]
    roster.append(counsel_name)
    roster.extend(pool_names)
    return roster


def test_seniors_excludes_counsel_name():
    c = catalog()
    counsel = next(l["n"] for l in c["lawyers"] if frame_of(l) == "rep")
    field = "K"
    court = ""

    rows_roster, _ = seniors_for(
        field, court, counsel_name=counsel, roster=_fake_roster(counsel), seed="t-counsel"
    )
    assert counsel not in {r["n"] for r in rows_roster}

    b = c["bookings"][0]
    rows_default, _ = seniors_for(
        b.get("field") or field,
        b.get("court") or court,
        counsel_name=b.get("counsel"),
        seed=b.get("id") or "t-default",
    )
    assert b.get("counsel") not in {r["n"] for r in rows_default}


def test_seniors_lawyers_max_four_list_rank_order():
    c = catalog()
    counsel = next(l["n"] for l in c["lawyers"] if frame_of(l) == "rep")
    rows, _ = seniors_for(
        "K", "", counsel_name=counsel, roster=_fake_roster(counsel), seed="t-rank"
    )
    lawyers = _lawyers_in(rows)
    assert len(lawyers) <= LAWYER_SLOTS
    ranks = [LIST_RANK.get(p.get("grade"), 9) for p in lawyers]
    assert ranks == sorted(ranks)

    b = c["bookings"][0]
    rows_default, _ = seniors_for(
        b.get("field") or "K",
        b.get("court") or "",
        counsel_name=b.get("counsel"),
        seed=b.get("id") or "t-rank-default",
    )
    lawyers_default = _lawyers_in(rows_default)
    assert len(lawyers_default) <= LAWYER_SLOTS
    ranks_default = [LIST_RANK.get(p.get("grade"), 9) for p in lawyers_default]
    assert ranks_default == sorted(ranks_default)


def test_seniors_advisors_use_advisor_role_order():
    c = catalog()
    counsel = next(l["n"] for l in c["lawyers"] if frame_of(l) == "rep")
    rows, _ = seniors_for(
        "K", "", counsel_name=counsel, roster=_fake_roster(counsel), seed="t-advisor"
    )
    advisors = _advisors_in(rows)
    assert advisors, "고문·위원 슬롯이 비어 있으면 안 된다"
    for a in advisors:
        assert a.get("pos") in ADVISOR_ROLE_ORDER

    b = c["bookings"][0]
    rows_default, _ = seniors_for(
        b.get("field") or "K",
        b.get("court") or "",
        counsel_name=b.get("counsel"),
        seed=b.get("id") or "t-advisor-default",
    )
    for a in _advisors_in(rows_default):
        assert a.get("pos") in ADVISOR_ROLE_ORDER


def test_seniors_total_at_most_six():
    c = catalog()
    counsel = next(l["n"] for l in c["lawyers"] if frame_of(l) == "rep")
    rows, _ = seniors_for(
        "K", "", counsel_name=counsel, roster=_fake_roster(counsel), seed="t-six"
    )
    assert len(rows) <= EXPERT_SLOTS

    b = c["bookings"][0]
    rows_default, _ = seniors_for(
        b.get("field") or "K",
        b.get("court") or "",
        counsel_name=b.get("counsel"),
        seed=b.get("id") or "t-six-default",
    )
    assert len(rows_default) <= EXPERT_SLOTS


def test_seniors_same_seed_same_result():
    c = catalog()
    counsel = next(l["n"] for l in c["lawyers"] if frame_of(l) == "rep")
    roster = _fake_roster(counsel)
    a, _ = seniors_for("K", "", counsel_name=counsel, roster=roster, seed="seed-fixed")
    b, _ = seniors_for("K", "", counsel_name=counsel, roster=roster, seed="seed-fixed")
    assert [r["n"] for r in a] == [r["n"] for r in b]

    booking = c["bookings"][0]
    field = booking.get("field") or "K"
    court = booking.get("court") or ""
    counsel_name = booking.get("counsel")
    seed = booking.get("id") or "seed-default"
    x, _ = seniors_for(field, court, counsel_name=counsel_name, seed=seed)
    y, _ = seniors_for(field, court, counsel_name=counsel_name, seed=seed)
    assert [r["n"] for r in x] == [r["n"] for r in y]
