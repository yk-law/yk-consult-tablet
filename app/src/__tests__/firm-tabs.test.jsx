import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Tablet from "../Tablet.jsx";
import firmIntro from "../../public/data/firm_intro.json";
import { tabletData } from "./fixtures.js";

// 2차 내부 시연(2026-11-17): YK 소개 탭은 법원·검찰·경찰 경력 변호사와 지사 소속 변호사, 전문 센터는 늘 맨 아래.
// 업무사례는 「전문 인력」 자리의 업무사례 화면으로 옮겼다.
const firm = {
  ...firmIntro,
  bench: [{ n: "가판사", pos: "변호사", title: "부장판사 역임" }],
  prosecution: [{ n: "나검사", pos: "변호사", title: "부장검사 역임" }],
  policeLawyers: [{ n: "다경찰", pos: "변호사", title: "경찰 경력" }],
  branches: [{ office: "수원 분사무소", people: [{ n: "라지사", pos: "변호사", title: "수원 분사무소" }] }],
};
const helper = { summary: [], topics: [], flow: [], ask: [], bring: [], cases: [] };
// 업무사례는 홈페이지 업무사례 모양(tools/firm_cases_refresh.py). 5건씩 보이고 「더 보기」로 늘린다.
const firmCases = Array.from({ length: 7 }, (_, i) => ({
  id: String(i), key: "civil", cat: "민사 / 상간", role: "피고", title: i ? `사례 ${i}` : "상간소송 방어", sub: "부제",
  date: "2026.11.02", lawyers: ["임효진"], result: "전부승소", body: ["본문"],
}));

describe("법무법인 YK 소개 탭", () => {
  it("법원·검찰·경찰·고문 및 전문위원 탭이 있고 고르면 내용이 바뀌며 전문 센터는 늘 맨 아래에 있다", () => {
    render(<Tablet data={{ ...tabletData("한지우"), firm, helper }} screen="firm" onScreen={() => {}} />);
    const tabs = within(screen.getByRole("tablist", { name: "법무법인 YK 구성원" })).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["법원 경력 변호사", "검찰 경력 변호사", "경찰 경력 변호사", "고문 및 전문위원"]);
    expect(screen.getByRole("tabpanel").textContent).toContain("가판사");
    fireEvent.click(tabs[2]);
    expect(screen.getByRole("tabpanel").textContent).toContain("다경찰");
    fireEvent.click(tabs[3]);
    expect(screen.getByRole("tabpanel").querySelectorAll(".firm-person img").length).toBeGreaterThan(0);
    expect(screen.getByRole("tabpanel").nextElementSibling.querySelector("#firm-centers")).toBeTruthy();
  });

  it("방문한 곳이 분사무소면 그 분사무소 변호사 탭이 하나 더 생긴다", () => {
    const data = tabletData("한지우");
    render(<Tablet data={{ ...data, booking: { ...data.booking, branch: "수원 분사무소 1번 상담실" }, firm, helper }} screen="firm" onScreen={() => {}} />);
    const tabs = within(screen.getByRole("tablist", { name: "법무법인 YK 구성원" })).getAllByRole("tab");
    expect(tabs.at(-1).textContent).toBe("수원 분사무소 변호사");
    fireEvent.click(tabs.at(-1));
    expect(screen.getByRole("tabpanel").textContent).toContain("라지사");
  });
});

describe("구성원이 많은 탭", () => {
  it("24명씩 쪽을 나누고 쪽 번호로 넘긴다", () => {
    const many = { ...firm, branches: [{ office: "서울 강남 주사무소", people: Array.from({ length: 30 }, (_, i) => ({ n: `강남${i + 1}`, pos: "변호사", title: "서울 강남 주사무소" })) }] };
    render(<Tablet data={{ ...tabletData("한지우"), firm: many, helper }} screen="firm" onScreen={() => {}} />);
    fireEvent.click(within(screen.getByRole("tablist", { name: "법무법인 YK 구성원" })).getByRole("tab", { name: "서울 강남 주사무소 변호사" }));
    const panel = screen.getByRole("tabpanel");
    expect(panel.querySelectorAll(".firm-person")).toHaveLength(24);
    const pager = within(panel).getByRole("navigation", { name: "구성원 목록 쪽" });
    fireEvent.click(within(pager).getByRole("button", { name: "2" }));
    expect(panel.querySelectorAll(".firm-person")).toHaveLength(6);
    expect(panel.textContent).toContain("강남30");
    expect(within(pager).getByRole("button", { name: "다음 쪽" }).disabled).toBe(true);
  });
});

describe("업무사례 화면", () => {
  it("이 사건 분야 사례만 5건씩, 더 보기로 늘린다", () => {
    render(<Tablet data={{ ...tabletData("한지우"), firm, helper, firmCases }} screen="cases" onScreen={() => {}} />);
    const pane = document.querySelector(".casespane");
    expect(pane.querySelectorAll(".firm-case")).toHaveLength(5);
    fireEvent.click(within(pane).getByRole("button", { name: /업무사례 더 보기/ }));
    expect(pane.querySelectorAll(".firm-case")).toHaveLength(7);
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
