import client from 'lib/client';

// 응답 모양은 backend/services/visit_binder_firm_service.py 의 build_firm_view 를 따른다.

export type VisitBinderFirmPerson = {
  /** 홈페이지 구성원 행 번호. 카드를 누르면 이 번호로 소개 페이지를 연다(getVisitBinderLawyer) */
  seq: number;
  name: string;
  /** 구성원 구분 (대표변호사·파트너변호사 …) */
  position: string | null;
  /** 예: 부장판사 역임 */
  title: string;
  /** lawyer.images_url 원본 경로 */
  photo: string | null;
};

export type VisitBinderFirm = {
  stats: { members: number; offices: number; centers: number; asOf: string };
  /**
   * fields: 이 묶음에 드는 업무 분야. 상담 사건 분야가 속한 묶음을 강조한다.
   * centerFields: 센터마다 업무 분야(centers 와 같은 순서). 사건 분야와 같은 센터 칩만 칠한다.
   */
  centerGroups: { title: string; centers: string[]; centerFields?: string[]; fields?: string[] }[];
  /** 탭 순서 법원 → 검찰 → 경찰 → 고문 및 전문위원 → 지사. 한 사람은 먼저 걸린 탭 하나에만 온다 */
  bench: VisitBinderFirmPerson[];
  prosecution: VisitBinderFirmPerson[];
  /** 경찰 경력 변호사 */
  policeLawyers: VisitBinderFirmPerson[];
  /** 고문. seq·photo 로 사진 카드를 그리고 누르면 소개 페이지를 연다 */
  advisors: { seq: number; name: string; label: string; photo: string | null }[];
  /** 경찰 경력 전문위원 */
  police: { seq: number; name: string; photo: string | null }[];
  expertCount: number;
  /**
   * 사무소마다 소속 변호사(앞 탭에 나온 사람 제외). 화면은 고객이 방문한 사무소 하나만 탭으로 보인다.
   * title 은 카드 줄: 대표 경력, 없으면 대한변협 등록 전문분야
   */
  offices: { office: string; people: VisitBinderFirmPerson[] }[];
  /** 구성원 전체 줄 순서(seq). 상담 변호사 칩도 이 순서로 세운다 */
  order?: number[];
};

/** 요청이 멈추면 고객 화면이 빈 채로 남지 않게 실패 안내로 넘긴다. */
export const VISIT_BINDER_FIRM_TIMEOUT_MS = 15000;

/** 바인더#3 YK 소개 — 고객과 무관한 공통 데이터 */
export const getVisitBinderFirm = async (): Promise<VisitBinderFirm> => {
  const res = await client.get<VisitBinderFirm>('/v1/visit/binder/firm', {
    timeout: VISIT_BINDER_FIRM_TIMEOUT_MS,
  });
  return res.data;
};

// 응답 모양은 backend/services/visit_binder_counsel_service.py 의 build_counsel_view 를 따른다.
export type VisitBinderCounsel = {
  /** 홈페이지 구성원 행 번호(VisitBinderFirm.order 와 맞춘다) */
  seq?: number;
  name: string;
  /** 구성원 구분 (없으면 「변호사」) */
  position: string;
  /** lawyer.images_url 원본 경로 */
  photo: string | null;
  greeting: string;
  /** 대표 경력 (예: 부장판사 역임) */
  titles: string[];
  education: string[];
  /** 사법연수원 N기 / 변호사시험 N회 */
  qualification: string | null;
  /** 주요 업무 분야 대분류 */
  fields: string[];
  performance: string[];
  /** 관련 업무 사례 (최신 8건). 분류가 없으면 href 는 null */
  works: { id: number; title: string; href: string | null }[];
  career: string[];
  awards: string[];
  papers: string[];
};

/** 바인더#3 상담 변호사 — 상담실장이 고른 변호사의 홈페이지 프로필 */
export const getVisitBinderCounsel = async (empId: number): Promise<VisitBinderCounsel> => {
  const res = await client.get<VisitBinderCounsel>(`/v1/visit/binder/counsel/${empId}`, {
    timeout: VISIT_BINDER_FIRM_TIMEOUT_MS,
  });
  return res.data;
};

/** 바인더#3 YK 소개 카드에서 고른 구성원의 홈페이지 프로필(상담 변호사와 같은 모양, 홈페이지 행 번호로 찾는다) */
export const getVisitBinderLawyer = async (seq: number): Promise<VisitBinderCounsel> => {
  const res = await client.get<VisitBinderCounsel>(`/v1/visit/binder/lawyer/${seq}`, {
    timeout: VISIT_BINDER_FIRM_TIMEOUT_MS,
  });
  return res.data;
};

// 응답 모양은 backend/services/visit_binder_seniors_service.py 의 load_seniors_view 를 따른다.
export type VisitBinderSenior = VisitBinderCounsel & { group: 'lawyer' | 'expert' };

