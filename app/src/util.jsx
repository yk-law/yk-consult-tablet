import React from "react";

export const DEMO_TODAY = "2026-09-04";
export const YOIL = ["일", "월", "화", "수", "목", "금", "토"];
export const ST_CLS = { "상담 중": "now", "곧 시작": "soon" };
export const WTABS = ["콜", "상담", "선임", "부서 배당", "사건 수행", "종료"];
export const CF = ["전체", "민사", "교통사고", "성범죄"];
export const RF = ["전체", "민사", "기업법무", "이혼", "형사", "학교폭력"];
export const AF = ["전체", "고문", "전문위원", "자문위원"];

export const won = (v) => "₩" + Number(v).toLocaleString("ko-KR");
export const man = (v) => (v / 10000).toLocaleString("ko-KR") + "만원";
export const wonPlain = (v) => (v ? Number(v).toLocaleString("ko-KR") : "　　　　");

/** 고객 화면 표기: 「아동청소년보호법위반(아청법위반)」→ 괄호 이하 생략 */
export function areaLabel(name) {
  return String(name || "").replace(/\s*\([^)]*\)\s*/g, "").trim();
}

/** 분야 대분류 표기 정규화 — 「가사·상속」↔「가사상속」 */
export function normFieldLabel(s) {
  return String(s || "").replace(/[·・\s\-_/]/g, "");
}

export function fieldLabelsOf(FIELD, key) {
  return FIELD?.[key] || [];
}

export function groupMatchesFieldLabels(group, labels) {
  const g = normFieldLabel(group);
  if (!g || !labels?.length) return false;
  return labels.some((lab) => {
    const n = normFieldLabel(lab);
    return n && (g === n || g.includes(n) || n.includes(g));
  });
}

/** 예약 사건명·분야 라벨과 세부 업무명 겹침 (골드 플레이트 hit용). */
export function areaNameMatchesCase(area, b, fieldLabels = []) {
  const cat2 = String(b?.cat2 || "").replace(/\s/g, "");
  const cat1 = String(b?.cat1 || "").replace(/\s/g, "");
  const stem = cat2.replace(/^준/, "").replace(/유사/g, "");
  const name = area?.name || "";
  const bare = areaLabel(name).replace(/\s/g, "");
  if (!name) return false;

  if (cat2.includes(name) || name.includes(stem) || (stem && stem.includes(name))) return true;
  if (bare && (cat2.includes(bare) || (stem && bare.includes(stem)))) return true;
  if (stem.length >= 4 && bare.includes(stem.slice(0, 4))) return true;
  if (bare.length >= 4 && stem.includes(bare.slice(0, 4))) return true;

  // 대분류 한 글자짜리(민사·형사·이혼…)는 제외. 세부 라벨·사건명 토큰만.
  const BROAD = new Set(["민사", "형사", "이혼", "행정", "가사", "가사상속", "기업법무", "노동", "의료", "조세", "마약"]);
  const tokens = new Set();
  for (const lab of fieldLabels) {
    for (const part of String(lab).split(/[·・/,\s]+/)) {
      const t = part.replace(/\s/g, "");
      if (t.length >= 2 && !BROAD.has(t)) tokens.add(t);
    }
  }
  for (const raw of [cat1, cat2, stem]) {
    if (!raw) continue;
    if (raw.length >= 2 && !BROAD.has(raw)) tokens.add(raw);
    if (/고소$|고발$/.test(raw) && raw.length > 2) {
      const base = raw.replace(/고소$|고발$/, "");
      if (base.length >= 2 && !BROAD.has(base)) tokens.add(base);
    }
  }
  for (const t of tokens) {
    if (t.length >= 2 && (bare.includes(t) || name.includes(t) || normFieldLabel(bare).includes(normFieldLabel(t)))) {
      return true;
    }
  }
  return false;
}

/**
 * 미니/상세 업무태그 등급.
 * hit = 이번 사건과 직결(골드 플레이트). rel = 같은·인접 대분류(골드 테두리).
 * 대분류 표기가 홈페이지와 달라도(예: FIELD 금융·증권 ↔ areas 형사) 사건명이 맞으면 hit.
 */
export function areaCaseMark(area, b, FIELD, NEAR) {
  const key = b?.field || "";
  const labels = fieldLabelsOf(FIELD, key);
  const nearLabels = (NEAR?.[key] || []).flatMap((k) => fieldLabelsOf(FIELD, k));
  const direct = groupMatchesFieldLabels(area.group, labels);
  const near = !direct && groupMatchesFieldLabels(area.group, nearLabels);
  if (!direct && !near) return "";
  if (areaNameMatchesCase(area, b, labels)) return "hit";
  return "rel";
}

