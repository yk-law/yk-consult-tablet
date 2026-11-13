import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Tablet from "../Tablet.jsx";
import firmIntro from "../../public/data/firm_intro.json";
import { tabletData } from "./fixtures.js";

// 시연 피드백 5·6번(2026-11-13): 법무법인 YK 소개를 탭 4개로 나누고, 전문 센터는 어느 탭이든 맨 아래에 둔다.
const firm = { ...firmIntro, bench: [{ n: "가판사", pos: "변호사", title: "부장판사" }], prosecution: [{ n: "나검사", pos: "변호사", title: "부장검사" }] };
const helper = { summary: [], topics: [], flow: [], ask: [], bring: [], cases: [{ t: "상간소송 방어", r: "전부 승소", tag: "민사", href: "https://www.yklawfirm.co.kr/case-study/1" }] };

describe("법무법인 YK 소개 탭", () => {
  it("탭 4개가 있고 고르면 내용이 바뀌며 전문 센터는 늘 맨 아래에 있다", () => {
    render(<Tablet data={{ ...tabletData("한지우"), firm, helper }} screen="firm" onScreen={() => {}} />);
    const tabs = within(screen.getByRole("tablist", { name: "법무법인 YK 구성원과 업무사례" })).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["법원 경력 변호사", "검찰 경력 변호사", "고문 및 전문위원", "업무사례"]);
    expect(screen.getByRole("tabpanel").textContent).toContain("가판사");

    fireEvent.click(tabs[2]);
    const panel = screen.getByRole("tabpanel");
    expect(panel.querySelectorAll(".firm-person img").length).toBeGreaterThan(0);

    fireEvent.click(tabs[3]);
    expect(screen.getByRole("tabpanel").textContent).toContain("상간소송 방어");
    expect(screen.getByRole("tabpanel").nextElementSibling.querySelector("#firm-centers")).toBeTruthy();
  });
});

describe("이전·다음 플로팅 버튼", () => {
  // 시연 피드백 3번(2026-11-13): 모든 탭에서 .tablet-content 기준 같은 자리, 메뉴를 비켜 둔다.
  const css = readFileSync(resolve(__dirname, "../styles.css"), "utf-8");
  it("버튼은 하단·왼쪽 메뉴 크기만큼 비켜 같은 자리에 뜬다", () => {
    expect(css).toMatch(/\.report-next button \{\s*position:absolute;z-index:30;bottom:calc\(24px \+ var\(--float-bottom, 0px\)\)/);
    expect(css).toMatch(/left:calc\(var\(--float-left, 0px\) \+ var\(--float-side, 40px\)\)/);
    expect(css).toMatch(/--float-bottom:calc\(56px \+ env\(safe-area-inset-bottom, 0px\)\)/);
    expect(css).toMatch(/--float-left:200px; --float-bottom:0px;/);
  });
  it("버튼보다 업무 사례·영상 팝업이 위에 있다", () => {
    expect(css).toMatch(/\.case-modal \{z-index:50;\}/);
    expect(css).not.toMatch(/\.viewscr\s*\{[^}]*position:relative/);
  });
});
