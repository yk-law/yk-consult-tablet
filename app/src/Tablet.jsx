import { cleanProfileContent, profileCategories } from "./profileContent.js";
import { specialistHero, specialistHeadline } from "./specialistHero.js";
import HeroBackdrop from "./HeroBackdrop.jsx";
import { relatedCaseWorks } from "./caseWorks.js";
import { customerDateParts } from "./customerDate.js";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Logo from "./Logo.jsx";
import WelcomeBackdrop from "./WelcomeBackdrop.jsx";
import Myk from "./Myk.jsx";
import { Portrait, areaLabel, fieldLabelsOf, groupMatchesFieldLabels, areaCaseMark } from "./util.jsx";

// 브랜드 영상은 앱에 동봉한다. 외부(YK-OS) 참조는 상담실 회선이 느리거나
// 그 서버가 점검 중이면 대기 화면이 비어 버리고, 태블릿 오프라인에서도 못 쓴다.
const FILM = `${import.meta.env.BASE_URL}yk-brand-film.mp4`;
const PREP_MS = 2200;
// 예약 확인 중앙 배치 검토 중에는 숨김. true로 바꾸면 기존 QR 안내를 복구한다.
const SHOW_RESERVATION_QR = false;

/** 고객이 태블릿 안에서 자유 이동하는 퍼널 장면. */
const JOURNEY = [
  ["firm", "YK 소개"],
  ["report", "사건 요약"],
  ["counsel", "상담 변호사"],
  ["seniors", "전문 인력"],
];

export default function Tablet({ data, screen, onScreen }) {
  const b = data.booking;
  const roomLabel = b.location != null && b.room != null
    ? `${b.location} ${b.room} 상담실`
    : b.branch;
  const FIELD = data.FIELD || {};
  const NEAR = data.NEAR || {};
  const counsel = data.counsel;
  const [waitStep, setWaitStep] = useState("confirm");

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
  const prepOn = screen === "prep" || (screen === "wait" && waitStep === "prep");
  const welcomeOn = prepOn || (screen === "wait" && waitStep === "confirm");
  const counselVideo =
    screen === "counsel-video" && counsel?.videoId
      ? counsel
      : null;
  const journeyOn = JOURNEY.some(([id]) => id === screen);
  const journeyActive = screen === "counsel-video" ? "counsel" : screen;

  return (
    <div className={`tab viewtab ${filmOn ? "filmon" : ""} ${welcomeOn ? "welcome-on" : ""}`} id="tabDev">
      {welcomeOn && <WelcomeBackdrop />}
      {!filmOn && (
        <div className={`tbar${journeyOn ? " journey-header" : ""}`}>
          <Logo className="header-ci" />
          <span className="lk on">{roomLabel}</span>
        </div>
      )}
      <div className={`tablet-content${journeyOn ? " has-journey" : ""}`}>
      <div className={`scr viewscr ${filmOn ? "darkscr" : ""}`}>
        {(screen === "wait" || screen === "prep" || screen === "film") && (
          <WaitFlow
            b={b}
            step={screen === "film" ? "film" : screen === "prep" ? "prep" : waitStep}
            autoAdvance={screen !== "prep" && screen !== "film"}
            onStep={setWaitStep}
            onDone={() => onScreen("firm")}
          />
        )}
        {screen === "firm" && (
          <FirmIntro firm={data.firm} portraits={data.portraits} FIELD={FIELD} onNext={() => onScreen("report")} />
        )}
        {screen === "report" && (
          <Report helper={data.helper} onCounsel={() => onScreen("counsel")} />
        )}
        {counselVideo && (
          <CounselVideo l={counselVideo} onDone={() => onScreen("counsel")} />
        )}
        {(screen === "counsel" || (screen === "counsel-video" && !counsel?.videoId)) && (
          <Counsel
            l={counsel}
            portraits={data.portraits}
            FIELD={FIELD}
            NEAR={NEAR}
            b={b}
            onNext={() => onScreen("seniors")}
            onPrevious={() => onScreen("report")}
          />
        )}
        {screen === "seniors" && (
          <Seniors
            list={data.seniors}
            counsel={counsel}
            headline={data.seniorHeadline}
            portraits={data.portraits}
            FIELD={FIELD}
            NEAR={NEAR}
            b={b}
          />
        )}
      </div>
      {journeyOn && (
        <nav className="jnav" aria-label="상담 안내">
          {b.name?.trim() && <div className="journey-client"><p className="journey-client-greeting">안녕하세요,</p><p className="journey-client-name"><strong>{b.name.trim()}</strong><span> 고객님</span></p></div>}
          {JOURNEY.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={journeyActive === id ? "on" : ""}
              aria-current={journeyActive === id ? "page" : undefined}
              onClick={() => onScreen(id)}
            >
              {label}
            </button>
          ))}
          <div className="journey-qr">
            <p className="journey-qr-title">법률 과정을 더 쉽게,<br />의뢰인의 곁에 더 가까이</p>
            <p className="journey-qr-description">상담과 사건 진행을 편리하게 확인하고 이어갈 수 있습니다.</p>
            <img src={`${import.meta.env.BASE_URL}consultation-room-tablet-qr.svg`} width="147" height="147" alt="YourK 접속 QR코드" />
            <a className="journey-qr-url" href="https://yourk.legal" target="_blank" rel="noreferrer" aria-label="https://yourk.legal (새 탭에서 열림)">https://yourk.legal</a>
            <p className="journey-qr-caption">QR코드를 스캔해 만나보세요.</p>
          </div>
        </nav>
      )}
      </div>
    </div>
  );
}

