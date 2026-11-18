/** 바인더에 보여 주는 변호사 한 명 */
export type VisitConsultLawyer = {
  emp_id: number | null;
  name: string;
  job_title: string;
  position: string;
  branch: string;
  photo: string;
  greeting: string;
  career: string[];
  highlighted_career: string;
  career_highlights: string[];
  bar_specialties: string[];
  business_categories: string[];
  business_details: string[];
  experience_count: number;
  specialty_match_count: number;
  is_target_org_career: boolean;
  authority_org: string;
  sourceType: string;
};

/** 바인더 제목·절차 안내에 쓰는 사건 분류 */
export type VisitConsultCategory = {
  major_category: string;
  small_category: string;
  homepage_category_1: string;
  homepage_category_2: string;
};

type VisitConsultCategoryLike = Partial<VisitConsultCategory> | null | undefined;

/** 비슷한 사례 한 건(컨터닝 도우미 응답) */
export type VisitConsultCase = {
  case_title?: string;
  success_story_title?: string;
  case_summary?: string;
  case_feature?: string;
  case_assistance?: string;
  closure_summary?: string;
  case_result?: string;
};

/** 컨터닝 도우미가 돌려주는 변호사 */
type ConturningLawyerRaw = {
  emp_id?: number | null;
  lawyer_name?: string;
  name?: string;
  job_title?: string;
  position?: string;
  branch_name?: string;
  greeting?: string;
  greeting2?: string;
  major_career?: string;
  certified_specialty?: string;
  career?: unknown;
  career_details?: unknown;
  authority_org?: string;
  experience_count?: number | string;
  specialty_match_count?: number | string;
  is_target_org_career?: number | boolean;
};

/** 홈페이지 추천 변호사 API 가 돌려주는 변호사 */
type HomepageLawyerRaw = {
  emp_id?: number | null;
  name?: string;
  job_title?: string;
  photo?: string;
  greeting?: string;
  career?: unknown;
  career_highlights?: unknown;
  bar_specialties?: unknown;
  business_details?: unknown;
  business_categories?: unknown;
};

export function lawyerImageUrl(raw: string) {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://www.yklawfirm.co.kr/${raw.replace(/^\//, '')}`;
}

export const VISIT_CONSULT_DISPLAY_LAWYER_LIMIT = 6;
export const VISIT_CONSULT_CANDIDATE_LAWYER_LIMIT = 18;

const JOB_TITLE_RANK: [string, number][] = [
  ['대표변호사', 0],
  ['파트너변호사', 1],
  ['파트너 변호사', 1],
  ['고문변호사', 2],
  ['고문 변호사', 2],
  ['변호사', 3],
  ['수습변호사', 4],
  ['수습 변호사', 4],
];

const POSITION_RANK: [string, number][] = [
  ['부장변호사', 0],
  ['부지사장', 1],
  ['수석변호사', 2],
];

function safeJsonParse(value: unknown, fallback: object | null = {}) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value || fallback;
  } catch {
    return fallback;
  }
}

function uniqueLabels(items: unknown[]) {
  return [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))];
}

function splitLabels(value: unknown) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCareerLines(value: unknown) {
  const parsed = safeJsonParse(value, null);
  const rawLines =
    parsed && typeof parsed === 'object'
      ? Object.keys(parsed)
          .sort()
          .flatMap((key) => String(parsed[key] || '').split('\n'))
      : String(value || '').split('\n');

  return rawLines.map((item) => item.trim()).filter(Boolean);
}

function getAuthorityCareerLine(careerLines: string[], authorityOrg?: unknown) {
  const org = String(authorityOrg || '').trim();
  if (!org) return '';

  return careerLines.find((line) => line.includes(org)) || '';
}

function sortCareerLinesByAuthority(careerLines: string[], authorityOrg?: unknown) {
  const highlightedCareer = getAuthorityCareerLine(careerLines, authorityOrg);
  if (!highlightedCareer) return uniqueLabels(careerLines);

  return uniqueLabels([
    highlightedCareer,
    ...careerLines.filter((line) => line !== highlightedCareer),
  ]);
}

