#!/usr/bin/env node
/* 전 화면 스모크 점검 — 콘솔 오류·핵심 수치·화면 렌더를 한 번에 확인하고
   .check/ 에 스크린샷을 남긴다.
   준비:  npm i -D playwright && npx playwright install chromium
   실행:  node tools/check.mjs            (기본 app/index.html)
         node tools/check.mjs dist/yk-binder-app.html */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const TARGET = process.argv[2] ?? 'app/index.html';
const SHOT = '.check';
await mkdir(SHOT, { recursive: true });

const EXPECT = { lawyers: 316, advisors: 98, bookings: 4 };
const errs = [], fails = [];
const ok = (label, cond, got) => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${cond ? '' : `   ← ${got}`}`);
  if (!cond) fails.push(label);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 1050 } });
page.on('pageerror', e => errs.push(String(e)));
// 오프라인/CSP로 막히는 외부 리소스(폰트·영상)는 앱 오류가 아니므로 제외한다
page.on('console', m => {
  const t = m.text();
  if (m.type() === 'error' && !/Failed to load resource|ERR_(TUNNEL|NAME|INTERNET|CONNECTION)/.test(t)) errs.push(t);
});
await page.goto('file://' + resolve(TARGET));
await page.waitForTimeout(700);

console.log(`\n  ${TARGET}\n`);
ok('변호사 명단',   await page.evaluate('L.length') === EXPECT.lawyers, await page.evaluate('L.length'));
ok('전문가 명단',   await page.evaluate('ADV.length') === EXPECT.advisors, await page.evaluate('ADV.length'));
ok('예약 목록',     await page.evaluate('BOOKINGS.length') === EXPECT.bookings, await page.evaluate('BOOKINGS.length'));
ok('전문위원 혼입 없음',
   (await page.evaluate('L.filter(l=>ADV.some(a=>a.n===l.n)).map(l=>l.n)')).length <= 1,
   await page.evaluate('L.filter(l=>ADV.some(a=>a.n===l.n)).map(l=>l.n)'));
ok('대기화면 = 미연결', await page.evaluate('!CONNECTED'), 'CONNECTED=true');
ok('미연결 시 인사 숨김', await page.evaluate("document.getElementById('intro-hi').classList.contains('hidden')"), '노출됨');
await page.screenshot({ path: `${SHOT}/1-대기.png` });

for (const b of await page.evaluate('BOOKINGS.map(b=>({id:b.id,name:b.name}))')) {
  await page.evaluate(`share('${b.id}')`); await page.waitForTimeout(250);
  ok(`공유 · ${b.name}`, await page.evaluate('BK.name') === b.name, await page.evaluate('BK.name'));
  await page.evaluate('start()'); await page.waitForTimeout(200);
  ok(`  예약확인 · ${b.name}`, await page.evaluate("cur==='brief'"), await page.evaluate('cur'));
  ok(`  추천 3인 · ${b.name}`, await page.evaluate("(nav('home'),document.querySelectorAll('#recWrap .rr').length)") === 3,
     await page.evaluate("document.querySelectorAll('#recWrap .rr').length"));
}

await page.evaluate("reset();share('228271')"); await page.waitForTimeout(250);
for (const s of ['brief', 'home', 'adv', 'case', 'review', 'fav']) {
  await page.evaluate(`nav('${s}')`); await page.waitForTimeout(180);
  await page.screenshot({ path: `${SHOT}/2-${s}.png` });
}
await page.evaluate("view('os')"); await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT}/3-ykos.png` });
await page.evaluate("view('both')"); await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT}/4-나란히.png`, fullPage: false });

ok('콘솔 오류 없음', errs.length === 0, errs.join(' / '));
await browser.close();
console.log(`\n  스크린샷 → ${SHOT}/`);
console.log(fails.length ? `\n  실패 ${fails.length}건: ${fails.join(', ')}\n` : `\n  전부 통과\n`);
process.exit(fails.length ? 1 : 0);
