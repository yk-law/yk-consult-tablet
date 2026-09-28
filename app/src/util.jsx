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

// 회의 결정(09-28): 변호사 평가 개념을 없앤다. 직위에 따라 액자를 화려하게 하던 장식과
// 빛번짐(포일) 효과를 걷어내고, 사진은 모두 같은 테두리로 담는다.
export function Portrait({ l, portraits, size = "card" }) {
  const src = portraits?.[l.n];
  return (
    <figure className={`pframe ${size} bust`}>
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
