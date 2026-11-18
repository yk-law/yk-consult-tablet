import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { VisitBinderSenior } from 'lib/api/api-visit-binder';
import { lawyerImageUrl } from '../utils/visitConsultDisplay';
import Binder3Counsel, { Binder3FieldKeywords } from './Binder3Counsel';
import { briefCareer } from './binder3SeniorText';
import { Binder3NavLinks, Binder3NoPhoto } from './binder3Common';

export type Binder3SeniorsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: VisitBinderSenior[] };

const AUTO_ADVANCE_MS = 5000;
/** 고객이 넘기거나 누른 뒤 자동 넘김을 쉬는 시간 */
const PAUSE_AFTER_TOUCH_MS = 8000;
const SWIPE_MIN_PX = 36;
/** CSS 의 카드 이동 시간(420ms)보다 조금 길게. 이동이 끝난 뒤 지나간 카드를 정리한다 */
const JUMP_SETTLE_MS = 500;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const mod = (value: number, count: number) => (count ? ((value % count) + count) % count : 0);

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {direction === 'left' ? <path d="m12 19-7-7 7-7M19 12H5" /> : <path d="m12 5 7 7-7 7M5 12h14" />}
    </svg>
  );
}

function SeniorCard({
  person,
  caseField,
  style,
  focused,
  offscreen = false,
  onOpen,
}: {
  person: VisitBinderSenior;
  caseField: string;
  style?: CSSProperties;
  focused: boolean;
  /** 캐러셀 양 끝 바깥에서 들어오고 나가는 칸 — 보이지 않고 누를 수도 없다 */
  offscreen?: boolean;
  onOpen: () => void;
}) {
  const src = person.photo ? lawyerImageUrl(person.photo) : '';
  const career = person.career.map(briefCareer).filter(Boolean).slice(0, 2);
  return (
    <button
      type="button"
      className={`b3-senior-card${focused ? ' is-focused' : ''}`}
      style={style}
      aria-hidden={offscreen || undefined}
      tabIndex={offscreen ? -1 : undefined}
      aria-label={`${person.name} ${person.position} 프로필`}
      onClick={onOpen}
    >
      <span className="b3-senior-shot">
        {src ? <img src={src} alt="" /> : <Binder3NoPhoto />}
      </span>
      <span className="b3-senior-body">
        <span className="b3-senior-identity">
          {person.titles[0] ? <span className="b3-senior-headline">{person.titles[0]}</span> : null}
          <span className="b3-senior-name-row">
            <strong>{person.name}</strong>
            <span>{person.position}</span>
          </span>
        </span>
        {career.length ? (
          <>
            <span className="b3-senior-h">주요 경력</span>
            <ul className="b3-senior-career">
              {career.map((text, i) => (
                <li key={`${i}-${text}`}>{text}</li>
              ))}
            </ul>
          </>
        ) : null}
        {person.fields.length ? (
          <>
            <span className="b3-senior-h">업무 분야</span>
            <Binder3FieldKeywords fields={person.fields} caseField={caseField} limit={3} />
          </>
        ) : null}
      </span>
    </button>
  );
}

