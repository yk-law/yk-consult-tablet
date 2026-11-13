import { describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import Tablet from "../Tablet.jsx";
import { tabletData } from "./fixtures.js";

/** Tablet.jsx JOURNEY 와 동일한 시연 메뉴. */
const JOURNEY = [
  ["firm", "법무법인 YK 소개"],
  ["report", "사건 요약"],
  ["counsel", "상담 변호사"],
  ["seniors", "전문 인력"],
  ["youtube", "YK 변호사 이야기"],
];

describe("고객 태블릿 상담 안내 메뉴", () => {
  it("시연 메뉴 항목이 모두 렌더되고 누르면 onScreen 이 해당 화면 키로 불린다", () => {
    const data = tabletData("한지우");
    const onScreen = vi.fn();
    render(<Tablet data={data} screen="firm" onScreen={onScreen} />);

    const nav = screen.getByRole("navigation", { name: "상담 안내" });
    for (const [id, label] of JOURNEY) {
      expect(within(nav).getByRole("button", { name: label })).toBeTruthy();
    }

    for (const [id, label] of JOURNEY) {
      onScreen.mockClear();
      fireEvent.click(within(nav).getByRole("button", { name: label }));
      expect(onScreen).toHaveBeenCalledWith(id);
    }
  });
});
