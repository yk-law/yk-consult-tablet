/** 예약의 한국 현지 날짜·시간을 표시한다. 기기 시간대로 변환하지 않는다. */
export function customerDateParts(date, time) {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  const clock = /^(\d{2}):(\d{2})$/.exec(time || "");
  if (!day || !clock) return { dateLabel: "예약 일시를 확인해 주세요", timeLabel: "" };
  const [, year, month, dayOfMonth] = day.map(Number);
  const [, hour, minute] = clock.map(Number);
  const value = new Date(Date.UTC(year, month - 1, dayOfMonth));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== dayOfMonth || hour > 23 || minute > 59) {
    return { dateLabel: "예약 일시를 확인해 주세요", timeLabel: "" };
  }
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][value.getUTCDay()];
  return {
    dateLabel: `${year}년 ${month}월 ${dayOfMonth}일 (${weekday})`,
    timeLabel: `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${String(minute).padStart(2, "0")}`,
  };
}

export function formatCustomerDate(date, time) {
  const { dateLabel, timeLabel } = customerDateParts(date, time);
  return [dateLabel, timeLabel].filter(Boolean).join(" ");
}
