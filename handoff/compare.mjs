#!/usr/bin/env node
/* golden 과 동일 조건 재촬영 후 픽셀 비교.
   차이 비율이 0.1%를 넘는 장면이 있으면 표로 출력하고 종료코드 1.
   실행: node handoff/compare.mjs */
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { captureAll, GOLDEN, ROOT } from "./capture.mjs";

const require = createRequire(join(ROOT, "app", "package.json"));
const pixelmatch = require("pixelmatch").default || require("pixelmatch");
const { PNG } = require("pngjs");

const THRESHOLD = 0.001; // 0.1% — 0.5%에선 가로 태블릿 1px 이동(0.479%)이 통과했다(11-17 검수)
const DIFF_DIR = process.env.HANDOFF_DIFF_DIR || join(tmpdir(), "yk-handoff", "diff");

function pct(n) {
  return `${(n * 100).toFixed(3)}%`;
}

async function comparePair(goldenPath, actualPath, diffPath) {
  const gBuf = await readFile(goldenPath);
  const aBuf = await readFile(actualPath);
  const img1 = PNG.sync.read(gBuf);
  const img2 = PNG.sync.read(aBuf);
  if (img1.width !== img2.width || img1.height !== img2.height) {
    return {
      ok: false,
      total: img1.width * img1.height,
      diff: img1.width * img1.height,
      ratio: 1,
      note: `크기 불일치 ${img1.width}×${img1.height} vs ${img2.width}×${img2.height}`,
    };
  }
  const { width, height } = img1;
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false,
  });
  const total = width * height;
  const ratio = mismatched / total;
  if (mismatched > 0) {
    await mkdir(dirname(diffPath), { recursive: true });
    await writeFile(diffPath, PNG.sync.write(diff));
  }
  return { ok: ratio <= THRESHOLD, total, diff: mismatched, ratio, note: "" };
}

export async function runCompare() {
  if (!existsSync(GOLDEN)) {
    throw new Error("handoff/golden 이 없습니다. 먼저 node handoff/capture.mjs 를 실행하세요.");
  }
  const tmp = await mkdtemp(join(tmpdir(), "yk-handoff-"));
  const actualDir = join(tmp, "actual");
  await mkdir(DIFF_DIR, { recursive: true });
  console.log("\n  handoff compare — 재촬영 후 golden 비교\n");
  try {
    await captureAll(actualDir);
    const { readdirSync } = await import("node:fs");
    const names = readdirSync(GOLDEN).filter((f) => f.endsWith(".png")).sort();
    if (!names.length) throw new Error("golden PNG 가 없습니다.");

    const rows = [];
    let fail = 0;
    for (const name of names) {
      const g = join(GOLDEN, name);
      const a = join(actualDir, name);
      if (!existsSync(a)) {
        rows.push({ name, ratio: 1, note: "재촬영 파일 없음", fail: true });
        fail += 1;
        continue;
      }
      const r = await comparePair(g, a, join(DIFF_DIR, name));
      const bad = !r.ok;
      if (bad) fail += 1;
      rows.push({
        name,
        ratio: r.ratio,
        note: r.note || (bad ? `diff ${r.diff}/${r.total}` : "ok"),
        fail: bad,
      });
    }

    const over = rows.filter((r) => r.fail && r.ratio > THRESHOLD);
    console.log("  화면                              차이율     결과");
    console.log("  ─────────────────────────────────────────────────");
    for (const r of rows) {
      const mark = r.fail ? "FAIL" : "ok";
      console.log(`  ${r.name.padEnd(34)} ${pct(r.ratio).padStart(8)}  ${mark}${r.note && r.fail ? `  ${r.note}` : ""}`);
    }
    console.log("");
    if (over.length || fail) {
      console.log(`  실패 ${fail}건 (허용 ${pct(THRESHOLD)} 초과). diff → ${DIFF_DIR}\n`);
      return 1;
    }
    console.log("  전부 통과 (차이 0 또는 허용 이내)\n");
    return 0;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  try {
    const code = await runCompare();
    process.exit(code);
  } catch (e) {
    console.error("\n  compare 실패:", e.message || e, "\n");
    process.exit(1);
  }
}
