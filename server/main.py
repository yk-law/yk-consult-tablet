"""YK 상담 태블릿 API — FastAPI.

세션은 메모리 한 건. 태블릿과 YK-OS가 같은 상태를 폴링한다.
"""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path

from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .catalog import booking, catalog, contract_for, fee_for, lawyer, ranked, reasons, score, visit_for

ROOT = Path(__file__).resolve().parent.parent
WEB_DIST = ROOT / "app" / "dist"

app = FastAPI(title="YK 상담 태블릿")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def blank_session() -> dict:
    first = catalog()["bookings"][0]
    return {
        "connected": False,
        "bookingId": first["id"],
        "screen": "intro",
        "confirmed": False,
        "favs": [],
        "memoVotes": [None] * len(first.get("memo") or []),
        "lastMark": -1,
        "asked": {},
        "signed": {},
        "contract": None,
        "signOpen": False,
        "signErr": "",
        "writeOpen": False,
        "writeBookingId": None,
        "writeTab": 0,
        "stack": [],
        "detailName": None,
        "visitRange": "today",
        "rev": 1,
    }


SESSION = blank_session()


def public_session() -> dict:
    s = deepcopy(SESSION)
    b = booking(s["bookingId"])
    s["booking"] = b
    s["fee"] = fee_for(b["feeKey"]) if b else None
    s["scenarios"] = []
    if b:
        sc = catalog()["scenarios"]
        s["scenarios"] = sc.get(b["cat2"]) or sc.get(b["cat1"]) or []
    if s["connected"] and b:
        s["top"] = ranked(b["field"], b["court"], limit=3)
    else:
        s["top"] = []
    return s


class ShareIn(BaseModel):
    id: str


class ScreenIn(BaseModel):
    screen: str
    detailName: Optional[str] = None
    push: bool = True


class FavIn(BaseModel):
    name: str


class MarkIn(BaseModel):
    index: int
    value: Optional[bool] = None


class AskedIn(BaseModel):
    index: int


class ContractIn(BaseModel):
    contract: dict
    send: bool = False
    save: bool = False


class WriteIn(BaseModel):
    id: Optional[str] = None
    tab: Optional[int] = None
    open: Optional[bool] = None


class RangeIn(BaseModel):
    visit_range: str = Field(alias="range")
    model_config = {"populate_by_name": True}


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/visit")
def get_visit(id: str = ""):
    data = visit_for(id or None)
    if not data:
        raise HTTPException(404, "예약을 찾을 수 없습니다.")
    return data


@app.get("/api/catalog")
def get_catalog():
    c = catalog()
    lawyers = [{k: v for k, v in l.items() if k != "d"} for l in c["lawyers"]]
    return {
        "bookings": c["bookings"],
        "lawyers": lawyers,
        "advisors": c["advisors"],
        "fee": c["fee"],
        "firm": c["firm"],
        "sign": c["sign"],
        "cases": c["cases"],
        "reviews": c["reviews"],
        "FIELD": c["FIELD"],
        "NEAR": c["NEAR"],
        "roleHint": c["roleHint"],
        "counts": c["counts"],
        "portraits": c["portraits"],
    }


@app.get("/api/lawyers/{name}")
def get_lawyer(name: str):
    l = lawyer(name)
    if not l:
        raise HTTPException(404, "변호사를 찾을 수 없습니다.")
    b = booking(SESSION["bookingId"])
    field, court = (b["field"], b["court"]) if b else ("K", "서울중앙지방법원")
    return {
        **l,
        "photo": catalog()["portraits"].get(name),
        "score": score(l, field, court),
        "reasons": reasons(l, field, court),
        "fee": fee_for(b["feeKey"]) if b else fee_for("__all"),
    }


@app.get("/api/search")
def search(q: str = "", limit: int = 25):
    b = booking(SESSION["bookingId"])
    field, court = (b["field"], b["court"]) if b else ("K", "서울중앙지방법원")
    return ranked(field, court, q=q, limit=limit)


@app.get("/api/session")
def get_session():
    return public_session()


@app.post("/api/session/share")
def share(body: ShareIn):
    b = booking(body.id)
    if not b:
        raise HTTPException(404, "예약을 찾을 수 없습니다.")
    SESSION["connected"] = True
    SESSION["bookingId"] = b["id"]
    SESSION["screen"] = "intro"
    SESSION["confirmed"] = False
    SESSION["favs"] = []
    SESSION["memoVotes"] = [None] * len(b.get("memo") or [])
    SESSION["lastMark"] = -1
    SESSION["stack"] = []
    SESSION["detailName"] = None
    SESSION["contract"] = None
    SESSION["signOpen"] = False
    SESSION["signErr"] = ""
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/unshare")
def unshare():
    b = booking(SESSION["bookingId"])
    SESSION["connected"] = False
    SESSION["screen"] = "intro"
    SESSION["confirmed"] = False
    SESSION["favs"] = []
    SESSION["memoVotes"] = [None] * len((b or {}).get("memo") or [])
    SESSION["lastMark"] = -1
    SESSION["stack"] = []
    SESSION["detailName"] = None
    SESSION["signOpen"] = False
    SESSION["writeOpen"] = False
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/reset")
def reset():
    global SESSION
    SESSION = blank_session()
    return public_session()


