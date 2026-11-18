/** 고객 사이드바 메뉴. 켜짐은 PageVisitTabletBinder3 의 메뉴↔화면 표(JOURNEY_VIEWS)가 정한다. */
export type Binder3JourneyId = 'firm' | 'report' | 'counsel' | 'cases' | 'youtube';

export const BINDER3_JOURNEY: readonly (readonly [Binder3JourneyId, string])[] = [
  ['firm', '법무법인 YK 소개'],
  ['report', '사건 요약'],
  ['counsel', '상담 변호사'],
  // 「전문 인력」 자리를 업무사례로 바꿨다(고재완 11-18, 2차 내부 시연 피드백)
  ['cases', '업무사례'],
  // 법무법인 YK 변호사 소개 영상 (바인더#3 예시 메뉴 이름과 같게)
  ['youtube', 'YK 변호사 이야기'],
];

const JOURNEY_IDS = new Set<string>(BINDER3_JOURNEY.map(([id]) => id));

/** 사이드바로 오가는 탐색 화면인지 */
export function isBinder3JourneyId(step: string): step is Binder3JourneyId {
  return JOURNEY_IDS.has(step);
}
