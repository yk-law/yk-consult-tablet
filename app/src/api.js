/** 시연용 API. 파이썬 서버를 쓰지 않고 브라우저 안에서 데이터를 읽어 답한다.
 *  화면 코드가 await 로 쓰던 모양을 그대로 두어, 나중에 진짜 서버를 붙일 때 이 파일만 바꾸면 된다. */
import { catalog, booking, lawyer, feeFor, ranked } from "./catalog.js";

const j = async (res) => {
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.json();
};

/** 태블릿 한 건의 화면 데이터. 현재는 파이썬이 미리 뽑아 둔 스냅샷을 쓴다. */
async function snapshotVisit(id, { refresh = false } = {}) {
  const options = { cache: refresh ? "no-store" : "default" };
  const base = import.meta.env.BASE_URL;
  const index = await fetch(`${base}snapshot/index.json?v=${__BUILD__}`, options).then(j);
  const key = (id && (index.byId?.[id] || index.byName?.[id])) || index.default;
  return fetch(`${base}snapshot/${encodeURIComponent(key)}.json?v=${__BUILD__}`, options).then(j);
}

/** YK-OS에서 고른 상담 변호사의 고객용 프로필(사진 포함). 스냅샷에 한 명씩 뽑아 둔다. */
async function counselProfile(name) {
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}snapshot/counsel/${encodeURIComponent(name)}.json?v=${__BUILD__}`);
  return res.ok ? res.json() : null;
}

let topicsCache = null;
const norm = (s) => (s || "").replace(/[^\p{L}\p{N}]/gu, "");

/** 사건 종류별 2뎁스 템플릿. server/catalog.py topic_by_kind 와 같은 규칙: 소분류 → 별칭 → 중분류 폴백 → 기본. */
async function topicByKind(small, middle = "") {
  if (!topicsCache) {
    const base = import.meta.env.BASE_URL;
    topicsCache = await fetch(`${base}data/topics.json?v=${__BUILD__}`).then(j);
  }
  const t = topicsCache;
  const key = t._alias?.[small] || small;
  if (key && !key.startsWith("_") && t[key]) return { kind: key, ...t[key] };
  const mid = t._middle_alias?.[middle] || middle;
  const hit = Object.entries(t._middle || {}).find(([k]) => norm(k) === norm(mid));
  if (hit) return { kind: hit[0], ...hit[1] };
  return t._default ? { kind: "_default", ...t._default } : null;
}

/** 고객 지위별로 고를 수 있는 값. 첫째가 그 사건 종류의 기본 지위다. 나누지 않는 종류는 빈 배열. */
async function partiesFor(small, middle = "") {
  const t = await topicByKind(small, middle);
  if (!t?.base_role) return [];
  return [t.base_role, ...Object.keys(t.roles || {})];
}

/** 사건 요약 2뎁스를 (사건 종류, 지위) 템플릿으로 바꿔 끼운다. 1뎁스 요약은 그대로 둔다. */
async function retopic(data, { small, middle = "", party = "", keepSummary = true } = {}) {
  if (!data?.helper) return data;
  const base = await topicByKind(small, middle);
  if (!base) return data;
  const p = party || base.base_role || "";
  const v = p !== base.base_role ? base.roles?.[p] : null;
  // 사례는 소분류에만 있음. 구체 지위면 빼고, 공통(미정·잘 모르겠어요)은 유지 — catalog.with_role과 같음
  const tpl = v ? { ...base, ...v, cases: p === "공통" ? base.cases || [] : [] } : base;
  return {
    ...data,
    helper: {
      ...data.helper,
      ...(keepSummary ? {} : { topic: tpl.label || middle || data.helper.topic, summary: [], agenda: [] }),
      party: p,
      // 고객이 고른 값이면 다시 묻지 않는다. '잘 모르겠어요'(공통)도 고른 것으로 본다.
      partyKnown: !!party || data.helper.partyKnown,
      topics: tpl.steps || [],
      flow: tpl.flow || [],
      ask: tpl.ask || [],
      bring: tpl.bring || [],
      cases: tpl.cases || [],
      intake: null,
    },
  };
}

/** 템플릿 검토용 딥링크 `k=<사건종류>`(+ `m=<중분류>`, `r=<지위>`). 예약은 그대로 두고 사건 요약 2뎁스만 그 종류로 바꿔 끼운다. */
async function withKind(data) {
  const q = new URLSearchParams(location.search);
  const small = q.get("k");
  if (!small) return data;
  return retopic(data, { small, middle: q.get("m") || "", party: q.get("r") || "", keepSummary: false });
}

export const api = {
  visit: (id, options) => snapshotVisit(id, options).then(withKind),

  topicByKind,
  partiesFor,
  retopic,

  /** 방문 예정 목록 등 YK-OS 쪽에서 쓰는 전체 데이터 */
  catalog: (options) => catalog(options),

  /** 추천 순위. 검색어가 비면 그 사건 분야 담당자만 본다. */
  search: async (q, { field, court, limit = 25 } = {}) => {
    const c = await catalog();
    return ranked(c, field, court, q, limit);
  },

  /** 변호사 한 명의 상세 — 경력·업무사례·처분권자 접점까지 */
  lawyer: async (name) => {
    const c = await catalog();
    return lawyer(c, name);
  },

  counsel: (name) => counselProfile(name),

  fee: async (key) => feeFor(await catalog(), key),
  booking: async (bid) => booking(await catalog(), bid),
};
