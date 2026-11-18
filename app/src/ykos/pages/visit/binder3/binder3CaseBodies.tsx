import { createContext, useContext, useEffect, useState } from 'react';
import { getVisitBinderCaseBody, type VisitBinderCaseBody } from 'lib/api/api-visit-binder';
import type { Binder3CounselState } from './Binder3Counsel';

/** 사례 본문을 바인더 시작 전에 받는다. 동시에 이만큼씩만 받는다. */
const CONCURRENCY = 6;
/** 이만큼 지나면 시작하고, 남은 것은 뒤에서 계속 받는다. 고객을 오래 세워 두지 않는다. */
export const BODY_WAIT_MS = 20000;

export type Binder3CaseBodies = {
  bodies: Record<number, VisitBinderCaseBody>;
  /** 일시적으로 못 받은 사례. 누르면 모달이 다시 받는다 */
  retryable: ReadonlySet<number>;
};

const Binder3CaseBodiesContext = createContext<Binder3CaseBodies | null>(null);
export const Binder3CaseBodiesProvider = Binder3CaseBodiesContext.Provider;
export const useBinder3CaseBodiesContext = () => useContext(Binder3CaseBodiesContext);

/**
 * 받은 사례만 보인다. 홈페이지에서 열리지 않는 사례(404)가 많아서다.
 * 받는 중인 사례도 숨겨, 보이던 항목이 손가락 밑에서 사라지지 않게 한다.
 */
export function isCaseVisible(
  state: Binder3CaseBodies | null,
  work: { id: number; href: string | null }
) {
  if (!state || !work.href) return true;
  return Boolean(state.bodies[work.id]) || state.retryable.has(work.id);
}

type WithWorks = { works: { id: number; href: string | null }[] };

/** 상담에 함께하는 사람 모두(2차 내부 피드백 8)의 사례 번호를 한 번씩. */
export function collectCaseIds(counsels: Binder3CounselState[]): number[] {
  const people: WithWorks[] = counsels.flatMap((counsel) =>
    counsel.status === 'ready' ? [counsel.data] : []
  );
  const ids = people.flatMap((person) =>
    person.works.filter((work) => work.href).map((work) => work.id)
  );
  return [...new Set(ids)];
}

/** ready 가 되면 ids 를 받기 시작한다. 모두 끝나거나 상한이 지나면 done. */
export function useBinder3CaseBodies(ready: boolean, ids: number[]) {
  const [state, setState] = useState<Binder3CaseBodies>({ bodies: {}, retryable: new Set() });
  const [done, setDone] = useState(false);
  const key = ids.join(',');

  useEffect(() => {
    if (!ready) return undefined;
    if (ids.length === 0) {
      setDone(true);
      return undefined;
    }
    let alive = true;
    let next = 0;
    let settled = 0;
    const settle = () => {
      settled += 1;
      if (settled === ids.length) setDone(true);
      pump();
    };
    const pump = () => {
      if (next >= ids.length) return;
      const id = ids[next];
      next += 1;
      getVisitBinderCaseBody(id)
        .then((body) => {
          if (!alive) return;
          setState((prev) => ({ ...prev, bodies: { ...prev.bodies, [id]: body } }));
          settle();
        })
        .catch((error: { response?: { status?: number } }) => {
          if (!alive) return;
          if (error?.response?.status !== 404) {
            setState((prev) => ({ ...prev, retryable: new Set(prev.retryable).add(id) }));
          }
          settle();
        });
    };
    for (let i = 0; i < CONCURRENCY; i += 1) pump();
    const timer = window.setTimeout(() => setDone(true), BODY_WAIT_MS);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
    // ids 는 key 로 비교한다(매번 새 배열이다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  return { ...state, done };
}
