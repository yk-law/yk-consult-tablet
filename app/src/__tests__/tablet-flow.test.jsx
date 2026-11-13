import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import Tablet from "../Tablet.jsx";
import { tabletData } from "./fixtures.js";

describe("고객 태블릿 화면 흐름", () => {
  it("첫 화면에 이름과 띄어쓰기 뒤 '고객님, 반갑습니다.'가 보인다", () => {
    const data = tabletData("한지우");
    render(<Tablet data={data} screen="wait" onScreen={() => {}} />);
    const heading = screen.getByRole("heading", { level: 2, name: /고객님, 반갑습니다\./ });
    expect(heading.textContent).toBe("한지우 고객님, 반갑습니다.");
    expect(heading.querySelector(".client-name")?.textContent).toBe("한지우");
  });

  it("하단/좌측 메뉴에 'YK 변호사 이야기'가 있고 누르면 유튜브 목록이 열린다", () => {
    const data = tabletData("한지우");
    const onScreen = vi.fn();
    const { rerender } = render(
      <Tablet data={data} screen="firm" onScreen={onScreen} />,
    );

    const nav = screen.getByRole("navigation", { name: "상담 안내" });
    const youtubeBtn = within(nav).getByRole("button", { name: "YK 변호사 이야기" });
    fireEvent.click(youtubeBtn);
    expect(onScreen).toHaveBeenCalledWith("youtube");

    rerender(<Tablet data={data} screen="youtube" onScreen={onScreen} />);
    expect(screen.getByRole("region", { name: "YK 변호사 이야기" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "The Lawyer On Your Side" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /영상 보기/ }).length).toBeGreaterThan(0);
  });

  it("사이드바 YourK QR 안내에 '상담 기록과 사건 진행은'이 보인다", () => {
    const data = tabletData("오세린");
    render(<Tablet data={data} screen="firm" onScreen={() => {}} />);
    const nav = screen.getByRole("navigation", { name: "상담 안내" });
    expect(nav.textContent).toContain("상담 기록과 사건 진행은");
    expect(within(nav).getByAltText("YourK 접속 QR코드")).toBeTruthy();
  });
});
