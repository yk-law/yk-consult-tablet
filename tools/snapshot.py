"""시연 예약별 visit 응답을 정적 JSON으로 뽑는다. GitHub Pages에서 API 없이 연다."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server.catalog import _advisor_card, catalog, public_profile, visit_for  # noqa: E402


def main() -> None:
    out = ROOT / "app" / "public" / "snapshot"
    out.mkdir(parents=True, exist_ok=True)
    bookings = catalog()["bookings"]
    by_id = {}
    by_name = {}
    for b in bookings:
        data = visit_for(b["id"])
        (out / f"{b['id']}.json").write_text(
            json.dumps(data, ensure_ascii=False),
            encoding="utf-8",
        )
        by_id[b["id"]] = b["id"]
        by_name[b["name"]] = b["id"]
    index = {"default": bookings[0]["id"], "byId": by_id, "byName": by_name}
    (out / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    # YK-OS 화면 공유 때 실장이 고르는 상담 변호사. 고른 사람의 고객용 프로필로 바꿔 끼운다.
    c = catalog()
    (out / "counsel").mkdir(exist_ok=True)
    for l in c["lawyers"]:
        n = l["n"]
        one = {"counsel": public_profile(l), "portraits": {n: c["portraits"][n]} if n in c["portraits"] else {}}
        (out / "counsel" / f"{n}.json").write_text(json.dumps(one, ensure_ascii=False), encoding="utf-8")
    # 고문·전문위원도 상담에 함께 들어올 수 있다(시연 피드백 4번). 변호사와 이름이 겹치면 변호사를 둔다.
    photos = c.get("firmIntro", {}).get("photos", {})
    lawyer_names = {l["n"] for l in c["lawyers"]}
    for a in c["advisors"]:
        n = a["n"]
        if n in lawyer_names:
            continue
        pic = c["portraits"].get(n) or photos.get(n)
        one = {"counsel": _advisor_card(a, c["portraits"]) | {"photo": bool(pic)}, "portraits": {n: pic} if pic else {}}
        (out / "counsel" / f"{n}.json").write_text(json.dumps(one, ensure_ascii=False), encoding="utf-8")
    print(f"snapshot {len(bookings)} → {out}")


if __name__ == "__main__":
    main()
