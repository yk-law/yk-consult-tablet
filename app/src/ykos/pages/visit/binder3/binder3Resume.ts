import type { Binder3Answers } from './binder3CaseCheckMessage';
import { isBinder3JourneyId, type Binder3JourneyId } from './binder3JourneyMenu';

/**
 * 고객이 보던 메뉴 화면·스크롤 위치. 페이지가 새로 읽히면(앱 복귀 등)
 * 같은 태블릿 주소(바인더#3 를 누를 때마다 `t` 가 바뀐다)일 때만 그 자리로 되돌린다.
 */
export type Binder3ReportView = 'check' | 'topics';

export type Binder3Resume = {
  step: Binder3JourneyId;
  scrollTop: number;
  /** 사건 요약 안의 화면: 1뎁스(check) 또는 2뎁스(topics) */
  reportView?: Binder3ReportView;
};

const STORAGE_KEY = 'yk-binder3-resume';
const ANSWERS_KEY = 'yk-binder3-answers';
const PARTY_KEY = 'yk-binder3-party';

export function loadBinder3Resume(address: string): Binder3Resume | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || saved.address !== address || !isBinder3JourneyId(String(saved.step))) return null;
    const scrollTop = Number(saved.scrollTop);
    const resume: Binder3Resume = { step: saved.step, scrollTop: Number.isFinite(scrollTop) && scrollTop > 0 ? scrollTop : 0 };
    if (saved.reportView === 'check' || saved.reportView === 'topics') resume.reportView = saved.reportView;
    return resume;
  } catch {
    return null;
  }
}

export function saveBinder3Resume(address: string, resume: Binder3Resume) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ address, ...resume }));
  } catch {
    // 저장소를 못 쓰면 돌아왔을 때 처음부터 시작할 뿐이다.
  }
}

/** 사건 요약 1뎁스에서 고른 답. 화면 상태지만 메뉴를 오가거나 페이지가 새로 읽혀도 남게 같은 주소일 때 되돌린다. */
export function loadBinder3Answers(address: string): Binder3Answers {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ANSWERS_KEY) || 'null');
    if (!saved || saved.address !== address) return {};
    const answers: Binder3Answers = {};
    for (const [text, answer] of Object.entries(saved.answers ?? {})) {
      if (answer === 'yes' || answer === 'no') answers[text] = answer;
    }
    return answers;
  } catch {
    return {};
  }
}

export function saveBinder3Answers(address: string, answers: Binder3Answers) {
  try {
    sessionStorage.setItem(ANSWERS_KEY, JSON.stringify({ address, answers }));
  } catch {
    // 저장소를 못 쓰면 돌아왔을 때 다시 고르실 뿐이다.
  }
}

/** 사건 요약 2뎁스에서 고객이 고른 지위. 화면 상태이고 같은 주소일 때만 되돌린다. */
export function loadBinder3Party(address: string): string | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PARTY_KEY) || 'null');
    return saved?.address === address && typeof saved.party === 'string' ? saved.party : null;
  } catch {
    return null;
  }
}

export function saveBinder3Party(address: string, party: string) {
  try {
    sessionStorage.setItem(PARTY_KEY, JSON.stringify({ address, party }));
  } catch {
    // 저장소를 못 쓰면 돌아왔을 때 다시 고르실 뿐이다.
  }
}

/**
 * 사건을 바꾸거나 해제하면(태블릿에 빈 화면을 열면) 이전 사건의 진행(메뉴·위치·답·지위)을 지운다.
 * 이어보기는 하지 않는다(2026-11-13 결정: 사건 변경은 이전 사건을 리셋).
 */
export function clearBinder3Progress() {
  for (const key of [STORAGE_KEY, ANSWERS_KEY, PARTY_KEY]) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // 저장소를 못 쓰면 지울 것도 없다
    }
  }
}
