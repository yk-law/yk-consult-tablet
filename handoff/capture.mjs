#!/usr/bin/env node
/* 태블릿 View 정답 스크린샷 → handoff/golden/{기기}-{화면}.png
   실행: node tools/dev.mjs 가 떠 있거나, 이 스크립트가 직접 기동한다.
   node handoff/capture.mjs */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");
const GOLDEN = join(ROOT, "handoff", "golden");
/** 다른 워크트리와 포트 충돌을 피하기 위해 핸드오프 기본 포트는 18000/15173.
 *  기존 `node tools/dev.mjs`(8000/5173)가 이 프로젝트면 API_URL/WEB_URL 로 넘겨도 된다. */
const API_PORT = Number(process.env.HANDOFF_API_PORT || 18000);
const WEB_PORT = Number(process.env.HANDOFF_WEB_PORT || 15173);
const API = process.env.API_URL || `http://127.0.0.1:${API_PORT}`;
const WEB = process.env.WEB_URL || `http://127.0.0.1:${WEB_PORT}`;
const NODE = "/tmp/node-v22.14.0-darwin-arm64/bin";
const LOG = process.env.HANDOFF_LOG_DIR || join(tmpdir(), "yk-handoff");

const require = createRequire(join(APP, "package.json"));
const { chromium } = require("playwright");

/** 시연 예약(가명). 1뎁스 확인 문항이 있는 한지우(이혼). */
const BOOKING = "한지우";

const DEVICES = [
  { id: "tablet-landscape", width: 1194, height: 834, deviceScaleFactor: 2 },
  { id: "tablet-portrait", width: 834, height: 1194, deviceScaleFactor: 2 },
  { id: "desktop", width: 1280, height: 900, deviceScaleFactor: 1 },
];

/** 대기 영상(film) 제외. docs/05 · App SCREENS 기준 실제 있는 고객 태블릿 화면. */
const SCREENS = [
  { id: "confirm", qs: `c=${encodeURIComponent(BOOKING)}&v=tab&theme=light`, ready: ".confirmpane:not(.preppane)", settle: settleConfirm },
  { id: "prep", qs: `c=${encodeURIComponent(BOOKING)}&s=prep&v=tab&theme=light`, ready: ".preppane", settle: settleIdle },
  { id: "firm", qs: `c=${encodeURIComponent(BOOKING)}&s=firm&v=tab&theme=light`, ready: ".firmpane .firm-hero", settle: settleFirm },
  { id: "report", qs: `c=${encodeURIComponent(BOOKING)}&s=report&v=tab&theme=light`, ready: ".yh-check", settle: settleIdle },
  { id: "topics", qs: `c=${encodeURIComponent(BOOKING)}&s=topics&v=tab&theme=light`, ready: ".yh-steps", settle: settleIdle },
  { id: "counsel", qs: `c=${encodeURIComponent(BOOKING)}&s=counsel&v=tab&theme=light`, ready: ".counselpane .profile", settle: settleIdle },
  { id: "seniors", qs: `c=${encodeURIComponent(BOOKING)}&s=seniors&v=tab&theme=light`, ready: ".seniorpane", settle: settleSeniors },
  { id: "youtube", qs: `c=${encodeURIComponent(BOOKING)}&s=youtube&v=tab&theme=light`, ready: ".youtube-stories", settle: settleIdle },
];

const FREEZE_CSS = `
  .dbar { display: none !important; }
  .stage { padding: 0 !important; gap: 0 !important; }
  .shell, .stage, .tabwrap, .tab.viewtab {
    width: 100% !important; height: 100% !important; min-height: 100vh !important;
    max-width: none !important; border-radius: 0 !important; box-shadow: none !important;
  }
  *, *::before, *::after {
    animation: none !important; transition: none !important; caret-color: transparent !important;
  }
  .prep-loading span { opacity: .7 !important; }
`;

function envWithNode() {
  const env = { ...process.env };
  if (existsSync(NODE)) env.PATH = `${NODE}:${env.PATH || ""}`;
  return env;
}

async function apiOk() {
  try {
    const h = await fetch(`${API}/api/health`).then((r) => r.json());
    return h?.ok === true;
  } catch {
    return false;
  }
}

async function webOk() {
  try {
    const r = await fetch(WEB);
    return r.ok;
  } catch {
    return false;
  }
}

async function waitReady(ms = 90000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await apiOk()) && (await webOk())) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("FastAPI/Vite 기동 대기 시간 초과");
}

