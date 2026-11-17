import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import Tablet from "../Tablet.jsx";
import { tabletData } from "./fixtures.js";

// 시연 피드백 4번(2026-11-13): 상담 변호사 여러 명, 고문·전문위원도 함께 들어올 수 있다.
const lawyer = { n: "임효진", pos: "파트너변호사", kind: "lawyer", f: [], career: ["법무법인 호민 변호사"], cases: [], titles: [] };
const advisor = { n: "고기동", pos: "고문", kind: "advisor", f: [], career: ["정부기관 경력"], cases: [], titles: [] };

describe("상담에 함께하는 분이 여러 명일 때", () => {
  it("상담 변호사 화면 위에 사람마다 탭이 있고 누르면 그 사람 소개로 바뀐다", () => {
    const data = { ...tabletData("한지우"), counsel: lawyer, counsels: [lawyer, advisor] };
    render(<Tablet data={data} screen="counsel" onScreen={() => {}} />);
    const list = screen.getByRole("tablist", { name: "상담에 함께하는 분" });
    const tabs = within(list).getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector(".profile").textContent).toContain("임효진");

    fireEvent.click(tabs[1]);
    expect(within(list).getAllByRole("tab")[1].getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector(".profile").textContent).toContain("고기동");
    expect(document.querySelector(".profile").textContent).not.toContain("임효진");
  });

  it("한 명이면 탭을 두지 않는다", () => {
    const data = { ...tabletData("한지우"), counsel: lawyer };
    render(<Tablet data={data} screen="counsel" onScreen={() => {}} />);
    expect(screen.queryByRole("tablist", { name: "상담에 함께하는 분" })).toBeNull();
  });
});

describe("학력", () => {
  // 고재완 11-17: 연수원 기수가 시험·연수원 두 칸에 같이 있으면(한만수) 「사법연수원 13기사법연수원 13기」로 붙어 보였다.
  it("이력 사항 맨 아래에 두고 같은 줄은 한 번만", () => {
    const l = { ...lawyer, n: "한만수", edu: "서울대학교 법학과", exam: "사법연수원 13기", tr: "사법연수원 13기" };
    render(<Tablet data={{ ...tabletData("한지우"), counsel: l }} screen="counsel" onScreen={() => {}} />);
    const sections = [...document.querySelectorAll(".counsel-history .detail-subsection")];
    const last = sections.at(-1);
    expect(last.querySelector("h4").textContent).toBe("학력");
    expect([...last.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["서울대학교 법학과", "사법연수원 13기"]);
  });
});
