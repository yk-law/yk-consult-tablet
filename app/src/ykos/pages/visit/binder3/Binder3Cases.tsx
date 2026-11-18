import { useState } from 'react';
import type { VisitBinderCaseBody, VisitBinderRelatedCase } from 'lib/api/api-visit-binder';
import { Binder3ArrowIcon, Binder3NavLinks } from './binder3Common';
import Binder3CaseModal from './Binder3CaseModal';

const FIRM_CASES_STEP = 5;

/**
 * 업무사례 줄 목록: 상담 사건 분야의 홈페이지 업무사례(시연 앱 FirmCases). 5건씩 「더 보기」로 늘리고,
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
 * 업무사례 화면 — 사이드바 「전문 인력」 자리(고재완 11-18, 2차 내부 시연 피드백). YK 소개에 있던 업무사례 탭을 그대로 옮겼다.
 * 이 사건 분야의 홈페이지 업무사례만 둔다. 줄을 누르면 업무 사례 창(홈페이지 사례 본문)을 연다.
 */
export default function Binder3Cases({
  cases,
  caseBodies,
  caseField,
  loading = false,
  onPrevious,
  onNext,
}: {
  /** 바인더를 열 때 받아 둔 사례 중 본문을 받은 것(Gemma 가 상담과 비슷한 사례를 앞에 둔다) */
  cases: VisitBinderRelatedCase[];
  caseBodies?: Record<number, VisitBinderCaseBody>;
  /** 상담 사건의 홈페이지 분류(예: 형사) */
  caseField: string;
  /** 사례 본문을 아직 받는 중 */
  loading?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const [openCase, setOpenCase] = useState<VisitBinderRelatedCase | null>(null);
  const label = caseField.trim();
  return (
    <>
      <section className="b3-firm b3-cases" aria-label="업무사례">
        <div className="b3-firm-body">
          <h2 className="b3-cases-title">
            {label ? `${label} 사건에서 YK가 함께한 사례입니다.` : 'YK가 함께한 비슷한 사례입니다.'}
          </h2>
          {cases.length > 0 ? (
            <FirmCases rows={cases} label={label} onOpen={setOpenCase} />
          ) : (
            <p className="b3-cases-empty" role="status">
              {loading
                ? '업무사례를 불러오고 있습니다.'
                : '이 사건 분야의 업무사례가 아직 없습니다.'}
            </p>
          )}
          <Binder3NavLinks
            previous={onPrevious ? { label: '상담 변호사로', onClick: onPrevious } : undefined}
            next={onNext ? { label: 'YK 변호사 이야기 보기', onClick: onNext } : undefined}
          />
        </div>
      </section>
      {openCase ? (
        <Binder3CaseModal
          caseId={openCase.id}
          title={openCase.title}
          body={caseBodies?.[openCase.id]}
          onClose={() => setOpenCase(null)}
        />
      ) : null}
    </>
  );
}
