/**
 * YK 변호사 이야기 탭의 영상 목록. 법무법인 YK 재생 목록 「The Lawyer On Your Side」를 2026-11-11 에 옮겼다.
 * https://www.youtube.com/playlist?list=PL0dUw0MrEgaospa1FtIbfR6w1Hmph9NR4 (재생할 수 없는 1편은 뺐다)
 */
export const BINDER3_YOUTUBE_PLAYLIST = {
  title: 'The Lawyer On Your Side',
  // 고객 태블릿 화면(yk-consult-tablet app YoutubeStories, e620a3b)과 같은 설명. 줄마다 따로 둔다.
  description: [
    'YK 변호사들이 사건을 바라보는 관점과 상담에서 중요하게 생각하는 점을 이야기합니다.',
    '관심 있는 영상을 선택해 편하게 살펴보세요.',
  ],
};

export type Binder3YoutubeVideo = { id: string; headline: string; lawyer: string };

export const BINDER3_YOUTUBE_VIDEOS: Binder3YoutubeVideo[] = [
  { id: 't8sQ_SUJpFU', headline: '감정을 흔드는 가사사건, 균형 있는 판단으로 답합니다', lawyer: '김윤정 파트너변호사' },
  { id: 'OTCXZQqCUNM', headline: '전쟁 같은 기업분쟁, 최적의 전략으로 답합니다', lawyer: '강진구 변호사' },
  { id: 'DM5CgyjVDFs', headline: '노동법은 누군가를 처벌하기 위한 법이 아닙니다', lawyer: '조인선 변호사' },
  { id: 'IcFO4GfHYsI', headline: '부동산 분쟁은 단순히 자산의 이야기가 아닙니다', lawyer: '이민우 변호사' },
  { id: 'ShbgBc3HX5A', headline: '주·야를 가리지 않는 형사사건, 그래서 저는 먼저 움직입니다', lawyer: '조규원 변호사' },
  { id: '7g5PmEu2R0U', headline: '의뢰인의 두려움, 외면하지 않겠습니다', lawyer: '천기홍 변호사' },
  { id: '07ESKzrFfJU', headline: '형사사건의 골든타임, 놓치지 않습니다', lawyer: '이준혁 변호사' },
  { id: '18J-Ly04YWY', headline: '가장 불안한 순간, 가장 든든한 동반자', lawyer: '홍성준 변호사' },
  { id: '8RRF-Y6yhtI', headline: '이혼 후 어떤 삶을 원하시나요? 그 답이 곧 전략과 방향이 됩니다', lawyer: '조한나 변호사' },
];
