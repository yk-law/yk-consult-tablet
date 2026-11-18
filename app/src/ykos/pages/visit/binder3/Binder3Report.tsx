import { Binder3ArrowIcon } from './binder3Common';
import {
  BINDER3_PARTY_COMMON,
  applyParty,
  findTopic,
  initialParty,
  partyChoices,
  type Binder3Topic,
  type Binder3TopicTable,
} from './binder3Topics';

export type Binder3ReportState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; table: Binder3TopicTable };

/** 지위를 고객 말로 묻는다. 법률 용어는 화면에 쓰지 않는다. */
const PARTY_ASK: Record<string, string> = {
  피의자: '수사를 받고 있거나 연락을 받았어요',
  피고인: '재판을 받고 있어요',
  피해자: '피해를 입었어요',
  원고: '상대방에게 청구하려고 해요',
  피고: '소장이나 청구를 받았어요',
};

/** 「중분류 > 소분류」. 소분류가 중분류와 같거나 「기타」면 고객에게 더 알려 주는 것이 없어 뺀다. */
function reportFieldLabel(middle: string, small: string): string {
  if (!small || small === middle || (middle && small === '기타')) return middle;
  return middle ? `${middle} > ${small}` : small;
}

function PartyAsk({
  choices,
  chosen,
  onParty,
}: {
  choices: string[];
  chosen: string | null;
  onParty: (party: string) => void;
}) {
  const option = (party: string, label: string, skip = false) => {
    const picked = chosen === party;
    return (
      <button
        type="button"
        key={party}
        className={[skip ? 'skip' : '', picked ? 'on' : ''].filter(Boolean).join(' ') || undefined}
        aria-pressed={picked}
        onClick={() => onParty(party)}
      >
        {label}
      </button>
    );
  };
  return (
    <section className="b3-report-party">
      <h3>어떤 경우에 해당하시나요?</h3>
      <p>고르시면 그에 맞는 내용으로 보여드립니다. 모르시면 넘어가셔도 됩니다.</p>
      <div className="b3-report-party-options">
        {choices.map((party) => option(party, PARTY_ASK[party] ?? party))}
        {option(BINDER3_PARTY_COMMON, '잘 모르겠어요', true)}
      </div>
    </section>
  );
}

