/** 사건 요약 2뎁스: 사건 종류별 안내. 개인화는 사건 종류와 고객 지위까지만 한다. */
export type Binder3Pair = [string, string];

export type Binder3TopicContent = {
  steps: Binder3Pair[];
  flow: Binder3Pair[];
  ask: string[];
  bring: string[];
};

export type Binder3TopicCase = { tag?: string; t?: string; s?: string; r?: string };

export type Binder3Topic = Binder3TopicContent & {
  label: string;
  cases?: Binder3TopicCase[];
  /** 내용이 기준으로 삼은 지위. 없으면 지위를 나누지 않는 사건이다. */
  base_role?: string;
  roles?: Record<string, Binder3TopicContent>;
};

/** 키는 YK-OS 사건 분류 소분류 이름. `_` 로 시작하는 키는 표의 부속이다. */
export type Binder3TopicTable = Record<string, unknown> & {
  _alias: Record<string, string>;
  _middle_alias: Record<string, string>;
  _middle: Record<string, Binder3Topic>;
  _default: Binder3Topic;
};

/** 지위를 모를 때 어느 쪽이어도 맞는 내용 */
export const BINDER3_PARTY_COMMON = '공통';

/** Object.hasOwn 은 빌드 대상(chrome87)보다 새 API 라 구형 태블릿 WebView 에서 없을 수 있다. */
const hasOwn = (target: object, key: string) => Object.prototype.hasOwnProperty.call(target, key);

const noSpace = (value: string) => value.replace(/\s+/g, '');

/** 소분류 → 별칭 → 중분류 → 기본. 사건 분류 이름이 표의 부속 키나 Object 속성을 가리켜도 기본으로 간다. */
export function findTopic(table: Binder3TopicTable, small: string, middle: string): Binder3Topic {
  const key = hasOwn(table._alias, small) ? table._alias[small] : small;
  if (key && !key.startsWith('_') && hasOwn(table, key)) return table[key] as Binder3Topic;
  const middleKey = noSpace(hasOwn(table._middle_alias, middle) ? table._middle_alias[middle] : middle);
  const found = Object.keys(table._middle).find((name) => noSpace(name) === middleKey);
  return found ? table._middle[found] : table._default;
}

/** 지위가 기준과 다르면 그 지위의 내용으로 바꾼다. 사례는 기준 지위의 것이라 다른 지위에서는 빼고, 공통에서는 둔다. */
export function applyParty(topic: Binder3Topic, party: string): Binder3Topic {
  if (party === topic.base_role || !topic.roles || !hasOwn(topic.roles, party)) return topic;
  return { ...topic, ...topic.roles[party], cases: party === BINDER3_PARTY_COMMON ? topic.cases : [] };
}

/** 고객에게 물을 지위. 2개 미만이면 묻지 않는다. */
export function partyChoices(topic: Binder3Topic): string[] {
  if (!topic.base_role) return [];
  return [topic.base_role, ...Object.keys(topic.roles ?? {})].filter((party) => party !== BINDER3_PARTY_COMMON);
}

export function initialParty(topic: Binder3Topic): string {
  if (topic.roles && hasOwn(topic.roles, BINDER3_PARTY_COMMON)) return BINDER3_PARTY_COMMON;
  return topic.base_role ?? '';
}

/** 다른 콘솔 화면 용량이 늘지 않게 필요할 때 읽는다. 출처를 API 로 바꾸면 여기만 고친다. */
export async function loadBinder3Topics(): Promise<Binder3TopicTable> {
  const data = await import('./binder3Topics.json');
  return data.default as unknown as Binder3TopicTable;
}
