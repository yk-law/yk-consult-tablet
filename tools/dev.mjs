#!/usr/bin/env node
/* 라이브 리로드 개발 서버 — 외부 의존성 0.
   실행:  node tools/dev.mjs        →  http://localhost:5173
   app/ 아래 파일을 저장하면 브라우저가 스스로 새로고침한다. */
import http from 'node:http';
import { readFile, watch, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? 'app');
const PORT = Number(process.env.PORT ?? 5173);
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };

const clients = new Set();
const RELOAD = `<script>
(()=>{const s=new EventSource('/__reload');
 s.onmessage=e=>{if(e.data==='reload')location.reload();};
 s.onerror=()=>setTimeout(()=>location.reload(),1200);})();
</script>`;

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/__reload') {
    res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    res.write('retry: 500\n\n'); clients.add(res); req.on('close',()=>clients.delete(res)); return;
  }
  const file = join(ROOT, url === '/' ? 'index.html' : decodeURIComponent(url));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  try {
    await stat(file);
    let body = await readFile(file);
    const ext = extname(file);
    if (ext === '.html') body = Buffer.from(body.toString('utf8').replace('</body>', RELOAD + '\n</body>'));
    res.writeHead(200, {'Content-Type': MIME[ext] ?? 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
}).listen(PORT, () => {
  console.log(`\n  YK 온라인 바인더 — 개발 서버`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  ${ROOT} 를 지켜보는 중. 저장하면 브라우저가 새로고침됩니다.\n`);
});

let t;
(async () => {
  for await (const ev of watch(ROOT, { recursive: true })) {
    if (!/\.(html|css|js)$/.test(ev.filename ?? '')) continue;
    clearTimeout(t);
    t = setTimeout(() => {
      console.log(`  ↻ ${ev.filename}`);
      for (const c of clients) c.write('data: reload\n\n');
    }, 60);
  }
})();
