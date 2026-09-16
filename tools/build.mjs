#!/usr/bin/env node
/* app/ 을 단일 HTML 파일로 합친다 — 아티팩트 게시·공유·태블릿 반입용.
   실행:  node tools/build.mjs   →  dist/yk-binder-app.html
   아티팩트는 <html>/<head>/<body> 없이 본문만 받으므로 그 형태로 뽑는다. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const APP = 'app', OUT = 'dist/yk-binder-app.html';
let html = await readFile(join(APP, 'index.html'), 'utf8');

const css = await readFile(join(APP, 'styles.css'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="styles\.css[^"]*">/, `<style>\n${css}</style>`);

for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]) {
  const file = m[1].split('?')[0];
  const code = await readFile(join(APP, file), 'utf8');
  html = html.replace(m[0], `<script>\n${code}</script>`);
}

// 아티팩트용: 문서 껍데기 제거
html = html.replace(/^[\s\S]*?<title>/, '<title>')
           .replace(/<\/head>\s*<body[^>]*>/i, '')
           .replace(/<\/body>\s*<\/html>\s*$/i, '')
           .replace(/<meta[^>]*>\s*/g, '');

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, html);
console.log(`  ✓ ${OUT}  ${(Buffer.byteLength(html)/1024).toFixed(0)} KB`);
console.log(`    → 이 파일을 아티팩트로 게시하거나 그대로 열어 시연하면 됩니다.`);
