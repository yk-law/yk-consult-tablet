export type Binder3Answer = 'yes' | 'no';
/** 문항 글자 → 답. 문항이 새로 만들어지면 예전 답이 새 문항에 붙지 않게 글자로 묶는다. */
export type Binder3Answers = Record<string, Binder3Answer>;
export type Binder3ConfirmItem = { text: string; answer: Binder3Answer | null };

/** 태블릿 셸(PageVisitBrowserTablet)이 이 이름의 메시지만 게이트웨이로 올린다. */
export const BINDER3_CONFIRM_SOURCE = 'ykos-visit-binder3-confirm';

/** 실장의 리롤 버튼이 page-event 로 보내는 이름. 사건 번호를 넣어 다른 고객을 띄운 태블릿은 반응하지 않는다. */
export function binder3RerollEvent(engId: number | string) {
  return `binder3-confirm-reroll-${engId}`;
}

export function buildConfirmItems(questions: string[], answers: Binder3Answers): Binder3ConfirmItem[] {
  return questions.map((text) => ({ text, answer: answers[text] ?? null }));
}

export function postBinder3Confirm(engId: number, items: Binder3ConfirmItem[]) {
  if (window.parent === window) return;
  window.parent.postMessage({ source: BINDER3_CONFIRM_SOURCE, engId, items }, window.location.origin);
}

/** 문항마다 답을 골랐는지. 문항이 없으면 고를 것이 없으니 참이다. */
export function isCaseCheckAnswered(questions: string[], answers: Binder3Answers): boolean {
  return questions.every((question) => Boolean(answers[question]));
}
