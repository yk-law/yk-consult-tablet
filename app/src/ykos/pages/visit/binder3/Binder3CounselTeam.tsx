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

/**
 * 직급 순서로 줄 세운다. 같은 직급 안에서는 YKOS 에서 고른 순서를 지킨다(YKOS 에서는 순서를 신경 쓰지 않아도 된다).
 * 못 불러온 사람은 맨 뒤.
 */
export function sortCounselTeam(team: Binder3CounselMember[]): Binder3CounselMember[] {
  return team
    .map((member, i) => ({ member, i }))
    .sort((a, b) => counselRank(a.member) - counselRank(b.member) || a.i - b.i)
    .map(({ member }) => member);
}

/**
 * 상담 변호사 화면 위 「상담에 함께하는 분」 탭(2차 내부 피드백 8, 시연 앱 .counsel-team).
 * 직급 순서(sortCounselTeam)로 사진·이름·직급을 두고, 고르면 아래 소개가 그 사람으로 바뀐다. 2명 이상일 때만 둔다.
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
