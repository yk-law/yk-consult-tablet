#!/usr/bin/env node
/* FastAPI(8000) + Vite(5173). 실행: node tools/dev.mjs */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NODE = "/tmp/node-v22.14.0-darwin-arm64/bin";
const env = { ...process.env };
if (existsSync(NODE)) env.PATH = `${NODE}:${env.PATH || ""}`;

const kids = [];
function run(cmd, args, cwd) {
  const p = spawn(cmd, args, { cwd, env, stdio: "inherit" });
  kids.push(p);
  return p;
}
function stop() {
  for (const p of kids) p.kill();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

console.log("\n  YK 온라인 바인더 — React + FastAPI");
console.log("  API  http://127.0.0.1:8000");
console.log("  WEB  http://localhost:5173\n");

const api = run("python3", ["-m", "uvicorn", "server.main:app", "--reload", "--port", "8000"], ROOT);
const web = run("npm", ["run", "dev"], resolve(ROOT, "app"));
api.on("exit", (c) => { web.kill(); process.exit(c ?? 0); });
web.on("exit", (c) => { api.kill(); process.exit(c ?? 0); });
