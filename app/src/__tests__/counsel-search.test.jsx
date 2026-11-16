import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import YKOS from "../YKOS.jsx";
import { osCatalog } from "./fixtures.js";

// 상담 변호사 칸은 실제 YK-OS처럼 글자를 넣어야 목록이 뜨고, 고문·전문위원도 이름·직함으로 찾는다(2026-11-16).
const advisors = [{ n: "고기동", r: "고문" }, { n: "임만영", r: "전문위원" }];

function renderOS() {
  const act = { share: vi.fn(), unshare: vi.fn(), screen: vi.fn(), pushLawyer: vi.fn(), counsel: vi.fn() };
  render(<YKOS cat={{ ...osCatalog(), advisors }} data={{}} connected={false} screen="wait" act={act} answersBy={{}} onResetAnswers={vi.fn()} />);
}

describe("상담 변호사 검색", () => {
  it("빈 칸이면 목록이 없고, 글자를 넣으면 이름·직함으로 찾는다", () => {
    renderOS();
    const input = screen.getAllByRole("textbox", { name: /상담 변호사/ })[0];
    fireEvent.focus(input);
    expect(screen.queryByRole("listbox")).toBeNull();

    fireEvent.change(input, { target: { value: "고기" } });
    expect(within(screen.getByRole("listbox")).getByRole("option").textContent).toContain("고기동");

    fireEvent.change(input, { target: { value: "전문위원" } });
    expect(within(screen.getByRole("listbox")).getByRole("option").textContent).toContain("임만영");

    fireEvent.change(input, { target: { value: "없는이름" } });
    expect(screen.getByRole("listbox").textContent).toContain("일치하는 임직원이 없습니다");
  });
});

describe("한글 입력 중 Enter", () => {
  it("조합 중 Enter는 사람을 더하지 않고, 조합이 끝난 Enter에 한 명만 더한다", () => {
    renderOS();
    const input = screen.getAllByRole("textbox", { name: /상담 변호사/ })[0];
    const box = input.closest(".vteam-box");
    const before = box.querySelectorAll(".vteam-chip").length;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "고기" } });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229, isComposing: true });
    expect(box.querySelectorAll(".vteam-chip").length).toBe(before);
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
    expect(box.querySelectorAll(".vteam-chip").length).toBe(before + 1);
    expect(box.textContent).toContain("고기동");
  });
});
