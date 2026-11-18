/** 바인더#3 태블릿 화면에 넘기는 값. 화면 문구는 쿼리로, YK 소개·상담 변호사 데이터는 API 로 받는다. */
export type Binder3QueryInput = {
  engId?: number | string | null;
  customerName?: string | null;
  /** engagement.will_visit_date (한국 현지 시각) */
  visitAt?: string | null;
  /** 방문 예정 사무소 이름 */
  office?: string | null;
  /** 게이트웨이 태블릿 세션 이름 (예: 상담실 301호) */
  room?: string | null;
  /** YK-OS 에서 고른 상담 변호사 emp_id (회차 5) */
  /** 상담에 함께하는 사람 emp_id, 고른 순서(2차 내부 피드백 8) */
  counselEmpIds?: number[];
  /** 사건의 홈페이지 분류(incident_category.homepage_category_1). 같은 이름의 업무 분야를 강조한다 */
  caseField?: string | null;
  /** 사건 분류 소·중분류 — 사건 요약 2뎁스 안내를 찾는다 */
  caseSmall?: string | null;
  caseMiddle?: string | null;
  t?: number;
};

const VISIT_AT_FALLBACK = { dateLabel: '예약 일시를 확인해 주세요', timeLabel: '' };
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const clean = (value: unknown) => String(value ?? '').trim();

/**
 * 예약 일시를 `2026년 10월 22일 (목)` / `오후 1:15` 로 나눈다.
 * 한국 현지 값을 문자열 그대로 읽고, 기기 시간대로 바꾸지 않는다.
 */
export function formatVisitAt(value: string | null | undefined) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(clean(value));
  if (!m) return VISIT_AT_FALLBACK;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return VISIT_AT_FALLBACK;
  }
  return {
    dateLabel: `${year}년 ${month}월 ${day}일 (${WEEKDAYS[date.getUTCDay()]})`,
    timeLabel: `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(minute).padStart(
      2,
      '0'
    )}`,
  };
}

/** 상담실장 쪽: 태블릿 URL 쿼리. 빈 값은 싣지 않는다. */
export function buildBinder3Query(input: Binder3QueryInput) {
  const visitAt = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(clean(input.visitAt));
  const query: Record<string, string | number> = {};
  if (input.engId != null && input.engId !== '') query.engId = input.engId;
  const customerName = clean(input.customerName);
  if (customerName) query.customerName = customerName;
  if (visitAt) query.visitAt = `${visitAt[1]} ${visitAt[2]}`;
  const office = clean(input.office);
  if (office) query.office = office;
  const room = clean(input.room);
  if (room) query.room = room;
  if (input.counselEmpIds?.length) query.counsel = input.counselEmpIds.join(',');
  const caseField = clean(input.caseField);
  if (caseField) query.field = caseField;
  const caseSmall = clean(input.caseSmall);
  if (caseSmall) query.caseSmall = caseSmall;
  const caseMiddle = clean(input.caseMiddle);
  if (caseMiddle) query.caseMiddle = caseMiddle;
  if (input.t != null) query.t = input.t;
  return query;
}

/** 양의 정수 문자열만 숫자로, 나머지는 null */
function positiveInt(value: string | null) {
  const text = clean(value);
  return /^[1-9]\d*$/.test(text) ? Number(text) : null;
}

/** 쉼표로 이은 양의 정수들. 순서대로 한 번씩, 아닌 것은 뺀다(예: counsel=905,12). */
function positiveIntList(value: string | null): number[] {
  const out: number[] = [];
  for (const part of clean(value).split(',')) {
    const n = positiveInt(part);
    if (n != null && !out.includes(n)) out.push(n);
  }
  return out;
}

/** 태블릿 쪽: 쿼리를 화면 문구로 바꾼다. */
export function parseBinder3Query(params: URLSearchParams) {
  const office = clean(params.get('office'));
  const room = clean(params.get('room'));
  const { dateLabel, timeLabel } = formatVisitAt(params.get('visitAt'));
  return {
    engId: positiveInt(params.get('engId')),
    customerName: clean(params.get('customerName')),
    /** 방문 사무소 이름(예: 인천 분사무소). YK 소개의 방문 지사 변호사 탭을 고른다 */
    office,
    room,
    placeLabel: [office, room].filter(Boolean).join(' '),
    visitLabel: [dateLabel, timeLabel].filter(Boolean).join(' '),
    counselEmpIds: positiveIntList(params.get('counsel')),
    caseField: clean(params.get('field')),
    caseSmall: clean(params.get('caseSmall')),
    caseMiddle: clean(params.get('caseMiddle')),
    /** 바인더#3 를 누를 때마다 바뀌는 값 — 전문 인력 랜덤 씨앗 */
    seed: clean(params.get('t')),
  };
}