function WaitFlow({ b, step, onStep, onDone, autoAdvance = true }) {
  const { dateLabel, timeLabel } = customerDateParts(b.date, b.time);
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (step !== "prep" || !autoAdvance) return undefined;
    const t = setTimeout(() => onStep("film"), PREP_MS);
    return () => clearTimeout(t);
  }, [step, onStep, autoAdvance]);

  if (step === "prep") {
    return (
      <section className="pane on confirmpane preppane">
        <div className="confirm-main">
          <div className="welcome-brand">
            <Logo className="welcome-ci" />
            <p className="sub">법무법인 YK를 찾아주셔서 감사합니다.</p>
          </div>
          <h2 className="prep-title">상담을 준비하고 있습니다.</h2>
          <p className="prep-description">잠시 후 법무법인 YK 소개 영상이 시작됩니다.</p>
          <div className="prep-loading" role="status" aria-label="상담 준비 중">
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </div>
        </div>
      </section>
    );
  }

  if (step === "film") {
    return <Film onDone={onDone} autoAdvance={autoAdvance} />;
  }

  return (
    <section className="pane on confirmpane">
      <div className="confirm-main">
        <div className="welcome-brand">
          <Logo className="welcome-ci" />
          <p className="sub">법무법인 YK를 찾아주셔서 감사합니다.</p>
        </div>
        {wrong ? (
          <div className="reservation-help" role="region" aria-labelledby="reservation-help-title">
            <div role="status">
              <h2 id="reservation-help-title">예약 정보 확인을 도와드리겠습니다.</h2>
              <p className="reservation-help-description">담당 직원이 예약 정보를 확인해 드립니다.<br />이 화면을 그대로 두시면 됩니다.</p>
            </div>
            <div className="confirm-actions">
              <button type="button" className="reservation-return" onClick={() => setWrong(false)}>
                <svg className="lucide lucide-arrow-left" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="m12 19-7-7 7-7" /><path d="M5 12h14" />
                </svg>
                <span>예약 정보 다시 보기</span>
              </button>
            </div>
          </div>
        ) : (
          <>
        <h2 className="h1"><span className="client-name">{b.name}</span>고객님, 반갑습니다.</h2>
        <div className="reservation-check" role="group" aria-labelledby="reservation-check-heading">
          <p id="reservation-check-heading" className="confirm-instruction">예약하신 시간과 장소를 확인해 주세요.</p>
          <div className="who-card">
            <p>{[dateLabel, timeLabel].filter(Boolean).join(" ")}</p>
            <p>{b.location != null && b.room != null ? `${b.location} ${b.room} 상담실` : b.branch}</p>
          </div>
        </div>
            <div className="confirm-actions">
              <button className="go" onClick={() => onStep("prep")}>네, 맞습니다</button>
              <button className="ghost" onClick={() => setWrong(true)}>제 예약이 아니에요</button>
            </div>
          </>
        )}
      </div>
      {SHOW_RESERVATION_QR && <Myk hero />}
    </section>
  );
}

function Film({ onDone, autoAdvance = true }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  return (
    <section className="pane on filmpane">
      <video
        ref={ref}
        autoPlay
        muted
        playsInline
        preload="auto"
        src={FILM}
        loop={!autoAdvance}
        onEnded={autoAdvance ? onDone : undefined}
        onError={() => setFailed(true)}
      />
      <div className="film-vignette" />
      <button
        type="button"
        className={`film-skip brand-film-skip on${failed ? " fail" : ""}`}
        onClick={onDone}
      >
        <span>{failed ? "영상을 불러오지 못했습니다 · YK 소개로" : "영상 건너뛰기"}</span>
        <svg className="lucide lucide-arrow-right" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </section>
  );
}

/** 끝 3초 전 전환 — YouTube 엔드스크린(관련영상) 노출 전에 프로필로. */
const COUNSEL_VIDEO_EARLY_CUT_S = 3;

/** 상담 변호사 인터뷰 — 브랜드 필름과 같이 전면 재생, 끝나면/건너뛰면 프로필. */
function CounselVideo({ l, onDone }) {
  const frame = useRef(null);
  const doneRef = useRef(false);
  const [showSkip, setShowSkip] = useState(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let duration = 0;
    const onMsg = (e) => {
      if (typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === "onStateChange" && data.info === 0) {
          finish();
          return;
        }
        if (data.event === "infoDelivery" && data.info && typeof data.info === "object") {
          const info = data.info;
          const d =
            (typeof info.duration === "number" && info.duration) ||
            (typeof info.progressState?.duration === "number" && info.progressState.duration) ||
            0;
          if (d > 0) duration = d;
          const t =
            (typeof info.currentTime === "number" && info.currentTime) ||
            (typeof info.progressState?.current === "number" && info.progressState.current);
          if (typeof t === "number" && duration > 0) {
            const cutAt = Math.max(0, duration - COUNSEL_VIDEO_EARLY_CUT_S);
            if (t >= cutAt) finish();
          }
        }
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
    /* playing 중 duration·currentTime 폴링 → 끝 3초 전 finish */
    const poll = setInterval(() => {
      const win = frame.current?.contentWindow;
      if (!win || doneRef.current) return;
      win.postMessage(
        JSON.stringify({ event: "command", func: "getDuration", args: [] }),
        "*",
      );
      win.postMessage(
        JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }),
        "*",
      );
    }, 400);
    return () => {
      window.removeEventListener("message", onMsg);
      clearInterval(ping);
      clearInterval(poll);
    };
  }, [finish]);

  const origin =
    typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : "";
  const src =
    `https://www.youtube.com/embed/${l.videoId}` +
    `?rel=0&autoplay=1&mute=1&playsinline=1&enablejsapi=1&modestbranding=1` +
    (origin ? `&origin=${origin}` : "");

  return (
    <section className="pane on filmpane counsel-videopane">
      <div className="counsel-video-stage">
        <iframe
          ref={frame}
          title={`${l.n} 인터뷰`}
          src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="counsel-video-chrome-mask" aria-hidden="true" />
      <div className="counsel-video-meta">
        <p className="lbl">상담 변호사</p>
        <strong>{l.n}</strong>
      </div>
      <button
        type="button"
        className={`film-skip${showSkip ? " on" : ""}`}
        onClick={finish}
      >
        프로필 바로 보기
      </button>
    </section>
  );
}

