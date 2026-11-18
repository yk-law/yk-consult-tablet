import { useEffect, useMemo, useState } from 'react';
import { postVisitBinderConfirmRewrites, type VisitBinderRewriteResult } from 'lib/api/api-visit-binder';
import type { Binder3Answers } from './binder3CaseCheckMessage';
import { applyParty, type Binder3Topic } from './binder3Topics';

const NOTHING: VisitBinderRewriteResult = { party: '', role: '', items: [] };

/** 지위마다의 안내 항목. 지위를 나누지 않는 사건은 지위가 빈 글이다. */
export function rewriteOptions(topic: Binder3Topic) {
  const roles = topic.base_role ? [topic.base_role, ...Object.keys(topic.roles ?? {})] : [''];
  return [...new Set(roles)].map((role) => ({
    role,
    steps: applyParty(topic, role).steps.map(([title, text]) => ({ title, text })),
  }));
}

/**
 * 그 지위·항목의 맞춤 설명. 만든 지위이고 쓰인 문항에 모두 「네」로 답했을 때만 쓴다.
 * 아니면 null 이고 화면은 템플릿 원문을 보인다.
 */
export function rewrittenStep(
  result: VisitBinderRewriteResult,
  role: string,
  step: number,
  questions: string[],
  answers: Binder3Answers
): string | null {
  if (role !== result.role) return null;
  const found = result.items.find((item) => item.step === step);
  if (!found) return null;
  return found.questions.every((position) => answers[questions[position]] === 'yes') ? found.text : null;
}

/**
 * 시작 로딩에서 받아 둔다. 실패하면 템플릿 원문으로 시작한다.
 * settled 는 처음 한 번 끝나면 계속 참이라, 리롤로 다시 받아도 화면이 로딩으로 돌아가지 않는다.
 */
export function useBinder3StepRewrites(
  ready: boolean,
  engId: number | null,
  questions: string[],
  topic: Binder3Topic | null
) {
  const [state, setState] = useState<{ result: VisitBinderRewriteResult; settled: boolean }>({
    result: NOTHING,
    settled: false,
  });
  const questionsKey = JSON.stringify(questions);
  const options = useMemo(() => (topic ? rewriteOptions(topic) : []), [topic]);

  useEffect(() => {
    if (!ready) return undefined;
    const sent = JSON.parse(questionsKey) as string[];
    if (engId == null || !sent.length || !options.length) {
      setState({ result: NOTHING, settled: true });
      return undefined;
    }
    let alive = true;
    setState((prev) => ({ result: NOTHING, settled: prev.settled }));
    postVisitBinderConfirmRewrites(engId, { questions: sent, options })
      .catch(() => NOTHING)
      .then((result) => {
        if (alive) setState({ result, settled: true });
      });
    return () => {
      alive = false;
    };
  }, [engId, questionsKey, options, ready]);

  return state;
}
