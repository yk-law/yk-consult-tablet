"""API·catalog 테스트 공통 fixture.

세션은 server.main 모듈 전역 SESSION 한 건이다.
각 테스트 전후로 blank_session()으로 초기화하고, server/data 는 읽기만 한다.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from server import main as main_mod  # noqa: E402
from server.main import app  # noqa: E402

# tools/check.mjs EXPECT 와 동일
EXPECT = {"lawyers": 316, "advisors": 98, "bookings": 7}


@pytest.fixture(autouse=True)
def _reset_session():
    main_mod.SESSION = main_mod.blank_session()
    yield
    main_mod.SESSION = main_mod.blank_session()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def expect():
    return EXPECT
