import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
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

const base = process.env.VITE_BASE || "/";

/* src/ykos 는 YK-OS 바인더#3 원본을 그대로 복사한 것이다. 원본이 쓰는 절대 경로
   /assets/visit-binder3 를 Pages 하위 경로(base)에서도 열리게 빌드 때만 바꾼다. */
function ykosAssetBase() {
  return {
    name: "ykos-asset-base",
    // TS 변환 뒤에는 따옴표가 바뀌어 찾지 못한다. 원본 그대로일 때 바꾼다.
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("/src/ykos/") || base === "/") return null;
      return code.replace(/(['"])\/assets\/visit-binder3\1/g, JSON.stringify(`${base}assets/visit-binder3`));
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), ykosAssetBase()],
  resolve: {
    // YK-OS 의 'lib/...' 가져오기를 그대로 쓴다. lib/client 만 POC 용(받아 둔 응답)이다.
    alias: { lib: fileURLToPath(new URL("./src/ykos/lib", import.meta.url)) },
  },
  define: { __BUILD__: JSON.stringify(buildId()) },
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // 첫 화면은 YK-OS 바인더#3, 이전 POC 는 old.html 에 둔다.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        old: fileURLToPath(new URL("./old.html", import.meta.url)),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.js"],
    css: false,
  },
});
