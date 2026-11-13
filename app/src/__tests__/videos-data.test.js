import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** app/public/data/videos.json (server/data/videos.json 과 동일 내용). */
const videosPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/data/videos.json",
);
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

describe("변호사 소개 영상 데이터(videos.json) 형식", () => {
  const data = JSON.parse(readFileSync(videosPath, "utf8"));
  const clips = data.clips;

  it("clips 배열이 있고 항목마다 name·id·title 이 비어 있지 않다", () => {
    expect(Array.isArray(clips)).toBe(true);
    expect(clips.length).toBeGreaterThan(0);
    for (const clip of clips) {
      expect(typeof clip.name).toBe("string");
      expect(clip.name.trim()).not.toBe("");
      expect(typeof clip.id).toBe("string");
      expect(clip.id.trim()).not.toBe("");
      expect(typeof clip.title).toBe("string");
      expect(clip.title.trim()).not.toBe("");
    }
  });

  it("유튜브 id 는 11자 [A-Za-z0-9_-] 형식이다", () => {
    for (const clip of clips) {
      expect(clip.id).toMatch(YT_ID);
    }
  });

  it("유튜브 id·변호사 이름(name) 이 중복되지 않는다", () => {
    const ids = clips.map((c) => c.id);
    const names = clips.map((c) => c.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });
});
