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

export function Portrait({ l, portraits, grade, size = "card" }) {
  const g = grade || l?.grade || frameGrade(l);
  const src = portraits?.[l.n];
  return (
    <figure className={`pframe ${g} ${size} bust`}>
      <span className="pouter" aria-hidden="true" />
      <span className="pmat">
        {src ? <img src={src} alt={l.n} /> : <span className="mono">{l.n[0]}</span>}
      </span>
      <span className="pcorner tl" aria-hidden="true" />
      <span className="pcorner tr" aria-hidden="true" />
      <span className="pcorner bl" aria-hidden="true" />
      <span className="pcorner br" aria-hidden="true" />
    </figure>
  );
}

export function hasTerm(ct, id) {
  if (!ct) return false;
  if (id === "delegation" || id === "special") return (ct.agreement || []).includes(id);
  return (ct.fee || []).includes(id);
}
