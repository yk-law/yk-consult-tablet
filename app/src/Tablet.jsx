import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Logo from "./Logo.jsx";
import Myk from "./Myk.jsx";
import Survey from "./Survey.jsx";
import { Portrait, RankMarks, rankPips, areaLabel } from "./util.jsx";

const FILM = "https://ykos.yklawfirm.co.kr/assets/yk-brand-film.mp4";
const PREP_MS = 2200;

export default function Tablet({ data, screen, onScreen }) {
  const b = data.booking;
  const FIELD = data.FIELD || {};
  const counsel = data.counsel;
  const [waitStep, setWaitStep] = useState("confirm");
  const goCounsel = useCallback(() => {
    if (counsel?.videoId) onScreen("counsel-video");
    else onScreen("counsel");
  }, [onScreen, counsel]);

  useEffect(() => {
    setWaitStep("confirm");
  }, [b.id]);

  useEffect(() => {
    if (screen === "wait") setWaitStep("confirm");
    if (screen === "film") setWaitStep("film");
  }, [screen]);

  const filmOn =
    screen === "film" ||
    screen === "counsel-video" ||
    (screen === "wait" && waitStep === "film");
  const prepOn = screen === "wait" && waitStep === "prep";
  const counselVideo =
    screen === "counsel-video" && counsel?.videoId
      ? counsel
      : null;

  return (
    <div className={`tab viewtab ${filmOn ? "filmon" : ""}`} id="tabDev">
      {!filmOn && (
        <div className="tbar">
          <span>법무법인 YK</span>
          <span className="lk on">{b.branch}</span>
        </div>
      )}
      <div className={`scr viewscr ${filmOn || prepOn ? "darkscr" : ""}`}>
        {(screen === "wait" || screen === "film") && (
          <WaitFlow
            b={b}
            step={screen === "film" ? "film" : waitStep}
            onStep={setWaitStep}
            onDone={() => onScreen("report")}
          />
        )}
        {screen === "report" && (
          <Report helper={data.helper} onReady={goCounsel} />
        )}
        {counselVideo && (
          <CounselVideo l={counselVideo} onDone={() => onScreen("counsel")} />
        )}
        {(screen === "counsel" || (screen === "counsel-video" && !counsel?.videoId)) && (
          <Counsel l={counsel} portraits={data.portraits} FIELD={FIELD} b={b} />
        )}
        {screen === "seniors" && (
          <Seniors
            list={data.seniors}
            headline={data.seniorHeadline}
            portraits={data.portraits}
            FIELD={FIELD}
            b={b}
          />
        )}
        {screen === "survey" && <Survey key={b.id} signed={!!b.modusign} />}
      </div>
    </div>
  );
}

function WaitFlow({ b, step, onStep, onDone }) {
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (step !== "prep") return undefined;
    const t = setTimeout(() => onStep("film"), PREP_MS);
    return () => clearTimeout(t);
  }, [step, onStep]);

  if (step === "prep") {
    return (
      <section className="pane on preppane">
        <Logo />
        <p className="prep-lbl">상담 준비</p>
        <h2>상담을 준비 중입니다</h2>
        <p className="prep-sub">잠시 후 법무법인 YK를 소개하는 영상이 이어집니다.</p>
        <span className="prep-bar" />
      </section>
    );
  }

  if (step === "film") {
    return <Film onDone={onDone} />;
  }

  return (
    <section className="pane on confirmpane">
      <div className="confirm-main">
        <h2 className="h1">예약자가 맞으신가요?</h2>
        <p className="sub">상담실에서 안내드리기 전에, 오늘 예약 정보를 확인해 주세요.</p>
        <div className="who-card">
          <div className="who-name">
            {b.name} <span className="al">가명</span>
          </div>
          <p>{b.at}</p>
          <p>{b.branch}</p>
        </div>
        {wrong ? (
          <div className="wrong-box">
            <p className="wrong-note">
              예약이 다르시면<br />
              상담실장에게 말씀해 주세요.<br />
              이 화면은 그대로 두시면 됩니다.
            </p>
            <button type="button" className="ghost" onClick={() => setWrong(false)}>뒤로가기</button>
          </div>
        ) : (
          <div className="confirm-actions">
            <button className="go" onClick={() => onStep("prep")}>네, 맞습니다</button>
            <button className="ghost" onClick={() => setWrong(true)}>아닙니다</button>
          </div>
        )}
      </div>
      <Myk />
    </section>
  );
}