function SeniorList({
  people,
  caseField,
  hidden,
  onOpen,
  onPrevious,
  onNext,
}: {
  people: VisitBinderSenior[];
  caseField: string;
  hidden: boolean;
  onOpen: (index: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const count = people.length;
  const trackId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  // 캐러셀은 끝없이 이어진 칸이다. position 은 가운데 칸 번호(넘길 때마다 ±1, 줄지 않는다).
  // 칸마다 key 가 고정이라 화면에 남는 사진은 그대로 미끄러지고, 새 사람은 양 끝 바깥 칸에서 들어온다.
  const [position, setPosition] = useState(0);
  // 두 칸 이상 건너뛸 때 지나갈 칸까지 그려 두는 범위. 새 카드가 보이는 자리에서 갑자기 생기거나
  // 나가는 카드가 보이는 채로 사라지지 않고 함께 미끄러지게 한다.
  const [span, setSpan] = useState<[number, number] | null>(null);
  const jumpTimers = useRef<number[]>([]);
  useEffect(() => () => jumpTimers.current.forEach((id) => window.clearTimeout(id)), []);
  const focused = mod(position, count);
  const [carousel, setCarousel] = useState(false);
  const [paused, setPaused] = useState(false);
  const restUntil = useRef(0);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  // 가로형에서만 캐러셀이다. 세로형은 CSS 가 격자로 바꾸므로 넘김·자동 넘김을 하지 않는다(프로토타입 방식).
  const isCarousel = () => !!trackRef.current && getComputedStyle(trackRef.current).display === 'flex';
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const check = () => setCarousel(getComputedStyle(track).display === 'flex');
    check();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(check);
    observer.observe(track);
    return () => observer.disconnect();
  }, [count]);
  const rest = () => {
    restUntil.current = Date.now() + PAUSE_AFTER_TOUCH_MS;
  };
  const move = useCallback((step: number) => setPosition((p) => p + step), []);
  const { before, after } = carouselReach(count);
  /** 멀리 있는 칸으로: 지나갈 칸을 지금 자리 기준(화면 밖)으로 먼저 그리고, 다음 화면에서 움직인다. */
  const jumpTo = (target: number) => {
    jumpTimers.current.forEach((id) => window.clearTimeout(id));
    const lo = Math.min(position, target) - before - 1;
    const hi = Math.max(position, target) + after + 1;
    setSpan([lo, hi]);
    jumpTimers.current = [
      window.setTimeout(() => setPosition(target), 30),
      window.setTimeout(() => setSpan(null), 30 + JUMP_SETTLE_MS),
    ];
  };

  useEffect(() => {
    if (hidden || paused || count < 2) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden || Date.now() < restUntil.current || reducedMotion() || !isCarousel()) return;
      move(1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [hidden, paused, count, move]);

  /** slot: 캐러셀 칸 번호(격자에서는 사람 번호) */
  const openCard = (slot: number) => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (carousel && slot !== position) {
      rest();
      if (Math.abs(slot - position) > 1) jumpTo(slot);
      else setPosition(slot);
      return;
    }
    onOpen(mod(slot, count));
  };

  // 보이는 칸과 그 바깥 한 칸씩(들어오고 나가는 자리). 건너뛰는 중이면 지나갈 칸까지.
  const [lo, hi] = span ?? [position - before - 1, position + after + 1];
  const slots = carousel
    ? Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
    : people.map((_, index) => index);

  const person = people[focused];
  const arrows = (className: string) =>
    count > 1
      ? ([-1, 1] as const).map((step) => (
          <button
            key={step}
            type="button"
            className={className}
            aria-label={step < 0 ? '이전 전문 인력' : '다음 전문 인력'}
            aria-controls={trackId}
            onClick={() => {
              rest();
              move(step);
            }}
          >
            {className === 'b3-senior-side' ? (
              <ChevronIcon direction={step < 0 ? 'left' : 'right'} />
            ) : (
              <ArrowIcon direction={step < 0 ? 'left' : 'right'} />
            )}
          </button>
        ))
      : null;

  return (
    <section className="b3-seniors" hidden={hidden} aria-label="전문 인력">
      <div className="b3-seniors-content">
        <h2 className="b3-seniors-title">다양한 경험을 갖춘 전문 인력을 소개합니다.</h2>
        <p className="b3-seniors-sub">
          주요 업무 분야와 경력을 살펴보세요.
          <br />
          프로필을 누르면 자세한 정보를 확인하실 수 있습니다.
        </p>
        {count ? (
          <>
            <div className="b3-senior-stage">
              <div className="b3-senior-sides">{arrows('b3-senior-side')}</div>
              <div
                className="b3-senior-track"
                ref={trackRef}
                id={trackId}
                role="region"
                aria-label="전문 인력 목록"
                aria-roledescription="캐러셀"
                onPointerDown={(e) => {
                  // 터치로 넘기면 click 이 오지 않는다 — 지난 스와이프 표시가 다음 탭을 막지 않게 새로 시작한다
                  swiped.current = false;
                  if (!isCarousel()) return;
                  swipe.current = { x: e.clientX, y: e.clientY };
                  rest();
                }}
                onPointerUp={(e) => {
                  const start = swipe.current;
                  swipe.current = null;
                  if (!start) return;
                  const dx = e.clientX - start.x;
                  const dy = e.clientY - start.y;
                  if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
                    swiped.current = true;
                    rest();
                    move(dx < 0 ? 1 : -1);
                  }
                }}
                onPointerCancel={() => {
                  swipe.current = null;
                }}
              >
                {slots.map((slot) => {
                  const p = people[mod(slot, count)];
                  if (!carousel) {
                    return (
                      <SeniorCard
                        key={`p-${slot}`}
                        person={p}
                        caseField={caseField}
                        focused={false}
                        onOpen={() => openCard(slot)}
                      />
                    );
                  }
                  const d = slot - position;
                  const offscreen = d < -before || d > after;
                  const near = Math.max(0, 1 - Math.abs(d));
                  const weight = near * near * (3 - 2 * near);
                  const style = {
                    '--b3-d': String(d),
                    '--b3-scale': String(0.62 + 0.38 * weight),
                    '--b3-opacity': offscreen ? '0' : String(0.5 + 0.5 * weight),
                  } as CSSProperties;
                  return (
                    <SeniorCard
                      key={`s-${slot}`}
                      person={p}
                      caseField={caseField}
                      style={style}
                      focused={d === 0}
                      offscreen={offscreen}
                      onOpen={() => openCard(slot)}
                    />
                  );
                })}
              </div>
            </div>
            {person ? (
              // 사진이 다 넘어간 뒤 새 사람 정보가 나타나게, 사람이 바뀔 때마다 다시 그려 흐려졌다 나타난다
              <div className="b3-senior-focused" aria-live="off" key={focused}>
                {person.titles[0] ? <p className="b3-senior-focused-career">{person.titles[0]}</p> : null}
                <p className="b3-senior-focused-name">
                  <strong>{person.name}</strong>
                  <span>{person.position}</span>
                </p>
                <button type="button" onClick={() => onOpen(focused)}>
                  프로필 보기
                  <ArrowIcon direction="right" />
                </button>
              </div>
            ) : null}
            <div className="b3-senior-controls">
              <span>전체 {count}명</span>
              <div className="b3-senior-arrows">
                {count > 1 ? (
                  <button
                    type="button"
                    className="b3-senior-auto"
                    aria-label={paused ? '자동 넘김 재생' : '자동 넘김 일시정지'}
                    onClick={() => setPaused((v) => !v)}
                  >
                    {paused ? '재생' : '일시정지'}
                  </button>
                ) : null}
                {arrows('b3-senior-arrow')}
              </div>
            </div>
          </>
        ) : (
          <p className="b3-seniors-empty">현재 표시할 전문 인력 정보가 없습니다.</p>
        )}
      </div>
      <Binder3NavLinks
        previous={onPrevious ? { label: '상담 변호사로', onClick: onPrevious } : undefined}
        next={onNext ? { label: 'YK 변호사 이야기 보기', onClick: onNext } : undefined}
      />
    </section>
  );
}

