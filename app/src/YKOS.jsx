import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "./Logo.jsx";
import Tablet from "./Tablet.jsx";
import SignForm from "./SignForm.jsx";
import { DEMO_TODAY, addDays } from "./util.jsx";

/* 상담실장 YK-OS — 실제 YK-OS 상담 태블릿(/app/visit, feature/20261029-상담-태블릿) 화면과 동작을 따른다(2026-11-13).
   이 저장소에 데이터가 있는 동작은 그대로 구현하고(태블릿 선택·고객 띄우기·바인더 열기·체크리스트·선임 계약 안내 등),
   데이터가 없는 것(상담 내용 작성·상담 메모·문서 보관함·체크리스트 다시 만들기)은 모양만 둔다. */

/** 방문 예정일 이동. 실제 YK-OS는 화살표 하나에 라벨 하나다. */
const DAY_LABEL = { "-1": "어제", 0: "오늘", 1: "내일" };

/** 시연 시각. 머리줄 시계와 방문 상태(예정·곧 시작·미방문 상담) 계산에 같이 쓴다. */
const DEMO_NOW = `${DEMO_TODAY}T08:50`;
const CLOCK = `${DEMO_TODAY.replaceAll("-", ".")} 08:50`;

/** 실제 YK-OS getVisitStatus: 지난 시각은 미방문 상담, 30분 안이면 곧 시작, 그 밖은 예정. */
function visitStatus(x) {
  const diff = (new Date(`${x.date}T${x.time}`) - new Date(DEMO_NOW)) / 60000;
  if (Number.isNaN(diff)) return ["시간 미정", "none"];
  if (diff < 0) return ["미방문 상담", "muted"];
  if (diff <= 30) return ["곧 시작", "soon"];
  return ["예정", "plan"];
}

/** 전체·형사·민·가사 탭. 실제는 서버가 major_category 로 거른다. 여기서는 YK-OS 콜 중분류로 나눈다. */
const CRIMINAL = new Set(["강력범죄", "경제범죄", "고소, 고발", "고소·고발", "교통범죄", "군형사", "도박", "마약범죄", "부패범죄", "성범죄", "소년사건", "일반형사", "학교폭력"]);
const tabOf = (x) => (CRIMINAL.has(x.cat1) ? "형사" : "민·가사");

/** 실제 YK-OS(lucide) 아이콘. 선 굵기 2, 24 격자. */
const ICON = {
  home: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8 M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  file: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z M14 2v4a2 2 0 0 0 2 2h4 M10 9H8 M16 13H8 M16 17H8",
  folder: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
  cast: "M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6 M2 12a9 9 0 0 1 8 8 M2 16a5 5 0 0 1 4 4 M2 20h.01",
  out: "m16 17 5-5-5-5 M21 12H9 M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  down: "m6 9 6 6 6-6",
  x: "M18 6 6 18 M6 6l12 12",
  book: "M12 7v14 M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
  memo: "M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z M15 3v4a2 2 0 0 0 2 2h4",
  tablet: "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M12 18h.01",
  trash: "M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",
  warn: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3 M12 9v4 M12 17h.01",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
  refresh: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16 M8 16H3v5",
};
function Icon({ d, className = "" }) {
  return (
    <svg className={`yo-i ${className}`.trim()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split(" M").map((p, i) => <path key={i} d={i ? `M${p}` : p} />)}
    </svg>
  );
}

/** 보기를 바꿔(고객 태블릿·나란히) 이 화면이 내려갔다 올라와도 실장 쪽 상태가 남게 한다. */
const kept = new Map();
function useKept(key, init) {
  const [v, setV] = useState(() => (kept.has(key) ? kept.get(key) : typeof init === "function" ? init() : init));
  useEffect(() => { kept.set(key, v); }, [key, v]);
  return [v, setV];
}