@app.post("/api/session/screen")
def set_screen(body: ScreenIn):
    if body.push and SESSION["screen"] and SESSION["screen"] != body.screen:
        SESSION["stack"].append(SESSION["screen"])
    SESSION["screen"] = body.screen
    if body.detailName is not None:
        SESSION["detailName"] = body.detailName
    elif body.screen != "detail":
        SESSION["detailName"] = None
    if body.screen == "home":
        SESSION["confirmed"] = True
    if body.screen == "browse":
        SESSION["confirmed"] = False
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/back")
def go_back():
    prev = SESSION["stack"].pop() if SESSION["stack"] else "home"
    SESSION["screen"] = prev
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/fav")
def tog_fav(body: FavIn):
    if body.name in SESSION["favs"]:
        SESSION["favs"] = [n for n in SESSION["favs"] if n != body.name]
    else:
        SESSION["favs"].append(body.name)
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/mark")
def mark(body: MarkIn):
    votes = list(SESSION["memoVotes"])
    if body.index < 0 or body.index >= len(votes):
        raise HTTPException(400, "문장 번호가 없습니다.")
    cur = votes[body.index]
    votes[body.index] = None if cur == body.value else body.value
    SESSION["memoVotes"] = votes
    SESSION["lastMark"] = body.index
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/asked")
def asked(body: AskedIn):
    key = f"{SESSION['bookingId']}:{body.index}"
    SESSION["asked"][key] = not SESSION["asked"].get(key)
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/range")
def visit_range(body: RangeIn):
    SESSION["visitRange"] = body.visit_range
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/sign/open")
def sign_open(body: ShareIn):
    b = booking(body.id)
    if not b:
        raise HTTPException(404, "예약을 찾을 수 없습니다.")
    SESSION["contract"] = contract_for(b, SESSION["favs"] if SESSION["connected"] and SESSION["bookingId"] == b["id"] else None)
    SESSION["signOpen"] = True
    SESSION["signErr"] = ""
    SESSION["writeBookingId"] = b["id"]
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/sign/close")
def sign_close():
    SESSION["signOpen"] = False
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/sign")
def sign_update(body: ContractIn):
    SESSION["contract"] = body.contract
    if body.save:
        SESSION["signErr"] = "저장했습니다. 서식 원문은 그대로이고, 왼쪽 값만 반영됩니다."
        SESSION["rev"] += 1
        return public_session()
    if body.send:
        ct = body.contract
        if not ct.get("org1"):
            SESSION["signErr"] = "최소 1개의 희망 배당 부서를 선택해주세요."
            SESSION["rev"] += 1
            return public_session()
        if not str(ct.get("opinion") or "").strip():
            SESSION["signErr"] = "부서 배당 의견을 입력해주세요."
            SESSION["rev"] += 1
            return public_session()
        SESSION["signErr"] = ""
        SESSION["signOpen"] = False
        b = booking(ct["engId"])
        if b:
            same = SESSION["bookingId"] == b["id"]
            SESSION["connected"] = True
            SESSION["bookingId"] = b["id"]
            SESSION["screen"] = "sign"
            if not same:
                SESSION["memoVotes"] = [None] * len(b.get("memo") or [])
                SESSION["favs"] = []
                SESSION["confirmed"] = False
        SESSION["rev"] += 1
        return public_session()
    SESSION["signErr"] = ""
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/sign/now")
def sign_now():
    SESSION["signed"][SESSION["bookingId"]] = True
    SESSION["rev"] += 1
    return public_session()


@app.post("/api/session/write")
def write(body: WriteIn):
    if body.open is False:
        SESSION["writeOpen"] = False
    elif body.id:
        if not booking(body.id):
            raise HTTPException(404, "예약을 찾을 수 없습니다.")
        SESSION["writeOpen"] = True
        SESSION["writeBookingId"] = body.id
        SESSION["writeTab"] = 0
    if body.tab is not None:
        SESSION["writeTab"] = body.tab
    SESSION["rev"] += 1
    return public_session()


if WEB_DIST.exists():
    app.mount("/assets", StaticFiles(directory=WEB_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(404)
        index = WEB_DIST / "index.html"
        file = WEB_DIST / full_path
        if full_path and file.is_file():
            return FileResponse(file)
        return FileResponse(index)
