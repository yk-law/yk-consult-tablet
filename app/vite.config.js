import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* 빌드마다 달라지는 짧은 표식.
   data/*.json 과 snapshot/*.json 은 파일명에 해시가 없어서, 새로 배포해도
   브라우저가 예전 파일을 그대로 쓴다. 화면은 새것인데 데이터만 옛것이라
   알아채기 어렵다. 주소 끝에 이 값을 붙여 배포마다 새로 받게 한다. */
function buildId() {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString().trim();
  } catch {
    return String(Date.now());
  }
}

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  define: { __BUILD__: JSON.stringify(buildId()) },
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
