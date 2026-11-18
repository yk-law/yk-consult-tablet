import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { VisitBinderCounsel } from 'lib/api/api-visit-binder';
import { lawyerImageUrl } from '../utils/visitConsultDisplay';
import { isCaseVisible, useBinder3CaseBodiesContext } from './binder3CaseBodies';
import Binder3CaseModal from './Binder3CaseModal';
import { Binder3ArrowIcon, Binder3NoPhoto, Binder3WelcomeBackdrop } from './binder3Common';
import { greetingOf } from './binder3Greeting';
import { specialistHero } from './binder3SeniorText';

export type Binder3CounselState =
  | { status: 'none' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: VisitBinderCounsel };

/** counsel: 상담 변호사, specialist: 전문 인력 상세, member: 법무법인 YK 소개 카드에서 연 구성원 */
export type Binder3CounselVariant = 'counsel' | 'specialist' | 'member';

const CAREER_PREVIEW = 10;

type IndexItem = { id: string; label: string; group: boolean };

/** 관련 업무 사례는 이만큼만 보인다 */
const MAX_SHOWN_WORKS = 8;

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={up ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 7h10v10M7 17 17 7" />
    </svg>
  );
}

export function Binder3Photo({ data, className }: { data: VisitBinderCounsel; className: string }) {
  const src = data.photo ? lawyerImageUrl(data.photo) : '';
  return (
    <div className={className}>
      {src ? <img src={src} alt={`${data.name} ${data.position}`} /> : <Binder3NoPhoto />}
    </div>
  );
}

/** 업무 분야 태그. 상담 사건의 홈페이지 분류와 이름이 같은 분야만 파란색으로 강조한다. */
export function Binder3FieldKeywords({
  fields,
  caseField,
  limit,
}: {
  fields: string[];
  caseField: string;
  limit?: number;
}) {
  return (
    <ul className="b3-field-keywords">
      {fields.slice(0, limit).map((field) => (
        <li
          key={field}
          className={caseField && field.trim() === caseField ? 'case-related' : undefined}
        >
          <span>{field}</span>
        </li>
      ))}
    </ul>
  );
}

function ListSection({
  title,
  items,
  className,
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <section className={`b3-detail-sub${className ? ` ${className}` : ''}`}>
      <h4>{title}</h4>
      <ul className="b3-clist">
        {items.map((text, i) => (
          <li key={`${i}-${text}`}>{text}</li>
        ))}
      </ul>
    </section>
  );
}

