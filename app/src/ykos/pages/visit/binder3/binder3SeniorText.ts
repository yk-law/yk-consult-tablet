import type { VisitBinderCounsel } from 'lib/api/api-visit-binder';

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

/** 카드용 짧은 경력 — 대괄호·괄호 안 내용을 뺀다 (yk-consult-tablet `briefCareer`). */
export function briefCareer(text: string) {
  return squash(text.replace(/\s*\[[^\]]*\]/g, '').replace(/\s*\([^)]*\)/g, ''));
}

/**
 * 전문 인력 상세 히어로 (yk-consult-tablet `specialistHero`).
 * 인사말이 대표 경력·경력과 같은 문장이면 인사말로 보이지 않는다. 대표 경력은 대표 경력·경력 앞 2개.
 */
export function specialistHero(person: VisitBinderCounsel) {
  const titles = person.titles.map(squash).filter(Boolean);
  const career = person.career.map(squash).filter(Boolean);
  const credentials = new Set([...titles, ...career]);
  const quote = squash(person.greeting);
  return {
    greeting: quote && !credentials.has(quote) ? quote : '',
    titles: [...new Set([...titles, ...career])].slice(0, 2),
  };
}
