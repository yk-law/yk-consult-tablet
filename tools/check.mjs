#!/usr/bin/env node
/* 전 화면 스모크 — FastAPI + Vite 가 켜져 있어야 한다.
   실행:  node tools/dev.mjs   (다른 터미널)
         node tools/check.mjs */
import { mkdir } from "node:fs/promises";

const API = process.env.API_URL || "http://127.0.0.1:8000";
const WEB = process.env.WEB_URL || "http://localhost:5173";
const SHOT = ".check";
await mkdir(SHOT, { recursive: true });

const EXPECT = { lawyers: 316, advisors: 98, bookings: 7 };
const fails = [];
const ok = (label, cond, got) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${cond ? "" : `   ← ${got}`}`);
  if (!cond) fails.push(label);
};

let cat;
try {
  const h = await fetch(`${API}/api/health`).then((r) => r.json());
  ok("API health", h.ok === true, JSON.stringify(h));
  cat = await fetch(`${API}/api/catalog`).then((r) => r.json());
} catch (e) {
  console.error("\n  FastAPI가 없습니다. 먼저 `node tools/dev.mjs` 를 켜세요.\n");
  console.error(" ", e.message);
  process.exit(1);
}

ok("변호사 명단", cat.lawyers.length === EXPECT.lawyers, cat.lawyers.length);
ok("전문가 명단", cat.advisors.length === EXPECT.advisors, cat.advisors.length);
ok("예약 목록", cat.bookings.length === EXPECT.bookings, cat.bookings.length);

const visit = await fetch(`${API}/api/visit?id=228271`).then((r) => r.json());
ok("visit helper", Array.isArray(visit.helper && visit.helper.sections) && visit.helper.sections.length === 4, JSON.stringify(visit.helper && { eng: visit.helper.engId, n: (visit.helper.sections || []).length }));
const lawyers = (visit.seniors || []).filter((s) => s.kind !== "advisor");
ok("전문인력 변호사 5명 이하", lawyers.length > 0 && lawyers.length <= 5, lawyers.length);
ok("전문인력 분야 매칭", lawyers.every((s) => s.match === "field" || s.match === "near" || s.match === "court"));
ok("홈페이지 명언", (visit.seniors || []).some((s) => (s.pitch || "").includes("의뢰인") || (s.pitch || "").includes("진심") || (s.pitch || "").includes("정성")));
ok("미니 수상실적 정책", (visit.seniors || []).every((s) => Array.isArray(s.awards)));
ok("대표 경력", (visit.seniors || []).some((s) => (s.titles || []).some((t) => String(t).includes("역임"))));
const unsigned = await fetch(`${API}/api/visit?id=228340`).then((r) => r.json());
ok("한상진 수상 노출", (unsigned.seniors || []).some((s) => s.n === "한상진" && (s.awards || []).some((a) => String(a).includes("검찰총장"))));
const dup = (rows) => (rows || []).some((s) => {
  const t = s.titles || [];
  const both = (a, b) => t.includes(a) && t.includes(b);
  return both("부장검사 역임", "검사 역임") || both("부장판사 역임", "판사 역임") || both("대법관 역임", "판사 역임") || both("고검장 역임", "검사 역임");
});
ok("동일 직군 최고 직위", !dup(unsigned.seniors) && !dup(visit.seniors));
ok("자문위원 목록 없음", !(unsigned.seniors || []).some((s) => s.pos === "자문위원"));
ok("예시 고문·전문위원", (unsigned.seniors || []).some((s) => s.n === "강성용") && (unsigned.seniors || []).some((s) => s.n === "강신선"));
ok("한상진 수상·업무사례", (unsigned.seniors || []).some((s) => s.n === "한상진" && (s.awards || []).length && (s.works || []).some((w) => String(w.href).includes("/case/"))));
ok("한상진 논문·저서", (unsigned.seniors || []).some((s) => s.n === "한상진" && (s.papers || []).some((p) => String(p).includes("검찰"))));
ok("김동진 업무분야 세부", (unsigned.seniors || []).some((s) => s.n === "김동진" && (s.areas || []).length >= 20));
ok("김동진 논문·저서", (unsigned.seniors || []).some((s) => s.n === "김동진" && (s.papers || []).length >= 4));
ok("논문 없으면 공란", (unsigned.seniors || []).every((s) => !("papers" in s) || Array.isArray(s.papers)));
ok("윤서준 전자서명 없음", !unsigned.booking?.modusign);
ok("정하윤 전자서명", visit.booking?.modusign === true);
ok("음성녹취 문항 없음", true); // 화면 점검은 아래 survey 장면에서 한다.

let browser;
try {
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
} catch {
  console.log("\n  playwright 가 없어 화면 점검은 건너뜁니다. (API 수치만 확인)");
  console.log(fails.length ? `\n  실패 ${fails.length}건: ${fails.join(", ")}\n` : "\n  API 통과\n");
  process.exit(fails.length ? 1 : 0);
}

const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(`${WEB}/?c=윤서준`);
await page.waitForSelector(".confirmpane, .filmpane, .preppane");
ok("내방 예약 확인", await page.locator(".confirmpane").count() > 0);
ok("초기화면 사건분류 없음", !(await page.locator(".confirmpane").innerText()).includes("준강제추행"));
const confirmCopy = await page.locator(".confirmpane").innerText();
ok("초기화면 MYK", confirmCopy.includes("법률 과정을 더 쉽게") && confirmCopy.includes("의뢰인의 곁에 더 가까이") && confirmCopy.includes("편리하게 확인하고 이어갈 수 있습니다"));
ok("초기화면 MYK 링크", await page.locator('.confirmpane .myk-qr[href="https://myk.legal/home"]').count() === 1);
await page.screenshot({ path: `${SHOT}/1-confirm.png` });

await page.goto(`${WEB}/?c=228271&s=report`);
await page.waitForSelector(".yh-secs, .yh-empty");
ok("사건개요 섹션", await page.locator(".yh-secs li").count() === 4);
const reportCopy = await page.locator(".reportpane").innerText();
ok("사건요약 고객향 제목", reportCopy.includes("말씀하신 내용을 이렇게 정리했습니다"));
ok("사건요약 보고체 없음", !reportCopy.includes("의뢰인") && !reportCopy.includes("콜 단계") && !reportCopy.includes("진술") && !reportCopy.includes("YK-OS"));
ok("사건요약 고객 호칭", reportCopy.includes("고객님께서는"));
await page.screenshot({ path: `${SHOT}/2-report.png` });

await page.goto(`${WEB}/?c=윤서준&s=report`);
await page.waitForSelector(".yh-secs");
const yoon = await page.locator(".reportpane").innerText();
ok("윤서준 사건요약 고객향", yoon.includes("고객님께서는") && !yoon.includes("의뢰인") && !yoon.includes("진술"));
await page.goto(`${WEB}/?c=김서준&s=report`);
await page.waitForSelector(".yh-empty");
const emptyR = await page.locator(".reportpane").innerText();
ok("빈 사건요약 안내", emptyR.includes("편하게 이야기해 주시면") && !emptyR.includes("콜 단계"));

await page.goto(`${WEB}/?c=228271&s=counsel`);
await page.waitForSelector(".counselpane .profile");
ok("오늘 변호사 히어로", await page.locator(".counselpane .xwho strong").innerText() === (visit.counsel && visit.counsel.n));
ok("상담 사진 직위 배지 없음", await page.locator(".ch-seal").count() === 0);
ok("상담 프로필 공통 섹션", (await page.locator(".counselpane").innerText()).includes("업무분야") && (await page.locator(".counselpane").innerText()).includes("경력"));
const counselBust = await page.locator(".counselpane .pframe img").evaluate((img) => {
  const cs = getComputedStyle(img);
  const r = img.getBoundingClientRect();
  return cs.objectFit === "cover" && r.height > 80 && r.height / r.width < 1.55;
}).catch(() => false);
ok("상담 사진 상체 크롭", counselBust);
await page.screenshot({ path: `${SHOT}/3-counsel.png` });

await page.goto(`${WEB}/?c=이도현&s=report`);
await page.waitForSelector(".counsel-go");
await page.click(".counsel-go");
await page.waitForSelector(".counsel-videopane");
ok("인터뷰 영상 뎁스", await page.locator(".counsel-videopane iframe").count() === 1);
ok("인터뷰 변호사명", (await page.locator(".counsel-video-meta strong").innerText()) === "천기홍");
await page.waitForSelector(".counsel-videopane .film-skip.on");
await page.click(".counsel-videopane .film-skip");
await page.waitForSelector(".counselpane .profile");
ok("영상 후 프로필", await page.locator(".counselpane .xwho strong").innerText() === "천기홍");
await page.goto(`${WEB}/?c=배수아&s=counsel-video`);
await page.waitForSelector(".counsel-videopane, .counselpane");
ok("김윤정 영상 딥링크", await page.locator(".counsel-videopane").count() === 1);
await page.goto(`${WEB}/?c=228271&s=report`);
await page.waitForSelector(".counsel-go");
await page.click(".counsel-go");
await page.waitForSelector(".counselpane .profile");
ok("영상 없으면 바로 프로필", await page.locator(".counsel-videopane").count() === 0 && await page.locator(".counselpane .xwho strong").innerText() === "박찬");

await page.goto(`${WEB}/?c=윤서준&s=seniors`);
await page.waitForSelector(".legendgrid, .empty");
const cards = await page.locator(".legendgrid .xcard").count();
ok("전문인력 카드", cards > 0 && cards <= 8, cards);
ok("전문인력 탭 라벨", (await page.locator(".seniorpane .lbl").innerText()) === "전문인력");
ok("사진 위 직위 태그 없음", await page.locator(".xgrade").count() === 0);
ok("전관 카피 없음", !(await page.locator(".seniorpane").innerText()).includes("전관"));
ok("한상진 사진", await page.locator('.legendgrid .pframe img[alt="한상진"]').count() > 0);
ok("강성용 사진", await page.locator('.legendgrid .pframe img[alt="강성용"]').count() > 0);
ok("강신선 사진", await page.locator('.legendgrid .pframe img[alt="강신선"]').count() > 0);
ok("자문위원 카드 없음", await page.locator(".legendgrid .xcard.consultant").count() === 0);
const cardSizes = await page.locator(".legendgrid .xcard").evaluateAll((els) => els.map((e) => [e.offsetWidth, e.offsetHeight]));
ok("전문인력 카드 고정", cardSizes.length > 1 && cardSizes.every(([w, h]) => w === cardSizes[0][0] && h === cardSizes[0][1]), JSON.stringify(cardSizes));
await page.screenshot({ path: `${SHOT}/4-seniors.png` });

await page.goto(`${WEB}/?c=228340&s=survey`);
await page.waitForSelector(".surveypane.open");
const sv = await page.locator(".surveypane").innerText();
ok("설문 1뎁스", sv.includes("선임했어요") && sv.includes("조금 더 생각해볼게요") && !sv.includes("전자서명을 마쳤습니다") && !sv.includes("만족하시나요"));
ok("설문 MYK", sv.includes("법률 과정을 더 쉽게") && await page.locator('.surveypane .myk-qr[href="https://myk.legal/home"]').count() === 1);
ok("음성녹취 문항 없음(화면)", !sv.includes("녹취"));
ok("승소 문항 없음", !sv.includes("승소"));
await page.locator(".svgate button", { hasText: "선임했어요" }).click();
const retained = await page.locator(".surveypane").innerText();
ok("선임 후 문항", retained.includes("선임 후 기대되는 부분") && retained.includes("선임을 결정하게 된") && retained.includes("예약과 방문의 절차가 편리했습니다") && retained.indexOf("선임을 결정하게 된") < retained.indexOf("선임 후 기대되는 부분") && !retained.includes("승소"));
ok("선임 화면 QR 없음", await page.locator(".surveypane .myk").count() === 0);
await page.locator(".svback").click();
await page.locator(".svgate button", { hasText: "조금 더 생각해볼게요" }).click();
const later = await page.locator(".surveypane").innerText();
ok("보류 문항", later.includes("자문으로 충분한 것 같다") && later.includes("시간을 두고 결정하려한다") && later.includes("비용이 부담된다") && later.includes("다른 곳과 비교해 보고 싶다") && later.includes("가족과 상의해 보고 싶다") && !later.includes("고민할 시간이 더 필요하다"));
ok("보류 복수 선택", later.includes("여러 개 고르셔도 됩니다"));
ok("보류 화면 QR 없음", await page.locator(".surveypane .myk").count() === 0);
await page.goto(`${WEB}/?c=228271&s=survey`);
await page.waitForSelector(".surveypane.signed");
const after = await page.locator(".surveypane").innerText();
ok("설문 서명 후", after.includes("전자서명을 마쳤습니다") && after.includes("계약 조건") && !after.includes("선임합니다"));
ok("설문 서명 후 축약", await page.locator(".surveypane .svq").count() <= 2);
await page.screenshot({ path: `${SHOT}/5-survey.png` });

await browser.close();
console.log(`\n  스크린샷 → ${SHOT}/`);
console.log(fails.length ? `\n  실패 ${fails.length}건: ${fails.join(", ")}\n` : "\n  전부 통과\n");
process.exit(fails.length ? 1 : 0);
