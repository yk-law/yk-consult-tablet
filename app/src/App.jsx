import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import Tablet from "./Tablet.jsx";
import LegacyPreview from "./LegacyPreview.jsx";
import YKOS from "./YKOS.jsx";

const SCREENS = [
  ["wait", "내방"],
  ["prep", "상담 준비"],
  ["film", "소개 영상"],
  ["firm", "YK 소개"],
  ["report", "사건 요약"],
  ["counsel", "상담 변호사"],
  ["seniors", "전문 인력"],
];
/** 장면 딥링크용. 상단 세그에는 안 넣고 URL·흐름에서만 쓴다. */
const DEEP = new Set(["film", "counsel-video", "topics", ...SCREENS.map(([id]) => id)]);
const VIEWS = [["tab", "고객 태블릿"], ["os", "상담실장 YK-OS"], ["both", "나란히"]];

export default function App() {
  const q = new URLSearchParams(location.search);
  const [data, setData] = useState(null);
  const [cat, setCat] = useState(null);
  const [screen, setScreen] = useState(DEEP.has(q.get("s")) ? q.get("s") : "wait");
  const [theme, setTheme] = useState(q.get("theme") === "dark" ? "dark" : "light");
  const [darkDesign, setDarkDesign] = useState(q.get("design") === "current" ? "current" : "legacy");
  const [cid, setCid] = useState(q.get("c") || "");
  const [view, setView] = useState(VIEWS.some(([v]) => v === q.get("v")) ? q.get("v") : "tab");
  /** YK-OS에서 화면 공유를 눌렀는지. 누르기 전 태블릿은 대기 화면만 보여준다. */
  const [connected, setConnected] = useState(false);
  /** 화면 공유 때 실장이 고른 상담 변호사. 예약의 지정 변호사 대신 고객 화면에 나온다. */
  const [pick, setPick] = useState(q.get("l") || "");
  const [pickData, setPickData] = useState(null);
  /** 사건 요약 1뎁스에서 고객이 고른 맞아요/아니요. 문장 순서 → "yes" | "no". 실장 화면에 그대로 보인다. */
  const [answers, setAnswers] = useState({});
  const answer = useCallback((i, v) => setAnswers((a) => ({ ...a, [i]: v })), []);
  useEffect(() => { setAnswers({}); }, [cid]);

  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [controlsOpen, setControlsOpen] = useState(false);
  const cornerTaps = useRef([]);
  const [fullscreenError, setFullscreenError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const refreshLock = useRef(false);
  const refreshData = async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    setRefreshing(true);
    setFullscreenError("");
    try {
      const [nextCatalog, nextData] = await Promise.all([
        api.catalog({ refresh: true }), api.visit(cid, { refresh: true }),
      ]);
      setCat(nextCatalog);
      setData(nextData);
    } catch {
      setFullscreenError("새로고침하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      refreshLock.current = false;
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const sync = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      setControlsOpen(false);
      cornerTaps.current = [];
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const handleCornerTap = (event) => {
    if (!fullscreen || controlsOpen || event.detail === 0) return;
    // 팝업 닫기 등 실제 조작은 숨은 설정 호출보다 우선한다.
    if (event.target instanceof Element && event.target.closest('.xmodal, button, a, input, select, textarea, [role="button"]')) {
      cornerTaps.current = [];
      return;
    }
    const width = document.documentElement.clientWidth;
    if (event.clientX < width - 256 || event.clientX > width || event.clientY < 0 || event.clientY >= 256) {
      cornerTaps.current = [];
      return;
    }
    // 비대화형 빈 영역에서만 세 번 눌러 설정을 호출한다.
    event.preventDefault();
    event.stopPropagation();
    const now = performance.now();
    cornerTaps.current = [...cornerTaps.current.filter((time) => now - time <= 1500), now];
    if (cornerTaps.current.length >= 3) {
      cornerTaps.current = [];
      setControlsOpen(true);
    }
  };

  useEffect(() => {
    if (!fullscreen || !controlsOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setControlsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [fullscreen, controlsOpen]);

  const toggleFullscreen = async () => {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
        // 터치 이벤트 안에서 바로 호출해야 Android Chrome의 사용자 동작 조건을 충족한다.
        await document.documentElement.requestFullscreen();
      } else {
        setFullscreenError("이 브라우저에서는 전체 화면을 사용할 수 없습니다. 태블릿의 Chrome에서 직접 열어 주세요.");
      }
    } catch {
      setFullscreenError("전체 화면으로 전환하지 못했습니다. 버튼을 다시 눌러 주세요.");
    }
  };

  useEffect(() => { api.catalog().then(setCat); }, []);
  useEffect(() => { api.visit(cid).then(setData); }, [cid]);
  useEffect(() => {
    if (!pick) { setPickData(null); return; }
    let live = true;
    api.counsel(pick).then((p) => live && setPickData(p));
    return () => { live = false; };
  }, [pick]);

  useEffect(() => {
    const u = new URL(location.href);
    if (screen && screen !== "wait") u.searchParams.set("s", screen); else u.searchParams.delete("s");
    if (cid) u.searchParams.set("c", cid); else u.searchParams.delete("c");
    if (pick) u.searchParams.set("l", pick); else u.searchParams.delete("l");
    if (view !== "tab") u.searchParams.set("v", view); else u.searchParams.delete("v");
    u.searchParams.set("theme", theme);
    if (darkDesign === "current") u.searchParams.set("design", "current"); else u.searchParams.delete("design");
    history.replaceState(null, "", u);
  }, [screen, cid, view, theme, darkDesign, pick]);

  const share = useCallback((id, counselName = "") => {
    setCid(id);
    setPick(counselName);
    setConnected(true);
    setScreen("wait");
  }, []);

  const unshare = useCallback(() => {
    setConnected(false);
    setPick("");
    setAnswers({});
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

  // 실장이 고른 상담 변호사로 바꿔 끼운다. 전문 인력 목록에서는 그 사람을 뺀다.
  const shown = pickData && pickData.counsel.n !== data.counsel?.n
    ? {
        ...data,
        counsel: pickData.counsel,
        portraits: { ...data.portraits, ...pickData.portraits },
        seniors: data.seniors.filter((s) => s.n !== pickData.counsel.n),
      }
    : data;
  const booking = cat.bookings.find((b) => b.id === data.booking.id) || data.booking;
  const displayView = fullscreen ? "tab" : view;
  const act = { share, unshare, screen: setScreen, pushLawyer, counsel: setPick };

  return (
    <div className={`shell ${fullscreen ? "customer-fullscreen" : ""} ${controlsOpen ? "controls-open" : ""}`} onClickCapture={handleCornerTap}>
      {fullscreen && controlsOpen && (
        <button className="drawer-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setControlsOpen(false)} />
      )}
      <div className="dbar" data-theme={theme} role={fullscreen ? "dialog" : undefined} aria-label={fullscreen ? "화면 설정" : undefined}>
        {fullscreen && controlsOpen && (
          <div className="drawer-heading">
            <h2>설정</h2>
            <div className="drawer-header-actions">
            <button type="button" className="drawer-icon-button" aria-label={refreshing ? "새로고침 중" : "새로고침"} title="새로고침" disabled={refreshing} aria-busy={refreshing} onClick={refreshData}>
              <svg className="lucide lucide-refresh-cw" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
            <button type="button" className="drawer-icon-button" aria-label="설정 닫기" title="닫기" onClick={() => { setControlsOpen(false); cornerTaps.current = []; }}>
              <svg className="lucide lucide-x" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
            </div>
          </div>
        )}
        {/* 시연 중 어느 배포본을 보고 있는지 확인용. 마우스를 올려야 보이므로 고객 화면에는 드러나지 않는다. */}
        <span className="bd" title={`빌드 ${__BUILD__}`}>YK 상담 태블릿 <em>시연</em></span>
        {!fullscreen && (
          <div className="seg">
            {VIEWS.map(([v, l]) => (
              <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>{l}</button>
            ))}
          </div>
        )}
        <div className={fullscreen ? "drawer-body" : "toolbar-body"}>
        {(fullscreen || view !== "os") && (
          <div className="seg screen-controls" role="group" aria-label="페이지">
            {fullscreen && <h3 className="drawer-section-label">페이지</h3>}
            {SCREENS.map(([id, l]) => (
              <button
                key={id}
                className={screen === id || (id === "counsel" && screen === "counsel-video") || (id === "report" && screen === "topics") ? "on" : ""}
                aria-pressed={screen === id || (id === "counsel" && screen === "counsel-video") || (id === "report" && screen === "topics")}
                onClick={() => setScreen(id)}
              >{l}</button>
            ))}
          </div>
        )}
        {(fullscreen || (view !== "os" && ["wait", "prep", "film", "firm", "report", "topics", "counsel", "seniors"].includes(screen))) && (
          fullscreen ? <div className="theme-controls drawer-theme-row">
            <h3 className="drawer-section-label">화면 테마</h3>
            <div className="drawer-theme-setting">
            <span>{theme === "dark" ? "다크 모드" : "라이트 모드"}</span>
            <button type="button" className="theme-switch" role="switch" aria-label="다크 모드" aria-checked={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <span className="theme-switch-thumb">
                <svg className={`lucide lucide-${theme === "dark" ? "moon" : "sun"}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {theme === "dark" ? (
                    <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" /><path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" /><path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                    </>
                  )}
                </svg>
              </span>
            </button>
            </div>
          </div> : <div className="seg theme-controls" role="group" aria-label="화면 테마">
            {[["light", "라이트 모드"], ["dark", "다크 모드"]].map(([id, label]) => (
              <button key={id} aria-pressed={theme === id} className={theme === id ? "on" : ""} onClick={() => setTheme(id)}>{label}</button>
            ))}
          </div>
        )}
        {theme === "dark" && (
          <label className="dark-design-control">
            <span>다크 디자인 비교</span>
            <select value={darkDesign} onChange={(event) => setDarkDesign(event.target.value)}>
              <option value="legacy">초기 시안 · 검정 / 버건디</option>
              <option value="current">현재 다크 · 네이비</option>
            </select>
          </label>
        )}
        </div>
        <select className="dpick" value={data.booking.id} onChange={(e) => { setCid(e.target.value); setPick(""); }} aria-label="시연 예약">
          {data.bookings.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.cat2} · {b.depth === 1 ? "요약 1·2뎁스" : "요약 2뎁스만"}</option>)}
        </select>
        <button type="button" className="fullscreen-toggle" aria-pressed={fullscreen} onClick={toggleFullscreen}>
          {fullscreen && (
            <svg className="lucide lucide-minimize" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          )}
          <span>{fullscreen ? "전체 화면 해제" : "전체 화면"}</span>
        </button>
        {fullscreenError && <span className="fullscreen-error" role="alert">{fullscreenError}</span>}
        <span className="sp" />
        <span className="note">고객명은 전부 가명입니다</span>
      </div>

      <div className={`stage ${displayView === "both" ? "two" : "one"}`}>
        {displayView !== "os" && (
          <div className={`tabwrap binder-theme theme-${theme}`}>
            {theme === "dark" && darkDesign === "legacy"
              ? <LegacyPreview data={shown} screen={screen} onScreen={setScreen} />
              : <Tablet data={shown} screen={screen} onScreen={setScreen} answers={answers} onAnswer={answer} />}
          </div>
        )}
        {displayView !== "tab" && (
          <YKOS cat={cat} data={shown} booking={booking} connected={connected} screen={screen} act={act} answers={answers} />
        )}
      </div>
    </div>
  );
}
