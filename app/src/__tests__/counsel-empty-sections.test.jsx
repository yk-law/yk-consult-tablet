import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import Tablet from "../Tablet.jsx";
import { tabletData } from "./fixtures.js";
import lawyers from "../../public/data/lawyers.json";
import profileExtra from "../../public/data/profile_extra.json";

/** server/catalog.py public_profile 와 같은 고객용 프로필 모양. */
function counselFromName(name) {
  const raw = lawyers.find((l) => l.n === name);
  if (!raw) throw new Error(`lawyer not found: ${name}`);
  const d = raw.d || {};
  const bits = profileExtra[name] || {};
  return {
    n: raw.n,
    pos: raw.pos,
    o: raw.o || "",
    f: raw.f || [],
    edu: d.edu || "",
    exam: d.exam || "",
    tr: d.tr || "",
    career: d.career || [],
    cases: d.cases || [],
    awards: bits.awards || [],
    works: bits.works || [],
    areas: bits.areas || [],
    papers: bits.papers || [],
    titles: d.titles || [],
    pitch: (d.quote || "").trim() || "내 일처럼 진심을 다하겠습니다.",
    kind: "lawyer",
  };
}

function renderCounsel(name) {
  const data = tabletData("조은호");
  data.counsel = counselFromName(name);
  data.booking = { ...data.booking, counsel: name, field: data.booking.field || (data.counsel.f[0] || "") };
  return render(<Tablet data={data} screen="counsel" onScreen={() => {}} />);
}

/** Hero가 보이면 프로필 카드가 aria-hidden이라 hidden:true 로 목차를 읽는다. */
async function counselIndex() {
  return waitFor(() =>
    screen.getByRole("navigation", { name: "소개 목차", hidden: true }),
  );
}

beforeAll(() => {
  class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  class FakeIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

describe("상담 변호사 상세 빈 항목 숨김", () => {
  it("업무 실적이 없는 변호사 상세에서는 제목과 소메뉴에 주요 업무 실적이 없다", async () => {
    renderCounsel("김진주");
    expect(counselFromName("김진주").cases).toHaveLength(0);

    expect(screen.queryByRole("heading", { level: 4, name: "주요 업무 실적" })).toBeNull();

    const index = await counselIndex();
    expect(within(index).queryByRole("button", { name: "주요 업무 실적", hidden: true })).toBeNull();
    expect(index.textContent).not.toContain("주요 업무 실적");
  });

  it("업무 실적이 있는 변호사 상세에서는 제목과 소메뉴에 주요 업무 실적이 있다", async () => {
    renderCounsel("김영지");
    expect(counselFromName("김영지").cases.length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 4, name: "주요 업무 실적" })).toBeTruthy();

    const index = await counselIndex();
    expect(within(index).getByRole("button", { name: "주요 업무 실적", hidden: true })).toBeTruthy();
  });

  it("경력이 없는 변호사 상세에서는 주요 경력 제목과 소메뉴가 없다", async () => {
    renderCounsel("김영지");
    expect(counselFromName("김영지").career).toHaveLength(0);

    expect(screen.queryByRole("heading", { level: 4, name: "주요 경력" })).toBeNull();

    const index = await counselIndex();
    expect(within(index).queryByRole("button", { name: "주요 경력", hidden: true })).toBeNull();
  });
});

describe("사건 요약 진행 순서 안내", () => {
  it("일반적인 진행 순서 아래에 안내 문구가 정확히 보인다", () => {
    const data = tabletData("한지우");
    data.helper = {
      ...data.helper,
      summary: [],
      flow: [
        ["상담", "상황을 듣습니다."],
        ["협의", "합의를 살펴봅니다."],
        ["소송", "필요하면 청구합니다."],
        ["정리", "결과까지 챙깁니다."],
      ],
    };
    render(<Tablet data={data} screen="topics" onScreen={() => {}} />);

    expect(screen.getByRole("heading", { name: "일반적인 진행 순서" })).toBeTruthy();
    const note = document.querySelector(".yh-flow-note");
    expect(note).toBeTruthy();
    expect(note.textContent).toBe(
      "실제 절차와 기간은 사건마다 다르며, 선임 계약 후 담당 변호사가 다시 안내합니다.",
    );
  });
});
