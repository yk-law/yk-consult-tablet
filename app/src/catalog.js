/** 시연 데이터 계층 — 파이썬 서버 없이 브라우저에서 직접 읽고 계산한다.
 *  server/catalog.py 의 조회·점수 로직을 옮긴 것이라, 규칙을 고칠 때는 양쪽을 같이 본다.
 *  원본 JSON 은 app/public/data/ 에 있고 첫 진입에서 한 번만 받는다. */

const FILES = [
  "bookings", "lawyers", "advisors", "fee", "fields", "firm",
  "sign", "cases", "reviews", "videos",
  "profile_extra", "scenarios", "intake",
];

let cache = null;

/** 전체 데이터를 한 번만 불러온다. 두 번째 호출부터는 같은 객체를 돌려준다. */
export async function catalog() {
  if (cache) return cache;
  const base = import.meta.env.BASE_URL;
  const entries = await Promise.all(
    FILES.map(async (name) => {
      const res = await fetch(`${base}data/${name}.json`);
      if (!res.ok) throw new Error(`${name}.json 을 불러오지 못했습니다 (${res.status})`);
      return [name, await res.json()];
    }),
  );
  const d = Object.fromEntries(entries);
  cache = {
    bookings: d.bookings,
    lawyers: d.lawyers,
    advisors: d.advisors,
    fee: d.fee,
    firm: d.firm,
    sign: d.sign,
    cases: d.cases,
    reviews: d.reviews,
    videos: d.videos,
    profileExtra: d.profile_extra,
    scenarios: d.scenarios,
    intake: d.intake,
    FIELD: d.fields.FIELD,
    NEAR: d.fields.NEAR,
    counts: { lawyers: 318, advisors: 98, offices: 31 },
  };
  return cache;
}

export const booking = (c, bid) =>
  c.bookings.find((b) => b.id === bid || b.name === bid) || null;

export const lawyer = (c, name) => c.lawyers.find((l) => l.n === name) || null;

export const feeFor = (c, key) => c.fee[key] || c.fee.__all;

const POS_VALUE = { 대표변호사: 10, 파트너변호사: 6, 고문변호사: 4 };

/** 추천 점수. 분야 정확 일치 100 · 인접 분야 8씩(최대 24) · 관할기관 근무 이력 40 · 직위 · 상세 보유 6 · 담당 분야 폭 */
export function score(c, l, field, court) {
  const parts = {};
  let s = 0;
  const hit = l.f.includes(field);
  if (hit) { s += 100; parts.field = 100; }

  const near = (c.NEAR[field] || []).filter((x) => l.f.includes(x));
  if (near.length) { parts.near = Math.min(near.length * 8, 24); s += parts.near; }

  const d = l.d || null;
  const blob = d
    ? [...(d.career || []), ...(d.links || []).map((x) => x.t || "")].join(" ")
    : "";
  const courtHit = !!(d && blob.includes(court));
  if (courtHit) { s += 40; parts.court = 40; }

  const pv = POS_VALUE[l.pos] || 0;
  if (pv) { s += pv; parts.pos = pv; }
  if (d) { s += 6; parts.detail = 6; }
  s += l.f.length;

  return { s, parts, court: courtHit, hit, near };
}

/** 고객 화면에 보여줄 추천 근거. 사실 서술만 쓴다 — 관계를 암시하지 않는다. */
export function reasons(c, l, field, court) {
  const sc = score(c, l, field, court);
  const out = [];
  if (sc.hit) out.push({ t: `${c.FIELD[field][0]} 담당` });
  if (sc.court) out.push({ t: `${court} 근무 이력` });
  if (sc.near.length) {
    out.push({ t: `관련 ${sc.near.slice(0, 2).map((x) => c.FIELD[x][0]).join(" · ")}`, k: "s" });
  }
  if (l.o) out.push({ t: `${l.o} 출신`, k: "s" });
  return out.slice(0, 3);
}

const hay = (c, l) => {
  const p = [l.n, l.pos, l.o || ""];
  for (const f of l.f) if (c.FIELD[f]) p.push(`${c.FIELD[f][0]} ${c.FIELD[f][1]}`);
  const d = l.d;
  if (d) p.push(d.edu || "", d.tr || "", (d.career || []).join(" "), (d.cases || []).join(" "));
  return p.join(" ");
};

/** 검색어가 없으면 그 분야 담당자만, 있으면 전체에서 찾아 점수순으로 준다. */
export function ranked(c, field, court, q = "", limit = 25) {
  const ql = q.trim().toLowerCase();
  let rows = ql
    ? c.lawyers.filter((l) => hay(c, l).toLowerCase().includes(ql))
    : c.lawyers.filter((l) => l.f.includes(field));

  rows = rows
    .map((l) => ({ l, sc: score(c, l, field, court) }))
    .sort((a, b) => b.sc.s - a.sc.s || a.l.n.localeCompare(b.l.n, "ko"))
    .slice(0, limit);

  // 목록에는 상세 본문(d)을 빼 용량을 줄인다.
  return rows.map(({ l, sc }) => {
    const { d, ...rest } = l;
    return { ...rest, score: sc, reasons: reasons(c, l, field, court) };
  });
}
