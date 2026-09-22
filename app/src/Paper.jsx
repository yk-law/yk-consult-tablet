import { hasTerm, wonPlain } from "./util.jsx";

export default function Paper({ ct, firm, sign, signed, tab, onSign }) {
  if (!ct || !firm) return null;
  const F = firm;
  const ret = hasTerm(ct, "retainer");
  const suc = hasTerm(ct, "success");
  const trv = hasTerm(ct, "travel");
  const del = hasTerm(ct, "delegation");
  const sp = hasTerm(ct, "special");
  const amt = ret ? wonPlain(ct.retainer.amount) : "　　　　";
  const vat = ret ? ct.retainer.vat : "　　";
  const sucAmt = suc && ct.success.fixed ? wonPlain(ct.success.fixed) : "　　　　";
  const pct = suc ? ct.success.pct : "　";
  const daily = trv && ct.travel.daily ? wonPlain(ct.travel.daily) : "　　　";
  const dep = trv && ct.travel.deposit ? wonPlain(ct.travel.deposit) : "　　　";
  const done = signed?.[ct.engId];

  return (
    <>
      {tab && (
        <>
          <span className="lbl">위임계약</span>
          <h2 className="h1">소송위임계약서</h2>
          <p className="sub">상담실장이 보낸 기본서식입니다. 내용 확인 후 아래에 서명해 주세요.<br />표시된 이름은 가명입니다. 주민번호·실주소는 비워 두었습니다.</p>
        </>
      )}
      <article className="paper">
        <header className="phd">
          <div className="fn">{F.spaced}</div>
          <div className="meta"><span>전화 {F.tel}</span><span>{F.addr}</span><span>팩스 {F.fax}</span></div>
          <h1>소송위임계약서</h1>
        </header>
        <p className="party">위임인(갑) <b>{ct.client}</b> <i>가명</i><br />수임인(을) <b>{F.name}</b></p>
        <p>위 당사자들은 아래 소송사건의 처리에 관한 위임계약을 다음과 같이 체결한다.</p>
        <h3>사　　건</h3>
        <table className="pt">
          <tbody>
            <tr><th>사건번호</th><td>{ct.caseNo}</td><th>사건명</th><td>{ct.caseName}</td></tr>
            <tr><th>의뢰인</th><td>{ct.client}</td><th>상대방</th><td>{ct.opponent}</td></tr>
            <tr><th>관할</th><td>{ct.jurisdiction}</td><th>소송물가액</th><td>{ct.litigationAmount}</td></tr>
          </tbody>
        </table>
        <table className="pt">
          <tbody>
            <tr><th>구분</th><th>지급시기</th><th>금액</th></tr>
            {ret && <tr><th>착수금</th><td>{ct.retainer.timing}</td><td>금 {amt} 원 (부가세 {vat})<br />결제 {ct.retainer.method}</td></tr>}
            {suc && <tr><th>성공보수</th><td style={{ whiteSpace: "pre-line" }}>{ct.success.timing}</td><td>경제적 이익의 {pct}%</td></tr>}
            {trv && <tr><th>출장비</th><td>출장시</td><td>일당 {daily} 원 · 예치 {dep} 원</td></tr>}
            {del && <tr><th>위임사무</th><td colSpan={2} className="left">{ct.delegation}</td></tr>}
            {sp && ct.special ? <tr><th>특약사항</th><td colSpan={2} className="left">{ct.special}</td></tr> : null}
          </tbody>
        </table>
        <p className="center">기타 계약의 내용은 별첨과 같다.</p>
        <p className="date">2026.  9.  4.</p>
        <div className="signers">
          <div>
            <div className="who">(갑) 위임인</div>
            <div>성명 : {ct.client} (인){done ? <em className="ok"> 서명완료</em> : null}</div>
            <div>주민번호 : </div>
            <div>연락처 : {ct.phone}</div>
            <div>이메일 : </div>
            <div>주소 : </div>
          </div>
          <div>
            <div className="who">(을) 수임인</div>
            <div>{F.addr2}</div>
            <div><b>{F.name}</b></div>
            <div>{F.reps}</div>
            <div>{F.svc}</div>
          </div>
        </div>
        <p className="pg">- 1 -</p>
      </article>
      <article className="paper">
        <h3>아　　래</h3>
        <p><b>제1조 【목적】</b> 갑은 을에게 위 표시 사건의 처리(이하 “위임사무”라 한다)를 위임하고, 을은 이를 수임한다.</p>
        <p><b>제2조 【위임한계】</b> 갑이 을에게 위임하는 위임사무는 당해 심급에 한하고, 파기 환송된 사건이나 상소의 제기, 강제집행, 강제집행정지, 보전처분, 반소절차 등 부수적 절차에 관한 사항은 따로 정한다. 보전처분사건의 경우 이의사건 또는 취소사건은 별개의 위임사무로 한다.</p>
        <p><b>제3조 【수권범위】</b> ① 갑은 을에게 위 위임장 또는 선임서에 기재된 아래 특별수권사항에 대하여 특별수권을 부여하기로 한다.</p>
        <table className="pt sm">
          <tbody>
            {(sign.auth || []).map((a) => (
              <tr key={a.id}><th>{a.label}</th><td className="left">{a.d}</td><td>O</td></tr>
            ))}
          </tbody>
        </table>
        <p><b>제4조 【수임인의 의무】</b> 을은 변호사로서 법령에 정한 권리와 의무에 입각하여, 위임의 내용에 따라 선량한 관리자의 주의를 다하여 위임사무를 처리한다.</p>
        <p><b>제5조 【자료제공 등】</b> 을이 위임사무를 처리하는데 필요하다고 인정하여 요구한 자료 또는 조회한 사항에 대하여 갑은 지체 없이 이에 응하여야 한다.</p>
        <p><b>제6조 【착수보수】</b> 갑은 을에게 위임계약의 성립과 동시에 착수보수로 금 <u>{amt}</u> 원(부가가치세 {vat})을 지급한다 [입금계좌: {F.bank}].</p>
        {ret && ct.retainer.installments ? <div className="cl">분할납부: {ct.retainer.installments}</div> : null}
        <p><b>제7조 【성과보수】</b> ① 성과보수: 위임사무가 판결, 재판상 내지 재판외 화해(화해권고결정 포함), 조정(조정에 갈음한 결정 포함) 등으로 성공한 때에는 아래 구분에 의하여 성과보수를 지급하기로 한다.</p>
        <p className="ind">가. 전부 승소한 경우: 금 <u>{sucAmt}</u> 원(부가가치세 {suc ? ct.success.vat : "　　"})<br />
        일부 승소한 경우: 위 금액을 승소비율로 계산한 금액<br />
        나. 승소로 얻은 경제적 이익가액의 <u>{pct}</u> %에 해당하는 금액<br />
        다. 상소심의 경우 달리 정함이 없는 한 상소심의 심판의 대상 전부를 기준으로 하여 승소 비율을 정한다.<br />
        라. ‘승소로 얻은 경제적 이익’이 금액일 경우 판결원리금을 기준으로 성공보수를 산정한다.</p>
        <p className="pg">- 2 -</p>
      </article>
      <article className="paper">
        <p>② 승소로 보는 경우: 아래의 경우는 승소로 보고 전항에 정한 성과보수를 지급하여야 한다.</p>
        <p className="ind">가. 을이 위임사무 처리를 위하여 상당한 노력을 투입한 후 갑이 임의로 청구 포기 또는 인낙, 소의 취하, 상소의 취하를 한 경우<br />
        나. 을의 소송수행 결과로 인하여 상대방이 청구 포기 또는 인낙, 소의 취하, 상소의 취하를 한 경우</p>
        <p><b>제8조 【비용부담】</b> ① 을이 위임사무를 처리하는데 필요한 인지대, 송달료, 감정료, 예납금, 보증금, 등사료, 국제전화료, 여비, 출장비, 보증보험료, 담보공탁금, 기타 필요한 실비는 보수와는 별도로 그 전액을 갑이 부담한다.</p>
        <p>② 출장 일당으로 1일 금 <u>{daily}</u> 원을 출장으로 인한 여비와 별도로 출장시 지급한다.</p>
        <p>③ 갑은 비용에 충당하기 위하여 금 <u>{dep}</u> 원을 예치한다. ④ 제3항의 예치금에서 비용과 출장 일당을 충당할 수 있다.</p>
        <p><b>제9조 【계약해지】</b> ① 을은 갑이 정당한 사유 없이 채무를 이행하지 않거나, 위임 관련 진술이 허위이거나, 정당한 사유 없이 비협조하여 위임업무가 불가능한 경우 계약을 해지할 수 있다. 해지 시 수행비용은 제10조에 따른다.</p>
        <p><b>제10조 【수행비용】</b> ① 착수금 반환 시 공제를 위한 수행비용은 아래와 같이 산정한다. 가. 변호사 보수: 직급별 변호사 보수(실제로 참여한 인원별). 나. 시간은 30분 단위 올림. 다. 법률문서는 1장당 30분.</p>
        <table className="pt sm nar">
          <tbody>
            <tr><th>순번</th><th>직급</th><th>변호사보수(단위: 만원)</th></tr>
            {(sign.rank || []).map((x) => (
              <tr key={x.r}><td>{x.r}</td><td>{x.t}</td><td>{x.f}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="fine">② 을의 수행비용은 약정 착수금을 한도로 산정한다.</p>
        <p className="pg">- 3 -</p>
      </article>
      {tab && !done ? <button className="bgo" onClick={onSign}>내용 확인 · 전자서명</button> : null}
    </>
  );
}
