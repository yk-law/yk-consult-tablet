"""pytest 경로 설정 — `cd server && python -m pytest tests` 에서 server 패키지를 찾게 한다."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
