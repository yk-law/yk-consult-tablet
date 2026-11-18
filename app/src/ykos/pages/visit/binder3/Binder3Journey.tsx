import { BINDER3_ASSET_BASE } from './binder3Common';
import { BINDER3_JOURNEY, type Binder3JourneyId } from './binder3JourneyMenu';

/**
 * 고객 사이드바 (yk-consult-tablet `jnav`). 가로형 넓은 화면은 좌측, 그 밖은 하단 — CSS 컨테이너 쿼리가 나눈다.
 * 아직 없는 화면의 메뉴는 비활성으로 둔다. 고객에게 「준비 중」 같은 문구는 띄우지 않는다.
 */
export default function Binder3Journey({
  active,
  customerName,
  onSelect,
  enabled,
}: {
  active: Binder3JourneyId;
  customerName: string;
  onSelect: (id: Binder3JourneyId) => void;
  /** 화면이 있는 메뉴 */
  enabled: readonly Binder3JourneyId[];
}) {
  const name = customerName.trim();
  return (
    <nav className="b3-jnav" aria-label="상담 안내">
      {name ? (
        <div className="b3-journey-client">
          <p className="b3-journey-greeting">안녕하세요,</p>
          <p className="b3-journey-name">
            <strong>{name}</strong>
            <span> 고객님</span>
          </p>
        </div>
      ) : null}
      {BINDER3_JOURNEY.map(([id, label]) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            className={on ? 'on' : undefined}
            aria-current={on ? 'page' : undefined}
            disabled={!enabled.includes(id)}
            onClick={() => onSelect(id)}
          >
            {label}
          </button>
        );
      })}
      <div className="b3-journey-qr">
        <p className="b3-journey-qr-title">
          법률 과정을 더 쉽게,
          <br />
          의뢰인의 곁에 더 가까이
        </p>
        <p className="b3-journey-qr-description">상담과 사건 진행을 편리하게 확인하고 이어갈 수 있습니다.</p>
        <img src={`${BINDER3_ASSET_BASE}/yourk-qr.svg`} width="147" height="147" alt="YourK 접속 QR코드" />
        {/* 태블릿 밖으로 나가지 않게 링크가 아닌 글자로 둔다. */}
        <span className="b3-journey-qr-url">https://yourk.legal</span>
        <p className="b3-journey-qr-caption">QR코드를 스캔해 만나보세요.</p>
      </div>
    </nav>
  );
}
