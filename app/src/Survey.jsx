import { useMemo, useState } from "react";
import Myk from "./Myk.jsx";

const RETAIN = "선임했어요";
const LATER = "조금 더 생각해볼게요";

const RETAIN_FORM = {
  title: "선임해 주셔서 감사합니다",
  sub: "선임을 결정하신 원인과, 기대하시는 점을 여쭤 봅니다.",
  questions: [
    {
      id: "cause",
      type: "pick",
      text: "선임을 결정하게 된 가장 가까운 원인은 무엇인가요?",
      options: [
        "설명이 이해하기 쉬웠습니다",
        "사건 대응 방향이 분명해 보였습니다",
        "비용과 맡기는 범위가 이해됐습니다",
        "믿고 맡길 수 있겠다 싶었습니다",
        "예약과 방문의 절차가 편리했습니다",
      ],
    },
    {
      id: "expect",
      type: "multi",
      text: "선임 후 기대되는 부분을 골라 주세요. 여러 개 고르셔도 됩니다.",
      options: [
        "진행 상황을 꾸준히 알려 주는 것",
        "앞으로의 대응 방향을 분명히 하는 것",
        "약속한 비용과 범위를 지켜 진행하는 것",
        "궁금한 점을 편하게 물어볼 수 있는 것",
      ],
    },
  ],
};

const LATER_FORM = {
  title: "조금 더 생각해 보시겠어요",
  questions: [
    {
      id: "later-why",
      type: "multi",
      text: "오늘 바로 선임하지 않으신 이유에 가까운 것을 골라 주세요. 여러 개 고르셔도 됩니다.",
      options: [
        "자문으로 충분한 것 같다",
        "시간을 두고 결정하려한다",
        "비용이 부담된다",
        "다른 곳과 비교해 보고 싶다",
        "가족과 상의해 보고 싶다",
      ],
    },
  ],
};

const SIGNED = {
  id: "signed",
  title: "전자서명을 마쳤습니다",
  sub: "계약 과정만 두 가지만 확인합니다.",
  notice: "서명을 마친 뒤에 작성합니다. 사건 수행 평가는 아닙니다.",
  questions: [
    { id: "a-paper", type: "scale", text: "계약 조건은 이해하기 쉬웠나요?", lo: "어려웠다", hi: "쉬웠다" },
    {
      id: "a-guide",
      type: "pick",
      text: "앞으로 누가 연락드릴지 안내받으셨나요?",
      options: ["네, 안내받았습니다", "아직입니다"],
    },
  ],
};

function answered(q, value) {
  if (q.type === "multi") return Array.isArray(value) && value.length > 0;
  return value !== null && value !== undefined && value !== "";
}

function OptionButtons({ options, selected, onPick }) {
  return (
    <div className="svpick many">
      {options.map((opt) => (
        <button key={opt} type="button" className={selected(opt) ? "on" : ""} onClick={() => onPick(opt)}>{opt}</button>
      ))}
    </div>
  );
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
  if (q.type === "multi") {
    const picked = Array.isArray(value) ? value : [];
    return (
      <div className="svq">
        <div className="svt">{q.text}</div>
        <OptionButtons
          options={q.options}
          selected={(opt) => picked.includes(opt)}
          onPick={(opt) => onChange(picked.includes(opt) ? picked.filter((x) => x !== opt) : [...picked, opt])}
        />
      </div>
    );
  }
  return (
    <div className="svq">
      <div className="svt">{q.text}</div>
      <OptionButtons
        options={q.options}
        selected={(opt) => value === opt}
        onPick={onChange}
      />
    </div>
  );
}

export default function Survey({ signed = false }) {
  const [gate, setGate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const form = signed ? SIGNED : gate === RETAIN ? RETAIN_FORM : gate === LATER ? LATER_FORM : null;
  const shown = useMemo(() => form?.questions || [], [form]);
  const complete = shown.every((q) => answered(q, answers[q.id]));

  function choose(next) {
    setGate(next);
    setAnswers({});
  }

  if (done) {
    return (
      <section className={`pane on surveypane svfocus ${signed ? "signed" : "open"}`}>
        <div className="svdone">
          <div className="check">✓</div>
          <h2 className="h1">설문에 참여해주셔서 감사합니다</h2>
          <p className="sub">
            {signed
              ? "소중한 의견 잘 전달됐습니다.\n앞으로 담당자가 안내드리겠습니다."
              : gate === LATER
                ? "오늘 방문해 주셔서 감사합니다.\n필요하실 때 다시 찾아 주세요."
                : "의견 잘 받았습니다.\n이어서 서명을 진행해 주세요."}
          </p>
          <Myk hero />
        </div>
      </section>
    );
  }

  if (!signed && !gate) {
    return (
      <section className="pane on surveypane open svfocus">
        <div className="svfocus-main">
          <div className="svfocus-core">
            <h2 className="h1">오늘 상담은 어떠셨나요?</h2>
            <p className="sub">더 나은 법률서비스 제공을 위하여, 내방한 고객님들께 설문을 요청드립니다.</p>
            <div className="svsheet">
              <div className="svpick svgate">
                <button type="button" onClick={() => choose(RETAIN)}>{RETAIN}</button>
                <button type="button" onClick={() => choose(LATER)}>{LATER}</button>
              </div>
            </div>
          </div>
          <Myk hero />
        </div>
      </section>
    );
  }

  return (
    <section className={`pane on surveypane ${signed ? "signed" : "open"}`}>
      {signed ? (
        <div className="svband">
          <span className="lbl">전자서명 완료</span>
          <h2 className="h1">{form.title}</h2>
          <p className="sub">{form.sub}</p>
        </div>
      ) : (
        <>
          <h2 className="h1">{form.title}</h2>
          {form.sub ? <p className="sub">{form.sub}</p> : null}
        </>
      )}
      <div className="svsheet">
        {form.notice ? <p className="svnote">{form.notice}</p> : null}
        <div className="svlist">
          {shown.map((q) => (
            <Question key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))} />
          ))}
        </div>
        {!signed ? (
          <button type="button" className="svback" onClick={() => choose(null)}>이전으로</button>
        ) : null}
        <button type="button" className="bgo" disabled={!complete} onClick={() => setDone(true)}>제출하기</button>
      </div>
      {signed ? <Myk /> : null}
    </section>
  );
}
