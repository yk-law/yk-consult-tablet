import { useMemo, useState } from "react";

const RETAIN = "선임합니다";
const DECLINE = "이번에는 선임하지 않습니다";

const PHASES = {
  before: {
    id: "before",
    label: "상담 후 · 계약 전",
    title: "오늘 상담은 어떠셨나요?",
    sub: "상담이 끝난 뒤, 계약을 진행하기 전에 짧게 여쭤 봅니다.",
    notice: "이 설문은 오늘 선임·미선임 결정에 영향을 주지 않습니다. 담당 변호사·상담실장에게 바로 공개되지 않으니, 편하게 적어 주세요.",
    questions: [
      {
        id: "retain",
        type: "pick",
        text: "오늘 상담을 마치고, 선임 여부를 알려 주세요.",
        options: [RETAIN, DECLINE],
      },
      { id: "q-book", type: "scale", text: "상담 예약 과정은 편리하셨나요?", lo: "매우 불편", hi: "매우 편리" },
      { id: "q-wait", type: "scale", text: "상담 시작 전 대기 시간은 적절했나요?", lo: "많이 길었다", hi: "적절했다" },
      { id: "q-talk", type: "scale", text: "하고 싶은 말씀을 충분히 전달하셨나요?", lo: "전혀 아니다", hi: "매우 그렇다" },
      { id: "q-explain", type: "scale", text: "사건과 앞으로의 진행에 대한 설명은 이해하기 쉬웠나요?", lo: "어려웠다", hi: "쉬웠다" },
      { id: "q-satisfy", type: "scale", text: "오늘 상담에 전반적으로 만족하시나요?", lo: "불만족", hi: "매우 만족" },
      {
        id: "q-terms",
        type: "scale",
        when: "retain",
        text: "비용과 업무 범위에 대한 설명은 충분했나요?",
        lo: "부족했다",
        hi: "충분했다",
      },
      {
        id: "q-expect",
        type: "multi",
        when: "retain",
        text: "선임 후 가장 중요하게 보시는 점은? (복수 선택)",
        options: [
          "빠른 착수",
          "진행 상황 공유",
          "담당 변호사와의 소통",
          "비용이 명확한 것",
          "사건 전략을 이해하는 것",
        ],
      },
      {
        id: "q-why",
        type: "choice",
        when: "decline",
        text: "오늘 선임하지 않으신 가장 가까운 이유는?",
        options: [
          "조금 더 생각해 보고 싶다",
          "비용이 부담된다",
          "다른 곳과 비교하고 싶다",
          "사건 진행을 보류한다",
          "설명이나 신뢰가 충분하지 않았다",
        ],
      },
      {
        id: "q-recall",
        type: "pick",
        when: "decline",
        text: "필요하시면 다시 연락드려도 될까요?",
        options: ["네, 연락 주세요", "괜찮습니다"],
      },
    ],
  },
  after: {
    id: "after",
    label: "계약 후",
    title: "계약을 마치셨습니다",
    sub: "오늘 계약 과정만 짧게 확인합니다. 사건 수행 평가는 아닙니다.",
    notice: "계약을 마친 뒤에만 작성하는 설문입니다. 결과는 담당 수행 평가에 바로 쓰이지 않습니다.",
    questions: [
      { id: "a-paper", type: "scale", text: "계약서와 조건은 이해하기 쉬웠나요?", lo: "어려웠다", hi: "쉬웠다" },
      { id: "a-flow", type: "scale", text: "계약 진행은 불편하지 않으셨나요?", lo: "불편했다", hi: "괜찮았다" },
      {
        id: "a-guide",
        type: "pick",
        text: "앞으로 누가, 어떻게 연락드릴지 안내받으셨나요?",
        options: ["네, 안내받았습니다", "아직입니다"],
      },
      {
        id: "a-next",
        type: "multi",
        text: "착수 후 가장 먼저 받고 싶은 안내는? (복수 선택)",
        options: ["담당자 연락처", "앞으로의 일정", "준비할 서류", "다음 면담 일정"],
      },
      { id: "a-visit", type: "scale", text: "오늘 방문 전반에 만족하시나요?", lo: "불만족", hi: "매우 만족" },
      { id: "a-nps", type: "scale", text: "주변에 저희를 추천할 의향이 있으신가요?", lo: "전혀 없다", hi: "매우 많다" },
    ],
  },
};

function visibleQuestions(phase, retain) {
  const side = retain === RETAIN ? "retain" : retain === DECLINE ? "decline" : null;
  return PHASES[phase].questions.filter((q) => !q.when || q.when === side);
}