function Film({ onDone }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="pane on filmpane">
      <video
        ref={ref}
        autoPlay
        muted
        playsInline
        preload="auto"
        src={FILM}
        onEnded={onDone}
        onError={() => setFailed(true)}
      />
      <div className="film-vignette" />
      <button
        type="button"
        className={`film-skip${failed ? " fail" : ""}${showSkip ? " on" : ""}`}
        onClick={onDone}
      >
        {failed ? "영상을 불러오지 못했습니다 · 사건요약으로" : "건너뛰기"}
      </button>
    </section>
  );
}

/** 오늘의 상담변호사 인터뷰 — 브랜드 필름과 같이 전면 재생, 끝나면/건너뛰면 프로필. */
function CounselVideo({ l, onDone }) {
  const frame = useRef(null);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onMsg = (e) => {
      if (typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === "onStateChange" && data.info === 0) onDone();
      } catch {
        /* ignore non-YT messages */
      }
    };
    window.addEventListener("message", onMsg);
    const ping = setInterval(() => {
      const win = frame.current?.contentWindow;
      if (!win) return;
      win.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*");
      win.postMessage(
        JSON.stringify({
          event: "command",
          func: "addEventListener",
          args: ["onStateChange"],
        }),
        "*",
      );
    }, 800);
    return () => {
      window.removeEventListener("message", onMsg);
      clearInterval(ping);
    };
  }, [onDone]);

  const src =
    `https://www.youtube.com/embed/${l.videoId}` +
    `?rel=0&autoplay=1&mute=1&playsinline=1&enablejsapi=1&modestbranding=1`;

  return (
    <section className="pane on filmpane counsel-videopane">
      <iframe
        ref={frame}
        title={l.videoTitle || `${l.n} 인터뷰`}
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div className="film-vignette" />
      <div className="counsel-video-meta">
        <p className="lbl">오늘의 상담변호사</p>
        <strong>{l.n}</strong>
        {l.videoTitle ? <em>{l.videoTitle}</em> : null}
      </div>
      <button
        type="button"
        className={`film-skip${showSkip ? " on" : ""}`}
        onClick={onDone}
      >
        건너뛰기 · 프로필 보기
      </button>
    </section>
  );
}

function Report({ helper, onReady }) {
  const sections = helper?.sections || [];
  const none = !sections.length;

  return (
    <section className="pane on reportpane">
      <div className="ykhelper">
        <div className="yh-body">
          <h3>{helper?.title || "말씀하신 내용을 이렇게 정리했습니다"}</h3>
          <p className="yh-lead">
            상담을 시작하기 전에, 예약하실 때 들려주신 이야기를 다시 안내드립니다.
            다른 점이 있으시면 오늘 상담에서 편하게 말씀해 주세요.
          </p>
          {none ? (
            <p className="yh-empty">
              예약하실 때에는 자세한 사건 내용을 미리 남겨 두지 않으셨습니다.
              {helper?.emptyNote ? ` ${helper.emptyNote}` : ""}
              {" "}오늘은 편하게 이야기해 주시면, 그 자리에서 함께 정리하겠습니다.
            </p>
          ) : (
            <ol className="yh-secs">
              {sections.map((s, i) => (
                <li key={s.title}>
                  <div className="yh-sec-h">
                    <span className="n">{i + 1}</span>
                    <h4>{s.title}</h4>
                  </div>
                  {(s.body || "").split("\n").map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </li>
              ))}
            </ol>
          )}
          <p className="yh-src">예약 상담 때 말씀하신 내용을 바탕으로 정리했습니다. 글에 나오는 이름은 가명입니다.</p>
        </div>
      </div>
      <button type="button" className="go counsel-go" onClick={onReady}>오늘 상담변호사 확인하기</button>
    </section>
  );
}

/** 미니 카드 대표 경력: 칸 너비에 맞춰 최대 글자 크기(한 줄). */
function FitTitle({ text, maxPx = 15.5, minPx = 11.5 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = maxPx;
    el.style.fontSize = `${size}px`;
    el.style.letterSpacing = ".02em";
    while (size > minPx && el.scrollWidth > el.clientWidth + 0.5) {
      size -= 0.25;
      el.style.fontSize = `${size}px`;
      if (size < 13.5) el.style.letterSpacing = "-.01em";
      if (size < 12.5) el.style.letterSpacing = "-.02em";
    }
  }, [text, maxPx, minPx]);
  return <span ref={ref}>{text}</span>;
}