/** 바인더#3 전문 인력 — 사건 분야에 맞는 구성원 최대 6명. 같은 seed 면 같은 사람·순서 */
export const getVisitBinderSeniors = async ({
  field,
  exclude,
  seed,
}: {
  field: string;
  /** 상담에 함께하는 사람들(전문 인력에서 뺀다) */
  exclude: number[];
  seed: string;
}): Promise<VisitBinderSenior[]> => {
  const params: Record<string, string | number> = {};
  if (field) params.field = field;
  if (exclude.length) params.exclude = exclude.join(',');
  if (seed) params.seed = seed;
  const res = await client.get<VisitBinderSenior[]>('/v1/visit/binder/seniors', {
    params,
    timeout: VISIT_BINDER_FIRM_TIMEOUT_MS,
  });
  return res.data;
};

/** 젬마를 기다리는 백엔드(30초)보다 길게 둔다. 그래야 실패해도 빈 목록 응답을 받는다. */
export const VISIT_BINDER_CONFIRM_TIMEOUT_MS = 35000;

/** 바인더#3 사건 요약 1뎁스 — 예약 때 말한 내용으로 만든 네/아니오 확인 문항. 없으면 빈 배열 */
export const getVisitBinderConfirm = async (
  engId: number,
  { reroll = false }: { reroll?: boolean } = {}
): Promise<string[]> => {
  const res = await client.get<{ questions?: unknown }>(`/v1/visit/binder/confirm/${engId}`, {
    params: reroll ? { reroll: true } : undefined,
    timeout: VISIT_BINDER_CONFIRM_TIMEOUT_MS,
  });
  const questions = res.data?.questions;
  return Array.isArray(questions)
    ? questions.filter((q): q is string => typeof q === 'string')
    : [];
};

/** 젬마가 문항 내용을 녹인 안내 설명. step·questions 는 보낸 목록의 위치 */
export type VisitBinderStepRewrite = { step: number; text: string; questions: number[] };

export type VisitBinderRewriteResult = {
  /** 콜 내용으로 고른 지위. 고르지 못하면 빈 글 */
  party: string;
  /** items 가 쓰인 지위 */
  role: string;
  items: VisitBinderStepRewrite[];
};

/** 지위 선택(1초 안팎)과 설명 생성을 차례로 기다리므로 다른 젬마 호출보다 길게 둔다. */
export const VISIT_BINDER_REWRITE_TIMEOUT_MS = 65000;

/** 바인더#3 사건 요약 2뎁스 — 콜 내용으로 지위를 고르고 그 지위 안내 설명에 1뎁스 문항을 녹인다 */
export const postVisitBinderConfirmRewrites = async (
  engId: number,
  body: {
    questions: string[];
    options: { role: string; steps: { title: string; text: string }[] }[];
  }
): Promise<VisitBinderRewriteResult> => {
  const res = await client.post<Partial<VisitBinderRewriteResult>>(
    `/v1/visit/binder/confirm/${engId}/rewrites`,
    body,
    {
      timeout: VISIT_BINDER_REWRITE_TIMEOUT_MS,
    }
  );
  return {
    party: typeof res.data?.party === 'string' ? res.data.party : '',
    role: typeof res.data?.role === 'string' ? res.data.role : '',
    items: Array.isArray(res.data?.items) ? res.data.items : [],
  };
};

// 응답 모양은 backend/services/visit_binder_case_body.py 의 load_case_body 를 따른다.
export type VisitBinderCaseBody = { title: string; html: string };

/** 바인더#3 업무 사례 본문 — 홈페이지 사례 페이지에서 본문만 정리한 것 */
// 응답 모양은 backend/services/visit_binder_related_cases.py 의 related_cases 를 따른다.
/** 소개 화면 업무사례 탭의 한 줄: 홈페이지 업무사례 (2차 내부 피드백 7) */
export type VisitBinderRelatedCase = {
  /** 홈페이지 사례 번호. 누르면 이 번호로 본문을 연다(getVisitBinderCaseBody) */
  id: number;
  title: string;
  sub: string;
  /** 예: 불송치, (전부)승소 */
  result: string;
  /** 예: 형사 / 일반사기 */
  category: string;
  /** 의뢰인 지위. 예: 피의자 */
  role: string;
  lawyers: string[];
  /** 예: 2026.10.01 */
  date: string;
};

/** 서버가 Gemma 를 30초까지 기다린다. 그보다 조금 길게. */
export const VISIT_BINDER_RELATED_TIMEOUT_MS = 40000;

/**
 * 사건 분야(홈페이지 대분류 이름)의 업무사례. 같은 세부 분류(small)를 먼저, 최신순.
 * engId 가 있으면 서버가 상담 내용과 비슷한 사례를 Gemma 로 골라 맨 앞에 둔다(실패하면 원래 순서).
 */
export const getVisitBinderRelatedCases = async ({
  field,
  small,
  engId,
}: {
  field: string;
  small: string;
  engId: number | null;
}): Promise<VisitBinderRelatedCase[]> => {
  const res = await client.get<{ items: VisitBinderRelatedCase[] }>(
    '/v1/visit/binder/related-cases',
    {
      params: engId == null ? { field, small } : { field, small, engId },
      timeout: VISIT_BINDER_RELATED_TIMEOUT_MS,
    }
  );
  return res.data.items;
};

export const getVisitBinderCaseBody = async (caseId: number): Promise<VisitBinderCaseBody> => {
  const res = await client.get<VisitBinderCaseBody>(`/v1/visit/binder/case-body/${caseId}`, {
    timeout: VISIT_BINDER_FIRM_TIMEOUT_MS,
  });
  return res.data;
};
