/** 시연용 API. 파이썬 서버를 쓰지 않고 브라우저 안에서 데이터를 읽어 답한다.
 *  화면 코드가 await 로 쓰던 모양을 그대로 두어, 나중에 진짜 서버를 붙일 때 이 파일만 바꾸면 된다. */
import { catalog, booking, lawyer, feeFor, ranked } from "./catalog.js";

const j = async (res) => {
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.json();
};

/** 태블릿 한 건의 화면 데이터. 현재는 파이썬이 미리 뽑아 둔 스냅샷을 쓴다. */
async function snapshotVisit(id) {
  const base = import.meta.env.BASE_URL;
  const index = await fetch(`${base}snapshot/index.json?v=${__BUILD__}`).then(j);
  const key = (id && (index.byId?.[id] || index.byName?.[id])) || index.default;
  return fetch(`${base}snapshot/${encodeURIComponent(key)}.json?v=${__BUILD__}`).then(j);
}

export const api = {
  visit: (id) => snapshotVisit(id),

  /** 방문 예정 목록 등 YK-OS 쪽에서 쓰는 전체 데이터 */
  catalog: () => catalog(),

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

  fee: async (key) => feeFor(await catalog(), key),
  booking: async (bid) => booking(await catalog(), bid),
};
