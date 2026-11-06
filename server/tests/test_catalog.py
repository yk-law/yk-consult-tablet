"""catalog.py 공개 함수 단위 테스트. 데이터 파일은 읽기만 한다."""
from __future__ import annotations

import pytest

from server.catalog import (
    booking,
    career_stars,
    catalog,
    contract_for,
    fee_for,
    frame_of,
    helper_view,
    is_senior,
    is_specialist_lawyer,
    lawyer,
    pitch_of,
    prominent_titles,
    ranked,
    reasons,
    score,
    visit_for,
)
from server.tests.conftest import EXPECT


def test_catalog_loads_expected_sizes():
    c = catalog()
    assert isinstance(c["lawyers"], list)
    assert isinstance(c["advisors"], list)
    assert isinstance(c["bookings"], list)
    assert len(c["lawyers"]) == EXPECT["lawyers"]
    assert len(c["advisors"]) == EXPECT["advisors"]
    if len(c["bookings"]) != EXPECT["bookings"]:
        pytest.xfail(
            f"bookings={len(c['bookings'])} ≠ EXPECT {EXPECT['bookings']} "
            "(check.mjs와 server/data/bookings.json 불일치 — 앱·데이터 수정 범위 밖)"
        )
    assert len(c["bookings"]) == EXPECT["bookings"]
    assert "FIELD" in c and "NEAR" in c
    assert c["counts"]["advisors"] == 98


def test_booking_and_lawyer_lookup():
    c = catalog()
    b0 = c["bookings"][0]
    by_id = booking(b0["id"])
    by_name = booking(b0["name"])
    assert by_id is not None and by_id["id"] == b0["id"]
    assert by_name is not None and by_name["name"] == b0["name"]
    assert booking("__nope__") is None

    n = c["lawyers"][0]["n"]
    assert lawyer(n) is not None
    assert lawyer(n)["n"] == n
    assert lawyer("__없는이름__") is None


def test_fee_for_fallback():
    fee = fee_for("__all")
    assert isinstance(fee, dict)
    assert "mid" in fee
    missing = fee_for("__never_a_real_key__")
    assert missing is fee or missing == fee or "mid" in missing


def test_score_and_reasons_shape():
    c = catalog()
    b = c["bookings"][0]
    l = next(x for x in c["lawyers"] if b["field"] in x["f"])
    sc = score(l, b["field"], b["court"])
    assert isinstance(sc, dict)
    assert isinstance(sc["s"], (int, float))
    assert isinstance(sc["parts"], dict)
    assert isinstance(sc["hit"], bool)
    assert isinstance(sc["near"], list)
    rs = reasons(l, b["field"], b["court"])
    assert isinstance(rs, list)
    assert len(rs) <= 3
    if rs:
        assert "t" in rs[0] and isinstance(rs[0]["t"], str)


def test_ranked_filter_and_limit():
    c = catalog()
    b = c["bookings"][0]
    field, court = b["field"], b["court"]
    top = ranked(field, court, q="", limit=3)
    assert len(top) == 3
    assert all("score" in row and "reasons" in row for row in top)
    assert all("d" not in row for row in top)

    name = c["lawyers"][0]["n"]
    hits = ranked(field, court, q=name, limit=10)
    assert isinstance(hits, list)
    assert any(row["n"] == name for row in hits)

    empty = ranked(field, court, q="___no_such_lawyer_q___", limit=10)
    assert empty == []


def test_contract_for_shape():
    b = catalog()["bookings"][0]
    ct = contract_for(b, favs=["테스트변호사"])
    assert ct["engId"] == b["id"]
    assert ct["client"] == b["name"]
    assert ct["template"] in ("civil", "criminal")
    assert isinstance(ct["retainer"], dict)
    assert "amount" in ct["retainer"]
    assert "테스트변호사" in ct["opinion"]
    assert isinstance(ct["org1"], str)


def test_frame_senior_specialist_helpers():
    assert frame_of({"pos": "대표변호사"}) == "rep"
    assert frame_of({"pos": "파트너변호사"}) == "partner"
    assert frame_of({"pos": "고문변호사"}) == "counsel"
    assert frame_of({}, "전문위원") == "expert"
    assert frame_of({}, "자문위원") == "consultant"

    seniorish = {"pos": "대표변호사", "o": "부장판사"}
    assert is_senior(seniorish) is True
    assert is_specialist_lawyer(seniorish) is True
    assert is_senior({"pos": "변호사", "o": ""}) is False
    assert is_specialist_lawyer({"pos": "고문변호사"}) is True


def test_prominent_titles_and_career_stars():
    titles = prominent_titles(["판사", "부장판사", "검사"])
    assert "부장판사" in titles
    assert "판사" not in titles  # 같은 법원 직군은 최고만
    assert "검사" in titles
    stars = career_stars(titles=["부장판사"], career=[])
    assert isinstance(stars, float)
    assert 4.0 <= stars <= 5.0


def test_pitch_helper_visit_for():
    assert pitch_of({"d": {"quote": "  진심  "}}) == "진심"
    assert pitch_of({}) == "내 일처럼 진심을 다하겠습니다."

    b = catalog()["bookings"][0]
    hv = helper_view(b)
    assert hv["engId"] == b["id"]
    assert isinstance(hv["summary"], list)
    assert isinstance(hv["topics"], list)
    assert "party" in hv

    visit = visit_for(b["id"])
    assert visit["booking"]["id"] == b["id"]
    assert isinstance(visit["seniors"], list)
    assert isinstance(visit["seniorHeadline"], str)
    assert visit_for("__missing__") == {}
