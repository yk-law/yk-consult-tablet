"""FastAPI 엔드포인트 응답 형태·오류·세션 흐름."""
from __future__ import annotations


def test_health_ok(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body == {"ok": True}
    assert isinstance(body["ok"], bool)


def test_catalog_shape_and_counts(client, expect):
    r = client.get("/api/catalog")
    assert r.status_code == 200
    data = r.json()
    for key in (
        "bookings",
        "lawyers",
        "advisors",
        "fee",
        "firm",
        "sign",
        "cases",
        "reviews",
        "FIELD",
        "NEAR",
        "roleHint",
        "counts",
        "portraits",
    ):
        assert key in data
    assert isinstance(data["bookings"], list)
    assert isinstance(data["lawyers"], list)
    assert isinstance(data["advisors"], list)
    assert isinstance(data["fee"], dict)
    assert isinstance(data["firm"], dict)
    assert isinstance(data["counts"], dict)
    assert isinstance(data["FIELD"], dict)
    assert len(data["lawyers"]) == expect["lawyers"]
    assert len(data["advisors"]) == expect["advisors"]
    assert len(data["bookings"]) == 26  # 11-13 바인더#3 검토본
    # 목록 응답에서 상세 본문 d 는 빠진다
    if data["lawyers"]:
        assert "d" not in data["lawyers"][0]
        assert isinstance(data["lawyers"][0]["n"], str)
        assert isinstance(data["lawyers"][0]["f"], list)


def test_visit_default_shape(client):
    r = client.get("/api/visit")
    assert r.status_code == 200
    data = r.json()
    for key in (
        "booking",
        "helper",
        "firm",
        "counsel",
        "seniors",
        "seniorHeadline",
        "videos",
        "FIELD",
        "NEAR",
        "counts",
        "portraits",
        "bookings",
    ):
        assert key in data
    assert isinstance(data["booking"], dict)
    assert isinstance(data["booking"]["id"], str)
    assert isinstance(data["booking"]["name"], str)
    assert isinstance(data["helper"], dict)
    assert isinstance(data["seniors"], list)
    assert isinstance(data["bookings"], list)
    assert data["counts"]["advisors"] == 98


def test_visit_by_id_and_404(client):
    cat = client.get("/api/catalog").json()
    bid = cat["bookings"][0]["id"]
    r = client.get("/api/visit", params={"id": bid})
    assert r.status_code == 200
    assert r.json()["booking"]["id"] == bid

    missing = client.get("/api/visit", params={"id": "__no_such_booking__"})
    assert missing.status_code == 404


def test_lawyer_detail_and_404(client):
    name = client.get("/api/catalog").json()["lawyers"][0]["n"]
    r = client.get(f"/api/lawyers/{name}")
    assert r.status_code == 200
    body = r.json()
    assert body["n"] == name
    assert isinstance(body["score"], dict)
    assert "s" in body["score"] and isinstance(body["score"]["s"], (int, float))
    assert isinstance(body["reasons"], list)
    assert "fee" in body

    missing = client.get("/api/lawyers/존재하지않는변호사XYZ")
    assert missing.status_code == 404


def test_search_empty_query_and_no_hits(client):
    blank = client.get("/api/search", params={"q": ""})
    assert blank.status_code == 200
    rows = blank.json()
    assert isinstance(rows, list)
    assert len(rows) <= 25
    if rows:
        assert "n" in rows[0]
        assert "score" in rows[0]
        assert "reasons" in rows[0]
        assert "d" not in rows[0]

    none = client.get("/api/search", params={"q": "zzzz_no_match_qwerty_999"})
    assert none.status_code == 200
    assert none.json() == []


def test_session_default(client):
    r = client.get("/api/session")
    assert r.status_code == 200
    s = r.json()
    assert s["connected"] is False
    assert s["screen"] == "intro"
    assert isinstance(s["bookingId"], str)
    assert isinstance(s["favs"], list)
    assert isinstance(s["top"], list)
    assert s["top"] == []
    assert isinstance(s["rev"], int)
    assert "booking" in s
    assert s["booking"] is None or isinstance(s["booking"], dict)


def test_session_share_screen_unshare_reset(client):
    cat = client.get("/api/catalog").json()
    booking = cat["bookings"][0]
    bid = booking["id"]

    shared = client.post("/api/session/share", json={"id": bid})
    assert shared.status_code == 200
    s = shared.json()
    assert s["connected"] is True
    assert s["bookingId"] == bid
    assert s["screen"] == "intro"
    assert isinstance(s["top"], list) and len(s["top"]) == 3
    assert isinstance(s["booking"], dict)
    rev_after_share = s["rev"]

    screened = client.post(
        "/api/session/screen",
        json={"screen": "home", "push": True},
    )
    assert screened.status_code == 200
    s2 = screened.json()
    assert s2["screen"] == "home"
    assert s2["confirmed"] is True
    assert s2["connected"] is True
    assert s2["rev"] > rev_after_share
    assert "intro" in s2["stack"]

    unshared = client.post("/api/session/unshare")
    assert unshared.status_code == 200
    s3 = unshared.json()
    assert s3["connected"] is False
    assert s3["screen"] == "intro"
    assert s3["favs"] == []
    assert s3["top"] == []
    assert s3["confirmed"] is False

    reset = client.post("/api/session/reset")
    assert reset.status_code == 200
    s4 = reset.json()
    assert s4["connected"] is False
    assert s4["screen"] == "intro"
    assert s4["stack"] == []
    assert isinstance(s4["bookingId"], str)


def test_session_share_unknown_booking_404(client):
    r = client.post("/api/session/share", json={"id": "__missing__"})
    assert r.status_code == 404
