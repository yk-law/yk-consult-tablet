import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getVisitBinderConfirm,
  getVisitBinderCounsel,
  getVisitBinderFirm,
  getVisitBinderRelatedCases,
  type VisitBinderCaseBody,
  type VisitBinderRelatedCase,
  type VisitBinderRewriteResult,
} from 'lib/api/api-visit-binder';
import { parseBinder3Query } from './binder3Display';
import { Binder3Logo, Binder3WelcomeBackdrop } from './binder3Common';
import {
  Binder3CaseBodiesProvider,
  collectCaseIds,
  useBinder3CaseBodies,
} from './binder3CaseBodies';
import Binder3CaseCheck from './Binder3CaseCheck';
import Binder3Confirm from './Binder3Confirm';
import Binder3Prep, { Binder3Loading } from './Binder3Prep';
import Binder3Film from './Binder3Film';
import Binder3YoutubeTab from './Binder3YoutubeTab';
import { useBinder3FilmPreload } from './binder3FilmPreload';
import Binder3Firm, { type Binder3FirmState } from './Binder3Firm';
import Binder3Journey from './Binder3Journey';
import Binder3Report, { type Binder3ReportState } from './Binder3Report';
import Binder3Counsel, { type Binder3CounselState } from './Binder3Counsel';
import Binder3CounselTeam, {
  sortCounselTeam,
  type Binder3CounselMember,
} from './Binder3CounselTeam';
import Binder3Cases from './Binder3Cases';
import { teamGreetings } from './binder3Greeting';
import { BINDER3_JOURNEY, isBinder3JourneyId, type Binder3JourneyId } from './binder3JourneyMenu';
import {
  binder3RerollEvent,
  buildConfirmItems,
  postBinder3Confirm,
  type Binder3Answer,
  type Binder3Answers,
} from './binder3CaseCheckMessage';
import {
  loadBinder3Answers,
  loadBinder3Party,
  loadBinder3Resume,
  saveBinder3Answers,
  saveBinder3Party,
  saveBinder3Resume,
  type Binder3ReportView,
} from './binder3Resume';
import { findTopic, loadBinder3Topics } from './binder3Topics';
import { rewrittenStep, useBinder3StepRewrites } from './binder3StepRewrites';
import './binder3.css';

type Binder3Step = 'confirm' | 'prep' | 'film' | Binder3JourneyId;

/** 사건 요약 1뎁스 문항. 실패도 문항 없음과 같이 건너뛴다. */
type Binder3CaseCheckState = { status: 'loading' } | { status: 'ready'; questions: string[] };

type JourneyViewContext = {
  firm: Binder3FirmState;
  caseCheck: Binder3CaseCheckState;
  stepRewrites: VisitBinderRewriteResult;
  answers: Binder3Answers;
  onAnswer: (question: string, answer: Binder3Answer) => void;
  reportView: Binder3ReportView;
  setReportView: (view: Binder3ReportView) => void;
  topics: Binder3ReportState;
  caseSmall: string;
  caseMiddle: string;
  party: string | null;
  onParty: (party: string) => void;
  /** 상담에 함께하는 사람들(2차 내부 피드백 8). 고른 순서 */
  counselTeam: Binder3CounselMember[];
  counselIndex: number;
  onCounselIndex: (index: number) => void;
  caseField: string;
  /** 업무사례 화면 목록(시작할 때 받아 둔다). 본문을 받은 사례만 */
  firmCases: VisitBinderRelatedCase[];
  firmCaseBodies: Record<number, VisitBinderCaseBody>;
  /** 업무사례 본문을 아직 받는 중 */
  firmCasesLoading: boolean;
  /** 고객이 방문한 사무소(YK 소개 지사 탭) */
  office: string;
  counselScrollTop: number;
  onCounselScroll: (scrollTop: number) => void;
  /** 상담 변호사의 「사건 요약으로」: 2뎁스로 돌아간다 */
  onToTopics: () => void;
  go: (id: Binder3JourneyId) => void;
};

/**
 * 메뉴↔화면 표. 여기 있는 메뉴만 사이드바에서 켜진다(화면 없는 메뉴를 켜 빈 본문이 되지 않게).
 * 화면을 만들 때 이 표에 하나씩 더한다.
 */
