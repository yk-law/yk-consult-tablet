import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import Tablet from "./Tablet.jsx";
import YKOS from "./YKOS.jsx";

const SCREENS = [
  ["wait", "내방"],
  ["report", "사건요약"],
  ["counsel", "상담 변호사"],
  ["seniors", "전문인력"],
];
/** 장면 딥링크용. 상단 세그에는 안 넣고 URL·흐름에서만 쓴다. */
const DEEP = new Set(["film", "counsel-video", ...SCREENS.map(([id]) => id)]);
const VIEWS = [["tab", "고객 태블릿"], ["os", "상담실장 YK-OS"], ["both", "나란히"]];

export default function App() {
  const q = new URLSearchParams(location.search);
  const [data, setData] = useState(null);
  const [cat, setCat] = useState(null);
  const [screen, setScreen] = useState(DEEP.has(q.get("s")) ? q.get("s") : "wait");
  const [cid, setCid] = useState(q.get("c") || "");
  const [view, setView] = useState(VIEWS.some(([v]) => v === q.get("v")) ? q.get("v") : "tab");
  /** YK-OS에서 화면 공유를 눌렀는지. 누르기 전 태블릿은 대기 화면만 보여준다. */
  const [connected, setConnected] = useState(false);

  useEffect(() => { api.catalog().then(setCat); }, []);
  useEffect(() => { api.visit(cid).then(setData); }, [cid]);

  useEffect(() => {
    const u = new URL(location.href);
    if (screen && screen !== "wait") u.searchParams.set("s", screen); else u.searchParams.delete("s");
    if (cid) u.searchParams.set("c", cid); else u.searchParams.delete("c");
    if (view !== "tab") u.searchParams.set("v", view); else u.searchParams.delete("v");
    history.replaceState(null, "", u);
  }, [screen, cid, view]);

  const share = useCallback((id) => {
    setCid(id);
    setConnected(true);
    setScreen("wait");
  }, []);

  const unshare = useCallback(() => {
    setConnected(false);
    setScreen("wait");
  }, []);

  /** 추천 순위표에서 고른 변호사를 고객 화면에 띄운다. */
  const pushLawyer = useCallback(() => setScreen("counsel"), []);

  if (!data || !cat) {
    return (
      <div className="shell">
        <div className="dbar"><span className="bd">YK 상담 태블릿</span></div>
        <p className="sub" style={{ color: "#ccc", padding: 24 }}>불러오는 중…</p>
      </div>
    );
  }

  const booking = cat.bookings.find((b) => b.id === data.booking.id) || data.booking;
  const act = { share, unshare, screen: setScreen, pushLawyer };

  return (
    <div className="shell">
      <div className="dbar">
        <span className="bd">YK 상담 태블릿 <em>시연</em></span>
        <div className="seg">
          {VIEWS.map(([v, l]) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>{l}</button>
          ))}
        </div>
        {view !== "os" && (
          <div className="seg">
            {SCREENS.map(([id, l]) => (
              <button
                key={id}
                className={screen === id || (id === "counsel" && screen === "counsel-video") ? "on" : ""}
                onClick={() => setScreen(id)}
              >{l}</button>
            ))}
          </div>
        )}
        <select className="dpick" value={data.booking.id} onChange={(e) => setCid(e.target.value)} aria-label="시연 예약">
          {data.bookings.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.cat2}</option>)}
        </select>
        <span className="sp" />
        <span className="note">고객명은 전부 가명입니다</span>
      </div>

      <div className={`stage ${view === "both" ? "two" : "one"}`}>
        {view !== "os" && (
          <div className="tabwrap">
            <Tablet data={data} screen={screen} onScreen={setScreen} />
          </div>
        )}
        {view !== "tab" && (
          <YKOS cat={cat} data={data} booking={booking} connected={connected} screen={screen} act={act} />
        )}
      </div>
    </div>
  );
}