function normalizeConturningLawyer(
  raw: ConturningLawyerRaw,
  sourceType: string
): VisitConsultLawyer | null {
  const name = raw?.lawyer_name || raw?.name || '';
  if (!name) return null;

  const specialties = uniqueLabels(splitLabels(raw.certified_specialty));
  const detailedCareerLines = Array.isArray(raw.career_details)
    ? raw.career_details.map((item: unknown) => String(item || '').trim()).filter(Boolean)
    : [];
  const careerLines = uniqueLabels([...detailedCareerLines, ...getCareerLines(raw.career)]);
  const authorityOrg = raw.authority_org || '';
  const sortedCareerLines =
    sourceType === 'career' ? sortCareerLinesByAuthority(careerLines, authorityOrg) : careerLines;
  const highlightedCareer =
    sourceType === 'career' ? getAuthorityCareerLine(sortedCareerLines, authorityOrg) : '';

  return {
    emp_id: raw.emp_id ?? null,
    name,
    job_title: raw.job_title || '변호사',
    position: raw.position || '',
    branch: raw.branch_name || '',
    photo: `https://www.yklawfirm.co.kr/upload_file/lawyer/${name.trim()}.png`,
    greeting: raw.greeting || raw.greeting2 || raw.major_career || '',
    career: uniqueLabels(sortedCareerLines).slice(0, 6),
    highlighted_career: highlightedCareer,
    career_highlights: [],
    bar_specialties: specialties,
    business_categories: specialties,
    business_details: specialties,
    experience_count: Number(raw.experience_count || 0),
    specialty_match_count: Number(raw.specialty_match_count || 0),
    is_target_org_career: raw.is_target_org_career === 1 || raw.is_target_org_career === true,
    authority_org: authorityOrg,
    sourceType,
  };
}

function getJobTitleRank(lawyer: VisitConsultLawyer) {
  const title = String(lawyer.job_title || '').replace(/\s/g, '');
  const matched = JOB_TITLE_RANK.find(([keyword]) => title.includes(keyword.replace(/\s/g, '')));
  return matched ? matched[1] : 3;
}

function getPositionRank(lawyer: VisitConsultLawyer) {
  const position = `${lawyer.position || ''}${lawyer.job_title || ''}`;
  const matched = POSITION_RANK.find(([keyword]) => position.includes(keyword));
  return matched ? matched[1] : 99;
}

function sortBinderLawyers(lawyers: VisitConsultLawyer[]) {
  return [...lawyers].sort((a, b) => {
    const titleDiff = getJobTitleRank(a) - getJobTitleRank(b);
    if (titleDiff !== 0) return titleDiff;

    const positionDiff = getPositionRank(a) - getPositionRank(b);
    if (positionDiff !== 0) return positionDiff;

    const countDiff =
      b.experience_count + b.specialty_match_count - (a.experience_count + a.specialty_match_count);
    if (countDiff !== 0) return countDiff;

    return a.name.localeCompare(b.name, 'ko');
  });
}

function getLawyerKey(lawyer: VisitConsultLawyer) {
  return lawyer.emp_id || lawyer.name;
}

function takeUniqueLawyers(source: VisitConsultLawyer[], count: number, seen: Set<unknown>) {
  const picked: VisitConsultLawyer[] = [];

  for (const lawyer of source) {
    if (picked.length >= count) break;

    const key = getLawyerKey(lawyer);
    if (seen.has(key)) continue;

    seen.add(key);
    picked.push(lawyer);
  }

  return picked;
}

function pickLawyersByGroupQuota(
  groups: { sourceType: string; items: VisitConsultLawyer[] }[],
  limit: number,
  seen = new Set<unknown>()
) {
  const selectedByGroup = groups.map((group) => ({
    ...group,
    selected: takeUniqueLawyers(group.items, 2, seen),
  }));

  let remaining = Math.max(
    limit - selectedByGroup.reduce((sum, group) => sum + group.selected.length, 0),
    0
  );

  while (remaining > 0) {
    let filled = false;

    for (const group of selectedByGroup) {
      if (remaining <= 0) break;

      const next = takeUniqueLawyers(group.items, 1, seen);
      if (!next.length) continue;

      group.selected.push(...next);
      remaining -= next.length;
      filled = true;
    }

    if (!filled) break;
  }

  return selectedByGroup.flatMap((group) => group.selected).slice(0, limit);
}