function TopicSections({
  topic,
  textOf,
  differentCount,
}: {
  topic: Binder3Topic;
  textOf: (step: number) => string | null;
  differentCount: number;
}) {
  const cases = topic.cases ?? [];
  const ask = differentCount > 0 ? [`앞에서 다르다고 하신 부분(${differentCount}건)`, ...topic.ask] : topic.ask;
  const pairCount = (ask.length > 0 ? 1 : 0) + (topic.bring.length > 0 ? 1 : 0);
  return (
    <>
      {topic.steps.length > 0 && (
        <section className="b3-report-section">
          <h3>상담에서 함께 볼 내용</h3>
          <ol className="b3-report-steps">
            {topic.steps.map(([title, text], index) => (
              <li key={title}>
                <span className="n">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h4>{title}</h4>
                  <p>{textOf(index) ?? text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      {topic.flow.length > 0 && (
        <section className="b3-report-section">
          <h3>일반적인 진행 순서</h3>
          <ol className="b3-report-flow">
            {topic.flow.map(([title, text], index) => (
              <li key={title}>
                <span className="n">{index + 1}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <p className="b3-report-flow-note">실제 절차와 기간은 사건마다 다르며, 선임 계약 후 담당 변호사가 다시 안내합니다.</p>
        </section>
      )}
      {pairCount > 0 && (
        <div className={`b3-report-pair${pairCount === 1 ? ' one' : ''}`}>
          {ask.length > 0 && (
            <section>
              <h3>상담에서 여쭤볼 내용</h3>
              <ul>
                {ask.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {topic.bring.length > 0 && (
            <section>
              <h3>가지고 계시면 도움이 되는 자료</h3>
              <ul>
                {topic.bring.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="b3-report-note">지금 없으셔도 괜찮습니다. 상담 후에 보내주셔도 됩니다.</p>
            </section>
          )}
        </div>
      )}
      {cases.length > 0 && (
        <section className="b3-report-section">
          <h3>YK가 함께한 비슷한 사례</h3>
          <ul className={`b3-report-cases${cases.length === 1 ? ' one' : ''}`}>
            {cases.map((item) => (
              <li key={item.t ?? item.s}>
                {item.tag ? <span className="tag">{item.tag}</span> : null}
                {item.t ? <strong>{item.t}</strong> : null}
                {item.s ? <p>{item.s}</p> : null}
                {item.r ? <span className="result">{item.r}</span> : null}
              </li>
            ))}
          </ul>
          <p className="b3-report-note">
            법무법인 YK 홈페이지 업무사례에서 골랐습니다. 사건마다 사정이 달라 결과도 다를 수 있습니다.
          </p>
        </section>
      )}
    </>
  );
}

/** 사건 요약 2뎁스 — 같은 사건 종류의 상담에서 많이 확인하는 내용. 개인화는 사건 종류와 지위까지만 한다. */
export default function Binder3Report({
  state,
  small,
  middle,
  party,
  suggestedParty = '',
  onParty,
  stepText,
  differentCount = 0,
  previousLabel,
  onPrevious,
  onNext,
}: {
  state: Binder3ReportState;
  small: string;
  middle: string;
  party: string | null;
  /** 콜 내용으로 고른 지위. 고객이 고르기 전까지 쓴다 */
  suggestedParty?: string;
  onParty: (party: string) => void;
  /** 그 지위·안내 항목의 고객 맞춤 설명. 없으면 템플릿 원문을 보인다 */
  stepText?: (role: string, step: number) => string | null;
  /** 1뎁스에서 「아니오」로 답한 문항 수 */
  differentCount?: number;
  previousLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const base = state.status === 'ready' ? findTopic(state.table, small, middle) : null;
  const choices = base ? partyChoices(base) : [];
  // 저장된 지위가 이 사건 템플릿에 없으면 고르지 않은 것으로 본다.
  const saved = party && (party === BINDER3_PARTY_COMMON || choices.includes(party)) ? party : null;
  const chosen = saved ?? (choices.includes(suggestedParty) ? suggestedParty : null);
  const role = base ? chosen ?? initialParty(base) : '';
  const topic = base ? applyParty(base, role) : null;
  const field = reportFieldLabel(middle, small);

  return (
    <section className="b3-report" aria-label="사건 요약">
      <div className="b3-report-body">
        {state.status === 'error' ? <p className="b3-report-message">내용을 불러오지 못했습니다</p> : null}
        {topic ? (
          <>
            <h2>오늘 상담에서 함께 볼 내용입니다.</h2>
            <p className="b3-report-lead">
              같은 고민으로 찾아오신 분들이 상담에서 많이 확인하신 내용입니다.
              <br />
              정리해서 오실 필요는 없습니다. 이 순서로 편하게 말씀 나누시면 됩니다.
            </p>
            {field ? (
              <div className="b3-report-field">
                <span>상담 분야</span>
                <strong>{field}</strong>
              </div>
            ) : null}
            {choices.length >= 2 ? <PartyAsk choices={choices} chosen={chosen} onParty={onParty} /> : null}
            <TopicSections
              topic={topic}
              textOf={(step) => stepText?.(role, step) ?? null}
              differentCount={differentCount}
            />
            <p className="b3-report-end">더 여쭤보고 싶은 점은 상담에서 편하게 말씀해 주세요.</p>
          </>
        ) : null}
        <div className="b3-counsel-links">
          <button type="button" className="b3-counsel-previous" onClick={onPrevious}>
            <Binder3ArrowIcon direction="left" />
            <span>{previousLabel}</span>
          </button>
          <button type="button" className="b3-counsel-next" onClick={onNext}>
            <span>상담 변호사 확인하기</span>
            <Binder3ArrowIcon direction="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
