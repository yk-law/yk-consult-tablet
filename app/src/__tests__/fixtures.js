import bookings from "../../public/data/bookings.json";
import lawyers from "../../public/data/lawyers.json";
import fields from "../../public/data/fields.json";

/** 시연 예약만 쓴다. YK-OS 오늘(DEMO_TODAY=2026-11-02) 목록. */
export const demoBookings = bookings.filter((b) => b.date === "2026-11-02");

export const bookingByName = (name) =>
  bookings.find((b) => b.name === name) || demoBookings[0];

/** Tablet 첫 화면·여정 메뉴에 필요한 최소 data. */
export function tabletData(name = "한지우") {
  const booking = bookingByName(name);
  return {
    booking,
    counsel: booking.counsel ? { n: booking.counsel } : null,
    seniors: [],
    portraits: {},
    FIELD: fields.FIELD,
    NEAR: fields.NEAR,
    helper: { summary: [], topics: [], flow: [], ask: [], bring: [], cases: [] },
    firm: null,
  };
}

/** YK-OS 방문 예정 목록용 catalog 조각. */
export function osCatalog() {
  return {
    bookings: demoBookings,
    lawyers: lawyers.slice(0, 40),
    FIELD: fields.FIELD,
    NEAR: fields.NEAR,
  };
}