export function buildVisitConsultLawyerSummary(
  // detailed_lawyer_info: 기관명 → 변호사 목록. 기관명이 키라 동적 맵으로 둔다.
  raw: {
    detailed_lawyer_info?: Record<string, ConturningLawyerRaw[] | null | undefined> | null;
    specialty_lawyers?: ConturningLawyerRaw[] | null;
  },
  limit = 6
) {
  const detailedInfo = raw?.detailed_lawyer_info || {};
  const authorityLawyers = Object.entries(detailedInfo).flatMap(([authorityOrg, items]) =>
    Array.isArray(items) ? items.map((item) => ({ ...item, authority_org: authorityOrg })) : []
  );

  const performed = authorityLawyers
    .filter(
      (item) =>
        Number(item.experience_count || 0) > 0 &&
        !(item.is_target_org_career === 1 || item.is_target_org_career === true)
    )
    .map((item) => normalizeConturningLawyer(item, 'performed'))
    .filter(Boolean) as VisitConsultLawyer[];

  const career = authorityLawyers
    .filter((item) => item.is_target_org_career === 1 || item.is_target_org_career === true)
    .map((item) => normalizeConturningLawyer(item, 'career'))
    .filter(Boolean) as VisitConsultLawyer[];

  const specialty = (Array.isArray(raw?.specialty_lawyers) ? raw.specialty_lawyers : [])
    .map((item) => normalizeConturningLawyer(item, 'specialty'))
    .filter(Boolean) as VisitConsultLawyer[];

  const sortedCareer = sortBinderLawyers(career);
  const sortedPerformed = sortBinderLawyers(performed);
  const sortedSpecialty = sortBinderLawyers(specialty);
  const groups = [
    { sourceType: 'career', items: sortedCareer },
    { sourceType: 'performed', items: sortedPerformed },
    { sourceType: 'specialty', items: sortedSpecialty },
  ];
  const seen = new Set<unknown>();
  const primaryLawyers = pickLawyersByGroupQuota(
    groups,
    Math.min(limit, VISIT_CONSULT_DISPLAY_LAWYER_LIMIT),
    seen
  );
  const fallbackLawyers =
    limit > primaryLawyers.length
      ? pickLawyersByGroupQuota(groups, limit - primaryLawyers.length, seen)
      : [];
  const uniqueLawyers = [...primaryLawyers, ...fallbackLawyers];

  return {
    lawyers: uniqueLawyers.slice(0, limit),
    totalCount: new Set([...career, ...performed, ...specialty].map(getLawyerKey)).size,
  };
}

export function buildVisitConsultCategoryFromHelper(
  raw: { major_category?: string | null; small_category?: string | null },
  fallbackCaseInfo: { majorCategory?: string } | null
): VisitConsultCategory {
  return {
    major_category: raw?.major_category || fallbackCaseInfo?.majorCategory || '',
    small_category: raw?.small_category || '',
    homepage_category_1:
      raw?.small_category || raw?.major_category || fallbackCaseInfo?.majorCategory || '',
    homepage_category_2: raw?.small_category || '',
  };
}

function normalizeHomepageLawyer(raw: HomepageLawyerRaw): VisitConsultLawyer | null {
  const name = raw?.name || '';
  if (!name) return null;

  const specialties = uniqueLabels([
    ...(Array.isArray(raw?.bar_specialties) ? raw.bar_specialties : []),
    ...(Array.isArray(raw?.business_details) ? raw.business_details : []),
    ...(Array.isArray(raw?.business_categories) ? raw.business_categories : []),
  ]);
  const careerLines = uniqueLabels([
    ...(Array.isArray(raw?.career) ? raw.career : []),
    ...(Array.isArray(raw?.career_highlights) ? raw.career_highlights : []),
  ]);

  return {
    emp_id: raw.emp_id ?? null,
    name,
    job_title: raw.job_title || '변호사',
    position: '',
    branch: '',
    photo:
      String(raw.photo || '').trim() ||
      `https://www.yklawfirm.co.kr/upload_file/lawyer/${name.trim()}.png`,
    greeting: raw.greeting || '',
    career: careerLines.slice(0, 6),
    highlighted_career: '',
    career_highlights: Array.isArray(raw?.career_highlights) ? raw.career_highlights : [],
    bar_specialties: specialties,
    business_categories: specialties,
    business_details: specialties,
    experience_count: 0,
    specialty_match_count: 0,
    is_target_org_career: false,
    authority_org: '',
    sourceType: 'specialty',
  };
}