export default function YKOS({ cat, data, connected, screen, act, answersBy = {}, onResetAnswers = () => {} }) {
  const bookings = cat?.bookings || [];
  const [vq, setVq] = useState("");
  const [off, setOff] = useKept("off", 0);
  const [tab, setTab] = useKept("tab", "전체");
  const [signId, setSignId] = useState(null);

  /** 상담 변호사. 콜 단계에서 정해 둔 변호사가 있으면 채워 둔다. */
  const [assigned, setAssigned] = useKept("assigned", () => Object.fromEntries(
    bookings.filter((b) => b.counsel && b.counselAssigned !== false).map((b) => [b.id, b.counsel]),
  ));
  /** 상담 태블릿. 실제는 태블릿 앱에서 이름을 넣고 입장한다. 시연은 예약의 상담실로 만든다. */
  const [tablets, setTablets] = useKept("tablets", () => [...new Set(bookings.map((b) => b.branch).filter(Boolean))].sort());
  const [mirror, setMirror] = useKept("mirror", "");
  /** 태블릿에 띄운 고객(예약 id). 띄우기만 하면 태블릿은 로고 대기 화면이다. */
  const [shownId, setShownId] = useKept("shownId", "");
  const [displayOn, setDisplayOn] = useKept("displayOn", false);
  /** 바인더를 연 예약. 바인더가 문항을 보내 와야 「체크리스트 확인」이 생긴다. */
  const [binderIds, setBinderIds] = useKept("binderIds", []);
  const [openCheck, setOpenCheck] = useState({});
  const [split, setSplit] = useKept("split", 0.5);

  const [menuOpen, setMenuOpen] = useState(false);
  /** 확인·안내 창: { kind: "switch"|"release"|"exit"|"display"|"contract"|"destroy", row?, openBinder?, name? } */
  const [dialog, setDialog] = useState(null);

  const want = addDays(DEMO_TODAY, off);
  const rows = useMemo(() => {
    const q = vq.trim().toLowerCase();
    return bookings
      .filter((x) => x.date === want)
      .filter((x) => tab === "전체" || tabOf(x) === tab)
      .filter((x) => !q || [x.name, x.tel, x.cat1, x.cat2].join(" ").toLowerCase().includes(q))
      .sort((a, z) => a.time.localeCompare(z.time));
  }, [bookings, vq, want, tab]);

  const byId = (id) => bookings.find((b) => b.id === id);
  const shown = shownId ? byId(shownId) : null;
  const binderOn = Boolean(shown && binderIds.includes(shown.id) && connected);
  const contentShowing = displayOn && binderOn;
  const checkItems = (x) => (binderIds.includes(x.id) ? x.summary || [] : []);

  /** 실제 clearBinder3Confirm: 이전 사건의 체크리스트 문항·답을 지운다. */
  const resetCase = (id) => {
    if (!id) return;
    setBinderIds((ids) => ids.filter((v) => v !== id));
    setOpenCheck((o) => ({ ...o, [id]: false }));
    onResetAnswers(id);
  };

  /** 고객을 태블릿에 띄운다(바인더는 열지 않고 화면 꺼짐 + 로고 대기). 같은 고객이면 해제. */
  const selectRow = (x) => {
    const prev = shownId;
    if (prev === x.id) {
      setShownId("");
    } else {
      setShownId(x.id);
    }
    setDisplayOn(false);
    if (connected) act.unshare();
    resetCase(prev);
  };

  const needsConfirm = (prevId) => checkItems(byId(prevId) || {}).length > 0 || displayOn;

  const onRowClick = (x) => {
    if (!mirror) return;
    const action = !shownId ? "show" : shownId === x.id ? "release" : "switch";
    if (action !== "show" && needsConfirm(shownId)) { setDialog({ kind: action, row: x }); return; }
    selectRow(x);
  };

  /** 실제 openBinder3: 그 고객의 바인더 첫 화면을 띄우고 고객화면을 켠다. */
  const openBinder = (x) => {
    setShownId(x.id);
    setDisplayOn(true);
    setBinderIds((ids) => (ids.includes(x.id) ? ids : [...ids, x.id]));
    act.share(x.id, assigned[x.id]);
  };

  const onOpenBinder = (x) => {
    // 고객화면이 꺼져 있어도 묻지 않는다. openBinder 가 화면을 켜고 바로 연다.
    const action = !shownId ? "show" : shownId === x.id ? "release" : "switch";
    if (action === "switch" && needsConfirm(shownId)) { setDialog({ kind: "switch", row: x, openBinder: true }); return; }
    if (action === "switch") resetCase(shownId);
    openBinder(x);
  };

  /** 미러링 종료·나가기: 태블릿을 비우고 화면을 끄고, 띄운 고객의 체크리스트도 지운다. */
  const removeTablet = () => {
    if (connected) act.unshare();
    resetCase(shownId);
    setShownId("");
    setDisplayOn(false);
    setMirror("");
  };

  const pickTablet = (name) => {
    if (mirror && mirror !== name) removeTablet();
    setMirror(name);
    setDisplayOn(false);
    setMenuOpen(false);
  };

  const confirmDialog = () => {
    const d = dialog;
    setDialog(null);
    if (!d) return;
    if (d.kind === "release" || d.kind === "switch") {
      selectRow(d.row);
      if (d.kind === "switch" && d.openBinder) openBinder(d.row);
    }
    if (d.kind === "exit") removeTablet();
    if (d.kind === "destroy") {
      if (mirror === d.name) removeTablet();
      setTablets((list) => list.filter((t) => t !== d.name));
    }
  };

  const sign = signId ? byId(signId) : null;
  const block = (x) => (!assigned[x.id] ? "counsel" : !mirror ? "tablet" : null);

  /* 화면 비율 조절(실제 0.28~0.72) */
  const splitRef = useRef(null);
  const startResize = (e) => {
    const box = splitRef.current?.getBoundingClientRect();
    if (!box) return;
    e.preventDefault();
    const move = (ev) => setSplit(Math.min(0.72, Math.max(0.28, (ev.clientX - box.left) / box.width)));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="os" id="osDev">
      {/* 머리줄: 홈(방문 예정 목록) · 선임 · 문서 보관함 | 미러링 · 시각 · 이름 · 로그아웃 */}
      <div className="ostop">
        <button type="button" className="oico on" aria-label="방문 예약 홈" onClick={() => setSignId(null)}><Icon d={ICON.home} /></button>
        <button type="button" className="oico" aria-label="선임"><Icon d={ICON.file} /></button>
        <button type="button" className="oico" aria-label="문서 보관함 보기"><Icon d={ICON.folder} /></button>
        <span className="sp2" />
        <div className="mir-wrap">
          <button
            type="button"
            className={`mir${mirror ? " on" : ""}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={mirror ? `${mirror} 미러링 중 — 방 선택 또는 종료` : "상담 태블릿 선택"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon d={ICON.cast} /><span>{mirror || "미러링"}</span><i />
          </button>
          {menuOpen && (
            <>
              <button type="button" className="mir-scrim" aria-label="닫기" onClick={() => setMenuOpen(false)} />
              <div className="mir-menu" role="menu">
                {mirror && (
                  <>
                    <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); removeTablet(); }}>
                      <b>미러링 종료</b>
                    </button>
                    <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); setDialog({ kind: "destroy", name: mirror }); }}>
                      <Icon d={ICON.trash} /><span><b>태블릿 삭제</b><small>태블릿 연결을 끊고 목록에서 제거</small></span>
                    </button>
                  </>
                )}
                {!tablets.length && (
                  <div className="mir-none"><b>연결 가능한 태블릿 없음</b><small>상담 태블릿 앱에서 입장해 주세요.</small></div>
                )}
                {tablets.map((t) => (
                  <button type="button" role="menuitem" key={t} className={t === mirror ? "on" : ""} onClick={() => pickTablet(t)}>
                    <Icon d={ICON.tablet} /><b>{t}</b>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <span className="clk">{CLOCK}</span>
        <span className="me">고재완</span>
        <button type="button" className="oico out" aria-label="로그아웃"><Icon d={ICON.out} /></button>
      </div>

      <div className="osw">
        <div className="osm">
          <div className="split" ref={splitRef} style={{ gridTemplateColumns: `${split * 100}% 8px minmax(0,1fr)` }}>
            <section className="lft">
              {sign ? <SignForm booking={sign} onBack={() => setSignId(null)} /> : <>
              <div className="yo-paper vhd">
                <h3>방문 예정 목록</h3>
                <div className="vhd-tools">
                  <div className="dnav" aria-label="방문 예정일 이동">
                    <button onClick={() => setOff(off - 1)} aria-label="이전 날"><Icon d={ICON.left} /></button>
                    <span className="lb">{DAY_LABEL[off] || want.slice(5)}</span>
                    <button onClick={() => setOff(off + 1)} aria-label="다음 날"><Icon d={ICON.right} /></button>
                  </div>
                  <div className="seg2" role="group">
                    {["전체", "형사", "민·가사"].map((t) => (
                      <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="yo-paper yo-list">
              <div className="vsearch">
                <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" /><path d="M13.5 13.5 18 18" /></svg>
                <input value={vq} onChange={(e) => setVq(e.target.value)} placeholder="고객명, 사건 유형, 연락처로 검색" />
              </div>

              <div className="vrows">
                {rows.map((x) => {
                  const on = shownId === x.id;
                  const [stLabel, st] = visitStatus(x);
                  const items = checkItems(x);
                  const answers = answersBy[x.id] || {};
                  const answered = items.filter((_, i) => answers[i]).length;
                  const hasNo = items.some((_, i) => answers[i] === "no");
                  const why = block(x);
                  return (
                    <div
                      className={`vcard${on ? " cur" : ""}${st === "muted" ? " muted" : ""}${mirror ? " pick" : ""}`}
                      key={x.id}
                      onClick={() => onRowClick(x)}
                    >
                      <div className="vline">
                        <span className="vwhen">
                          <span className="ymd">{x.date.slice(2)}</span>
                          <span className="tm">{x.time}</span>
                          <span className={`st ${st}`}>{stLabel}</span>
                        </span>
                        {/* 이름 옆에 사건 칩을 붙이고 전화번호는 오른쪽 끝. 목업 이름은 전부 가명이다. */}
                        <span className="vwho">
                          <span className="vn">{x.name}</span>
                          <span className="vg">{x.cat1}&gt;{x.cat2}</span>
                        </span>
                        <span className="vt">{x.tel}</span>
                      </div>
                      <div className="vacts" onClick={(e) => e.stopPropagation()}>
                        <div className="vbind">
                        <div className="vbind-row">
                        <CounselSelect
                          lawyers={cat.lawyers}
                          FIELD={cat.FIELD}
                          value={assigned[x.id] || ""}
                          onChange={(name) => {
                            const next = { ...assigned };
                            if (name) next[x.id] = name; else delete next[x.id];
                            setAssigned(next);
                            if (on && binderOn && name) act.counsel(name);
                          }}
                        />
                        <button className="vb share" disabled={why != null} onClick={() => onOpenBinder(x)}>
                          <Icon d={ICON.book} />바인더 열기
                        </button>
                        </div>
                        {why && <p className="vhint">{why === "counsel" ? "상담 변호사를 지정하면 바인더를 열 수 있습니다." : "태블릿(상담실)을 먼저 선택해 주세요."}</p>}
                        </div>
                        <div className="vacts-r">
                        {/* 바인더가 문항을 보내 온 행에만. 닫아 두어도 아니오는 놓치지 않게 붉게. */}
                        {items.length > 0 && (
                          <button
                            className={`vb check${openCheck[x.id] ? " open" : ""}${hasNo ? " no" : ""}`}
                            onClick={() => setOpenCheck({ ...openCheck, [x.id]: !openCheck[x.id] })}
                          >
                            체크리스트 확인 · {answered}/{items.length}
                          </button>
                        )}
                        {/* 상담 내용 작성은 YK-OS 상담 모달이다. 이 저장소에 없어 모양만 둔다. */}
                        <button className="vb">{x.wrote ? "상담 내용 보기" : "상담 내용 작성"}</button>
                        <button
                          className={`vb${x.wrote ? "" : " off"}`}
                          title={x.wrote ? undefined : "먼저 상담 내용 작성 후 상담 완료 시 선임 계약 버튼이 활성화됩니다."}
                          onClick={() => (x.wrote ? setSignId(x.id) : setDialog({ kind: "contract" }))}
                        >
                          선임 계약
                        </button>
                        <button className="vb icon" aria-label="상담 메모" title="상담 메모"><Icon d={ICON.memo} /></button>
                        </div>
                      </div>
                      {items.length > 0 && openCheck[x.id] && (
                        <ConfirmList rows={items} answers={answers} />
                      )}
                    </div>
                  );
                })}
                {!rows.length && <p className="vempty">방문 예정 고객이 없습니다.</p>}
              </div>
              </div>
              </>}
            </section>

            <div className="split-bar" role="separator" aria-orientation="vertical" aria-label="화면 비율 조절"
              aria-valuemin={28} aria-valuemax={72} aria-valuenow={Math.round(split * 100)} onPointerDown={startResize} />

            {/* 우 — 고객화면 미리보기 */}
            <section className="rgt">
              <div className="rtab">
                {!mirror ? (
                  <>
                    <span className="on">고객화면</span>
                    <span className="st">미연결</span>
                  </>
                ) : (
                  <>
                    <button type="button" role="switch" aria-checked={displayOn} aria-label="태블릿 화면 켜기/끄기"
                      className={`yo-switch${displayOn ? " on" : ""}`} onClick={() => setDisplayOn(!displayOn)}><i /></button>
                    <span className="on click" onClick={() => setDisplayOn(!displayOn)}>고객화면</span>
                    <span className={`st${contentShowing ? " live" : ""}`}>{contentShowing ? "화면 표시 중" : "대기 중"}</span>
                    <span className={`st ${displayOn ? "lit" : "dark"}`}>{displayOn ? "화면 켜짐" : "화면 꺼짐"}</span>
                    {shown && <span className="rwho" title={shown.name}>{shown.name}</span>}
                    <button type="button" className="rx" aria-label="상담 태블릿 화면 종료" onClick={() => setDialog({ kind: "exit" })}><Icon d={ICON.x} /></button>
                  </>
                )}
              </div>
              {!mirror ? (
                <div className="oempty">
                  <div className="lg"><Logo /></div>
                  <div className="ttl">상담 태블릿을 연결하세요</div>
                  <p className="d">미러링 시 고객 화면 미리보기가 여기에 표시됩니다.</p>
                  <ol>
                    <li><i>1</i>상담 태블릿 앱에서 이름을 입력해 입장합니다.</li>
                    <li><i>2</i>아래 목록에서 연결할 태블릿을 선택합니다.</li>
                    <li><i>3</i>방문 예정 목록에서 고객을 선택합니다.</li>
                  </ol>
                  {tablets.length ? (
                    <div className="otablets">
                      <p>연결 가능한 태블릿 {tablets.length}대</p>
                      <div>
                        {tablets.map((t) => (
                          <span className="otab" key={t}>
                            <button type="button" onClick={() => pickTablet(t)}><Icon d={ICON.tablet} />{t}</button>
                            <button type="button" className="x" aria-label={`${t} 태블릿 삭제`} title="태블릿 삭제"
                              onClick={() => setDialog({ kind: "destroy", name: t })}><Icon d={ICON.x} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : <p className="w">연결 가능한 태블릿이 없습니다. 상담 태블릿 앱에서 먼저 입장해 주세요.</p>}
                </div>
              ) : (
                <div className="mirror">
                  <div className="mfr"><div className="mscale"><div className="mclone">
                    {contentShowing && data
                      ? <Tablet data={data} screen={screen} onScreen={() => {}} answers={answersBy[data.booking.id] || {}} onParty={() => {}} />
                      : <div className="midle"><Logo /></div>}
                  </div></div></div>
                  {!shown && <p className="mwait">고객을 선택해주세요</p>}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {dialog && <YkDialog dialog={dialog} shown={shown} onCancel={() => setDialog(null)} onConfirm={confirmDialog} />}
    </div>
  );
}

/** 확인·안내 창. 실제 YK-OS 세 가지 모양을 따른다.
 *  confirm(바꾸기·해제) = ConfirmModal, notice(안내) = TemplateMissingFieldDialog, modal(나가기·태블릿 삭제) = Modal. */
function YkDialog({ dialog, shown, onCancel, onConfirm }) {
  const current = shown?.name || "지금 고객";
  const next = dialog.row?.name || "이 고객";
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (dialog.kind === "release" || dialog.kind === "switch") {
    const [title, body, ok] = dialog.kind === "release"
      ? ["태블릿에서 고객을 해제할까요?", `${current} 고객을 태블릿에서 내리고 고객화면을 끕니다.\n${current} 고객의 바인더 진행 내역(보던 화면·답·체크리스트)은 초기화됩니다.`, "해제"]
      : ["태블릿 고객을 바꿀까요?", `지금 태블릿에 ${current} 고객이 떠 있습니다.\n${next} 고객으로 바꾸면 태블릿이 그 고객의 첫 화면으로 바뀌고, ${current} 고객의 바인더 진행 내역(보던 화면·답·체크리스트)은 초기화됩니다.`, "바꾸기"];
    return (
      <div className="ydlg" role="presentation" onClick={onCancel}>
        <div className="ydlg-panel confirm" role="alertdialog" aria-modal="true" aria-labelledby="ydlg-t" onClick={(e) => e.stopPropagation()}>
          <div className="ydlg-body">
            <div className="ydlg-head">
              <span className="ydlg-warn"><Icon d={ICON.warn} /></span>
              <h2 id="ydlg-t">{title}</h2>
            </div>
            <p>{body}</p>
          </div>
          <div className="ydlg-a">
            <button type="button" className="cancel" onClick={onCancel}>취소</button>
            <button type="button" className="ok" autoFocus onClick={onConfirm}>{ok}</button>
          </div>
        </div>
      </div>
    );
  }

  if (dialog.kind === "contract") {
    const body = "먼저 상담 내용 작성 후 상담 완료를 해 주세요.\n상담 완료 시 선임 계약 버튼이 활성화됩니다.";
    return (
      <div className="ydlg" role="presentation" onClick={onCancel}>
        <div className="ydlg-panel modal" role="dialog" aria-modal="true" aria-labelledby="ydlg-t" onClick={(e) => e.stopPropagation()}>
          <h2 id="ydlg-t">안내</h2>
          <div className="ydlg-text"><Icon d={ICON.info} className="ydlg-info" /><p>{body}</p></div>
          <div className="ydlg-a"><button type="button" className="pill" autoFocus onClick={onCancel}>확인</button></div>
        </div>
      </div>
    );
  }

  const destroy = dialog.kind === "destroy";
  return (
    <div className="ydlg" role="presentation" onClick={onCancel}>
      <div className="ydlg-panel modal" role="dialog" aria-modal="true" aria-labelledby="ydlg-t" onClick={(e) => e.stopPropagation()}>
        <h2 id="ydlg-t">{destroy ? "태블릿 삭제" : "나가기"}</h2>
        <div className="ydlg-text">
          {destroy
            ? <p><b>{dialog.name}</b> 삭제할까요?<br />태블릿 연결이 끊기고 목록에서 제거됩니다.</p>
            : <p>상담태블릿 화면을 종료하시겠습니까?</p>}
        </div>
        <div className="ydlg-a">
          <button type="button" className="pill ghost" onClick={onCancel}>취소</button>
          <button type="button" className={`pill${destroy ? " danger" : ""}`} autoFocus onClick={onConfirm}>{destroy ? "삭제" : "확인"}</button>
        </div>
      </div>
    </div>
  );
}

/** 상담 변호사 칸. 실제 VisitCounselSelect: 고르면 이름과 지우기 X, 누르면 검색 입력으로 바뀌어 목록에서 고른다. */
function CounselSelect({ lawyers = [], FIELD, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState("");
  const hits = useMemo(() => {
    const t = q.trim();
    const label = (l) => (l.f || []).map((k) => FIELD?.[k]?.[0] || "").join(" ");
    return (t ? lawyers.filter((l) => l.n.includes(t) || label(l).includes(t)) : lawyers).slice(0, 8);
  }, [lawyers, q, FIELD]);
  const chosen = lawyers.find((l) => l.n === value);
  const pick = (name) => { onChange(name); setEditing(false); setQ(""); };

  if (value && !editing) {
    return (
      <div className="vcounsel set">
        <button type="button" className="vcounsel-pick" aria-label={`상담 변호사 변경 (${value})`} onClick={() => setEditing(true)}>
          <b>{value}</b>{chosen?.pos && <span className="pos">{chosen.pos}</span>}
        </button>
        <button type="button" className="vcounsel-x" aria-label="상담 변호사 지우기" onClick={() => onChange("")}><Icon d={ICON.x} /></button>
      </div>
    );
  }
  return (
    <div className="vcounsel" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setEditing(false); setQ(""); } }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setEditing(true)}
        placeholder={value ? "상담 변호사" : "상담 변호사 지정"}
        aria-label="상담 변호사 지정"
        autoFocus={editing}
      />
      <Icon d={ICON.down} className="vcounsel-chev" />
      {editing && (
        <ul className="vcounsel-list" role="listbox">
          {hits.map((l) => (
            <li key={l.n}>
              <button type="button" role="option" aria-selected={l.n === value} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(l.n)}>
                <b>{l.n}</b><span>{l.pos}</span>
              </button>
            </li>
          ))}
          {!hits.length && <li className="none">검색 결과가 없습니다.</li>}
        </ul>
      )}
    </div>
  );
}

/** 방문 예정 행 아래 「고객 확인」. 실제 VisitBinder3ConfirmList. 다시 만들기(리롤)는 데이터가 없어 모양만 둔다. */
function ConfirmList({ rows, answers }) {
  const count = (v) => rows.filter((_, i) => (answers[i] || null) === v).length;
  const view = { yes: ["네", "yes"], no: ["아니오", "no"], none: ["미응답", "none"] };
  return (
    <div className="ccheck" onClick={(e) => e.stopPropagation()}>
      <div className="ccheck-h">
        <span className="l">고객 확인</span>
        <span className="cnt-t">네 {count("yes")} · 아니오 {count("no")} · 미응답 {count(null)}</span>
        <button type="button" className="ccheck-reroll" aria-label="문항 다시 만들기" title="문항 다시 만들기"><Icon d={ICON.refresh} /></button>
      </div>
      <ul className="conn-check">
        {rows.map((t, i) => {
          const [label, cls] = view[answers[i] || "none"];
          return (
            <li key={t} className={cls}>
              <b className={cls}>{label}</b>
              <span>{t}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
