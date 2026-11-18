import { useCallback, useEffect, useId, useState } from 'react';
import {
  getVisitBinderLawyer,
  type VisitBinderCaseBody,
  type VisitBinderFirm,
  type VisitBinderRelatedCase,
} from 'lib/api/api-visit-binder';
import { lawyerImageUrl } from '../utils/visitConsultDisplay';
import { Binder3ArrowIcon, Binder3NoPhoto } from './binder3Common';
import Binder3CaseModal from './Binder3CaseModal';
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

function PersonGrid({ rows, onOpen }: { rows: PersonCard[]; onOpen: (seq: number) => void }) {
  return (
    <ul className="b3-firm-people">
      {rows.map((p) => (
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
  );
}

type FirmTab = 'bench' | 'prosecution' | 'advisors' | 'cases';

const FIRM_CASES_STEP = 5;

/**
 * 업무사례 탭: 상담 사건 분야의 홈페이지 업무사례 줄 목록(시연 앱 FirmCases). 5건씩 「더 보기」로 늘리고,
 * 줄을 누르면 관련 업무 사례와 같은 업무 사례 창을 연다(2차 내부 피드백 7).
 */
function FirmCases({
  rows,
  label,
  onOpen,
}: {
  rows: VisitBinderRelatedCase[];
  label: string;
  onOpen: (row: VisitBinderRelatedCase) => void;
}) {
  const [shown, setShown] = useState(FIRM_CASES_STEP);
  const left = rows.length - shown;
  return (
    <>
      <p className="b3-firm-cases-count">
        {label} 업무사례 <b>{rows.length}건</b>
      </p>
      <ul className="b3-firm-cases">
        {rows.slice(0, shown).map((c) => (
          <li key={c.id}>
            <button type="button" className="b3-firm-case" onClick={() => onOpen(c)}>
              {c.result ? <span className="b3-firm-case-result">{c.result}</span> : <span />}
              <span className="b3-firm-case-main">
                <span className="b3-firm-case-meta">
                  {[c.category, c.role].filter(Boolean).join(' · ')}
                </span>
                <strong>{c.title}</strong>
                {c.sub ? <span className="b3-firm-case-sub">{c.sub}</span> : null}
              </span>
              <span className="b3-firm-case-side">
                {c.lawyers.length ? <span>{c.lawyers.join(' · ')} 변호사</span> : null}
                {c.date ? <span className="b3-firm-case-date">{c.date}</span> : null}
              </span>
              <Binder3ArrowIcon direction="right" />
            </button>
          </li>
        ))}
      </ul>
      {left > 0 ? (
        <button
          type="button"
          className="b3-firm-cases-more"
          onClick={() => setShown((n) => n + FIRM_CASES_STEP)}
        >
          업무사례 더 보기 <span>{left}건</span>
        </button>
      ) : null}
    </>
  );
}

/**
 * 구성원을 탭 3개(법원 경력 변호사 / 검찰 경력 변호사 / 고문 및 전문위원)로 나눠 보이고,
 * 분야별 전문 센터는 어느 탭이든 맨 아래에 둔다(yk-consult-tablet 시연 앱 ea4ddbe, 2차 내부 피드백 7).
 * 업무사례 탭은 서버 작업이 필요해 다음 단계로 미뤘다.
 */
function FirmDynamic({
  data,
  onOpen,
  caseField,
  cases,
  onOpenCase,
}: {
  data: VisitBinderFirm;
  onOpen: (seq: number) => void;
  /** 업무사례 탭 목록. 비어 있으면 탭을 두지 않는다 */
  cases: VisitBinderRelatedCase[];
  onOpenCase: (row: VisitBinderRelatedCase) => void;
  /** 상담 사건의 홈페이지 분류(예: 성범죄). 그 분야가 든 센터 묶음을 강조한다 */
  caseField: string;
}) {
  const tabsId = useId();
  const tabs = (
    [
      ['bench', '법원 경력 변호사', data.bench.length > 0],
      ['prosecution', '검찰 경력 변호사', data.prosecution.length > 0],
      ['advisors', '고문 및 전문위원', data.advisors.length > 0 || data.police.length > 0],
      ['cases', '업무사례', cases.length > 0],
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
            {tab === 'advisors' ? (
              <>
                <p className="b3-firm-sec-lead">
                  정부기관·경찰·입법 분야의 실무 경험을 바탕으로, 사안 검토에 필요한 전문적 관점을
                  더합니다.
                </p>
                {data.advisors.length > 0 ? (
                  <div className="b3-firm-subgroup">
                    <h5>고문</h5>
                    <PersonGrid
                      rows={data.advisors.map((a) => ({
                        seq: a.seq,
                        name: a.name,
                        photo: a.photo,
                        position: '고문',
                        line: a.label,
                      }))}
                      onOpen={onOpen}
                    />
                  </div>
                ) : null}
                {data.police.length > 0 ? (
                  <div className="b3-firm-subgroup">
                    <h5>경찰 경력 전문위원</h5>
                    <PersonGrid
                      rows={data.police.map((a) => ({
                        seq: a.seq,
                        name: a.name,
                        photo: a.photo,
                        position: '전문위원',
                      }))}
                      onOpen={onOpen}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
            {tab === 'cases' ? (
              <FirmCases rows={cases} label={caseField} onOpen={onOpenCase} />
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
  cases = [],
  caseBodies,
}: {
  state: Binder3FirmState;
  onNext: () => void;
  /** 상담 사건의 홈페이지 분류. 구성원 소개 페이지에서 같은 분야를 표시한다 */
  caseField?: string;
  /**
   * 업무사례 탭 목록(바인더를 열 때 미리 받아 둔다, Gemma 가 상담과 비슷한 사례를 앞에 둔다).
   * 비어 있으면 탭을 두지 않는다.
   */
  cases?: VisitBinderRelatedCase[];
  /** 미리 받아 둔 사례 본문. 없는 사례는 창이 연 뒤에 받는다 */
  caseBodies?: Record<number, VisitBinderCaseBody>;
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
  // 업무사례 탭에서 연 사례(업무 사례 창)
  const [openCase, setOpenCase] = useState<VisitBinderRelatedCase | null>(null);
  const closeCase = useCallback(() => setOpenCase(null), []);
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
            <FirmDynamic
              data={data}
              onOpen={openMember}
              caseField={field}
              cases={cases}
              onOpenCase={setOpenCase}
            />
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
      {openCase ? (
        <Binder3CaseModal
          caseId={openCase.id}
          title={openCase.title}
          body={caseBodies?.[openCase.id]}
          onClose={closeCase}
        />
      ) : null}
    </>
  );
}
