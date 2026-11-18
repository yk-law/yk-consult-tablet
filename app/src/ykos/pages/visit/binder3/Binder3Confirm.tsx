import { useState } from 'react';
import { Binder3ArrowIcon, Binder3WelcomeBrand } from './binder3Common';

/** 내방: 예약 일시·장소 확인 (yk-consult-tablet `WaitFlow` confirm 단계) */
export default function Binder3Confirm({
  customerName,
  visitLabel,
  placeLabel,
  onConfirm,
}: {
  customerName: string;
  visitLabel: string;
  placeLabel: string;
  onConfirm: () => void;
}) {
  const [wrong, setWrong] = useState(false);

  return (
    <section className="b3-confirm">
      <div className="b3-confirm-main">
        <Binder3WelcomeBrand />
        {wrong ? (
          <div className="b3-help" role="region" aria-labelledby="b3-help-title">
            <div role="status">
              <h2 id="b3-help-title">예약 정보 확인을 도와드리겠습니다.</h2>
              <p className="b3-help-description">
                담당 직원이 예약 정보를 확인해 드립니다.
                <br />이 화면을 그대로 두시면 됩니다.
              </p>
            </div>
            <div className="b3-actions">
              <button type="button" className="b3-return" onClick={() => setWrong(false)}>
                <Binder3ArrowIcon direction="left" />
                <span>예약 정보 다시 보기</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="b3-title">
              {customerName ? <span className="b3-client-name">{customerName} </span> : null}
              고객님, 반갑습니다.
            </h2>
            <div className="b3-check" role="group" aria-labelledby="b3-check-heading">
              <p id="b3-check-heading" className="b3-instruction">
                예약하신 시간과 장소를 확인해 주세요.
              </p>
              <div className="b3-who">
                <p>{visitLabel}</p>
                {placeLabel ? <p>{placeLabel}</p> : null}
              </div>
            </div>
            <div className="b3-actions">
              <button type="button" className="b3-go" onClick={onConfirm}>
                네, 맞습니다
              </button>
              <button type="button" className="b3-ghost" onClick={() => setWrong(true)}>
                제 예약이 아니에요
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