function CareerSection({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  if (!items.length) return null;
  const hasMore = items.length > CAREER_PREVIEW;
  return (
    <section className="b3-detail-sub b3-counsel-career">
      <h4>주요 경력</h4>
      <ul className="b3-clist" id={listId}>
        {(expanded ? items : items.slice(0, CAREER_PREVIEW)).map((text, i) => (
          <li key={`${i}-${text}`}>{text}</li>
        ))}
      </ul>
      {hasMore ? (
        <button
          className="b3-career-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
        >
          <span>
            {expanded ? (
              '경력 접기'
            ) : (
              <>
                경력 더 보기{' '}
                <span className="b3-career-toggle-count">({items.length - CAREER_PREVIEW}개)</span>
              </>
            )}
          </span>
          <ChevronIcon up={expanded} />
        </button>
      ) : null}
    </section>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode[] }) {
  if (!children.some(Boolean)) return null;
  return (
    <section className="b3-detail-group">
      <h3>{title}</h3>
      <div className="b3-detail-group-body">{children}</div>
    </section>
  );
}

function CounselProfile({
  data,
  caseField,
  initialScrollTop,
  onScrollChange,
  variant,
  onBack,
  backLabel,
  onPrevious,
  onNext,
  greeting,
}: {
  data: VisitBinderCounsel;
  /** 이름 위 인사말. 없으면 홈페이지 인사말, 그것도 없으면 후보 문구(binder3Greeting) */
  greeting?: string;
  caseField: string;
  initialScrollTop: number;
  onScrollChange?: (scrollTop: number) => void;
  variant: Binder3CounselVariant;
  onBack?: () => void;
  backLabel: string;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const specialist = variant === 'specialist';
  // 상담에 고문·전문위원도 함께한다(2차 내부 피드백 8). 직급이 변호사 계열이 아니면 그 직급으로 부른다.
  const lawyer = !data.position || data.position.includes('변호사');
  const member = variant === 'member';
  const hero = specialist
    ? specialistHero(data)
    : { greeting: greeting ?? greetingOf(data), titles: data.titles };
  const paneRef = useRef<HTMLElement>(null);
  const onScrollChangeRef = useRef(onScrollChange);
  onScrollChangeRef.current = onScrollChange;

  // 페이지가 새로 읽혔을 때 보던 자리로 되돌린다(처음 그릴 때 한 번).
  useEffect(() => {
    if (paneRef.current && initialScrollTop > 0) paneRef.current.scrollTop = initialScrollTop;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 처음 그릴 때의 저장 위치만 쓴다
  }, []);
  const heroRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const indexId = useId();
  const [heroHidden, setHeroHidden] = useState(false);
  const caseBodies = useBinder3CaseBodiesContext();
  const [openWork, setOpenWork] = useState<{ id: number; title: string } | null>(null);
  const [indexItems, setIndexItems] = useState<IndexItem[]>([]);

  // 히어로가 화면 위로 사라지면 왼쪽 프로필 카드·목차를 띄운다(프로토타입 counsel-profile-card).
  useEffect(() => {
    const pane = paneRef.current;
    const hero = heroRef.current;
    if (!pane || !hero || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroHidden(
          !entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0)
        );
      },
      { root: pane, threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [data]);

  // 목차: 묶음 제목(h3)과 소제목(h4). 누르면 그곳으로 이동만 한다.
  // 현재 위치는 표시하지 않는다 — 이력이 짧으면 표시가 연달아 바뀌어 거슬렸다(2차 내부 피드백 3).
  useEffect(() => {
    const pane = paneRef.current;
    const details = detailsRef.current;
    if (!pane || !details) return undefined;
    const headings = [
      ...details.querySelectorAll<HTMLElement>('.b3-detail-group > h3, .b3-detail-sub > h4'),
    ];
    const items = headings.map((el, i) => {
      el.id = `${indexId}-${i}`;
      return { id: el.id, label: el.textContent || '', group: el.tagName === 'H3', el };
    });
    setIndexItems(items.map(({ id, label, group }) => ({ id, label, group })));
    const update = () => {
      pane.style.setProperty('--b3-counsel-scroll-height', `${pane.clientHeight}px`);
    };
    update();
    const onScroll = () => {
      update();
      onScrollChangeRef.current?.(pane.scrollTop);
    };
    pane.addEventListener('scroll', onScroll, { passive: true });
    return () => pane.removeEventListener('scroll', onScroll);
  }, [data, indexId]);

  const goToSection = (id: string) => {
    const pane = paneRef.current;
    const target = pane?.querySelector<HTMLElement>(`[id="${id}"]`);
    if (!pane || !target) return;
    const top =
      pane.scrollTop + target.getBoundingClientRect().top - pane.getBoundingClientRect().top - 24;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    pane.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  };

  // 학력·자격은 이름 아래가 아니라 이력 사항 맨 아래(고재완 11-18, 2차 내부 시연 피드백).
  // 홈페이지 학력 줄에 시험·연수원이 이미 있으면 한 번만 보인다(시연 앱 93a26e6).
  const qualification = data.qualification?.trim() ?? '';
  const education = [
    ...data.education,
    ...(qualification && !data.education.some((line) => line.includes(qualification))
      ? [qualification]
      : []),
  ];
  const visibleWorks = data.works
    .filter((work) => isCaseVisible(caseBodies, work))
    .slice(0, MAX_SHOWN_WORKS);
  const works = visibleWorks.length ? (
    <section className="b3-detail-sub b3-counsel-works" key="works">
      <h4>관련 업무 사례</h4>
      <ul className="b3-clist">
        {visibleWorks.map((work, i) => (
          <li key={`${i}-${work.title}`}>
            {work.href ? (
              <button type="button" className="b3-case-link" onClick={() => setOpenWork(work)}>
                <span>{work.title}</span>
                <ArrowUpRightIcon />
              </button>
            ) : (
              <span>{work.title}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  return (
    <section
      className="b3-counsel"
      ref={paneRef}
      aria-label={specialist ? '전문 인력 프로필' : member ? '구성원 프로필' : '상담 변호사'}
    >
      <div className="b3-counsel-hero" ref={heroRef}>
        <Binder3WelcomeBackdrop className="b3-counsel-backdrop" />
        <div className="b3-counsel-lead">
          <Binder3Photo data={data} className="b3-counsel-photo" />
          <div className="b3-counsel-ident">
            {hero.greeting ? <p className="b3-counsel-quote">{hero.greeting}</p> : null}
            {hero.greeting ? <div className="b3-counsel-divider" aria-hidden="true" /> : null}
            {hero.titles.length ? (
              <div className="b3-counsel-titles">
                {hero.titles.map((title, i) => (
                  <span key={`${i}-${title}`}>{title}</span>
                ))}
              </div>
            ) : null}
            <div className="b3-counsel-who">
              <strong>{data.name}</strong>
              <em>{data.position}</em>
            </div>
          </div>
        </div>
      </div>

      <div className="b3-counsel-layout">
        <aside
          className={`b3-counsel-card${heroHidden ? ' is-visible' : ''}`}
          aria-hidden={!heroHidden}
          aria-label={specialist ? '전문 인력 프로필 요약' : '상담 변호사 프로필'}
        >
          <Binder3Photo data={data} className="b3-counsel-card-photo" />
          <div className="b3-counsel-card-content">
            <div className="b3-counsel-card-identity">
              <strong>{data.name}</strong>
              <span>{data.position}</span>
            </div>
            {indexItems.length ? (
              <nav className="b3-counsel-index" aria-label="소개 목차">
                {indexItems.map((item) =>
                  item.group ? (
                    <p key={item.id} className="b3-index-group">
                      {item.label}
                    </p>
                  ) : (
                    <button
                      key={item.id}
                      type="button"
                      className="b3-index-section"
                      aria-controls={item.id}
                      tabIndex={heroHidden ? 0 : -1}
                      onClick={() => goToSection(item.id)}
                    >
                      {item.label}
                    </button>
                  )
                )}
              </nav>
            ) : null}
          </div>
        </aside>

        <div className="b3-counsel-details" ref={detailsRef}>
          <header className="b3-counsel-intro">
            <h2>
              {specialist
                ? '다양한 경험을 갖춘 전문 인력을 소개합니다.'
                : member
                ? '법무법인 YK 구성원을 소개합니다.'
                : lawyer
                ? '고객님과 함께할 변호사를 소개합니다.'
                : '고객님과 함께할 분을 소개합니다.'}
            </h2>
            <p>
              {specialist || member || !lawyer
                ? `${data.name} ${data.position}`
                : `${data.name} 변호사`}
              의 주요 업무 분야와 이력을 정리했습니다.
              <br />
              고객님의 상황과 관련된 경험과 사례를 살펴보세요.
            </p>
          </header>
          <DetailGroup title="업무 분야 및 사례">
            {[
              data.fields.length ? (
                <section className="b3-detail-sub" key="fields">
                  <h4>주요 업무 분야</h4>
                  <Binder3FieldKeywords fields={data.fields} caseField={caseField} />
                </section>
              ) : null,
              data.performance.length ? (
                <ListSection
                  key="performance"
                  title="주요 업무 실적"
                  items={data.performance}
                  className="b3-counsel-results"
                />
              ) : null,
              works,
            ]}
          </DetailGroup>
          <DetailGroup title="이력 사항">
            {[
              data.career.length ? <CareerSection key="career" items={data.career} /> : null,
              data.awards.length ? (
                <ListSection key="awards" title="수상 내역" items={data.awards} />
              ) : null,
              data.papers.length ? (
                <ListSection key="papers" title="논문·저서" items={data.papers} />
              ) : null,
              education.length ? (
                <ListSection key="education" title="학력" items={education} />
              ) : null,
            ]}
          </DetailGroup>
          {onPrevious || onNext || onBack ? (
            <div className="b3-counsel-links">
              {onPrevious ? (
                <button type="button" className="b3-counsel-previous" onClick={onPrevious}>
                  <Binder3ArrowIcon direction="left" />
                  <span>사건 요약으로</span>
                </button>
              ) : onBack ? (
                // 전문 인력 상세: 목록으로 돌아가는 버튼은 하단 왼쪽 플로팅 하나다(1차 내부 피드백 1).
                <button type="button" className="b3-counsel-previous" onClick={onBack}>
                  <Binder3ArrowIcon direction="left" />
                  <span>{backLabel}</span>
                </button>
              ) : null}
              {onNext ? (
                <button type="button" className="b3-counsel-next" onClick={onNext}>
                  <span>업무사례 보기</span>
                  <Binder3ArrowIcon direction="right" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {openWork ? (
        <Binder3CaseModal
          caseId={openWork.id}
          title={openWork.title}
          body={caseBodies?.bodies[openWork.id]}
          onClose={() => setOpenWork(null)}
        />
      ) : null}
    </section>
  );
}

/** 상담 변호사 — 상담실장이 YK-OS 에서 고른 변호사의 프로필 (yk-consult-tablet `Counsel`). */
export default function Binder3Counsel({
  state,
  caseField = '',
  initialScrollTop = 0,
  onScrollChange,
  variant = 'counsel',
  onBack,
  backLabel = '전문 인력 목록',
  onPrevious,
  onNext,
  greeting,
}: {
  state: Binder3CounselState;
  /** 상담에 함께하는 분끼리 겹치지 않게 고른 인사말(teamGreetings). 없으면 그 사람 것 */
  greeting?: string;
  /** 상담 사건의 홈페이지 분류 (예: 성범죄). 없으면 빈 문자열 */
  caseField?: string;
  /** 되돌릴 스크롤 위치(페이지가 새로 읽혔을 때) */
  initialScrollTop?: number;
  onScrollChange?: (scrollTop: number) => void;
  /** specialist: 전문 인력 상세 (머리말·히어로 문구만 다르다) */
  variant?: Binder3CounselVariant;
  /** 있으면 하단 왼쪽 돌아가기(전문 인력 상세·소개 카드에서 연 구성원) */
  onBack?: () => void;
  /** 돌아가기 글자. 기본 「전문 인력 목록」 */
  backLabel?: string;
  /** 있으면 하단 「사건 요약으로」 */
  onPrevious?: () => void;
  /** 있으면 하단 「업무사례 보기」 */
  onNext?: () => void;
}) {
  if (state.status === 'ready') {
    return (
      <CounselProfile
        data={state.data}
        greeting={greeting}
        caseField={caseField.trim()}
        initialScrollTop={initialScrollTop}
        onScrollChange={onScrollChange}
        variant={variant}
        onBack={onBack}
        backLabel={backLabel}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    );
  }
  const member = variant === 'member';
  return (
    <section
      className="b3-counsel b3-counsel-empty"
      aria-label={member ? '구성원 프로필' : '상담 변호사'}
    >
      {state.status === 'loading' ? (
        <div className="b3-counsel-loading" role="status" aria-label="불러오는 중" />
      ) : null}
      {state.status === 'error' ? (
        <p role="status">
          {member ? '구성원 정보를 불러오지 못했습니다' : '상담 변호사 정보를 불러오지 못했습니다'}
        </p>
      ) : null}
      {state.status === 'none' ? <p>오늘 상담 변호사가 지정되지 않았습니다.</p> : null}
      {/* 불러오는 중·실패에도 돌아갈 길을 남긴다(소개 카드에서 연 구성원) */}
      {member && onBack ? (
        <div className="b3-counsel-links">
          <button type="button" className="b3-counsel-previous" onClick={onBack}>
            <Binder3ArrowIcon direction="left" />
            <span>{backLabel}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
