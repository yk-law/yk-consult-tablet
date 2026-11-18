import { lawyerImageUrl } from '../utils/visitConsultDisplay';
import { Binder3NoPhoto } from './binder3Common';
import type { Binder3CounselState } from './Binder3Counsel';

export type Binder3CounselMember = { empId: number; state: Binder3CounselState };

/** 전문 인력과 같은 직급 순서(backend visit_binder_seniors_service LAWYER_RANKS + EXPERT_CLASSES). 없는 직급은 그 뒤. */
const COUNSEL_RANKS = [
  '대표변호사',
  '파트너변호사',
  '변호사',
  '고문변호사',
  '고문',
  '전문위원',
  '자문위원',
];

function counselRank(member: Binder3CounselMember) {
  if (member.state.status !== 'ready') return COUNSEL_RANKS.length + 1;
  const rank = COUNSEL_RANKS.indexOf(member.state.data.position);
  return rank < 0 ? COUNSEL_RANKS.length : rank;
}

/** 변호사가 아닌 직급. 상담 칩에서는 변호사 뒤에 둔다. */
const NON_LAWYER_CLASSES = ['고문', '전문위원', '자문위원'];

const isNonLawyer = (member: Binder3CounselMember) =>
  member.state.status === 'ready' && NON_LAWYER_CLASSES.includes(member.state.data.position);

/**
 * 변호사 먼저, 그다음 고문·전문위원(고재완 11-18 「변호사 먼저」). 각 묶음 안은 YK 소개와 같은 순서:
 * firmOrder(구성원 전체 줄 순서, seq)가 있으면 그 자리, 없거나 목록에 없는 사람은 직급 순서.
 * 같으면 YKOS 에서 고른 순서. 못 불러온 사람은 맨 뒤.
 */
export function sortCounselTeam(
  team: Binder3CounselMember[],
  firmOrder: number[] = []
): Binder3CounselMember[] {
  const place = new Map(firmOrder.map((seq, i) => [seq, i]));
  const firmPlace = (member: Binder3CounselMember) => {
    const seq = member.state.status === 'ready' ? member.state.data.seq : undefined;
    return (seq != null ? place.get(seq) : undefined) ?? firmOrder.length;
  };
  return team
    .map((member, i) => ({ member, i }))
    .sort(
      (a, b) =>
        (a.member.state.status === 'ready' ? 0 : 1) - (b.member.state.status === 'ready' ? 0 : 1) ||
        Number(isNonLawyer(a.member)) - Number(isNonLawyer(b.member)) ||
        firmPlace(a.member) - firmPlace(b.member) ||
        counselRank(a.member) - counselRank(b.member) ||
        a.i - b.i
    )
    .map(({ member }) => member);
}

/**
 * 상담 변호사 화면 위 「상담에 함께하는 분」 탭(2차 내부 피드백 8, 시연 앱 .counsel-team).
 * YK 소개 순서(sortCounselTeam)로 사진·이름·직급을 두고, 고르면 아래 소개가 그 사람으로 바뀐다. 2명 이상일 때만 둔다.
 */
export default function Binder3CounselTeam({
  team,
  index,
  onIndex,
}: {
  team: Binder3CounselMember[];
  index: number;
  onIndex: (index: number) => void;
}) {
  if (team.length < 2) return null;
  return (
    <div className="b3-counsel-team" role="tablist" aria-label="상담에 함께하는 분">
      {team.map((member, i) => {
        const data = member.state.status === 'ready' ? member.state.data : null;
        return (
          <button
            key={member.empId}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={i === index ? 'on' : undefined}
            onClick={() => onIndex(i)}
          >
            <span className="b3-counsel-team-ph">
              {data?.photo ? <img src={lawyerImageUrl(data.photo)} alt="" /> : <Binder3NoPhoto />}
            </span>
            <span className="b3-counsel-team-t">
              <b>{data?.name ?? `상담 변호사 ${i + 1}`}</b>
              {data?.position ? <span>{data.position}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