function TitleBlock({ titles, soft }) {
  if (!titles?.length) return null;
  return (
    <div className="xtitles">
      {titles.map((t) => (
        soft ? <FitTitle key={t} text={t} /> : <span key={t}>{t}</span>
      ))}
    </div>
  );
}

function ProfileBody({ l, portraits, FIELD, b }) {
  const edu = [l.edu, l.exam, l.tr].filter(Boolean).join(" · ");
  const pos = [l.pos, l.o ? `${l.o} 출신` : ""].filter(Boolean).join(" · ");
  const hasFields = !!(l.areas?.length || l.f?.length || l.tags?.length);
  return (
    <div className="profile">
      <div className="xlead">
        <div className="xlead-id">
          <Portrait l={l} portraits={portraits} grade={l.grade} size="hero" />
          <div className="xident xmeta">
            <TitleBlock titles={l.titles} />
            <div className="xwho">
              <strong>{l.n}</strong>
              {pos ? <em>{pos}</em> : null}
            </div>
            {l.pitch ? <p className="xquote">{l.pitch}</p> : null}
            {edu ? <p className="xedu">{edu}</p> : null}
          </div>
        </div>
        <section className="xsec xcareer">
          <h3>경력</h3>
          {l.career?.length ? (
            <ul className="clist">{l.career.map((t) => <li key={t}>{t}</li>)}</ul>
          ) : (
            <p className="empty">상세 경력은 상담에서 안내합니다.</p>
          )}
        </section>
      </div>
      {hasFields ? (
        <section className="xsec">
          <h3>업무분야</h3>
          <FieldTags l={l} FIELD={FIELD} b={b} full />
        </section>
      ) : null}
      {l.awards?.length ? (
        <section className="xsec">
          <h3>수상실적</h3>
          <ul className="clist">{l.awards.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      ) : null}
      {l.papers?.length ? (
        <section className="xsec">
          <h3>논문·저서</h3>
          <ul className="clist">{l.papers.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      ) : null}
      {l.kind === "lawyer" && l.works?.length ? (
        <section className="xsec">
          <h3>업무사례</h3>
          <ul className="clist">
            {l.works.map((w) => (
              <li key={w.href}>
                <a href={w.href} target="_blank" rel="noreferrer">{w.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {l.videoId ? (
        <div className="vwrap">
          <iframe
            title={l.videoTitle || l.n}
            src={`https://www.youtube.com/embed/${l.videoId}?rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
    </div>
  );
}

function Counsel({ l, portraits, FIELD, b }) {
  if (!l) {
    return (
      <section className="pane on">
        <p className="empty">오늘 상담 변호사가 지정되지 않았습니다.</p>
      </section>
    );
  }
  return (
    <section className="pane on counselpane">
      <ProfileBody l={l} portraits={portraits} FIELD={FIELD} b={b} />
    </section>
  );
}

function areaMark(area, b, FIELD) {
  const fieldName = FIELD?.[b?.field]?.[0] || "";
  if (!fieldName || area.group !== fieldName) return "";
  const cat2 = (b?.cat2 || "").replace(/\s/g, "");
  const stem = cat2.replace(/^준/, "").replace("유사", "");
  const name = area.name || "";
  if (name && (cat2.includes(name) || name.includes(stem) || (stem && stem.includes(name)))) return "hit";
  return "rel";
}

function FieldTags({ l, FIELD, b, full }) {
  const areas = l.areas || [];
  if (areas.length) {
    if (full) {
      const order = [];
      const by = new Map();
      for (const a of areas) {
        if (!by.has(a.group)) {
          by.set(a.group, []);
          order.push(a.group);
        }
        by.get(a.group).push(a);
      }
      const rank = (g) => (g === (FIELD?.[b?.field]?.[0] || "") ? 0 : 1);
      order.sort((a, c) => rank(a) - rank(c));
      return (
        <div className="xareas">
          {order.map((g) => (
            <div className="xareag" key={g}>
              <b>{g}</b>
              <div className="fl xtags">
                {by.get(g).map((a) => {
                  const m = areaMark(a, b, FIELD);
                  return <span className={m ? `f ${m}` : "f"} key={a.name}><i>{areaLabel(a.name)}</i></span>;
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }
    const hits = [];
    for (const a of areas) {
      const m = areaMark(a, b, FIELD);
      if (m) hits.push({ ...a, m });
    }
    hits.sort((a, c) => (a.m === c.m ? 0 : a.m === "hit" ? -1 : 1));
    if (!hits.length) return null;
    return (
      <div className="fl xtags">
        {hits.map((a) => <span className={`f ${a.m}`} key={`${a.group}-${a.name}`}><i>{areaLabel(a.name)}</i></span>)}
      </div>
    );
  }
  const fieldName = FIELD?.[b?.field]?.[0] || "";
  const fromField = (l.f || []).map((c) => FIELD[c]?.[0]).filter(Boolean);
  const extra = (l.tags || []).filter((t) => t && !fromField.includes(t));
  const tags = [...fromField, ...extra];
  if (!tags.length) return null;
  return (
    <div className="fl xtags">
      {tags.map((t) => <span className={t === fieldName ? "f hit" : "f"} key={t}><i>{areaLabel(t)}</i></span>)}
    </div>
  );
}

function Seniors({ list, headline, portraits, FIELD, b }) {
  const [open, setOpen] = useState(null);
  const shown = open ? list.find((x) => x.n === open) : null;
  return (
    <section className="pane on seniorpane">
      <span className="lbl">전문인력</span>
      <h2 className="h1">{headline || "법무법인 YK의 전문인력입니다"}</h2>
      <p className="sub">고객님의 사건을 성심껏 맡아드리기 위한 전담인력을 소개합니다</p>
      <p className="subhint">직위가 높을수록 프레임 장식을 더합니다.</p>
      <div className="legendgrid">
        {list.map((l) => (
          <button type="button" className={`xcard ${l.grade}`} key={`${l.pos}-${l.n}`} onClick={() => setOpen(l.n)}>
            <RankMarks n={rankPips(l.grade)} />
            <Portrait l={l} portraits={portraits} grade={l.grade} size="card" />
            <div className="xmeta">
              <div className="xmeta-body">
                <TitleBlock titles={l.titles} soft />
                <div className="xwho">
                  <strong>{l.n}</strong>
                  <em>{l.pos}</em>
                </div>
                <FieldTags l={l} FIELD={FIELD} b={b} />
              </div>
              <p className={`xaward${l.awards?.length ? "" : " blank"}`}>
                {l.awards?.length ? l.awards[0] : ""}
              </p>
            </div>
          </button>
        ))}
      </div>
      {!list.length ? <p className="empty">아직 연결된 전문인력 프로필이 없습니다.</p> : null}
      {shown ? (
        <div className="xmodal" onClick={() => setOpen(null)} role="presentation">
          <article className={`xcard ${shown.grade} open`} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="xclose" onClick={() => setOpen(null)}>닫기</button>
            <ProfileBody l={shown} portraits={portraits} FIELD={FIELD} b={b} />
          </article>
        </div>
      ) : null}
    </section>
  );
}
