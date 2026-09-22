"""시연 예약별 visit 응답을 정적 JSON으로 뽑는다. GitHub Pages에서 API 없이 연다."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server.catalog import catalog, visit_for  # noqa: E402


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
    print(f"snapshot {len(bookings)} → {out}")


if __name__ == "__main__":
    main()
