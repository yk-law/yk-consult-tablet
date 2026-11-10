"""FastAPI 세션 API(share · mark · sign) TestClient 검증.

시연 React 앱은 이 엔드포인트를 쓰지 않지만, 서버 계약은 유지한다.
카탈로그·예약 조회는 monkeypatch로 격리하고 저장소 data/ 는 건드리지 않는다.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from server import main


BOOKING_A = {
    "id": "t-100",
    "name": "테스트갑",
    "tel": "010-0000-0001",
    "cat1": "민사",
    "cat2": "대여금",
    "field": "K",
    "feeKey": "__all",
    "court": "서울중앙지방법원",
    "branch": "테스트지사 1 상담실",
    "memo": ["사실관계 문장 하나", "사실관계 문장 둘", "사실관계 문장 셋"],
}

BOOKING_B = {
    "id": "t-200",
    "name": "테스트을",
    "tel": "010-0000-0002",
    "cat1": "가사",
    "cat2": "이혼",
    "field": "G",
    "feeKey": "__all",
    "court": "서울가정법원",
    "branch": "테스트지사 2 상담실",
    "memo": ["가사 문장"],
}

FEE_ALL = {"mid": 3_000_000, "n": 5, "lo": 1_000_000, "hi": 5_000_000}


def _fake_catalog():
    return {
        "bookings": [BOOKING_A, BOOKING_B],
        "scenarios": {},
        "fee": {"__all": FEE_ALL},
    }


def _fake_booking(bid: str):
    return next(
        (b for b in (BOOKING_A, BOOKING_B) if b["id"] == bid or b["name"] == bid),
        None,
    )


def _fake_fee_for(key: str):
    fee = _fake_catalog()["fee"]
    return fee.get(key) or fee["__all"]


def _fake_contract_for(b: dict, favs=None):
    opinion = f"{b['cat1']} {b['cat2']} 초안"
    if favs:
        opinion += f" · {' · '.join(favs)}"
    return {
        "engId": b["id"],
        "client": b["name"],
        "org1": "본사 민사팀",
        "org2": "",
        "org3": "",
        "opinion": opinion,
    }


def _fake_ranked(*_args, **_kwargs):
    return []


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(main, "catalog", _fake_catalog)
    monkeypatch.setattr(main, "booking", _fake_booking)
    monkeypatch.setattr(main, "fee_for", _fake_fee_for)
    monkeypatch.setattr(main, "contract_for", _fake_contract_for)
    monkeypatch.setattr(main, "ranked", _fake_ranked)
    main.SESSION = main.blank_session()
    with TestClient(main.app) as c:
        yield c
    main.SESSION = main.blank_session()


def test_happy_path_share_mark_sign(client: TestClient):
    """세션 리셋 → 공유 → 맞아요/달라요 → 계약 열기·전송 → 서명."""
    r = client.post("/api/session/reset")
    assert r.status_code == 200
    assert r.json()["connected"] is False
    assert r.json()["bookingId"] == BOOKING_A["id"]

    r = client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    assert r.status_code == 200
    body = r.json()
    assert body["connected"] is True
    assert body["bookingId"] == BOOKING_A["id"]
    assert body["screen"] == "intro"
    assert body["memoVotes"] == [None, None, None]
    assert body["top"] == []

    r = client.post("/api/session/mark", json={"index": 0, "value": True})
    assert r.status_code == 200
    body = r.json()
    assert body["memoVotes"][0] is True
    assert body["lastMark"] == 0

    r = client.post("/api/session/mark", json={"index": 1, "value": False})
    assert r.status_code == 200
    assert r.json()["memoVotes"] == [True, False, None]

    r = client.post("/api/session/sign/open", json={"id": BOOKING_A["id"]})
    assert r.status_code == 200
    body = r.json()
    assert body["signOpen"] is True
    assert body["signErr"] == ""
    assert body["contract"]["engId"] == BOOKING_A["id"]
    assert body["contract"]["org1"]

    contract = dict(body["contract"])
    r = client.post(
        "/api/session/sign",
        json={"contract": contract, "send": True},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["signErr"] == ""
    assert body["signOpen"] is False
    assert body["connected"] is True
    assert body["screen"] == "sign"
    assert body["bookingId"] == BOOKING_A["id"]

    r = client.post("/api/session/sign/now")
    assert r.status_code == 200
    body = r.json()
    assert body["signed"].get(BOOKING_A["id"]) is True


def test_share_unknown_booking_returns_404(client: TestClient):
    r = client.post("/api/session/share", json={"id": "no-such-booking"})
    assert r.status_code == 404
    assert "예약을 찾을 수 없습니다" in r.json()["detail"]


def test_share_missing_id_returns_422(client: TestClient):
    r = client.post("/api/session/share", json={})
    assert r.status_code == 422


def test_mark_out_of_range_returns_400(client: TestClient):
    client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    r = client.post("/api/session/mark", json={"index": 99, "value": True})
    assert r.status_code == 400
    assert "문장 번호가 없습니다" in r.json()["detail"]


def test_mark_negative_index_returns_400(client: TestClient):
    client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    r = client.post("/api/session/mark", json={"index": -1, "value": True})
    assert r.status_code == 400


def test_mark_toggle_same_value_clears_vote(client: TestClient):
    client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    client.post("/api/session/mark", json={"index": 0, "value": True})
    r = client.post("/api/session/mark", json={"index": 0, "value": True})
    assert r.status_code == 200
    assert r.json()["memoVotes"][0] is None


def test_sign_open_unknown_booking_returns_404(client: TestClient):
    r = client.post("/api/session/sign/open", json={"id": "ghost"})
    assert r.status_code == 404


def test_sign_send_requires_org1(client: TestClient):
    client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    opened = client.post("/api/session/sign/open", json={"id": BOOKING_A["id"]}).json()
    contract = dict(opened["contract"])
    contract["org1"] = ""
    r = client.post("/api/session/sign", json={"contract": contract, "send": True})
    assert r.status_code == 200
    body = r.json()
    assert "희망 배당 부서" in body["signErr"]
    assert body["signOpen"] is True


def test_sign_send_requires_opinion(client: TestClient):
    client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    opened = client.post("/api/session/sign/open", json={"id": BOOKING_A["id"]}).json()
    contract = dict(opened["contract"])
    contract["opinion"] = "   "
    r = client.post("/api/session/sign", json={"contract": contract, "send": True})
    assert r.status_code == 200
    body = r.json()
    assert "부서 배당 의견" in body["signErr"]
    assert body["signOpen"] is True


def test_sign_now_duplicate_keeps_signed(client: TestClient):
    """코드에 중복 서명 거부는 없고, 재호출해도 signed 플래그만 유지한다."""
    client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    opened = client.post("/api/session/sign/open", json={"id": BOOKING_A["id"]}).json()
    client.post(
        "/api/session/sign",
        json={"contract": opened["contract"], "send": True},
    )
    first = client.post("/api/session/sign/now")
    assert first.status_code == 200
    assert first.json()["signed"][BOOKING_A["id"]] is True

    second = client.post("/api/session/sign/now")
    assert second.status_code == 200
    assert second.json()["signed"][BOOKING_A["id"]] is True


def test_sign_send_switches_booking_when_eng_id_differs(client: TestClient):
    client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    client.post("/api/session/mark", json={"index": 0, "value": True})
    opened = client.post("/api/session/sign/open", json={"id": BOOKING_B["id"]}).json()
    contract = dict(opened["contract"])
    assert contract["engId"] == BOOKING_B["id"]

    r = client.post("/api/session/sign", json={"contract": contract, "send": True})
    assert r.status_code == 200
    body = r.json()
    assert body["bookingId"] == BOOKING_B["id"]
    assert body["connected"] is True
    assert body["screen"] == "sign"
    assert body["memoVotes"] == [None]
    assert body["favs"] == []
    assert body["confirmed"] is False


def test_sign_close_and_save(client: TestClient):
    client.post("/api/session/share", json={"id": BOOKING_A["id"]})
    opened = client.post("/api/session/sign/open", json={"id": BOOKING_A["id"]}).json()
    contract = dict(opened["contract"])
    contract["opinion"] = "저장용 의견"

    saved = client.post(
        "/api/session/sign",
        json={"contract": contract, "save": True},
    )
    assert saved.status_code == 200
    assert "저장했습니다" in saved.json()["signErr"]

    closed = client.post("/api/session/sign/close")
    assert closed.status_code == 200
    assert closed.json()["signOpen"] is False