const JOURNEY_VIEWS: Partial<Record<Binder3JourneyId, (ctx: JourneyViewContext) => ReactNode>> = {
  firm: ({ firm, caseField, office, go }) => (
    <Binder3Firm state={firm} caseField={caseField} office={office} onNext={() => go('report')} />
  ),
  report: ({
    caseCheck,
    stepRewrites,
    answers,
    onAnswer,
    reportView,
    setReportView,
    topics,
    caseSmall,
    caseMiddle,
    party,
    onParty,
    go,
  }) => {
    const questions = caseCheck.status === 'ready' ? caseCheck.questions : [];
    if (reportView === 'check' && questions.length > 0) {
      return (
        <Binder3CaseCheck
          questions={questions}
          answers={answers}
          onAnswer={onAnswer}
          onPrevious={() => go('firm')}
          onNext={() => setReportView('topics')}
        />
      );
    }
    return (
      <Binder3Report
        state={topics}
        small={caseSmall}
        middle={caseMiddle}
        party={party}
        suggestedParty={stepRewrites.party}
        onParty={onParty}
        stepText={(role, step) => rewrittenStep(stepRewrites, role, step, questions, answers)}
        differentCount={questions.filter((question) => answers[question] === 'no').length}
        previousLabel={questions.length > 0 ? '말씀하신 내용으로' : '법무법인 YK 소개로'}
        onPrevious={() => (questions.length > 0 ? setReportView('check') : go('firm'))}
        onNext={() => go('counsel')}
      />
    );
  },
  counsel: ({
    counselTeam,
    counselIndex,
    onCounselIndex,
    caseField,
    counselScrollTop,
    onCounselScroll,
    onToTopics,
    go,
  }) => {
    const member = counselTeam[counselIndex] ?? counselTeam[0];
    // 인사말이 비어 후보 문구를 쓸 때 함께하는 분끼리 겹치지 않게 한다(고재완 11-17).
    const greetings = teamGreetings(
      counselTeam.flatMap((m) => (m.state.status === 'ready' ? [m.state.data] : []))
    );
    const ready = counselTeam.filter((m) => m.state.status === 'ready');
    const greeting = member ? greetings[ready.indexOf(member)] : undefined;
    return (
      <>
        <Binder3CounselTeam team={counselTeam} index={counselIndex} onIndex={onCounselIndex} />
        <Binder3Counsel
          key={member?.empId ?? 'none'}
          state={member?.state ?? { status: 'none' }}
          greeting={greeting}
          caseField={caseField}
          initialScrollTop={counselScrollTop}
          onScrollChange={onCounselScroll}
          onPrevious={onToTopics}
          onNext={() => go('cases')}
        />
      </>
    );
  },
  // 「전문 인력」 자리. YK 소개의 업무사례 탭을 옮겼다(고재완 11-18).
  cases: ({ firmCases, firmCaseBodies, firmCasesLoading, caseField, go }) => (
    <Binder3Cases
      cases={firmCases}
      caseBodies={firmCaseBodies}
      caseField={caseField}
      loading={firmCasesLoading}
      onPrevious={() => go('counsel')}
      onNext={() => go('youtube')}
    />
  ),
  youtube: ({ go }) => <Binder3YoutubeTab onPrevious={() => go('cases')} />,
};

const EMPTY_QUESTIONS: string[] = [];
const JOURNEY_ENABLED = BINDER3_JOURNEY.map(([id]) => id).filter((id) => id in JOURNEY_VIEWS);

