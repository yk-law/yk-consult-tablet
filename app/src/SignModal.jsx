import { useState } from "react";
import Paper from "./Paper.jsx";
import { hasTerm, man } from "./util.jsx";
import { api } from "./api.js";

function Acc({ open, label, on, children }) {
  return (
    <section className={`ssec ${open ? "" : "fold"}`}>
      <button type="button" className="shd" onClick={on}>{label}<i>{open ? "▾" : "▸"}</i></button>
      <div className="sbd">{children}</div>
    </section>
  );
}

export default function SignModal({ cat, sess, act }) {
  const [ct, setCt] = useState(sess.contract);
  const [open, setOpen] = useState({ case: true, agr: true, fee: true, org: true });
  if (!ct) return null;
  const r = ct.retainer;
  const patch = (next) => { setCt(next); api.post("/api/session/sign", { contract: next }); };
  const set = (fn) => patch(fn({ ...ct }));
  const chk = (on, id, label, lock, kind) => (
    <button type="button" className={`sch ${on ? "on" : ""} ${lock ? "lock" : ""}`}
      onClick={() => {
        if (lock) return;
        if (kind === "agr") {
          const a = ct.agreement.includes(id) ? ct.agreement.filter((x) => x !== id) : [...ct.agreement, id];
          set((x) => ({ ...x, agreement: a }));
        } else {
          if (id === "retainer") return;
          const a = ct.fee.includes(id) ? ct.fee.filter((x) => x !== id) : [...ct.fee, id];
          set((x) => ({ ...x, fee: a }));
        }
      }}>{label}</button>
  );

  return (
    <div className="wov" onClick={(e) => { if (e.target === e.currentTarget) act.signClose(); }}>
      <div className="wdlg signlg" role="dialog" aria-label="선임 계약">
        <div className="wtop">
          <div><h3>선임 계약</h3><span className="eng">eng_id {ct.engId} · {ct.client}(가명)</span></div>
          <button className="wx" onClick={act.signClose} aria-label="닫기">✕</button>
        </div>
        <div className="sgrid">
          <div className="sform">
            <div className="stpl" role="group" aria-label="사용할 템플릿">
              <button type="button" className={ct.template === "criminal" ? "on" : ""} onClick={() => set((x) => ({ ...x, template: "criminal", civil: false }))}>형사</button>
              <button type="button" className={ct.template === "civil" ? "on" : ""} onClick={() => set((x) => ({ ...x, template: "civil", civil: true }))}>민·가사</button>
            </div>
            <Acc open={open.case} label="사건" on={() => setOpen({ ...open, case: !open.case })}>
              <div className="wgrid c2">
                <div className="wf2"><label>사건번호</label><input value={ct.caseNo} onChange={(e) => set((x) => ({ ...x, caseNo: e.target.value }))} /></div>
                <div className="wf2"><label>사건명</label><input value={ct.caseName} onChange={(e) => set((x) => ({ ...x, caseName: e.target.value }))} /></div>
                <div className="wf2"><label>위임인</label><div className="bx fill">{ct.client} (가명)</div></div>
                <div className="wf2"><label>상대방</label><input value={ct.opponent} onChange={(e) => set((x) => ({ ...x, opponent: e.target.value }))} /></div>
                <div className="wf2"><label>관할</label><input value={ct.jurisdiction} onChange={(e) => set((x) => ({ ...x, jurisdiction: e.target.value }))} /></div>
                <div className="wf2"><label>소송물가액</label><input placeholder="미입력이면 서식에서 비움" value={ct.litigationAmount} onChange={(e) => set((x) => ({ ...x, litigationAmount: e.target.value }))} /></div>
              </div>
            </Acc>
            <Acc open={open.agr} label="약정 조건" on={() => setOpen({ ...open, agr: !open.agr })}>
              <p className="snote">위임사무·특약사항. 체크한 항목만 서식에 들어갑니다.</p>
              <div className="schips">{cat.sign.agr.map((t) => chk(hasTerm(ct, t.id), t.id, t.label, false, "agr"))}</div>
              <div className="wf2 full" style={{ marginTop: 10 }}><label>위임사무</label>
                <textarea rows={3} disabled={!hasTerm(ct, "delegation")} value={ct.delegation} onChange={(e) => set((x) => ({ ...x, delegation: e.target.value }))} /></div>
              <div className="wf2 full" style={{ marginTop: 10 }}><label>특약사항</label>
                <textarea rows={3} disabled={!hasTerm(ct, "special")} value={ct.special} onChange={(e) => set((x) => ({ ...x, special: e.target.value }))} /></div>
            </Acc>
            <Acc open={open.fee} label="보수 조건" on={() => setOpen({ ...open, fee: !open.fee })}>
              <p className="snote">착수금은 기본 포함. 성공보수·출장비는 필요할 때만 켭니다. 착수금 {man(r.amount)}은 {r.feeKey} 약정금 중앙값({r.feeN}건) 시연값입니다.</p>
              <div className="schips">{cat.sign.fee.map((t) => chk(hasTerm(ct, t.id), t.id, t.label, t.id === "retainer", "fee"))}</div>
              <div className="wgrid c2" style={{ marginTop: 10 }}>
                <div className="wf2"><label>착수금 금액 (원)</label><input inputMode="numeric" value={r.amount || ""} onChange={(e) => set((x) => ({ ...x, retainer: { ...x.retainer, amount: Number(String(e.target.value).replace(/\D/g, "")) || 0 } }))} /></div>
                <div className="wf2"><label>착수금 지급시기</label><input value={r.timing} onChange={(e) => set((x) => ({ ...x, retainer: { ...x.retainer, timing: e.target.value } }))} /></div>
                <div className="wf2"><label>분할납부</label><input placeholder="없으면 비움" value={r.installments} onChange={(e) => set((x) => ({ ...x, retainer: { ...x.retainer, installments: e.target.value } }))} /></div>
                <div className="wf2"><label>착수금 부가세</label>
                  <select value={r.vat} onChange={(e) => set((x) => ({ ...x, retainer: { ...x.retainer, vat: e.target.value } }))}><option>별도</option><option>포함</option></select></div>
                <div className="wf2"><label>결제수단</label>
                  <select value={r.method} onChange={(e) => set((x) => ({ ...x, retainer: { ...x.retainer, method: e.target.value } }))}>{cat.sign.pay.map((p) => <option key={p.id}>{p.label}</option>)}</select></div>
              </div>
              {hasTerm(ct, "success") && (
                <div className="wgrid c2" style={{ marginTop: 10 }}>
                  <div className="wf2"><label>성공보수 정액 (원)</label><input placeholder="비율만 쓸 거면 비움" value={ct.success.fixed} onChange={(e) => set((x) => ({ ...x, success: { ...x.success, fixed: e.target.value } }))} /></div>
                  <div className="wf2"><label>경제적 이익 비율 (%)</label><input value={ct.success.pct} onChange={(e) => set((x) => ({ ...x, success: { ...x.success, pct: e.target.value } }))} /></div>
                  <div className="wf2 full"><label>성공보수 지급시기</label><textarea rows={3} value={ct.success.timing} onChange={(e) => set((x) => ({ ...x, success: { ...x.success, timing: e.target.value } }))} /></div>
                </div>
              )}
              {hasTerm(ct, "travel") && (
                <div className="wgrid c2" style={{ marginTop: 10 }}>
                  <div className="wf2"><label>출장비 일당 (원)</label><input value={ct.travel.daily} onChange={(e) => set((x) => ({ ...x, travel: { ...x.travel, daily: e.target.value } }))} /></div>
                  <div className="wf2"><label>출장비 예치금 (원)</label><input value={ct.travel.deposit} onChange={(e) => set((x) => ({ ...x, travel: { ...x.travel, deposit: e.target.value } }))} /></div>
                </div>
              )}
            </Acc>
            <Acc open={open.org} label="부서 배당" on={() => setOpen({ ...open, org: !open.org })}>
              <p className="snote">태블릿으로 보내려면 희망 배당 부서 1과 의견이 필요합니다.</p>
              <div className="wgrid c2">
                {["org1", "org2", "org3"].map((key, i) => (
                  <div className="wf2" key={key}>
                    <label>희망 배당 부서/지사 {i + 1}.{i === 0 ? " *" : ""}</label>
                    <select value={ct[key] || ""} onChange={(e) => set((x) => ({ ...x, [key]: e.target.value }))}>
                      <option value="">선택</option>
                      {cat.sign.orgs.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="wf2 full" style={{ marginTop: 10 }}><label>부서 배당 의견 *</label>
                <textarea rows={3} value={ct.opinion} onChange={(e) => set((x) => ({ ...x, opinion: e.target.value }))} /></div>
            </Acc>
            <p className={`serr ${/저장/.test(sess.signErr || "") ? "ok" : ""}`}>{sess.signErr}</p>
          </div>
          <div className="sprev"><Paper ct={ct} firm={cat.firm} sign={cat.sign} signed={sess.signed} /></div>
        </div>
        <div className="wfoot">
          <button className="wb" onClick={act.signClose}>닫기</button>
          <span style={{ flex: 1 }} />
          <button className="wb" onClick={() => api.post("/api/session/sign", { contract: ct, save: true }).then(act.setSess)}>저장하기</button>
          <button className="wb pri" onClick={() => api.post("/api/session/sign", { contract: ct, send: true }).then(act.setSess)}>태블릿으로 보내기</button>
        </div>
      </div>
    </div>
  );
}
