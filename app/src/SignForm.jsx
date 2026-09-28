import { useState } from "react";

/* 실제 YK-OS 선임 계약 화면(/app/visit/sign)의 구성을 따른다.
   주민번호·이메일·주소는 자리표시자만 둔다. 목업에 개인정보를 담지 않는다. */

const CIVIL = ["민사", "가사", "상속", "행정", "노동"];

function Panel({ title, children, right }) {
  const [open, setOpen] = useState(true);
  return (
    <section className={`sgp${open ? " open" : ""}`}>
      <button type="button" className="sgph" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {right}
        <i aria-hidden="true" />
      </button>
      {open ? <div className="sgpb">{children}</div> : null}
    </section>
  );
}

function F({ label, children, wide }) {
  return (
    <label className={`sgf${wide ? " w" : ""}`}>
      <span className="sgl">{label}</span>
      {children}
    </label>
  );
}

const Check = ({ label, on = true, right }) => (
  <div className="sgck">
    <span className={`bx${on ? " on" : ""}`} aria-hidden="true" />
    <span className="t">{label}</span>
    {right}
  </div>
);

export default function SignForm({ booking, onBack }) {
  const civil = CIVIL.includes(booking.cat1);
  const [tab, setTab] = useState(civil ? "civil" : "crim");

  return (
    <div className="sgn">
      <div className="sgtop">
        <button type="button" className="sgback" onClick={onBack} aria-label="뒤로">←</button>
        <h3>선임 계약</h3>
        <div className="seg2 sgtab">
          <button className={tab === "crim" ? "on" : ""} onClick={() => setTab("crim")}>형사</button>
          <button className={tab === "civil" ? "on" : ""} onClick={() => setTab("civil")}>민·가사</button>
        </div>
      </div>

      <Panel title={<><b>{booking.name}</b><em className="alias">가명</em><em className="sgwhen">{booking.at}</em></>}>
        <div className="sgg">
          <F label="사건번호"><input placeholder="사건번호" /></F>
          <F label="사건명"><input defaultValue={booking.cat2} /></F>
          <F label="상대방"><input /></F>
          <F label="관할"><input defaultValue={booking.court} placeholder="관할" /></F>
          <F label="소송물가액" wide><input defaultValue="0" /></F>
        </div>
        <div className="sgg sep">
          <F label="주민번호"><input placeholder="000000-0000000" /></F>
          <F label="이메일"><input placeholder="이메일" /></F>
        </div>
        <div className="sgg addr">
          <F label="우편번호"><input placeholder="주소 검색" readOnly /></F>
          <F label="주소"><input placeholder="주소 검색으로 입력" readOnly /></F>
          <button type="button" className="sgb2">주소 검색</button>
          <F label="상세 주소" wide><input placeholder="상세 주소를 입력해주세요." /></F>
        </div>
        <p className="sghint">기본 주소는 주소 검색을 통해서만 입력할 수 있습니다. 기본 주소 입력 후 상세 주소를 입력해 주세요.</p>
      </Panel>

      <Panel title="약정 조건">
        <Check label="위임사무" />
        <select defaultValue=""><option value="">위임사무를 검색·선택하세요</option></select>
        <div className="sgd" />
        <Check label="특약사항" />
        <select defaultValue=""><option value="">자주쓰이는 특약사항 검색·선택</option></select>
        <span className="sgl2">반환</span>
        <input placeholder="처분명" />
        <span className="sgl2">별도 약정</span>
        <select defaultValue=""><option value="">별도 약정 검색·선택</option></select>
      </Panel>

      <Panel title="보수 조건">
        <div className="sgrow">
          <span className="sgl2 n">착수금</span>
          <button type="button" className="sgadd">+ 항목 추가</button>
        </div>
        <div className="sgbox">
          <div className="sgi"><span className="ik">%</span><span className="it">VAT 포함여부 (10%)</span><span className="tg on" aria-hidden="true" /><span className="tv">포함</span></div>
          <div className="sgi"><span className="ik">₩</span><span className="it">약정금 총액</span><input className="grow" defaultValue="0" /><span className="iu">원</span></div>
          <p className="sghint in">계약금 및 회차별 금액 입력 시 자동으로 약정금 총액이 합산되어 입력됩니다.</p>
          <div className="sgi">
            <span className="ik">▤</span><span className="it">계약금</span>
            <F label="납부 예정일"><input placeholder="YYYY-MM-DD" /></F>
            <F label="금액"><input defaultValue="0" /></F>
            <F label="결제방법"><select defaultValue="카드"><option>카드</option><option>계좌이체</option><option>현금</option></select></F>
          </div>
        </div>

        <div className="sgrow">
          <Check label="성공보수" right={<button type="button" className="sgadd">+ 항목 추가</button>} />
        </div>
        <div className="sgbox">
          <div className="sgi"><span className="ik">%</span><span className="it">VAT 포함여부 (10%)</span><span className="tg on" aria-hidden="true" /><span className="tv">포함</span></div>
          <div className="sgi top"><span className="ik">▤</span><span className="it">지급시기</span>
            <textarea className="grow" rows={3} defaultValue={["합의시(조정시)", "또는 판결", "정본영수시"].join("\n")} />
          </div>
          <div className="sgi"><span className="ik">▤</span><span className="it">약정형태</span>
            <select className="grow" defaultValue="정률형"><option value="정률형">정률형 (비율 약정) - 경제적 이익금</option><option>정액형 (금액 약정)</option></select>
          </div>
          <div className="sgi"><span className="ik">₩</span><span className="it">경제적 이익금</span>
            <span className="sp" /><button type="button" className="stp">−</button><button type="button" className="stp">+</button>
            <input className="num" defaultValue="7" /><span className="iu">%</span>
          </div>
        </div>
      </Panel>

      <Panel title={<Check label="출장비" />}>
        <div className="sgg">
          <F label="출장 일당 (1일)"><input defaultValue="0" /></F>
          <F label="예치금"><input defaultValue="0" /></F>
        </div>
      </Panel>

      <Panel title="부서 배당">
        <div className="sgg three">
          <F label="희망 배당 부서/지사 1. *"><select defaultValue=""><option value="">선택</option></select></F>
          <F label="희망 배당 부서/지사 2."><select defaultValue=""><option value="">선택</option></select></F>
          <F label="희망 배당 부서/지사 3."><select defaultValue=""><option value="">선택</option></select></F>
        </div>
        <F label="부서 배당 의견 *" wide><textarea rows={2} /></F>
      </Panel>

      <div className="sgfoot">
        <button type="button" className="pri">저장하기</button>
        <button type="button" className="sec">계약서 미리보기</button>
      </div>
      <p className="sghint end">시연용 화면입니다. 입력값은 저장되지 않습니다.</p>
    </div>
  );
}