function answered(q, value) {
  if (q.type === "multi") return Array.isArray(value) && value.length > 0;
  return value !== null && value !== undefined && value !== "";
}

function blank() {
  const a = {};
  Object.values(PHASES).forEach((p) => {
    p.questions.forEach((q) => { a[q.id] = q.type === "multi" ? [] : null; });
  });
  return a;
}

function Question({ q, value, onChange }) {
  if (q.type === "scale") {
    return (
      <div className="svq">
        <div className="svt">{q.text}</div>
        <div className="scale">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={value === n ? "on" : ""} onClick={() => onChange(n)}>{n}</button>
          ))}
        </div>
        <div className="slbl"><span>{q.lo}</span><span>{q.hi}</span></div>
      </div>
    );
  }
  if (q.type === "pick") {
    return (
      <div className="svq">
        <div className="svt">{q.text}</div>
        <div className={`svpick ${q.options.length > 2 ? "many" : ""}`}>
          {q.options.map((opt) => (
            <button key={opt} type="button" className={value === opt ? "on" : ""} onClick={() => onChange(opt)}>{opt}</button>
          ))}
        </div>
      </div>
    );
  }
  if (q.type === "choice") {
    return (
      <div className="svq">
        <div className="svt">{q.text}</div>
        <div className="chips">
          {q.options.map((opt) => (
            <button key={opt} type="button" className={`chip ${value === opt ? "on" : ""}`} onClick={() => onChange(opt)}>{opt}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="svq">
      <div className="svt">{q.text}</div>
      <div className="chips">
        {q.options.map((opt) => {
          const on = (value || []).includes(opt);
          return (
            <button
              key={opt}
              type="button"
              className={`chip ${on ? "on" : ""}`}
              onClick={() => {
                const cur = value || [];
                onChange(cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
              }}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

export default function Survey() {
  const [phase, setPhase] = useState("before");
  const [answers, setAnswers] = useState(blank);
  const [done, setDone] = useState(null);
  const retain = answers.retain;
  const shown = useMemo(() => visibleQuestions(phase, retain), [phase, retain]);
  const complete = shown.every((q) => answered(q, answers[q.id]));
  const blockedAfter = phase === "after" && retain === DECLINE;

  const setAns = (id, v) => setAnswers((prev) => ({ ...prev, [id]: v }));

  const submit = () => {
    if (phase === "before" && retain === RETAIN) {
      setPhase("after");
      return;
    }
    setDone(retain === DECLINE ? "decline" : "retain");
  };

  if (done) {
    return (
      <section className="pane on surveypane">
        <div className="svdone">
          <div className="check">✓</div>
          <h2 className="h1">설문에 참여해주셔서 감사합니다</h2>
          <p className="sub">
            {done === "decline"
              ? "오늘 방문해 주셔서 감사합니다.\n필요하실 때 다시 찾아 주세요."
              : "소중한 의견 잘 전달됐습니다.\n앞으로 담당자가 안내드리겠습니다."}
          </p>
        </div>
      </section>
    );
  }

  const meta = PHASES[phase];
  return (
    <section className="pane on surveypane">
      <span className="lbl">상담 만족도 조사</span>
      <div className="svseg">
        {Object.values(PHASES).map((p) => (
          <button key={p.id} type="button" className={phase === p.id ? "on" : ""} onClick={() => setPhase(p.id)}>{p.label}</button>
        ))}
      </div>
      <h2 className="h1">{blockedAfter ? "계약 후 설문" : meta.title}</h2>
      <p className="sub">{blockedAfter ? "계약을 마치신 분만 작성합니다." : meta.sub}</p>
      {blockedAfter ? (
        <div className="svq info">
          <p>이번에는 선임하지 않으셨습니다. 계약 후 설문은 계약을 마치신 분만 작성합니다.</p>
          <button type="button" className="svback" onClick={() => setPhase("before")}>상담 후 · 계약 전으로</button>
        </div>
      ) : (
        <>
          <div className="svq info"><p>{meta.notice}</p></div>
          <div className="svlist">
            {shown.map((q) => (
              <Question key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAns(q.id, v)} />
            ))}
          </div>
          <button type="button" className="bgo" disabled={!complete} onClick={submit}>
            {phase === "before" && retain === RETAIN ? "계약 후 설문으로" : "제출하기"}
          </button>
          <p className="svhint">보이는 항목에 모두 응답하시면 다음으로 갈 수 있습니다</p>
        </>
      )}
    </section>
  );
}
