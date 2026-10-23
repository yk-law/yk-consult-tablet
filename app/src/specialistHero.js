// Current-design representative credentials approved for member introductions.
const representativeTitles = {
  "강성용": "국무총리비서실 민정비서관 역임",
  "강신선": "경찰 경력",
};
export function specialistHeadline(person) {
  return representativeTitles[person.n] || person.titles?.[0] || (person.o ? `${person.o} 출신` : "");
}

// Only source quotes are greetings; catalog-generated career pitches remain credentials.
export function specialistHero(person) {
  const clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  const titles = (person.titles || []).map(clean).filter(Boolean);
  const career = (person.career || []).map(clean).filter(Boolean);
  const credentials = new Set([...titles, ...career, clean(person.o)].filter(Boolean));
  const quote = clean(person.quote);
  const pitch = clean(person.pitch);
  const greeting = quote && !credentials.has(quote) ? quote : "";
  const moved = [quote, pitch].filter((text) => text && credentials.has(text));
  return { greeting, titles: representativeTitles[person.n] ? [representativeTitles[person.n]] : [...new Set([...titles, ...moved, ...career])].slice(0, 2) };
}
