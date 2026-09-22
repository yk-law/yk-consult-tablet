import { WTABS, man } from "./util.jsx";

function wf(label, val, fill) {
  return (
    <div className={`wf2 ${fill === "full" ? "full" : ""}`}>
      <label>{label}</label>
      <div className={`bx ${val ? (fill === "fill" ? "fill" : "") : "em"}`}>{val || "입력"}</div>
    </div>
  );
}

export default function WriteModal({ cat, sess, act }) {
  const b = (cat.bookings || []).find((x) => x.id === sess.writeBookingId) || sess.booking;
  if (!b) return null;
  const live = sess.connected && sess.bookingId === b.id;
  const none = !(b.memo || []).length;
  const corr = live ? b.memo.map((t, i) => [t, sess.memoVotes[i]]).filter(([, v]) => v === false).map(([t]) => t) : [];
  const fee = cat.fee[b.feeKey] || cat.fee.__all;
  const tab = sess.writeTab || 0;

  return (
    <div className="wov" onClick={(e) => { if (e.target === e.currentTarget) act.writeClose(); }}>
      <div className="wdlg" role="dialog" aria-label="상담 정보">
        <div className="wtop">
          <div><h3>[{b.name}({b.role}) - {b.cat2}] 상담 정보</h3><span className="eng">eng_id {b.id}</span></div>
          <button className="wai">AI 리포트</button>
          <button className="wx" onClick={act.writeClose} aria-label="닫기">✕</button>
        </div>
        <div className="wtabs">
          {WTABS.map((t, i) => (
            <button key={t} className={i === tab ? "on" : ""} onClick={() => act.writeTab(i)}><i>{i + 1}</i>{t}</button>
          ))}
        </div>
        <div className="wbody">
          {tab !== 0 ? (
            <div className="wsoon"><div className="t">{WTABS[tab]} 탭</div>
              <p>현행 YK-OS 화면을 그대로 씁니다. 온라인 바인더가 바꾸는 것은 <b>콜 탭</b>뿐입니다.<br />선임·배당·수행·종결 흐름은 손대지 않습니다.</p></div>
          ) : (
            <>
              <div className="wsec"><h5>기본 정보<em>방문 예약</em></h5>
                <div className="wgrid">{wf("방문 예정 지사", b.branch)}{wf("방문 예정일", b.at)}{wf("시간대", "방문예약")}</div>
              </div>
              <div className="wsec"><h5>고객 정보<em>고객 1 · {b.name}</em></h5>
                <div className="wgrid">
                  {wf("고객 유형", b.type, "fill")}{wf("고객 역할", b.role, "fill")}{wf("사건 당사자와의 관계", b.rel || "")}
                  {wf("고객명", b.name + " (가명)")}{wf("전화번호", b.tel)}{wf("성별", "")}
                </div>
                <p className="wnote">소득·총자산은 현행 화면 그대로 두었습니다. 고객 태블릿에는 노출하지 않습니다.</p>
              </div>
              <div className="wsec"><h5>상담 정보<em>사건</em></h5>
                <div className="wgrid">
                  {wf("사건 종류", `${b.cat1} › ${b.cat2}`, "fill")}{wf("법정 사건명", "")}{wf("선임 형태", b.form)}
                  {wf("유입 경로", b.inflow)}{wf("유입 키워드", b.kw)}{wf("방문 부서 / 지사", b.branch)}
                </div>
                <div className="wgrid" style={{ marginTop: 11 }}>
                  <div className="wf2 full"><label>사건개요 (영업전략팀){live && !none ? <span className="wpull">고객 확인 반영됨</span> : null}</label>
                    <div className={`bx ta ${none ? "em" : ""}`}>{none
                      ? `콜 단계에서 사건 내용을 받지 못했습니다.\n${b.memoNote || ""}\n상담에서 처음부터 청취해 이 칸을 채우세요.`
                      : b.memo.join("\n")}</div>
                    {corr.length ? <div className="wcorr"><span className="l">고객이 다르다고 표시한 문장 {corr.length}건</span>{corr.map((t) => <div key={t}>· {t}</div>)}</div> : null}
                  </div>
                </div>
              </div>
              <div className="wsec"><h5>상담 기록<em>상담 중 작성</em></h5>
                <div className="wgrid c2">
                  {wf("기초 사실", "", "full")}{wf("상담 내용", "", "full")}
                  <div className="wf2 full"><label>부서 배당 의견{live && sess.favs.length ? <span className="wpull">고객 관심 {sess.favs.length}명</span> : null}</label>
                    <div className={`bx ta ${live && sess.favs.length ? "" : "em"}`}>{live && sess.favs.length ? "고객이 태블릿에서 담아 둔 변호사: " + sess.favs.join(" · ") : "입력"}</div>
                  </div>
                </div>
              </div>
              <div className="wsec"><h5>금액<em>부가세 별도</em></h5>
                <div className="wgrid">
                  {wf("상담료", "₩0")}
                  <div className="wf2"><label>제안 금액 <span className="wpull">약정금 실적</span></label>
                    <div className="bx fill">{man(fee.p25)} — {man(fee.p75)}</div>
                    <div className="hint">{b.feeKey} {fee.n}건 · 중앙값 {man(fee.mid)}</div></div>
                </div>
                <p className="wnote">제안 금액은 YK-OS 선임 목록의 약정금 분포에서 가져온 <b>가이드</b>입니다. 확정 금액이 아닙니다.</p>
              </div>
            </>
          )}
        </div>
        <div className="wfoot">
          <button className="wb">미방문 처리</button>
          <button className="wb">승인 요청</button>
          <span style={{ flex: 1 }} />
          <button className="wb">정보 저장</button>
          <button className="wb pri">상담 완료</button>
        </div>
      </div>
    </div>
  );
}
