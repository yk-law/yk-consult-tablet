import { useEffect, useState } from "react";
import { api } from "./api.js";
import Tablet from "./Tablet.jsx";

const SCREENS = [
  ["wait", "내방"],
  ["report", "사건요약"],
  ["counsel", "오늘의 변호사"],
  ["seniors", "전문인력"],
  ["survey", "설문"],
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
            <button key={id} className={screen === id ? "on" : ""} onClick={() => setScreen(id)}>{l}</button>
          ))}
        </div>
        <select className="dpick" value={data.booking.id} onChange={(e) => setCid(e.target.value)} aria-label="시연 예약">
          {data.bookings.map((b) => (
            <option key={b.id} value={b.id}>{b.name} · {b.cat2}</option>
          ))}
        </select>
        <span className="sp" />
        <span className="note">가로 태블릿 시연 · 내방 → 영상 → 사건요약 → (인터뷰) → 변호사 확인 · 고객명은 가명</span>
      </div>
      <div className="stage one">
        <Tablet data={data} screen={screen} onScreen={setScreen} />
      </div>
    </div>
  );
}
