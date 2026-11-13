import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import Tablet from "../Tablet.jsx";
import { bookingByName, tabletData } from "./fixtures.js";

function SummaryTablet({ name = "한지우" }) {
  const [answers, setAnswers] = useState({});
  const booking = bookingByName(name);
  const data = tabletData(name);
  data.helper = {
    ...data.helper,
    summary: booking.summary || [],
  };
  return (
    <Tablet
      data={data}
      screen="report"
      onScreen={() => {}}
      answers={answers}
      onAnswer={(i, v) => setAnswers((prev) => ({ ...prev, [i]: v }))}
    />
  );
}

describe("사건 요약 1뎁스 다음 버튼", () => {
  it("다음 버튼은 항상 보이고 1뎁스 답을 다 고르기 전에는 꺼져 있다", () => {
    render(<SummaryTablet />);

    const next = screen.getByRole("button", { name: "상담에서 함께 볼 내용" });
    expect(next).toBeTruthy();
    expect(next.disabled).toBe(true);

    const groups = screen.getAllByRole("group", { name: /번 확인/ });
    expect(groups.length).toBeGreaterThan(0);

    // 일부만 고르면 여전히 꺼져 있다.
    fireEvent.click(within(groups[0]).getByRole("button", { name: "네" }));
    expect(screen.getByRole("button", { name: "상담에서 함께 볼 내용" }).disabled).toBe(true);

    for (const group of groups) {
      const yes = within(group).getByRole("button", { name: "네" });
      if (yes.getAttribute("aria-pressed") !== "true") {
        fireEvent.click(yes);
      }
    }

    expect(screen.getByRole("button", { name: "상담에서 함께 볼 내용" }).disabled).toBe(false);
  });
});