function Binder3Flow({ searchParams }: { searchParams: URLSearchParams }) {
  const {
    engId,
    customerName,
    office,
    placeLabel,
    visitLabel,
    counselEmpIds,
    caseField,
    caseSmall,
    caseMiddle,
  } = useMemo(() => parseBinder3Query(searchParams), [searchParams]);
  // 페이지가 새로 읽혀도 같은 주소면 보던 메뉴 화면·위치로 되돌린다.
  const address = searchParams.toString();
  const [resume] = useState(() => loadBinder3Resume(address));
  const [step, setStep] = useState<Binder3Step>(resume?.step ?? 'confirm');
  const counselScrollRef = useRef(resume?.step === 'counsel' ? resume.scrollTop : 0);
  const reportViewRef = useRef<Binder3ReportView>(resume?.reportView ?? 'check');
  const onCounselScroll = useCallback(
    (scrollTop: number) => {
      counselScrollRef.current = scrollTop;
      saveBinder3Resume(address, { step: 'counsel', scrollTop, reportView: reportViewRef.current });
    },
    [address]
  );
  // 사건 요약은 문항이 있으면 1뎁스부터, 없으면 2뎁스를 보인다. 안의 화면은 되돌리기에 함께 둔다.
  const [reportView, setReportView] = useState<Binder3ReportView>(resume?.reportView ?? 'check');
  useEffect(() => {
    if (!isBinder3JourneyId(step)) return;
    saveBinder3Resume(address, {
      step,
      scrollTop: step === 'counsel' ? counselScrollRef.current : 0,
      reportView,
    });
  }, [address, reportView, step]);
  reportViewRef.current = reportView;
  const go = useCallback((id: Binder3JourneyId) => {
    if (id === 'report') setReportView('check');
    setStep(id);
  }, []);
  const onToTopics = useCallback(() => {
    setReportView('topics');
    setStep('report');
  }, []);
  const toFilm = useCallback(() => setStep('film'), []);
  const toFirm = useCallback(() => setStep('firm'), []);

  // YK 소개 데이터.
  const [firm, setFirm] = useState<Binder3FirmState>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    getVisitBinderFirm()
      .then((data) => alive && setFirm({ status: 'ready', data }))
      .catch(() => alive && setFirm({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);

  // YK 소개 업무사례 탭. 시작할 때(확인·영상 단계) 받아 두어 서버가 Gemma 로 상담과 비슷한 사례를 앞에 두는 동안
  // 고객이 기다리지 않게 한다. 사건 분야가 없거나 못 받으면 빈 목록(탭 없음). 시작을 막지 않는다.
  const [firmCases, setFirmCases] = useState<VisitBinderRelatedCase[]>([]);
  useEffect(() => {
    setFirmCases([]);
    if (!caseField) return undefined;
    let alive = true;
    getVisitBinderRelatedCases({ field: caseField, small: caseSmall, engId })
      .then((rows) => alive && setFirmCases(Array.isArray(rows) ? rows : []))
      .catch(() => alive && setFirmCases([]));
    return () => {
      alive = false;
    };
  }, [caseField, caseSmall, engId]);

  // 상담에 함께하는 사람들(2차 내부 피드백 8)도 시작할 때 한 번에 불러 둔다. 메뉴를 오가도 다시 부르지 않는다.
  const counselKey = counselEmpIds.join(',');
  const [counselTeam, setCounselTeam] = useState<Binder3CounselMember[]>(() =>
    counselEmpIds.map((empId) => ({ empId, state: { status: 'loading' } }))
  );
  useEffect(() => {
    const ids = counselKey ? counselKey.split(',').map(Number) : [];
    setCounselTeam(ids.map((empId) => ({ empId, state: { status: 'loading' } })));
    let alive = true;
    const settle = (empId: number, state: Binder3CounselState) =>
      alive &&
      setCounselTeam((prev) => prev.map((m) => (m.empId === empId ? { empId, state } : m)));
    for (const empId of ids) {
      getVisitBinderCounsel(empId)
        .then((data) => settle(empId, { status: 'ready', data }))
        .catch(() => settle(empId, { status: 'error' }));
    }
    return () => {
      alive = false;
    };
  }, [counselKey]);
  const counselStates = useMemo(() => counselTeam.map((m) => m.state), [counselTeam]);
  const counselLoading = counselStates.some((state) => state.status === 'loading');
  // 화면에는 YK 소개와 같은 순서(법원 → 검찰 → 경찰 → 고문 → 전문위원, 그 밖은 직함 → 기수)로 보인다(고재완 11-18).
  // 상담 변호사와 YK 소개를 다 받은 뒤에 한 번 정해 탭 순서(counselIndex)가 받는 도중에 바뀌지 않게 한다.
  const firmOrder = firm.status === 'ready' ? firm.data?.order : undefined;
  const orderedCounselTeam = useMemo(
    () =>
      counselLoading || firm.status === 'loading'
        ? counselTeam
        : sortCounselTeam(counselTeam, firmOrder),
    [counselLoading, counselTeam, firm.status, firmOrder]
  );
  // 탭으로 고른 사람. 바꾸면 그 사람 소개를 맨 위부터 보인다.
  const [counselIndex, setCounselIndex] = useState(0);
  const onCounselIndex = useCallback(
    (index: number) => {
      counselScrollRef.current = 0;
      saveBinder3Resume(address, {
        step: 'counsel',
        scrollTop: 0,
        reportView: reportViewRef.current,
      });
      setCounselIndex(index);
    },
    [address]
  );

  // 사건 요약 문항은 젬마가 만든다(수 초).
  const [caseCheck, setCaseCheck] = useState<Binder3CaseCheckState>(() =>
    engId == null ? { status: 'ready', questions: [] } : { status: 'loading' }
  );
  useEffect(() => {
    if (engId == null) return undefined;
    let alive = true;
    getVisitBinderConfirm(engId)
      .then((questions) => alive && setCaseCheck({ status: 'ready', questions }))
      .catch(() => alive && setCaseCheck({ status: 'ready', questions: [] }));
    return () => {
      alive = false;
    };
  }, [engId]);

  const [answers, setAnswers] = useState<Binder3Answers>(() => loadBinder3Answers(address));

  // 실장이 리롤을 누르면 문항을 다시 받는다. 못 받으면 고객 화면은 그대로 두고, 실장 화면이 기다림을 풀도록 같은 문항을 다시 보낸다.
  useEffect(() => {
    if (engId == null) return undefined;
    let alive = true;
    const apply = (next: string[]) => {
      if (!alive) return;
      // 새 문항을 받으면 글자가 같아도 답을 지운다. 못 받으면 고른 답을 그대로 둔다.
      if (next.length) setAnswers({});
      setCaseCheck((prev) => {
        const current = prev.status === 'ready' ? prev.questions : [];
        return { status: 'ready', questions: next.length ? next : [...current] };
      });
    };
    const onReroll = () => {
      getVisitBinderConfirm(engId, { reroll: true })
        .then(apply)
        .catch(() => apply([]));
    };
    const eventName = binder3RerollEvent(engId);
    window.addEventListener(eventName, onReroll);
    return () => {
      alive = false;
      window.removeEventListener(eventName, onReroll);
    };
  }, [engId]);

  const onAnswer = useCallback((question: string, answer: Binder3Answer) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
  }, []);
  useEffect(() => saveBinder3Answers(address, answers), [address, answers]);

  // 문항이 뜰 때와 답이 바뀔 때마다 상담실장 화면에 전체를 보낸다.
  // 문항이 없어도 빈 목록을 보내, 같은 사건을 다시 열었을 때 예전 목록이 실장 화면에 남지 않게 한다.
  const questions = caseCheck.status === 'ready' ? caseCheck.questions : null;
  useEffect(() => {
    if (engId == null || !questions) return;
    postBinder3Confirm(engId, buildConfirmItems(questions, answers));
  }, [answers, engId, questions]);

  // 사건 요약 안내 데이터.
  const [topics, setTopics] = useState<Binder3ReportState>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    loadBinder3Topics()
      .then((table) => alive && setTopics({ status: 'ready', table }))
      .catch(() => alive && setTopics({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);

  // 콜 내용으로 지위를 고르고 그 지위 안내 설명에 문항 내용을 녹인다. 문항과 안내가 다 와야 시작할 수 있다.
  const topicForRewrites = useMemo(
    () => (topics.status === 'ready' ? findTopic(topics.table, caseSmall, caseMiddle) : null),
    [caseMiddle, caseSmall, topics]
  );
  const { result: stepRewrites, settled: stepRewritesSettled } = useBinder3StepRewrites(
    caseCheck.status === 'ready' && topics.status !== 'loading',
    engId,
    caseCheck.status === 'ready' ? caseCheck.questions : EMPTY_QUESTIONS,
    topicForRewrites
  );

  const [party, setParty] = useState<string | null>(() => loadBinder3Party(address));
  const onParty = useCallback(
    (next: string) => {
      setParty(next);
      saveBinder3Party(address, next);
    },
    [address]
  );

  // 사례 본문은 상담 변호사가 온 뒤에 그 사람들 것만 받는다.
  const peopleReady = !counselLoading;
  const caseIds = useMemo(() => collectCaseIds(counselStates), [counselStates]);
  const { bodies, retryable, done: caseBodiesDone } = useBinder3CaseBodies(peopleReady, caseIds);
  const caseBodies = useMemo(() => ({ bodies, retryable }), [bodies, retryable]);

  // 업무사례 화면 사례도 본문을 받아 두고, 받은 것만 보인다. DIP 목록에는 그날 새벽에 들어오지만
  // 홈페이지에는 아직 올라오지 않은 사례(404)가 있어 눌러도 열리지 않기 때문이다. 시작을 막지는 않는다.
  const firmCaseIds = useMemo(() => firmCases.map((c) => c.id), [firmCases]);
  const firmBodies = useBinder3CaseBodies(firmCaseIds.length > 0, firmCaseIds);
  const visibleFirmCases = useMemo(
    () => firmCases.filter((c) => firmBodies.bodies[c.id] || firmBodies.retryable.has(c.id)),
    [firmCases, firmBodies.bodies, firmBodies.retryable]
  );

  // 소개 영상도 시작 전에 받아 둔다. 이미 지나간 화면으로 되돌아온 경우에는 받지 않는다.
  const [filmAhead] = useState(() => !isBinder3JourneyId(step));
  const film = useBinder3FilmPreload(filmAhead);

  // 바인더#3 를 누르면 전부 받은 뒤에 시작한다. 실패한 것은 기다리지 않고 그 화면에서 안내한다.
  const loading =
    !caseBodiesDone ||
    !stepRewritesSettled ||
    !film.done ||
    counselLoading ||
    [firm, caseCheck, topics].some((state) => state.status === 'loading');
  const filmOn = !loading && step === 'film';
  const welcomeOn = loading || step === 'confirm' || step === 'prep';
  const journeyStep = !loading && isBinder3JourneyId(step) ? step : null;
  const journeyOn = journeyStep != null;

  return (
    <Binder3CaseBodiesProvider value={caseBodies}>
      <div className={`yk-binder3${filmOn ? ' film-on' : ''}`}>
        {welcomeOn && <Binder3WelcomeBackdrop />}
        {!filmOn && (
          <header className={`b3-bar${journeyOn ? ' journey-header' : ''}`}>
            <Binder3Logo className="b3-ci b3-header-ci" />
            {placeLabel ? <span className="b3-place">{placeLabel}</span> : null}
          </header>
        )}
        <main className={`b3-content${journeyOn ? ' has-journey' : ''}`}>
          {loading && <Binder3Loading />}
          {!loading && step === 'confirm' && (
            <Binder3Confirm
              customerName={customerName}
              visitLabel={visitLabel}
              placeLabel={placeLabel}
              onConfirm={() => setStep('prep')}
            />
          )}
          {!loading && step === 'prep' && <Binder3Prep onDone={toFilm} />}
          {filmOn && <Binder3Film src={film.src} onDone={toFirm} />}
          {journeyStep && (
            <>
              <div className="b3-view">
                {JOURNEY_VIEWS[journeyStep]?.({
                  firm,
                  firmCases: visibleFirmCases,
                  firmCaseBodies: firmBodies.bodies,
                  firmCasesLoading: !firmBodies.done,
                  office,
                  caseCheck,
                  stepRewrites,
                  answers,
                  onAnswer,
                  reportView,
                  setReportView,
                  topics,
                  caseSmall,
                  caseMiddle,
                  party,
                  onParty,
                  counselTeam: orderedCounselTeam,
                  counselIndex,
                  onCounselIndex,
                  caseField,
                  counselScrollTop: counselScrollRef.current,
                  onCounselScroll,
                  onToTopics,
                  go,
                })}
              </div>
              <Binder3Journey
                active={journeyStep}
                customerName={customerName}
                enabled={JOURNEY_ENABLED}
                onSelect={go}
              />
            </>
          )}
        </main>
      </div>
    </Binder3CaseBodiesProvider>
  );
}

/**
 * 바인더#3 — yk-consult-tablet 고객 태블릿 화면 (내방 → 상담 준비 → 소개 영상 → YK 소개·사건 요약·상담 변호사·전문 인력).
 * 상담실장이 PiP 의 바인더#3 으로 연다. 고객 정보는 URL 쿼리로, 로그인 토큰은 localStorage 로 받는다.
 * 다시 열면(쿼리 `t` 변경) 내방부터 새로 시작한다.
 */
export default function PageVisitTabletBinder3() {
  const [searchParams] = useSearchParams();
  return <Binder3Flow key={searchParams.toString()} searchParams={searchParams} />;
}
