import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo.jsx";
import Survey from "./Survey.jsx";
import { Portrait } from "./util.jsx";

const FILM = "https://ykos.yklawfirm.co.kr/assets/yk-brand-film.mp4";
const PREP_MS = 2200;

export default function Tablet({ data, screen, onScreen }) {
  const b = data.booking;
  const FIELD = data.FIELD || {};
  const [waitStep, setWaitStep] = useState("confirm");
  const goCounsel = useCallback(() => onScreen("counsel"), [onScreen]);

  useEffect(() => {
    setWaitStep("confirm");
  }, [b.id]);

  useEffect(() => {
    if (screen === "wait") setWaitStep("confirm");
    if (screen === "film") setWaitStep("film");
  }, [screen]);

  const filmOn = screen === "film" || (screen === "wait" && waitStep === "film");
  const prepOn = screen === "wait" && waitStep === "prep";

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
        {screen === "counsel" && <Counsel l={data.counsel} portraits={data.portraits} FIELD={FIELD} b={b} />}
        {screen === "seniors" && (
          <Seniors
            list={data.seniors}
            headline={data.seniorHeadline}
            portraits={data.portraits}
            FIELD={FIELD}
            b={b}
          />
        )}
        {screen === "survey" && <Survey key={b.id} />}
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
      <span className="lbl">방문 확인</span>
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

function Counsel({ l, portraits, FIELD, b }) {
  if (!l) {
    return (
      <section className="pane on">
        <p className="empty">오늘 상담 변호사가 지정되지 않았습니다.</p>
      </section>
    );
  }
  const edu = [l.edu, l.exam, l.tr].filter(Boolean).join(" · ");
  return (
    <section className="pane on counselpane">
      <div className="counselhero">
        <Portrait l={l} portraits={portraits} grade={l.grade} size="hero" />
        <div className="ch-copy">
          <span className="lbl">오늘의 상담</span>
          <h2>{l.n}</h2>
          <p className="ch-pos">{l.pos}{l.o ? ` · ${l.o} 출신` : ""}</p>
          {l.pitch ? <p className="ch-quote">{l.pitch}</p> : null}
          {edu ? <p className="ch-edu">{edu}</p> : null}
          <div className="fl">
            {(l.f || []).map((c) => <span className="f" key={c}>{FIELD[c]?.[0]}</span>)}
          </div>
          {l.career.length ? (
            <ol className="ch-career">
              {l.career.map((t) => <li key={t}>{t}</li>)}
            </ol>
          ) : (
            <p className="empty">상세 경력은 상담에서 안내합니다.</p>
          )}
        </div>
      </div>
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
    </section>
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
      <p className="subhint">
        직위는 사진 프레임으로 구분합니다. 대표·파트너·고문 변호사와, 고문·전문위원·자문위원의 프레임이 다릅니다.
      </p>
      <div className="legendgrid">
        {list.map((l) => (
          <button type="button" className={`xcard ${l.grade}`} key={`${l.pos}-${l.n}`} onClick={() => setOpen(l.n)}>
            <Portrait l={l} portraits={portraits} grade={l.grade} size="card" />
            <div className="xmeta">
              <div className="xtitles">
                {(l.titles || []).map((t) => <span key={t}>{t}</span>)}
              </div>
              <strong>{l.n}</strong>
              <em>{l.pos}</em>
              <p>{l.pitch}</p>
            </div>
          </button>
        ))}
      </div>
      {!list.length ? <p className="empty">아직 연결된 전문인력 프로필이 없습니다.</p> : null}
      {shown ? (
        <div className="xmodal" onClick={() => setOpen(null)} role="presentation">
          <article className={`xcard ${shown.grade} open`} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="xclose" onClick={() => setOpen(null)}>닫기</button>
            <div className="xsheet">
              <Portrait l={shown} portraits={portraits} grade={shown.grade} size="hero" />
              <div className="xident xmeta">
                {(shown.titles || []).length ? (
                  <div className="xtitles">
                    {(shown.titles || []).map((t) => <span key={t}>{t}</span>)}
                  </div>
                ) : null}
                <strong>{shown.n}</strong>
                <em>{shown.pos}</em>
                {shown.pitch && shown.pitch !== shown.career?.[0] ? <p>{shown.pitch}</p> : null}
                <div className="fl">
                  {(shown.f || []).map((c) => <span className="f" key={c}>{FIELD[c]?.[0]}</span>)}
                </div>
              </div>
            </div>
            {shown.career.length ? (
              <ul className="clist">{shown.career.map((t) => <li key={t}>{t}</li>)}</ul>
            ) : null}
            {shown.videoId ? (
              <div className="vwrap">
                <iframe
                  title={shown.videoTitle || shown.n}
                  src={`https://www.youtube.com/embed/${shown.videoId}?rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
          </article>
        </div>
      ) : null}
    </section>
  );
}