/** 전문 인력 — 사건 분야에 맞는 구성원 (yk-consult-tablet `Seniors`). 카드를 누르면 상담 변호사와 같은 프로필. */
/** 강조한 사람 앞뒤로 보이는 칸. 강조는 다섯 칸 중 네 번째다. 사람이 적으면 같은 사람이 두 번 보이지 않게 줄인다. */
export function carouselReach(count: number) {
  const after = count > 1 ? 1 : 0;
  return { before: Math.max(0, Math.min(3, count - 1 - after)), after };
}

export default function Binder3Seniors({
  state,
  caseField,
  onPrevious,
  onNext,
}: {
  state: Binder3SeniorsState;
  /** 상담 사건의 홈페이지 분류. 같은 분야를 파란색으로 강조한다 */
  caseField: string;
  /** 하단 「상담 변호사로」 */
  onPrevious?: () => void;
  /** 하단 「YK 변호사 이야기 보기」 */
  onNext?: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (state.status !== 'ready') {
    return (
      <section className="b3-seniors b3-counsel-empty" aria-label="전문 인력">
        {state.status === 'loading' ? <div className="b3-counsel-loading" role="status" aria-label="불러오는 중" /> : null}
        {state.status === 'error' ? <p role="status">전문 인력 정보를 불러오지 못했습니다</p> : null}
      </section>
    );
  }
  const shown = open == null ? null : state.data[open];
  const field = caseField.trim();
  return (
    <>
      {/* 상세를 여는 동안 목록은 숨기기만 한다 — 닫으면 보던 카드 그대로 */}
      <SeniorList
        people={state.data}
        caseField={field}
        hidden={shown != null}
        onOpen={setOpen}
        onPrevious={onPrevious}
        onNext={onNext}
      />
      {shown ? (
        <Binder3Counsel
          key={`${open}-${shown.name}`}
          state={{ status: 'ready', data: shown }}
          caseField={field}
          variant="specialist"
          onBack={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}