/** app/public/snapshot/ 은 gitignore. 고객 태블릿이 읽는 정적 visit JSON을 뽑는다. */
async function ensureSnapshot() {
  const index = join(ROOT, "app", "public", "snapshot", "index.json");
  if (existsSync(index)) return;
  await new Promise((resolve, reject) => {
    const r = spawn("python3", ["tools/snapshot.py"], { cwd: ROOT, env: envWithNode(), stdio: "inherit" });
    r.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`snapshot.py exit ${code}`))));
  });
}

/** tools/dev.mjs 와 동일 스택: uvicorn + Vite (핸드오프는 전용 포트). */
async function ensureServers() {
  await ensureSnapshot();
  if ((await apiOk()) && (await webOk())) return { stop: async () => {}, owned: false };
  await mkdir(LOG, { recursive: true });
  const { openSync } = await import("node:fs");
  const apiLog = openSync(join(LOG, "api-spawn.log"), "w");
  const webLog = openSync(join(LOG, "vite-spawn.log"), "w");
  const kids = [];
  const env = envWithNode();
  const apiPort = Number(new URL(API).port || API_PORT);
  const webPort = Number(new URL(WEB).port || WEB_PORT);
  const api = spawn("python3", ["-m", "uvicorn", "server.main:app", "--host", "127.0.0.1", "--port", String(apiPort)], {
    cwd: ROOT, env, stdio: ["ignore", apiLog, apiLog],
  });
  const web = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(webPort), "--strictPort"], {
    cwd: APP, env, stdio: ["ignore", webLog, webLog],
  });
  kids.push(api, web);
  const stop = async () => {
    for (const p of kids) {
      try { p.kill("SIGTERM"); } catch { /* ignore */ }
    }
  };
  try {
    await waitReady();
  } catch (e) {
    await stop();
    throw e;
  }
  return { stop, owned: true };
}

async function waitImages(page) {
  await page.evaluate(async () => {
    const root = document.querySelector(".tab.viewtab") || document;
    const imgs = [...root.querySelectorAll("img")];
    await Promise.all(
      imgs.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              }),
      ),
    );
  });
}

async function settleIdle(page) {
  await waitImages(page);
  await page.waitForTimeout(300);
}

async function settleConfirm(page) {
  await page.waitForSelector(".confirmpane .h1");
  await waitImages(page);
  await page.waitForTimeout(300);
}

async function settleFirm(page) {
  await page.waitForSelector(".firmpane .firm-people .firm-ph img, .firmpane .firm-empty, .firmpane .firm-cases");
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll(".firmpane .firm-ph img")];
    return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, { timeout: 30000 });
  await waitImages(page);
  await page.waitForTimeout(400);
}

async function settleSeniors(page) {
  // 좁은 뷰포트에서는 컨트롤이 숨겨질 수 있어 DOM 클릭으로 자동 넘김만 멈춘다.
  await page.evaluate(() => {
    const btn = document.querySelector(".senior-auto-toggle");
    if (btn && (btn.getAttribute("aria-label") || "").includes("일시정지")) btn.click();
  });
  await waitImages(page);
  await page.waitForTimeout(600);
}

async function freezePage(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(async () => {
    document.querySelectorAll("video").forEach((v) => {
      try { v.pause(); v.currentTime = 0; } catch { /* ignore */ }
    });
    if (document.fonts?.ready) await document.fonts.ready;
  });
}

async function shotOne(browser, device, screen, outDir) {
  const context = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.deviceScaleFactor,
    colorScheme: "light",
  });
  const page = await context.newPage();
  const url = `${WEB}/?${screen.qs}`;
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(screen.ready, { timeout: 30000 });
  await freezePage(page);
  await screen.settle(page);
  const file = join(outDir, `${device.id}-${screen.id}.png`);
  await page.locator(".tab.viewtab").screenshot({ path: file, animations: "disabled" });
  await context.close();
  return file;
}

export async function captureAll(outDir = GOLDEN) {
  await mkdir(outDir, { recursive: true });
  const servers = await ensureServers();
  const browser = await chromium.launch({ headless: true });
  const files = [];
  try {
    for (const device of DEVICES) {
      for (const screen of SCREENS) {
        const file = await shotOne(browser, device, screen, outDir);
        files.push(file);
        console.log(`  ✓ ${device.id}-${screen.id}.png`);
      }
    }
  } finally {
    await browser.close();
    await servers.stop();
  }
  return files;
}

export { DEVICES, SCREENS, GOLDEN, ROOT };

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  console.log("\n  handoff capture → handoff/golden/\n");
  try {
    const files = await captureAll(GOLDEN);
    console.log(`\n  ${files.length}장 저장 (${DEVICES.length}기기 × ${SCREENS.length}화면)\n`);
  } catch (e) {
    console.error("\n  capture 실패:", e.message || e, "\n");
    process.exit(1);
  }
}