/** consult_helper 404 등일 때 visit_consult/recommended_lawyers 응답을 바인더용으로 변환 */
export function buildVisitConsultLawyerSummaryFromHomepage(
  raw: { lawyers?: unknown; total_count?: unknown },
  limit = 6
) {
  const lawyers = (
    (Array.isArray(raw?.lawyers) ? raw.lawyers : [])
      .map((item) => normalizeHomepageLawyer(item))
      .filter(Boolean) as VisitConsultLawyer[]
  ).slice(0, limit);

  return {
    lawyers,
    totalCount: Number(raw?.total_count || lawyers.length),
  };
}

export function buildVisitConsultCategoryFromHomepage(
  raw: { category?: Partial<VisitConsultCategory> | null },
  fallbackCaseInfo: { majorCategory?: string } | null
): VisitConsultCategory {
  const category: Partial<VisitConsultCategory> = raw?.category || {};
  return {
    major_category: category.major_category || fallbackCaseInfo?.majorCategory || '',
    small_category: category.small_category || '',
    homepage_category_1:
      category.homepage_category_1 ||
      category.small_category ||
      category.major_category ||
      fallbackCaseInfo?.majorCategory ||
      '',
    homepage_category_2: category.homepage_category_2 || category.small_category || '',
  };
}

export function getLawyerSectionTitle(category: VisitConsultCategoryLike, fallbackLabel?: unknown) {
  const label =
    category?.homepage_category_2 ||
    category?.small_category ||
    category?.homepage_category_1 ||
    category?.major_category ||
    String(fallbackLabel || '')
      .split(/[>/·-]/)
      .map((item) => item.trim())
      .find(Boolean) ||
    '상담';

  return `${label} 전문 변호사`;
}

export function getCategorySubLabel(category: VisitConsultCategoryLike) {
  const labels = [category?.homepage_category_1, category?.homepage_category_2]
    .filter(Boolean)
    .map((label) => String(label).trim())
    .filter(Boolean);
  const uniqueLabels = [...new Set(labels)];

  return uniqueLabels.length > 1 ? uniqueLabels.join(' · ') : '';
}

export function getSmallCategoryLabel(category: VisitConsultCategoryLike, fallbackLabel?: unknown) {
  const fallbackParts = String(fallbackLabel || '')
    .split(/[>/·-]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    category?.homepage_category_2 ||
    category?.small_category ||
    fallbackParts[fallbackParts.length - 1] ||
    category?.homepage_category_1 ||
    category?.major_category ||
    '상담'
  );
}

export function getLawyerCareers(lawyer: VisitConsultLawyer | null | undefined) {
  return uniqueLabels([...(lawyer?.career || []), ...(lawyer?.career_highlights || [])]);
}

export function getLawyerSpecialties(lawyer: VisitConsultLawyer | null | undefined) {
  return uniqueLabels([...(lawyer?.bar_specialties || []), ...(lawyer?.business_categories || [])]);
}

export function getLawyerSourceDescription(lawyer: VisitConsultLawyer | null | undefined) {
  const authorityOrg = lawyer?.authority_org || '관할기관';
  if (lawyer?.sourceType === 'performed') {
    const count = Number(lawyer?.experience_count || 0) + 10;
    return `${authorityOrg} 주요 사건 수행 ${count}건`;
  }
  return '';
}

export function getLawyerSourceDescriptionParts(lawyer: VisitConsultLawyer | null | undefined) {
  const authorityOrg = lawyer?.authority_org || '관할기관';
  if (lawyer?.sourceType !== 'performed') {
    return {
      authorityOrg: '',
      countText: '',
      fullText: getLawyerSourceDescription(lawyer),
    };
  }

  const countText = `${Number(lawyer?.experience_count || 0) + 10}건`;
  return {
    authorityOrg,
    countText,
    fullText: `${authorityOrg} 주요 사건 수행 ${countText}`,
  };
}

export function getLawyerDisplayBadges(lawyer: VisitConsultLawyer | null | undefined) {
  return getLawyerSpecialties(lawyer);
}

export function isLawyerPerformedSource(lawyer: VisitConsultLawyer | null | undefined) {
  return lawyer?.sourceType === 'performed';
}

export function isDecoratedSeniorLawyer(lawyer: VisitConsultLawyer | null | undefined) {
  const title = String(lawyer?.job_title || '').replace(/\s/g, '');
  return title.includes('대표변호사') || title.includes('고문변호사');
}

export function isLawyerHighlightedCareer(
  lawyer: VisitConsultLawyer | null | undefined,
  career?: unknown
) {
  return Boolean(lawyer?.highlighted_career && lawyer.highlighted_career === career);
}
