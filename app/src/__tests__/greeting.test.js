import { describe, expect, it } from "vitest";
import { GREETINGS, greetingOf, teamGreetings } from "../greeting.js";

// 고재완 11-17: 어색하거나 없는 인사말은 후보 문구로, 상담에 함께하는 분끼리는 겹치지 않게.
describe("상담 변호사 인사말", () => {
  it("홈페이지 인사말이 있으면 그대로, 없으면 이름으로 고정한 후보", () => {
    expect(greetingOf({ n: "가", pitch: "끝까지 돕겠습니다." })).toBe("끝까지 돕겠습니다.");
    const g = greetingOf({ n: "나", pitch: "" });
    expect(GREETINGS).toContain(g);
    expect(greetingOf({ n: "나", pitch: "" })).toBe(g);
  });

  it("고문의 경력 줄은 인사말로 쓰지 않는다", () => {
    expect(GREETINGS).toContain(greetingOf({ n: "다", kind: "advisor", quote: "경찰 수사관", pitch: "경찰 수사관", career: ["경찰 수사관"] }));
  });

  it("여러 명이면 같은 말이 두 번 나오지 않는다", () => {
    const same = { pitch: "의뢰인을 위하여 최선을 다하겠습니다." };
    const team = [{ n: "가", ...same }, { n: "나", ...same }, { n: "다", pitch: "" }, { n: "라", pitch: "" }];
    const out = Object.values(teamGreetings(team));
    expect(new Set(out).size).toBe(4);
    expect(out[0]).toBe(same.pitch);
  });
});
