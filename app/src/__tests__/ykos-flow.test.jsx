import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { osCatalog, bookingByName } from "./fixtures.js";

async function loadYKOS() {
  vi.resetModules();
  const mod = await import("../YKOS.jsx");
  return mod.default;
}

function renderOS(YKOS, actOverrides = {}) {
  const cat = osCatalog();
  const withLawyer = bookingByName("한지우");
  const act = {
    share: vi.fn(),
    unshare: vi.fn(),
    screen: vi.fn(),
    pushLawyer: vi.fn(),
    counsel: vi.fn(),
    ...actOverrides,
  };
  const view = render(
    <YKOS
      cat={cat}
      data={{ booking: withLawyer, counsel: { n: withLawyer.counsel } }}
      connected={false}
      screen="wait"
      act={act}
      answersBy={{}}
      onResetAnswers={vi.fn()}
    />,
  );
  return { ...view, act, cat };
}

function cardByName(name) {
  const who = screen.getByText(name, { selector: ".vn" });
  return who.closest(".vcard");
}

describe("상담실장 YK-OS 바인더 흐름", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("변호사가 없는 행의 '바인더 열기'는 꺼져 있고 안내 문구가 보인다", async () => {
    const YKOS = await loadYKOS();
    renderOS(YKOS);

    const card = cardByName("문태오");
    expect(card).toBeTruthy();
    const binder = within(card).getByRole("button", { name: /바인더 열기/ });
    expect(binder.disabled).toBe(true);
    expect(within(card).getByText("상담 변호사를 지정하면 바인더를 열 수 있습니다.")).toBeTruthy();
  });

  it("태블릿 선택 후 고객화면이 꺼진 상태에서 변호사가 있는 행의 '바인더 열기'는 안내 창 없이 화면 스위치를 켠다", async () => {
    const YKOS = await loadYKOS();
    const { act } = renderOS(YKOS);

    fireEvent.click(screen.getByRole("button", { name: /미러링|상담 태블릿 선택/ }));
    const menu = screen.getByRole("menu");
    const tabletItem = within(menu).getAllByRole("menuitem")[0];
    fireEvent.click(tabletItem);

    const displaySwitch = await screen.findByRole("switch", { name: "태블릿 화면 켜기/끄기" });
    expect(displaySwitch.getAttribute("aria-checked")).toBe("false");

    const card = cardByName("한지우");
    const binder = within(card).getByRole("button", { name: /바인더 열기/ });
    expect(binder.disabled).toBe(false);
    fireEvent.click(binder);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(displaySwitch.getAttribute("aria-checked")).toBe("true");
    });
    expect(act.share).toHaveBeenCalled();
  });
});