export function parseYMD(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function fmtYMD(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
export function addDays(s, n) {
  const d = parseYMD(s);
  d.setDate(d.getDate() + n);
  return fmtYMD(d);
}
export function weekMon(s) {
  const d = parseYMD(s);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return fmtYMD(d);
}
export function inVisitRange(date, range) {
  if (range === "today") return date === DEMO_TODAY;
  if (range === "tomorrow") return date === addDays(DEMO_TODAY, 1);
  const mon = weekMon(DEMO_TODAY);
  if (range === "week") return date >= mon && date <= addDays(mon, 6);
  if (range === "next") {
    const nmon = addDays(mon, 7);
    return date >= nmon && date <= addDays(nmon, 6);
  }
  return true;
}
export function visitWhen(b) {
  const dt = parseYMD(b.date);
  const yy = String(dt.getFullYear()).slice(2);
  const md = `${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  return (
    <>
      <span className="ymd">{yy}-{md}</span>
      <span className="dow">{YOIL[dt.getDay()]}</span>
      <span className="tm">{b.time}</span>
    </>
  );
}

export function Photo({ l, c, portraits }) {
  const src = portraits?.[l.n];
  if (src) return <div className={`ph ${c}`}><img src={src} alt={l.n} /></div>;
  return <div className={`ph ${c}`}><div className="mono">{l.n[0]}</div></div>;
}

/** 사진 프레임. 변호사 직위 우열 + 고문·위원 별도. */
export function frameGrade(l = {}) {
  const pos = l.pos || "";
  const role = l.r || l.role || "";
  if (pos === "대표변호사") return "rep";
  if (pos === "고문변호사") return "counsel";
  if (pos === "파트너변호사") return "partner";
  if (role === "고문" || pos === "고문") return "advisor";
  if (role === "전문위원") return "expert";
  if (role === "자문위원") return "consultant";
  return "assoc";
}

/** 희귀 카드 프레임 장식 두께. 별 개수와는 별개. */
const FRAME_LUX = {
  rep: "lux3",
  counsel: "lux-mid",
  partner: "lux2",
  advisor: "lux3",
  expert: "lux2",
  consultant: "lux1",
};

/** 약력 직함 → 별(4~5, 0.5 단위). 서버 `career_stars`와 동일. 사내 직위는 쓰지 않는다. */
const TITLE_FAMILIES = [
  ["court", ["대법관", "헌법재판관", "법원행정처장", "고등법원장", "법원장", "수석부장판사", "부장판사", "판사"]],
  ["pros", ["검찰총장", "고검장", "지검장", "검사장", "차장검사", "부장검사", "검사"]],
  ["police", ["경찰청장", "치안정감", "치안감", "경무관", "총경", "경정", "경감", "경위", "경사", "경장", "순경"]],
];
const STAR_BY_FAMILY_IDX = {
  court: { 0: 5, 1: 5, 2: 4.5, 3: 4.5, 4: 4.5, 5: 4.5, 6: 4, 7: 4 },
  pros: { 0: 5, 1: 4.5, 2: 4.5, 3: 4.5, 4: 4, 5: 4, 6: 4 },
  police: { 0: 4.5, 1: 4.5, 2: 4.5, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4 },
};

function titleRank(line) {
  const stem = String(line || "").replace(/역임/g, "").trim();
  let found = null;
  for (const [fam, ranks] of TITLE_FAMILIES) {
    for (let i = 0; i < ranks.length; i++) {
      const rank = ranks[i];
      if (stem === rank || stem.endsWith(rank)) {
        if (!found || rank.length > found.len) found = { len: rank.length, fam, idx: i };
      }
    }
  }
  return found ? [found.fam, found.idx] : null;
}

function socialStars(line) {
  const s = String(line || "").trim();
  if (!s || /훈장|표창|포상/.test(s)) return 0;
  if (s.includes("국무총리") || s.includes("대통령비서")) return 4.5;
  if (s.includes("국회의장") || s.includes("장관")) return 4;
  if (s.includes("국회의원") && /보좌|비서/.test(s)) return 4;
  return 0;
}

function snapStars(n) {
  const x = Math.round(Number(n) * 2) / 2;
  return Math.min(5, Math.max(4, x));
}

/** 약력(titles+career) 최고 지위 → 별 4 / 4.5 / 5. API `stars` 없을 때 폴백. */
export function careerStars(l = {}) {
  let best = 4;
  for (const line of [...(l.titles || []), ...(l.career || [])]) {
    const hit = titleRank(line);
    if (hit) {
      const n = STAR_BY_FAMILY_IDX[hit[0]]?.[hit[1]];
      if (n > best) best = n;
      continue;
    }
    const n = socialStars(line);
    if (n > best) best = n;
  }
  return snapStars(best);
}

/** 미니 카드 별. 인물 객체면 약력 기준. 숫자만 오면 그대로(4~5, 0.5). */
export function rankPips(l) {
  if (typeof l === "number") return snapStars(l);
  if (typeof l?.stars === "number") return snapStars(l.stars);
  return careerStars(l || {});
}

const STAR_PATH = "M6 .7 7.45 4.15 11.2 4.5 8.4 7.05 9.25 10.75 6 8.85 2.75 10.75 3.6 7.05.8 4.5 4.55 4.15Z";

export function RankMarks({ n }) {
  const stars = snapStars(n);
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  const glyphs = Array.from({ length: full }, () => "full");
  if (half) glyphs.push("half");
  return (
    <span className="prank" aria-hidden="true">
      {glyphs.map((kind, i) => (
        <svg key={i} className={kind === "half" ? "half" : undefined} viewBox="0 0 12 12">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

export function Portrait({ l, portraits, grade, size = "card" }) {
  const g = grade || l?.grade || frameGrade(l);
  const lux = FRAME_LUX[g] || "lux1";
  const src = portraits?.[l.n];
  return (
    <figure className={`pframe fut ${g} ${lux} ${size} bust`}>
      <span className="pfoil" aria-hidden="true" />
      <span className="pmat">
        {src ? <img src={src} alt={l.n} /> : <span className="mono">{l.n[0]}</span>}
      </span>
    </figure>
  );
}

export function hasTerm(ct, id) {
  if (!ct) return false;
  if (id === "delegation" || id === "special") return (ct.agreement || []).includes(id);
  return (ct.fee || []).includes(id);
}