/**
 * 사건 분류(incident_category.homepage_category_1)가 예전 홈페이지 이름으로 남아 있어 지금 홈페이지
 * 업무 분야 대분류와 이름이 다른 것. DB 값은 그대로 두고 여기서 맞춘다(회차 7 분석, 최근 1년 상담의 약 42%).
 * 「도산(회생,파산)」은 가장 가까운 「법인 회생·파산」이 법인 대상이라 정해질 때까지 맞추지 않는다.
 */
const CASE_FIELD_ALIASES: Record<string, string> = {
  '민사·행정': '민사',
  '가사상속(가업승계)': '가사상속',
  '부동산/건설': '부동산·건설',
  기업: '기업법무',
  군법무: '군형사',
};

/** 형사 중분류 → 홈페이지 업무 분야. 값이 있는 사건유형들이 쓰는 이름과 같다(로컬 2026-11-16). */
const CRIMINAL_MIDDLE_FIELDS: Record<string, string> = {
  성범죄: '성범죄',
  교통범죄: '교통사고',
  마약범죄: '마약',
  군형사: '군형사',
  학교폭력: '학교폭력',
  강력범죄: '형사',
  일반형사: '형사',
  경제범죄: '형사',
  부패범죄: '형사',
  도박: '형사',
  소년사건: '형사',
};

/** 대분류 → 홈페이지 업무 분야(가사·형사·기업은 아래에서 따로 본다). */
const MAJOR_FIELDS: Record<string, string> = {
  민사: '민사',
  '부동산/건설': '부동산·건설',
  '노동/산재': '노동·산업재해',
  의료: '의료',
  조세: '조세',
};

/**
 * homepage_category_1 이 빈 사건유형(300개 중 117개, 로컬 2026-11-16)은 대분류·중분류·소분류 이름으로 그 자리에서 정한다.
 * DB 에는 채우지 않는다(사용자 결정). 값이 있는 사건유형의 (대분류, 중분류) → 홈페이지 이름과 같은 규칙이다.
 * 가사는 소분류에 이혼·재산분할이 있으면 이혼, 나머지는 가사상속. 기업 회생·파산은 「도산(회생,파산)」과 같은 까닭으로 정하지 않는다.
 */
function fieldFromCategoryNames(major: string, middle: string, small: string): string | null {
  if ([middle, small].includes('기존데이터')) return null;
  if (major === '가사') return /이혼|재산분할/.test(small) ? '이혼' : small ? '가사상속' : null;
  if (major === '형사') return CRIMINAL_MIDDLE_FIELDS[middle] ?? null;
  if (major === '기업') return /회생|파산/.test(small) || !small ? null : '기업법무';
  return MAJOR_FIELDS[major] ?? null;
}

/**
 * 상담 변호사 강조·전문 인력 고르기·업무사례 탭에 쓸 사건 분류(홈페이지 업무 분야 대분류 이름).
 * 업무 분야는 홈페이지 분류(형사·성범죄·이혼 …)라 사건의 homepage_category_1 과 비교한다.
 * YK-OS 대분류(major_category: 형사)만으로 대신하지 않는다 — 성범죄 사건에 「형사」가 강조되면 안 된다.
 * homepage_category_1 이 비었을 때만 중분류·소분류까지 보고 정한다(fieldFromCategoryNames).
 */
export function binder3CaseField(
  category:
    | {
        homepage_category_1?: string | null;
        major_category?: string | null;
        middle_category?: string | null;
        small_category?: string | null;
      }
    | null
    | undefined
) {
  const name = clean(category?.homepage_category_1);
  if (name) return CASE_FIELD_ALIASES[name] ?? name;
  return fieldFromCategoryNames(
    clean(category?.major_category),
    clean(category?.middle_category),
    clean(category?.small_category)
  );
}

/** 사무소 목록(서울 강남 주사무소 + 이 분사무소들)에 있는 지사만 보인다. 이름은 organization.org_name 과 같다. */
const BRANCH_OFFICES = new Set(
  (
    '강릉 고양 광주 구미 군산 남양주 대구 대전 동탄 목포 부산 부천 분당 수원 순천 ' +
    '안산 안양 울산 원주 의정부 인천 전주 제주 진주 창원 천안 청주 춘천 평택 포항'
  ).split(' ')
);

/**
 * 바인더에 보이는 방문 지사 이름(오른쪽 위·첫 확인 화면). 사무소 목록에 맞춘다.
 * 본사 계열(지사 코드가 00 으로 시작: 본사·기업총괄·건설부동산·노동중대재해·해외사업 그룹)은 「서울 강남 주사무소」,
 * 목록에 있는 지사는 「OO 분사무소」, 목록에 없는 곳(기타 등)은 보이지 않는다.
 */
export function binder3OfficeLabel(
  orgCode: string | null | undefined,
  orgName: string | null | undefined
): string | null {
  const code = String(orgCode || '').trim();
  if (!code) return null;
  if (code.startsWith('00')) return '서울 강남 주사무소';
  const name = String(orgName || '').trim();
  return BRANCH_OFFICES.has(name) ? `${name} 분사무소` : null;
}
