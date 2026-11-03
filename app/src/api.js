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

/** 템플릿 검토용 딥링크 `k=<사건종류>`(+ `m=<중분류>`, `r=<지위>`). 예약은 그대로 두고 사건 요약 2뎁스만 그 종류로 바꿔 끼운다. */
async function withKind(data) {
  const q = new URLSearchParams(location.search);
  const small = q.get("k");
  if (!small || !data?.helper) return data;
  const base = await topicByKind(small, q.get("m") || "");
  if (!base) return data;
  // r=<지위>(피의자·피고인·피해자 / 원고·피고). 기본 지위와 다르면 그 지위의 내용으로 바꾼다.
  const party = q.get("r") || base.base_role || "";
  const v = party !== base.base_role ? base.roles?.[party] : null;
  const tpl = v ? { ...base, ...v, cases: [] } : base;
  return {
    ...data,
    helper: {
      ...data.helper,
      topic: tpl.label || q.get("m") || data.helper.topic,
      summary: [],
      party,
      topics: tpl.steps || [],
      flow: tpl.flow || [],
      ask: tpl.ask || [],
      bring: tpl.bring || [],
      cases: tpl.cases || [],
      intake: null,
    },
  };
}

export const api = {
  visit: (id, options) => snapshotVisit(id, options).then(withKind),

  topicByKind,

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