/** YK 소개 — 센터 구성과 구성원 면면. 고객이 이 로펌의 규모와 경력을 한 화면에서 본다(2026-10-28).
 *  수치는 홈페이지 기준만 쓰고, 법원·검찰 근무는 「역임」 사실로만 적는다. */
function FirmIntro({ firm, portraits, FIELD, onNext }) {
  if (!firm) return null;
  const people = [
    ["법원 출신 변호사", firm.bench],
    ["검찰 출신 변호사", firm.prosecution],
  ];
  return (
    <section className="pane on reportpane firmpane">
      <div className="ykhelper">
        <div className="yh-body firm-body">
          <header className="firm-hero">
            <p className="firm-eyebrow">법무법인 YK</p>
            <h3>{firm.slogan}</h3>
            <p className="firm-en">{firm.sloganEn}</p>
            <dl className="firm-stats">
              {firm.stats.map((x) => (
                <div key={x.label}>
                  <dt>{x.label}</dt>
                  <dd><strong>{x.n}</strong><span>{x.unit}</span></dd>
                </div>
              ))}
            </dl>
            <p className="firm-note">{firm.statsNote}</p>
          </header>

          <section className="firm-sec" aria-labelledby="firm-centers">
            <h4 id="firm-centers">분야별 전문 센터</h4>
            <p className="firm-sec-lead">사건 분야마다 전담 센터를 두고 있습니다.</p>
            <div className="firm-centers">
              {firm.centerGroups.map((g) => (
                <div className="firm-center-group" key={g.t}>
                  <p className="firm-group-t">{g.t}</p>
                  <ul>
                    {g.centers.map((c) => (
                      <li key={c.n}>
                        <span className="firm-center-n">{c.n}</span>
                        {c.f && FIELD[c.f] && <span className="firm-center-d">{FIELD[c.f][1]}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {people.map(([title, rows]) => rows?.length > 0 && (
            <section className="firm-sec" key={title} aria-label={title}>
              <h4>{title}</h4>
              <ul className="firm-people">
                {rows.map((l) => (
                  <li key={l.n}>
                    <span className="firm-ph">
                      {portraits?.[l.n] ? <img src={portraits[l.n]} alt="" /> : <span aria-hidden="true">{l.n[0]}</span>}
                    </span>
                    <strong>{l.n}</strong>
                    <span className="firm-people-pos">{l.pos}</span>
                    <span className="firm-people-t">{l.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {firm.advisors?.length > 0 && (
            <section className="firm-sec" aria-labelledby="firm-advisors">
              <h4 id="firm-advisors">고문 {firm.advisors.length}명</h4>
              <p className="firm-sec-lead">정부기관·경찰·입법 분야에서 일한 고문들이 함께합니다.</p>
              <ul className="firm-names">
                {firm.advisors.map((a) => (
                  <li key={a.n}><strong>{a.n}</strong>{a.c && <span>{a.c}</span>}</li>
                ))}
              </ul>
            </section>
          )}

          {firm.police?.length > 0 && (
            <section className="firm-sec" aria-labelledby="firm-police">
              <h4 id="firm-police">경찰 경력 전문위원 {firm.police.length}명</h4>
              <p className="firm-sec-lead">전문위원 {firm.expertCount}명 가운데 경찰에서 일했던 분들입니다.</p>
              <ul className="firm-names compact">
                {firm.police.map((a) => (
                  <li key={a.n}><strong>{a.n}</strong></li>
                ))}
              </ul>
            </section>
          )}

          <ReportNext onClick={onNext} label="사건 요약 보기" />
        </div>
      </div>
    </section>
  );
}

function ReportNext({ onClick, label = "상담 변호사 확인하기", previous = false }) {
  return (
    <div className={`report-next${previous ? " report-previous" : ""}`}>
      <button type="button" onClick={onClick}>
        <span>{label}</span>
        <svg className={`lucide ${previous ? "lucide-arrow-left" : "lucide-arrow-right"}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M5 12h14" /><path d={previous ? "m12 19-7-7 7-7" : "m12 5 7 7-7 7"} />
        </svg>
      </button>
    </div>
  );
}

function Report({ helper, onCounsel }) {
  const agenda = helper?.agenda || [];
  const intake = helper?.intake;
  const none = !agenda.length;

  // 콜에서 사건 내용을 전혀 받지 못한 예약 — 요약할 게 없으니 '오늘 이렇게 여쭤볼게요'를 대신 띄운다.
  // 빈 화면이나 사과문을 보여주면 고객이 준비가 덜 된 기분이 든다. 대기 시간에 생각을 정리하도록 돕는 편이 낫다.
  if (none) {
    return (
      <section className="pane on reportpane">
        <div className="ykhelper">
          <div className="yh-body">
            <h3>오늘은 처음부터 편하게 말씀해 주세요</h3>
            <p className="yh-lead">
              {helper?.emptyNote
                ? `${helper.emptyNote} `
                : "예약하실 때에는 사건 내용을 따로 남기지 않으셨습니다. "}
              정리해서 오실 필요는 없습니다. 상담에서 이런 순서로 여쭤보겠습니다.
            </p>

            <ol className="yh-steps">
              {(intake?.steps || []).map(([t, d], i) => (
                <li key={t}>
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>{t}</h4>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>

            {intake?.bring?.length > 0 && (
              <div className="yh-bring">
                <h4>가지고 계시면 도움이 되는 것</h4>
                <ul>
                  {intake.bring.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="yh-bring-note">
                  지금 없으셔도 괜찮습니다. 상담 후에 보내주셔도 됩니다.
                </p>
              </div>
            )}

            <p className="yh-src">기억나시는 대로 말씀해 주시면 됩니다. 순서가 뒤바뀌어도 저희가 정리해 드립니다.</p>
            <ReportNext onClick={onCounsel} />
          </div>
        </div>
      </section>
    );
  }

  // 사실관계 서술은 띄우지 않는다(2026-10-28). 상담 주제와 고객이 확인하고 싶은 점만 둔다.
  return (
    <section className="pane on reportpane">
      <div className="ykhelper">
        <div className="yh-body">
          <h3>오늘 상담에서 확인하실 내용입니다.</h3>
          <p className="yh-lead">
            예약하실 때 궁금하다고 하신 점을 상담 순서대로 적었습니다.<br />
            사건 내용은 상담에서 변호사가 직접 듣고 정리해 드립니다.
          </p>
          {helper?.topic && (
            <div className="yh-topic">
              <span className="yh-topic-l">상담 분야</span>
              <strong>{helper.topic}</strong>
            </div>
          )}
          <ol className="yh-secs yh-agenda">
            {agenda.map((t, i) => (
              <li key={t}>
                <div className="yh-sec-h">
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <h4>{t}</h4>
                </div>
              </li>
            ))}
          </ol>
          <p className="yh-src">더 여쭤보고 싶은 점은 상담에서 편하게 말씀해 주세요.</p>
          <ReportNext onClick={onCounsel} />
        </div>
      </div>
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

function CareerSection({ items }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  if (!items?.length) return null;
  const hasMore = items.length > 10;
  return <section className="detail-subsection">
    <h4>주요 경력</h4>
    <ul className="clist" id={listId}>
      {(expanded ? items : items.slice(0, 10)).map((text, index) => <li key={`${index}-${text}`}>{text}</li>)}
    </ul>
    {hasMore && <button className="career-toggle" type="button" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(!expanded)}>
      <span>{expanded ? "경력 접기" : <>경력 더 보기 <span className="career-toggle-count">({items.length - 10}개)</span></>}</span>
      <svg className={`lucide lucide-chevron-${expanded ? "up" : "down"}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d={expanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
      </svg>
    </button>}
  </section>;
}

function CounselDetailGroups({ l, portraits, FIELD, NEAR, b, hasFields, specialist = false }) {
  if (specialist) {
    l = cleanProfileContent(l);
    hasFields = profileCategories(l, FIELD).length > 0;
  }
  const listSection = (title, items, className = "") => items?.length ? (
    <section className={`detail-subsection ${className}`} key={title}>
      <h4>{title}</h4>
      <ul className="clist">{items.map((text) => <li key={text}>{text}</li>)}</ul>
    </section>
  ) : null;
  const hasCases = l.kind === "lawyer" && l.cases?.length;
  const relatedWorks = relatedCaseWorks(l.works, b?.field);
  const hasWorks = l.kind === "lawyer" && relatedWorks.length;
  return <>
    <header className="counsel-intro">
      <h2>{specialist ? "다양한 경험을 갖춘 전문 인력을 소개합니다." : "고객님과 함께할 변호사를 소개합니다."}</h2>
      <p>{l.n} {specialist ? (l.pos || "전문 인력") : "변호사"}의 주요 업무 분야와 이력을 정리했습니다.<br />
        고객님의 상황과 관련된 경험과 사례를 살펴보세요.</p>
    </header>
    {(hasFields || hasCases || hasWorks) ? <section className="xsec detail-group">
      <h3>업무 분야 및 사례</h3>
      <div className="detail-group-body">
        {hasFields && <section className="detail-subsection xfields">
          <h4>주요 업무 분야</h4>
          <FieldTags l={l} FIELD={FIELD} NEAR={NEAR} b={b} full categoriesOnly />
        </section>}
        {hasCases ? listSection("주요 업무 실적", l.cases, "counsel-results") : null}
        {hasWorks ? <section className="detail-subsection counsel-works">
          <h4>관련 업무 사례</h4>
          <ul className="clist">{relatedWorks.map((work) => <li key={work.href}>
            <a href={work.href} target="_blank" rel="noreferrer" aria-label={`${work.title} (새 탭에서 열림)`}>
              <span>{work.title}</span>
              <svg className="lucide lucide-arrow-up-right" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M7 7h10v10M7 17 17 7" />
              </svg>
            </a>
          </li>)}</ul>
        </section> : null}
      </div>
    </section> : null}
    {(l.career?.length || l.awards?.length || l.papers?.length) ? <section className="xsec detail-group counsel-history">
      <h3>이력 사항</h3>
      <div className="detail-group-body">
        <CareerSection key={l.n} items={l.career} />
        {listSection("수상 내역", l.awards)}
        {listSection("논문·저서", l.papers)}
      </div>
    </section> : null}
  </>;
}

function ProfileBody({ l, portraits, FIELD, NEAR, b, counselHero = false, specialist = false, onNext, onPrevious }) {
  const heroRef = useRef(null);
  const profileRef = useRef(null);
  const indexId = useId();
  const indexNavigation = useRef(null);
  const indexSettleTimer = useRef(null);
  const indexUpdate = useRef(() => {});
  const [indexItems, setIndexItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState("");
  const [heroHidden, setHeroHidden] = useState(false);
  useEffect(() => {
    const profile = profileRef.current;
    const pane = profile?.closest(".counselpane");
    if (!counselHero || !pane) return;
    const headings = [...profile.querySelectorAll(".counsel-details .detail-group > h3, .counsel-details .detail-subsection > h4")];
    const items = headings.map((element, index) => {
      element.id = `${indexId}-${index}`;
      return { id: element.id, label: element.textContent, group: element.tagName === "H3", element };
    });
    setIndexItems(items);
    indexNavigation.current = null;
    const update = () => {
      const top = pane.getBoundingClientRect().top + 48;
      let active = items.find((item) => !item.group)?.id || "";
      for (const [index, item] of items.entries()) {
        if (item.element.getBoundingClientRect().top <= top) {
          active = item.group ? (items.slice(index + 1).find((next) => !next.group)?.id || active) : item.id;
        }
      }
      const maxScroll = pane.scrollHeight - pane.clientHeight;
      if (maxScroll > 0 && pane.scrollTop >= maxScroll - 2) {
        active = items.filter((item) => !item.group).at(-1)?.id || active;
      }
      setActiveIndex(indexNavigation.current?.id || active);
      profile.style.setProperty("--counsel-scroll-height", `${pane.clientHeight}px`);
    };
    indexUpdate.current = update;
    const finish = () => {
      clearTimeout(indexSettleTimer.current);
      indexNavigation.current = null;
      update();
    };
    const onScroll = () => {
      update();
      clearTimeout(indexSettleTimer.current);
      if (indexNavigation.current) indexSettleTimer.current = setTimeout(finish, 180);
    };
    const onScrollEnd = () => {
      const navigation = indexNavigation.current;
      if (!navigation || Math.abs(pane.scrollTop - navigation.top) < 2) finish();
    };
    const onManualScroll = (event) => {
      if (event.target.closest?.(".counsel-profile-card")) return;
      if (event.type === "keydown" && !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) return;
      finish();
    };
    update();
    pane.addEventListener("scroll", onScroll, { passive: true });
    pane.addEventListener("scrollend", onScrollEnd);
    for (const type of ["wheel", "touchmove", "pointerdown", "keydown"]) pane.addEventListener(type, onManualScroll, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(pane);
    resize.observe(profile.querySelector(".counsel-details"));
    return () => {
      pane.removeEventListener("scroll", onScroll);
      pane.removeEventListener("scrollend", onScrollEnd);
      for (const type of ["wheel", "touchmove", "pointerdown", "keydown"]) pane.removeEventListener(type, onManualScroll);
      clearTimeout(indexSettleTimer.current);
      indexNavigation.current = null;
      indexUpdate.current = () => {};
      resize.disconnect();
    };
  }, [counselHero, l, b?.field, indexId]);
  const navigateIndex = (item) => {
    const pane = profileRef.current?.closest(".counselpane");
    if (!pane) return;
    const top = Math.max(0, Math.min(pane.scrollHeight - pane.clientHeight,
      pane.scrollTop + item.element.getBoundingClientRect().top - pane.getBoundingClientRect().top - 24));
    clearTimeout(indexSettleTimer.current);
    indexNavigation.current = { id: item.id, top };
    setActiveIndex(item.id);
    pane.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    // Also settle clicks that do not generate a scroll event (already at the destination).
    indexSettleTimer.current = setTimeout(() => {
      indexNavigation.current = null;
      indexUpdate.current();
    }, 180);
  };
  useEffect(() => {
    setHeroHidden(false);
    const hero = heroRef.current;
    const pane = hero?.closest(".counselpane");
    if (!counselHero || !hero || !pane) return;
    const observer = new IntersectionObserver(([entry]) => {
      setHeroHidden(!entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0));
    }, { root: pane, threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [counselHero, l]);
  const edu = [l.edu, l.exam, l.tr].filter(Boolean).join(" · ");
  const pos = [l.pos, l.o ? `${l.o} 출신` : ""].filter(Boolean).join(" · ");
  const heroInfo = specialist ? specialistHero(l) : { greeting: l.pitch, titles: l.titles };
  const hasFields = !!(l.areas?.length || l.f?.length || l.tags?.length);
  return (
    <div className="profile" ref={profileRef}>
      <div ref={heroRef} className={counselHero ? "counsel-hero" : "profile-hero-pass"}>
      {counselHero && <HeroBackdrop />}
      <div className="xlead">
        <Portrait l={l} portraits={portraits} size="hero" />
        <div className="xident xmeta">
          {counselHero ? (
            <>
              {heroInfo.greeting ? <p className="xquote">{heroInfo.greeting}</p> : null}
              {heroInfo.greeting && (heroInfo.titles?.length || l.n || l.pos || edu) ? <div className="hero-message-divider" aria-hidden="true" /> : null}
              <TitleBlock titles={heroInfo.titles} />
              <div className="xwho">
                <strong>{l.n}</strong>
                {l.pos ? <em>{l.pos}</em> : null}
              </div>
              {edu ? <p className="xedu">{edu}</p> : null}
            </>
          ) : (
            <>
              <TitleBlock titles={l.titles} />
              <div className="xwho">
                <strong>{l.n}</strong>
                {pos ? <em>{pos}</em> : null}
              </div>
              {l.pitch ? <p className="xquote">{l.pitch}</p> : null}
              {edu ? <p className="xedu">{edu}</p> : null}
            </>
          )}
        </div>
      </div>
      </div>
      <div className={counselHero ? "counsel-detail-layout" : "profile-detail-layout-pass"}>
      {counselHero && <aside className={`counsel-profile-card${heroHidden ? " is-visible" : ""}`} aria-hidden={!heroHidden} aria-label={specialist ? "전문 인력 프로필" : "상담 변호사 프로필"}>
        <div className="counsel-profile-card-photo">
          {portraits?.[l.n] ? <img src={portraits[l.n]} alt={`${l.n} ${l.pos || ""}`} /> : <span>{l.n?.[0]}</span>}
        </div>
        <div className="counsel-card-content">
        <div className="counsel-card-identity"><strong>{l.n}</strong><span>{l.pos || "변호사"}</span></div>
        {indexItems.length > 0 && <nav className="counsel-index" aria-label="소개 목차">
          {indexItems.map((item) => item.group ? <p key={item.id} className="index-group">{item.label}</p> : <button key={item.id} type="button"
            className="index-section"
            aria-current={activeIndex === item.id ? "location" : undefined}
            aria-controls={item.id} tabIndex={heroHidden ? 0 : -1}
            onClick={() => navigateIndex(item)}>{item.label}</button>)}
        </nav>}
        </div>
      </aside>}
      <div className={counselHero ? "counsel-details" : "profile-details-pass"}>
      {counselHero ? <CounselDetailGroups l={l} FIELD={FIELD} NEAR={NEAR} b={b} hasFields={hasFields} specialist={specialist} /> : <>
      {counselHero ? <>{hasFields ? (
        <section className="xsec xfields">
          <h3>{counselHero ? "주요 업무 분야" : "업무분야"}</h3>
          <FieldTags l={l} FIELD={FIELD} NEAR={NEAR} b={b} full categoriesOnly={counselHero} />
        </section>
      ) : null}{l.career?.length ? (
        <section className="xsec xcareer">
          <h3>{counselHero ? "주요 경력" : "경력"}</h3>
          <ul className="clist">{l.career.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      ) : null}</> : <>{l.career?.length ? (
        <section className="xsec xcareer">
          <h3>{counselHero ? "주요 경력" : "경력"}</h3>
          <ul className="clist">{l.career.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      ) : null}{hasFields ? (
        <section className="xsec xfields">
          <h3>{counselHero ? "주요 업무 분야" : "업무분야"}</h3>
          <FieldTags l={l} FIELD={FIELD} NEAR={NEAR} b={b} full categoriesOnly={counselHero} />
        </section>
      ) : null}</>}
      {l.awards?.length ? (
        <section className="xsec xawards">
          <h3>{counselHero ? "수상 내역" : "수상실적"}</h3>
          <ul className="clist">{l.awards.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      ) : null}
      {l.kind === "lawyer" && l.cases?.length ? (
        <section className="xsec xresults">
          <h3>주요 업무 실적</h3>
          <ul className="clist">{l.cases.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      ) : null}
      {l.papers?.length ? (
        <section className="xsec xpublications">
          <h3>논문·저서</h3>
          <ul className="clist">{l.papers.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      ) : null}
      {l.kind === "lawyer" && l.works?.length ? (
        <section className="xsec">
          <h3>{counselHero ? "관련 업무 사례" : "업무사례"}</h3>
          <ul className="clist">
            {l.works.map((w) => (
              <li key={w.href}>
                <a href={w.href} target="_blank" rel="noreferrer">{w.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      </>}
      {counselHero && (onPrevious || onNext) ? (
        <div className="counsel-page-links">
          {onPrevious && <ReportNext onClick={onPrevious} label="사건 요약으로" previous />}
          {onNext && <ReportNext onClick={onNext} label="전문 인력 살펴보기" />}
        </div>
      ) : null}
      </div>
      </div>
    </div>
  );
}

function Counsel({ l, portraits, FIELD, NEAR, b, onNext, onPrevious }) {
  if (!l) {
    return (
      <section className="pane on">
        <p className="empty">오늘 상담 변호사가 지정되지 않았습니다.</p>
      </section>
    );
  }
  return (
    <section className="pane on counselpane">
      <ProfileBody l={l} portraits={portraits} FIELD={FIELD} NEAR={NEAR} b={b} counselHero onNext={onNext} onPrevious={onPrevious} />
    </section>
  );
}

function FieldTags({ l, FIELD, NEAR, b, full, categoriesOnly = false, limit = Infinity }) {
  const areas = l.areas || [];
  if (categoriesOnly) {
    const categories = [...new Set(areas.length
      ? areas.map((a) => a.group).filter(Boolean)
      : (l.f || []).map((code) => FIELD[code]?.[0]).filter(Boolean))];
    if (!categories.length) return null;
    const primary = fieldLabelsOf(FIELD, b?.field);
    return <ul className="field-keywords">{categories.slice(0, limit).map((name) => {
      const related = groupMatchesFieldLabels(name, primary);
      return <li className={`field-category${related ? " case-related" : ""}`} key={name}>
        <span>{name}</span>
      </li>;
    })}</ul>;
  }
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
      const primary = fieldLabelsOf(FIELD, b?.field);
      const rank = (g) => (groupMatchesFieldLabels(g, primary) ? 0 : 1);
      order.sort((a, c) => rank(a) - rank(c));
      return (
        <div className="xareas">
          {order.map((g) => (
            <div className="xareag" key={g}>
              <b>{g}</b>
              <div className="fl xtags">
                {by.get(g).map((a) => {
                  const m = areaCaseMark(a, b, FIELD, NEAR);
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
      const m = areaCaseMark(a, b, FIELD, NEAR);
      if (m) hits.push({ ...a, m });
    }
    hits.sort((a, c) => (a.m === c.m ? 0 : a.m === "hit" ? -1 : 1));
    if (!hits.length) return null;
    return (
      <div className="fl xtags">
        {hits.slice(0, 6).map((a) => <span className={`f ${a.m}`} key={`${a.group}-${a.name}`}><i>{areaLabel(a.name)}</i></span>)}
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

/** 경력 한 줄에서 대괄호·괄호 상세를 덜어낸다. 카드에서는 기관명만 읽히면 된다. */
function briefCareer(c) {
  return c.replace(/\s*\[[^\]]*\]/g, "").replace(/\s*\([^)]*\)/g, "").trim();
}

/** 전문인력 카드.
 *  추천이 아니라 '이 사람들이 사건을 함께 맡는다'는 소개다. 드러나는 것은
 *  최종 출신 · 주요 경력 · 업무 분야 · 업무 사례 넷뿐이다.
 *  사내 직위(대표변호사)와 전관 경력(부장판사 역임)은 성격이 달라 서체로 가른다. */
function SeniorCard({ l, portraits, FIELD, NEAR, b, onOpen, focused, clone, offset = 0 }) {
  const prev = specialistHeadline(l);
  const career = (l.career || []).map(briefCareer).filter(Boolean).slice(0, 2);
  return (
    <button type="button" className={`xcard${focused ? " is-focused" : ""}${clone ? " is-clone" : ""}`} aria-label={`${l.n} ${l.pos} 프로필`} onClick={onOpen}>
      <span className="xshot" style={{ "--portrait-offset": `${offset}px` }}>
        {portraits?.[l.n] ? <img src={portraits[l.n]} alt={l.n} /> : <span className="xmono">{l.n[0]}</span>}
      </span>
      <span className="xbody">
        <span className="senior-identity">
          {prev ? <span className="senior-career">{prev}</span> : null}
          <span className="senior-name-row"><strong>{l.n}</strong><span>{l.pos}</span></span>
        </span>
        {career.length ? (
          <><span className="xh">주요 경력</span>
          <ul className="xlist">{career.map((c) => <li key={c}>{c}</li>)}</ul></>
        ) : null}
        {l.f?.length || l.areas?.length ? (
          <><span className="xh">업무 분야</span>
          <FieldTags l={l} FIELD={FIELD} NEAR={NEAR} b={b} categoriesOnly limit={3} /></>
        ) : null}

      </span>
    </button>
  );
}

function Seniors({ list, counsel, headline, portraits, FIELD, NEAR, b, onNext }) {
  const [open, setOpen] = useState(null);
  const visibleList = list.filter((person) => !counsel?.n || person.n !== counsel.n).slice(0, 6);
  const shown = open ? visibleList.find((x) => x.n === open) : null;
  const trackRef = useRef(null);
  const trackId = useId();
  const count = visibleList.length;
  const [focusedIndex, setFocusedIndex] = useState(0);
  const focusedRef = useRef(0);
  const [changing, setChanging] = useState(false);
  const changingRef = useRef(false);
  const changeTimer = useRef(null);
  const revealFrame = useRef(null);
  const swipeStart = useRef(null);
  const suppressClick = useRef(false);
  useEffect(() => () => { clearTimeout(changeTimer.current); cancelAnimationFrame(revealFrame.current); }, []);
  const pausedUntil = useRef(0);
  const [autoPaused, setAutoPaused] = useState(false);
  const [interacting, setInteractingState] = useState(false);
  const interactingRef = useRef(false);
  const setInteracting = (value) => { interactingRef.current = value; setInteractingState(value); };
  const [infoIndex, setInfoIndex] = useState(0);
  const focusedPerson = visibleList[((infoIndex % count) + count) % count];
  const renderedList = Array.from({ length: 7 }, () => visibleList).flat();
  const rosterKey = visibleList.map((person) => person.n).join("|");
  const pauseBriefly = () => { pausedUntil.current = Date.now() + 8000; };
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !count) return;
    let settling;
    let frame;
    let width = 0;
    const paint = (position) => {
      // Scale and opacity follow the same fractional scroll position, including loop copies.
      Array.from(track.children).forEach((card, index) => {
        const distance = index - position;
        const proximity = Math.max(0, 1 - Math.abs(distance));
        const weight = proximity * proximity * (3 - 2 * proximity);
        card.style.setProperty("--motion-scale", String(.62 + .48 * weight));
        card.style.setProperty("--motion-opacity", String(.5 + .5 * weight));
        card.style.setProperty("--motion-x", `${Math.max(-2, Math.min(2, distance)) * -12}px`);
        // A constant bottom origin with translation preserves the focused top-aligned endpoint.
        card.style.setProperty("--motion-y", `${34 * weight}px`);
      });
      const index = Math.round(position);
      focusedRef.current = index;
      setFocusedIndex(index);
    };
    const settle = () => {
      if (getComputedStyle(track).display !== "flex" || interactingRef.current) return;
      const step = track.firstElementChild.getBoundingClientRect().width;
      const position = track.scrollLeft / step + 3;
      const index = Math.round(position);
      if (Math.abs(position - index) > .02) return;
      setInfoIndex(index);
      revealFrame.current = requestAnimationFrame(() => {
        setChanging(false);
        changingRef.current = false;
      });
      if (index < count * 2 || index >= count * 4) {
        const normalized = count * 3 + ((index % count) + count) % count;
        // Paint the matching copy before the instantaneous, visually identical reposition.
        paint(normalized);
        track.scrollTo({ left: (normalized - 3) * step, behavior: "instant" });
      }
    };
    const update = () => {
      clearTimeout(settling);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (getComputedStyle(track).display !== "flex") return;
        const step = track.firstElementChild.getBoundingClientRect().width;
        paint(track.scrollLeft / step + 3);
      });
      settling = setTimeout(settle, 220);
    };
    const resize = () => {
      if (getComputedStyle(track).display !== "flex") { width = 0; return; }
      if (width === track.clientWidth) return;
      const initial = count * 3 + (width ? focusedRef.current % count : Math.min(3, count - 1));
      width = track.clientWidth;
      paint(initial);
      setInfoIndex(initial);
      track.scrollTo({ left: (initial - 3) * track.firstElementChild.getBoundingClientRect().width, behavior: "instant" });
    };
    resize();
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("scrollend", settle);
    const observer = new ResizeObserver(resize);
    observer.observe(track);
    return () => {
      clearTimeout(settling); cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update); track.removeEventListener("scrollend", settle);
      observer.disconnect();
    };
  }, [rosterKey]);
  const focusPerson = (index) => {
    const track = trackRef.current;
    if (!track || changingRef.current || index === focusedRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    changingRef.current = true;
    setChanging(true);
    changeTimer.current = setTimeout(() => {
      const step = track.firstElementChild.getBoundingClientRect().width;
      track.scrollTo({ left: (index - 3) * step, behavior: reduced ? "instant" : "smooth" });
    }, reduced ? 0 : 180);
  };
  const startSwipe = (event) => {
    if (getComputedStyle(trackRef.current).display !== "flex") return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
    setInteracting(true); pauseBriefly();
  };
  const endSwipe = (event) => {
    const start = swipeStart.current;
    swipeStart.current = null; setInteracting(false); pauseBriefly();
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
      suppressClick.current = true;
      focusPerson(focusedRef.current + (dx < 0 ? 1 : -1));
    }
  };
  const move = (direction) => { pauseBriefly(); focusPerson(focusedRef.current + direction); };
  useEffect(() => {
    if (open || autoPaused || interacting || count < 2) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (document.hidden || Date.now() < pausedUntil.current || !track ||
          getComputedStyle(track).display !== "flex" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      focusPerson(focusedRef.current + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [open, autoPaused, interacting, rosterKey]);

  return (
    <div className="senior-pages">
    <section className={`pane on seniorpane${shown ? " is-detail-hidden" : ""}`} aria-hidden={shown ? true : undefined} inert={shown ? "" : undefined}>
      <div className="senior-content">
      <h2 className="h1">다양한 경험을 갖춘 전문 인력을 소개합니다.</h2>
      <p className="sub">주요 업무 분야와 경력을 살펴보세요.<br />프로필을 누르면 자세한 정보를 확인하실 수 있습니다.</p>
      <div className={`senior-stage${changing ? " is-changing" : ""}`}>
      {count > 1 && <div className="senior-side-navigation">
        {[-1, 1].map((direction) => <button key={direction} type="button"
          className={direction < 0 ? "senior-prev" : "senior-next"}
          aria-label={direction < 0 ? "이전 전문 인력" : "다음 전문 인력"} aria-controls={trackId}
          disabled={changing} onClick={() => move(direction)}>
          <svg className={`lucide lucide-chevron-${direction < 0 ? "left" : "right"}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={direction < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
          </svg>
        </button>)}
      </div>}
      <div className="legendgrid senior-carousel" ref={trackRef} onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { swipeStart.current = null; setInteracting(false); }} onPointerLeave={() => { swipeStart.current = null; setInteracting(false); }} onWheel={pauseBriefly} onFocusCapture={pauseBriefly} id={trackId} role="region" aria-label="전문 인력 목록" aria-roledescription="캐러셀">
        {renderedList.map((l, index) => (
          <SeniorCard l={l} portraits={portraits} FIELD={FIELD} NEAR={NEAR} b={b}
            key={`${index}-${l.n}`} clone={Math.floor(index / count) !== 3} offset={Math.max(-2, Math.min(2, index - focusedIndex)) * -12} focused={index === focusedIndex} onOpen={() => {
              if (suppressClick.current) { suppressClick.current = false; return; }
              if (changingRef.current) return;
              if (getComputedStyle(trackRef.current).display === "flex" && index !== focusedIndex) { pauseBriefly(); focusPerson(index); }
              else setOpen(l.n);
            }} />
        ))}
      </div>
      {focusedPerson && <div className="senior-focused-info" aria-live="off" aria-atomic="true">
        {visibleList.map((person) => <div className="senior-info-copy senior-info-sizer" aria-hidden="true" key={person.n}>
        <p className="senior-focused-career">{specialistHeadline(person)}</p>
        <p className="senior-focused-name"><strong>{person.n}</strong><span>{person.pos}</span></p>
        <span className="senior-profile-action">프로필 보기
          <svg className="lucide lucide-arrow-right" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
        </span>
        </div>)}
        <div className="senior-info-copy">
        <p className="senior-focused-career">{specialistHeadline(focusedPerson)}</p>
        <p className="senior-focused-name"><strong>{focusedPerson.n}</strong><span>{focusedPerson.pos}</span></p>
        <button type="button" disabled={changing} onClick={() => setOpen(focusedPerson.n)}>프로필 보기
          <svg className="lucide lucide-arrow-right" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
        </button>
        </div>
      </div>}
      </div>
      {visibleList.length > 0 && <div className="senior-carousel-controls">
        <span>전체 {visibleList.length}명</span>
        <div className="senior-carousel-arrows">
          <button type="button" className="senior-auto-toggle" onClick={() => setAutoPaused((paused) => !paused)} aria-label={autoPaused ? "자동 넘김 재생" : "자동 넘김 일시정지"}>{autoPaused ? "재생" : "일시정지"}</button>
          {[-1, 1].map((direction) => <button key={direction} type="button"
            aria-label={direction < 0 ? "이전 전문 인력" : "다음 전문 인력"} aria-controls={trackId}
            disabled={count < 2} onClick={() => move(direction)}>
            <svg className={`lucide lucide-arrow-${direction < 0 ? "left" : "right"}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={direction < 0 ? "m12 19-7-7 7-7" : "m12 5 7 7-7 7"} /><path d="M5 12h14" />
            </svg>
          </button>)}
        </div>
      </div>}
      {!visibleList.length ? <p className="empty">현재 표시할 전문 인력 정보가 없습니다.</p> : null}
      {onNext ? (
        <div className="journey-foot">
          <button type="button" className="go counsel-go" onClick={onNext}>설문 참여하기</button>
        </div>
      ) : null}
      </div>
    </section>
      {shown && <section className="pane on counselpane specialist-detail-page" aria-label={`${shown.n} 프로필 상세`}>
        <div className="specialist-back-row">
          <button type="button" autoFocus onClick={() => { pauseBriefly(); setOpen(null); }}>
            <svg className="lucide lucide-arrow-left" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7M5 12h14" /></svg>
            전문 인력 목록
          </button>
        </div>
        <ProfileBody key={shown.n} l={shown} portraits={portraits} FIELD={FIELD} NEAR={NEAR} b={b} counselHero specialist />
      </section>}
    </div>
  );
}
