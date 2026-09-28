import { useEffect, useState } from "react";
import { api } from "./api.js";
import Tablet from "./Tablet.jsx";

const SCREENS = [
  ["wait", "내방"],
  ["report", "사건요약"],
  ["counsel", "상담 변호사"],
  ["seniors", "전문인력"],
];
/** 장면 딥링크용. 상단 세그에는 안 넣고 URL·흐름에서만 쓴다. */
const DEEP = new Set(["film", "counsel-video", ...SCREENS.map(([id]) => id)]);

export default function App() {
  const q = new URLSearchParams(location.search);
  const [data, setData] = useState(null);
  const [screen, setScreen] = useState(
    DEEP.has(q.get("s")) ? q.get("s") : "wait",
  );
  const [cid, setCid] = useState(q.get("c") || "");

  useEffect(() => {
    api.visit(cid).then(setData);
  }, [cid]);

  useEffect(() => {
    const u = new URL(location.href);
    if (screen && screen !== "wait") u.searchParams.set("s", screen);
    else u.searchParams.delete("s");
    if (cid) u.searchParams.set("c", cid);
    history.replaceState(null, "", u);
  }, [screen, cid]);

  if (!data) {
    return (
      <div className="shell">
        <div className="dbar"><span className="bd">YK 상담 태블릿</span></div>
        <p className="sub" style={{ color: "#ccc", padding: 24 }}>불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="dbar">
        <span className="bd">YK 상담 태블릿 <em>고객 화면 · 시연</em></span>
        <div className="seg">
          {SCREENS.map(([id, l]) => (
            <button key={id} className={screen === id || (id === "counsel" && screen === "counsel-video") ? "on" : ""} onClick={() => setScreen(id)}>{l}</button>
          ))}
        </div>
        <select className="dpick" value={data.booking.id} onChange={(e) => setCid(e.target.value)} aria-label="시연 예약">
          {data.bookings.map((b) => (
            <option key={b.id} value={b.id}>{b.name} · {b.cat2}</option>
          ))}
        </select>
        <span className="sp" />
        <span className="note">내방 → 영상 → 사건요약 → 상담 변호사 → 전문인력 · 고객명은 가명</span>
      </div>
      <div className="stage one">
        <Tablet data={data} screen={screen} onScreen={setScreen} />
      </div>
    </div>
  );
}
