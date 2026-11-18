import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { getVisitBinderLawyer, type VisitBinderFirm } from 'lib/api/api-visit-binder';
import { lawyerImageUrl } from '../utils/visitConsultDisplay';
import { Binder3ArrowIcon, Binder3NoPhoto } from './binder3Common';
import Binder3Counsel, { type Binder3CounselState } from './Binder3Counsel';

export type Binder3FirmState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: VisitBinderFirm };

/** asOf `2026-11` → `(2026년 11월 기준)` */
function asOfLabel(asOf: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(asOf || '');
  return m ? `(${m[1]}년 ${Number(m[2])}월 기준)` : '';
}

/** 사진 카드 한 묶음. 법원·검찰 경력 변호사, 고문, 전문위원이 같이 쓴다. 누르면 소개 페이지(2차 내부 피드백 2·4). */
type PersonCard = {
  seq: number;
  name: string;
  photo: string | null;
  position?: string | null;
  line?: string;
};

/** 구성원이 많은 탭(서울 강남 주사무소 100명 넘게 등)은 한 쪽에 이만큼씩 나눠 보인다(시연 앱 09c4f88). 그보다 적으면 전부. */
export const FIRM_PAGE_SIZE = 24;

function PersonGrid({ rows, onOpen }: { rows: PersonCard[]; onOpen: (seq: number) => void }) {
  const [page, setPage] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const moved = useRef(false);
  // 쪽을 넘기면 새 목록의 첫 줄이 고정된 탭 바로 아래 오도록 올린다(.b3-firm-people scroll-margin-top).
  useEffect(() => {
    if (moved.current) listRef.current?.scrollIntoView?.({ block: 'start' });
  }, [page]);
  const pages = Math.ceil(rows.length / FIRM_PAGE_SIZE);
  const shown = pages > 1 ? rows.slice(page * FIRM_PAGE_SIZE, (page + 1) * FIRM_PAGE_SIZE) : rows;
  const go = (n: number) => {
    moved.current = true;
    setPage(n);
  };
  return (
    <>
      <ul className="b3-firm-people" ref={listRef}>
        {shown.map((p) => (
          <li key={`${p.seq}-${p.name}`}>
            <button type="button" className="b3-firm-person" onClick={() => onOpen(p.seq)}>
              <span className="b3-firm-ph">
                {p.photo ? <img src={lawyerImageUrl(p.photo)} alt="" /> : <Binder3NoPhoto />}
              </span>
              <strong>{p.name}</strong>
              {p.position ? <span className="b3-firm-people-pos">{p.position}</span> : null}
              {p.line ? <span className="b3-firm-people-t">{p.line}</span> : null}
            </button>
          </li>
        ))}
      </ul>
      {pages > 1 ? (
        <nav className="b3-firm-pager" aria-label="구성원 목록 쪽">
          <button
            type="button"
            className="b3-firm-pager-step"
            disabled={page === 0}
            onClick={() => go(page - 1)}
            aria-label="이전 쪽"
          >
            <Binder3ArrowIcon direction="left" />
          </button>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={i === page ? 'on' : undefined}
              aria-current={i === page ? 'page' : undefined}
              onClick={() => go(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            className="b3-firm-pager-step"
            disabled={page === pages - 1}
            onClick={() => go(page + 1)}
            aria-label="다음 쪽"
          >
            <Binder3ArrowIcon direction="right" />
          </button>
        </nav>
      ) : null}
    </>
  );
}

type FirmTab = 'bench' | 'prosecution' | 'police' | 'advisors' | 'office';

/**
 * 구성원을 탭으로 나눠 보이고(법원 → 검찰 → 경찰 경력 변호사 → 고문 및 전문위원 → 방문 지사 소속 변호사, 고재완 11-18),
 * 분야별 전문 센터는 어느 탭이든 맨 아래에 둔다. 한 사람은 탭 하나에만 나온다(서버가 나눈다).
 * 업무사례는 탭에서 빠져 사이드바 「업무사례」 화면이 됐다.
 */
function FirmDynamic({
  data,
  onOpen,
  caseField,
  office,
}: {
  data: VisitBinderFirm;
  onOpen: (seq: number) => void;
  /** 상담 사건의 홈페이지 분류(예: 성범죄). 그 분야가 든 센터 묶음을 강조한다 */
  caseField: string;
  /** 고객이 방문한 사무소(예: 수원 분사무소). 그 사무소 변호사 탭을 더한다 */
  office: string;
}) {
  const tabsId = useId();
  const officeRows = (data.offices ?? []).find((o) => o.office === office)?.people ?? [];
  const tabs = (
    [
      ['bench', '법원 경력 변호사', data.bench.length > 0],
      ['prosecution', '검찰 경력 변호사', data.prosecution.length > 0],
      ['police', '경찰 경력 변호사', (data.policeLawyers ?? []).length > 0],
      ['advisors', '고문 및 전문위원', data.advisors.length > 0 || data.police.length > 0],
      // 탭 이름은 사무소와 상관없이 같게 두고 목록만 방문 사무소에 맞춘다(고재완 11-18, 이름이 길면 어색해서)
      ['office', '방문 지사 소속 변호사', officeRows.length > 0],
    ] as const
  ).filter(([, , has]) => has);
  const [picked, setPicked] = useState<FirmTab>('bench');
  const tab: FirmTab | undefined = tabs.some(([key]) => key === picked) ? picked : tabs[0]?.[0];

  return (
    <>
      {tab ? (
        <>
          <div className="b3-firm-tabs" role="tablist" aria-label="법무법인 YK 구성원">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`${tabsId}-${key}`}
                aria-selected={tab === key}
                aria-controls={`${tabsId}-${key}-panel`}
                className={tab === key ? 'on' : undefined}
                onClick={() => setPicked(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <section
            className="b3-firm-tabpanel"
            role="tabpanel"
            key={tab}
            id={`${tabsId}-${tab}-panel`}
            aria-labelledby={`${tabsId}-${tab}`}
          >
            {tab === 'bench' ? (
              <PersonGrid rows={data.bench.map((p) => ({ ...p, line: p.title }))} onOpen={onOpen} />
            ) : null}
            {tab === 'prosecution' ? (
              <PersonGrid
                rows={data.prosecution.map((p) => ({ ...p, line: p.title }))}
                onOpen={onOpen}
              />
            ) : null}
            {tab === 'police' ? (
              <PersonGrid
                rows={(data.policeLawyers ?? []).map((p) => ({ ...p, line: p.title }))}
                onOpen={onOpen}
              />
            ) : null}
            {tab === 'advisors' ? (
              // 고문과 경찰 경력 전문위원을 한 목록으로(고재완 11-18, 두 묶음으로 나눈 것이 어색했다).
              // 다른 탭처럼 카드에 직함과 경력 줄을 두고, 고문 → 전문위원, 각각 홈페이지 순서.
              <PersonGrid
                rows={[
                  ...data.advisors.map((a) => ({
                    seq: a.seq,
                    name: a.name,
                    photo: a.photo,
                    position: '고문',
                    line: a.label,
                  })),
                  ...data.police.map((a) => ({
                    seq: a.seq,
                    name: a.name,
                    photo: a.photo,
                    position: '전문위원',
                    line: '경찰 경력',
                  })),
                ]}
                onOpen={onOpen}
              />
            ) : null}
            {tab === 'office' ? (
              <PersonGrid rows={officeRows.map((p) => ({ ...p, line: p.title }))} onOpen={onOpen} />
            ) : null}
          </section>
        </>
      ) : null}

      {data.centerGroups.length > 0 && (
        <section className="b3-firm-sec" aria-labelledby="b3-firm-centers">
          <h4 id="b3-firm-centers">분야별 전문 센터</h4>
          {/* 분야 묶음마다 카드. 상담 사건 분야가 속한 묶음은 강조하고, 업무 분야가 사건 분야와 같은 센터 칩만 칠한다.
              시연 앱은 센터 이름에 분야 앞 두 글자가 들었는지로 골라 「형사」 사건에 교통형사센터까지 켜졌다. */}
          <div className="b3-firm-centers">
            {data.centerGroups.map((g) => {
              const related = caseField !== '' && (g.fields ?? []).includes(caseField);
              return (
                <section
                  key={g.title}
                  className={`b3-firm-center-group${related ? ' related' : ''}`}
                  aria-label={g.title}
                >
                  <header className="b3-firm-center-head">
                    <p className="b3-firm-group-t">{g.title}</p>
                    <span className="b3-firm-center-count">센터 {g.centers.length}곳</span>
                  </header>
                  {related ? <p className="b3-firm-center-badge">이 사건과 관련된 분야</p> : null}
                  <ul>
                    {g.centers.map((c, i) => (
                      <li
                        key={c}
                        className={related && g.centerFields?.[i] === caseField ? 'hit' : undefined}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

/** 법무법인 YK 소개 (yk-consult-tablet `FirmIntro`). 고객마다 같은 공통 화면이다. */
export default function Binder3Firm({
  state,
  onNext,
  caseField = '',
  office = '',
}: {
  state: Binder3FirmState;
  onNext: () => void;
  /** 상담 사건의 홈페이지 분류. 구성원 소개 페이지에서 같은 분야를 표시한다 */
  caseField?: string;
  /** 고객이 방문한 사무소. 그 사무소 변호사 탭을 더한다 */
  office?: string;
}) {
  const data = state.status === 'ready' ? state.data : null;
  // 카드에서 연 구성원. 여는 동안 소개 목록은 숨기기만 해 보던 위치를 지킨다.
  const [openSeq, setOpenSeq] = useState<number | null>(null);
  const [profile, setProfile] = useState<Binder3CounselState>({ status: 'loading' });
  const openMember = useCallback((seq: number) => {
    setProfile({ status: 'loading' });
    setOpenSeq(seq);
  }, []);
  const closeMember = useCallback(() => setOpenSeq(null), []);
  useEffect(() => {
    if (openSeq == null) return undefined;
    let alive = true;
    getVisitBinderLawyer(openSeq)
      .then((row) => alive && setProfile({ status: 'ready', data: row }))
      .catch(() => alive && setProfile({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, [openSeq]);
  const field = caseField.trim();
  const stats = data
    ? [
        { label: '구성원 변호사·고문·위원', n: data.stats.members, unit: '명' },
        { label: '전국 사무소', n: data.stats.offices, unit: '곳' },
        { label: '분야별 전문 센터', n: data.stats.centers, unit: '개' },
      ]
    : [];
  const asOf = data ? asOfLabel(data.stats.asOf) : '';

  return (
    <>
      <section className="b3-firm" hidden={openSeq != null}>
        <div className="b3-firm-body">
          <header className="b3-firm-hero">
            <h3>
              <span className="b3-firm-headline-lead">고객중심 법률파트너</span>법무법인 YK
            </h3>
            <p className="b3-firm-en">People. Promise. Performance.</p>
            {data ? (
              <>
                <dl className="b3-firm-stats">
                  {stats.map((x) => (
                    <div key={x.label}>
                      <dt>{x.label}</dt>
                      <dd>
                        <strong>{x.n.toLocaleString('ko-KR')}</strong>
                        <span>{x.unit}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                {asOf ? <p className="b3-firm-note">{asOf}</p> : null}
              </>
            ) : null}
            {state.status === 'error' ? (
              <p className="b3-firm-error" role="status">
                정보를 불러오지 못했습니다
              </p>
            ) : null}
          </header>

          {data ? (
            <FirmDynamic data={data} onOpen={openMember} caseField={field} office={office.trim()} />
          ) : null}

          <div className="b3-firm-next">
            <button type="button" onClick={onNext}>
              <span>사건 요약 보기</span>
              <Binder3ArrowIcon direction="right" />
            </button>
          </div>
        </div>
      </section>
      {openSeq != null ? (
        <Binder3Counsel
          key={openSeq}
          state={profile}
          caseField={caseField}
          variant="member"
          onBack={closeMember}
          backLabel="법무법인 YK 소개"
        />
      ) : null}
    </>
  );
}
