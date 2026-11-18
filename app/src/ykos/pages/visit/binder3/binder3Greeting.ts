/**
 * 상담 변호사 이름 위 한 줄 인사말(고재완 11-17·11-18, 시연 앱 app/src/greeting.js).
 * 홈페이지 인사말이 없거나 상담 화면에 어색한 사람(서버 visit_binder_counsel_service PLAIN_GREETING)은 greeting 이 비어 온다.
 * 그때 아래 후보에서 이름으로 하나를 고정해 고르고, 상담에 함께하는 분이 여럿이면 서로 겹치지 않게 다른 후보로 바꾼다.
 * 결과를 약속하는 말·수치·분야·지역은 넣지 않는다.
 */
export const BINDER3_GREETINGS = [
  '끝까지 함께 고민하겠습니다.',
  '의뢰인의 입장에서 먼저 생각하겠습니다.',
  '말씀을 충분히 듣고 방법을 찾겠습니다.',
  '어려운 순간에 곁에서 돕겠습니다.',
  '사건의 처음부터 끝까지 꼼꼼히 살피겠습니다.',
  '믿고 맡기실 수 있도록 성실히 임하겠습니다.',
  '작은 사정 하나도 놓치지 않겠습니다.',
  '가장 현실적인 해결 방법을 함께 찾겠습니다.',
  '일상을 되찾으실 때까지 함께하겠습니다.',
  '꼼꼼하게 준비하고 정직하게 말씀드리겠습니다.',
  '걱정을 덜어 드리는 변호사가 되겠습니다.',
  '편하게 말씀해 주시면 끝까지 돕겠습니다.',
] as const;

type Person = { name: string; greeting: string };

const seedOf = (name: string) =>
  [...name].reduce((n, ch) => (n * 31 + (ch.codePointAt(0) ?? 0)) >>> 0, 7);

/** 한 사람의 인사말. 홈페이지 인사말이 없으면 이름으로 고정한 후보. */
export function greetingOf(person: Person): string {
  return (
    person.greeting.trim() || BINDER3_GREETINGS[seedOf(person.name) % BINDER3_GREETINGS.length]
  );
}

/** 상담에 함께하는 분들의 인사말(같은 순서). 앞사람과 같으면 아직 안 쓴 후보로 바꾼다. */
export function teamGreetings(team: Person[]): string[] {
  const used = new Set<string>();
  return team.map((person) => {
    let greeting = greetingOf(person);
    if (used.has(greeting)) {
      const start = seedOf(person.name) % BINDER3_GREETINGS.length;
      greeting =
        BINDER3_GREETINGS.map(
          (_, i) => BINDER3_GREETINGS[(start + i) % BINDER3_GREETINGS.length]
        ).find((candidate) => !used.has(candidate)) ?? greeting;
    }
    used.add(greeting);
    return greeting;
  });
}
