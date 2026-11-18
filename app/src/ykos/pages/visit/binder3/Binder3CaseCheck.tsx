import { Binder3ArrowIcon } from './binder3Common';
import { isCaseCheckAnswered, type Binder3Answer, type Binder3Answers } from './binder3CaseCheckMessage';

const ANSWER_LABELS: [Binder3Answer, string][] = [
  ['yes', '네'],
  ['no', '아니오'],
];

/** 사건 요약 1뎁스 — 예약 때 말씀하신 내용을 문항마다 네/아니오로 확인받는다. 답은 풀 수 없고 모두 골라야 넘어간다. */
export default function Binder3CaseCheck({
  questions,
  answers,
  onAnswer,
  onPrevious,
  onNext,
}: {
  questions: string[];
  answers: Binder3Answers;
  onAnswer: (question: string, answer: Binder3Answer) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const allAnswered = isCaseCheckAnswered(questions, answers);
  return (
    <section className="b3-case-check" aria-label="사건 요약">
      <div className="b3-case-check-body">
        <h2>예약하실 때 말씀하신 내용입니다</h2>
        <p className="b3-case-check-lead">
          저희가 이해한 내용이 맞는지 확인해 주세요.
          <br />
          다른 부분은 상담에서 다시 여쭤보겠습니다.
        </p>
        <ol className="b3-case-check-list">
          {questions.map((question, index) => (
            <li key={question}>
              <p>{question}</p>
              <div className="b3-case-check-answers" role="group" aria-label={`${index + 1}번 확인`}>
                {ANSWER_LABELS.map(([value, label]) => {
                  const picked = answers[question] === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      className={picked ? `on-${value}` : undefined}
                      aria-pressed={picked}
                      onClick={() => {
                        if (!picked) onAnswer(question, value);
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
        <p className="b3-case-check-note">모든 항목에 네 또는 아니오를 골라 주세요. 고르신 답은 다른 쪽을 누르면 바뀝니다.</p>
        <div className="b3-counsel-links">
          <button type="button" className="b3-counsel-previous" onClick={onPrevious}>
            <Binder3ArrowIcon direction="left" />
            <span>법무법인 YK 소개로</span>
          </button>
          <button type="button" className="b3-counsel-next" disabled={!allAnswered} onClick={onNext}>
            <span>상담에서 함께 볼 내용</span>
            <Binder3ArrowIcon direction="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
