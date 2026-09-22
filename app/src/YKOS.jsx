import { useEffect, useState } from "react";
import Logo from "./Logo.jsx";
import Tablet from "./Tablet.jsx";
import SignModal from "./SignModal.jsx";
import WriteModal from "./WriteModal.jsx";
import { Photo, ST_CLS, inVisitRange, man, visitWhen, won } from "./util.jsx";
import { api } from "./api.js";

const WATCH = {
  intro: ["대기 화면", "예약 인사 노출 중"],
  brief: ["예약 정보 확인", "콜 메모 교차검증 중"],
  home: ["추천 변호사", "예약 정보 확인함 · 상위 3명"],
  browse: ["둘러보기", "예약 정보 확인을 미룸 · 추천은 참고로만"],
  detail: ["프로필", "고객이 상세를 보는 중"],
  fav: ["관심 변호사", "담김"],
  adv: ["고문·전문위원·자문위원", ""],
  case: ["업무사례", ""],
  review: ["의뢰인 후기", ""],
  sign: ["소송위임계약서", "YK-OS에서 보낸 기본서식 · 전자서명"],
};

export default function YKOS({ cat, sess, act }) {
  const b = sess.booking;
  const connected = sess.connected;
  const [vq, setVq] = useState("");
  const [oq, setOq] = useState("");
  const [rank, setRank] = useState([]);
  const [osd, setOsd] = useState(null);
  const MV = sess.memoVotes || [];
  const none = !(b?.memo || []).length;
  const bad = MV.filter((v) => v === false).length;
  const done = MV.filter((v) => v !== null).length;
  const rows = (cat.bookings || []).filter((x) => inVisitRange(x.date, sess.visitRange) && (!vq.trim() || [x.name, x.tel, x.cat1, x.cat2].join(" ").toLowerCase().includes(vq.toLowerCase())));
  const watch = WATCH[sess.screen] || ["—", ""];

  useEffect(() => {
    api.search(oq).then(setRank);
  }, [oq, sess.bookingId, sess.rev]);

  useEffect(() => {
    const n = sess.detailName || rank[0]?.n;
    if (!n) return;
    api.lawyer(n).then(setOsd);
  }, [sess.detailName, rank, sess.rev]);

  const rst = !connected ? "미연결"
    : bad ? `고객 정정 요청 ${bad}건`
    : sess.screen === "brief" ? "고객 확인 중"
    : `${b?.branch} · ${b?.name}(가명) 님`;

  return (
    <div className="os" id="osDev">
      <div className="ostop">
        <span className="oico">⌂</span><span className="oico">▤</span><span className="oico">▣</span>
        <span className="sp2" />
        <button className={`mir ${connected ? "on" : ""}`}>미러링 <i /></button>
        <span className="clk">2026.09.04 13:20</span>
        <span className="me"><span className="av">고</span>고재완</span>
      </div>
      <div className="osw">
        <nav className="rail">
          {["홈", "인입", "콜", "콜백", "상담 예약", "상담 목록"].map((t) => <span className="ri" key={t}>{t}</span>)}
          <span className="ri on">상담 태블릿</span>
          {["선임 대기", "선임 목록", "미선임 목록", "부서배당 목록", "사건배당 요청", "사건수행 목록", "나의 사건", "서면", "추심 (약정금)", "추심 (성공보수)", "종료"].map((t) => <span className="ri" key={t}>{t}</span>)}
          <span className="ri sec">검색</span>
          <span className="ri">맨파워 통합검색</span><span className="ri">성공 사례 검색</span>
          <span className="ri sec">승인</span>
          <span className="ri">약정금변경 승인요청</span><span className="ri">성공보수약정 승인요청</span>
          <span className="ri">사임 승인요청</span><span className="ri">처분권자 관리</span>
        </nav>
        <div className="osm">
          <div className="split">
            <section className="lft">
              <div className="vhd">
                <h3>방문 예정 목록</h3>
                <div className="seg2">
                  {[["today", "오늘"], ["tomorrow", "내일"], ["week", "이번주"], ["next", "다음주"]].map(([id, l]) => (
                    <button key={id} className={sess.visitRange === id ? "on" : ""} onClick={() => act.range(id)}>{l}</button>
                  ))}
                </div>
                <div className="seg2"><button className="on">전체</button><button>형사</button><button>민·가사</button></div>
              </div>
              <div className="vsearch">
                <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" /><path d="M13.5 13.5 18 18" /></svg>
                <input value={vq} onChange={(e) => setVq(e.target.value)} placeholder="고객명, 사건 유형, 연락처로 검색" />
              </div>
              <div>
                {rows.length ? rows.map((x) => {
                  const on = connected && sess.bookingId === x.id;
                  return (
                    <div className={`vcard ${on ? "cur" : ""}`} key={x.id}>
                      <span className="vwhen"><span className="dt">{visitWhen(x)}</span><span className={`st ${ST_CLS[x.st] || ""}`}>{x.st}</span></span>
                      <span className="vn">{x.name}</span><span className="alias">가명</span>
                      <span className="vt">{x.tel}</span>
                      <span className="vg">{x.cat1}&gt;{x.cat2}</span>
                      <button className="vb wr" onClick={() => act.write(x.id)}>상담 내용 작성</button>
                      <button className="vb wr" onClick={() => act.signOpen(x.id)}>{sess.signed?.[x.id] ? "서명 완료" : "선임 계약"}</button>
                      <button className={`vb share ${on ? "on" : ""}`} onClick={() => (on ? act.unshare() : act.share(x.id))}>
                        {on ? "공유 중 · 해제" : "화면 공유"}
                      </button>
                    </div>
                  );
                }) : <p className="sub vempty">{vq ? "검색 결과가 없습니다." : "이 기간에 방문 예정인 고객이 없습니다."}</p>}
              </div>

              {connected && (
                <div>
                  <div className="conn">
                    <div><span className="l">연결됨</span><span className="t">{b?.name}(가명) · {b?.branch}</span></div>
                    <button className="unshare" onClick={act.unshare}>공유 해제</button>
                  </div>
                  <div className="watch" style={{ margin: "10px 0" }}>
                    <div><div className="l">지금 이 화면</div><div className="t">{watch[0]}</div><div className="d">{watch[1]}</div></div>
                  </div>
                  <div><h4>예약 정보 <em>콜 탭 · eng_id {b?.id}</em></h4>
                    <div className="bk"><div className="h">콜 탭 등록 정보<span>고객 화면과 동일</span></div>
                      <div className="b"><div className="bkg">
                        {[["유형", b.type], ["역할", b.role], ["당사자와의 관계", b.rel || "—"], ["사건 종류", `${b.cat1} › ${b.cat2}`], ["선임 형태", b.form], ["유입 경로", `${b.inflow} · ${b.kw}`]].map(([k, v]) => (
                          <div className="i" key={k}><div className="k">{k}</div><div className="v">{v}</div></div>
                        ))}
                      </div></div>
                    </div>
                  </div>
                  <div><h4>고객 교차검증 <em>{none ? "해당 없음" : (done ? `${done}/${b.memo.length} 확인${bad ? ` · 정정 ${bad}` : ""}` : "고객 확인 대기")}</em></h4>
                    {none ? (
                      <div className="bk none"><div className="b">
                        <div className="nonel">고객 사전 교차검증 내용 없음</div>
                        <p>콜 단계에서 사건 내용을 받아두지 못했습니다.{b.memoNote ? <> <b>{b.memoNote}</b></> : null}</p>
                        <p className="s">고객 태블릿에도 교차검증 화면을 띄우지 않습니다. 사실관계는 상담에서 처음부터 들으셔야 합니다.</p>
                      </div></div>
                    ) : (
                      <div className="bk"><div className="h">사건개요(영업전략팀) 문장별 확인
                        <span className={`rt ${done < b.memo.length ? "on" : ""}`}>{done < b.memo.length ? "고객 확인 중" : "확인 완료"}</span></div>
                        <div className="b">{b.memo.map((t, i) => {
                          const v = MV[i];
                          return <div className={`xr ${v === false ? "n" : ""} ${i === sess.lastMark ? "just" : ""}`} key={i}><span className={`st ${v === true ? "y" : (v === false ? "n" : "w")}`}>{v === true ? "맞음" : (v === false ? "정정" : "미확인")}</span><span>{t}</span></div>;
                        })}</div>
                      </div>
                    )}
                  </div>
                  <div><h4>확장 질문 시나리오 <em>{b.cat1} › {b.cat2} · {(sess.scenarios || []).length}건</em></h4>
                    <div className="bk sc"><div className="h">이런 건으로 넓어질 수 있습니다<span>고객 화면 비노출</span></div>
                      <div className="b">
                        {(sess.scenarios || []).map((r, i) => {
                          const on = sess.asked?.[`${b.id}:${i}`];
                          return (
                            <div className={`scr2 ${on ? "on" : ""}`} key={r.k}>
                              <div className="sk">{r.k}</div>
                              <div className="sq">{r.q}</div>
                              <button className="sask" onClick={() => act.asked(i)}>{on ? "확인함" : "물어보기"}</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div><h4>고객이 담은 변호사 <em>{(sess.favs || []).length}명</em></h4>
                    {(sess.favs || []).length
                      ? sess.favs.map((n) => {
                        const l = (cat.lawyers || []).find((x) => x.n === n) || { n, pos: "", f: [] };
                        return (
                          <div className="fav" key={n}>
                            <Photo l={l} c="xs" portraits={cat.portraits} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 11.5 }}>{l.n} <span style={{ fontWeight: 300, color: "var(--mut)", fontSize: 10 }}>{l.pos}</span></div>
                            </div>
                            <button className="sb" onClick={() => act.detail(n, false)}>상세</button>
                          </div>
                        );
                      })
                      : <p className="sub" style={{ fontSize: 10 }}>고객이 아직 담은 변호사가 없습니다.</p>}
                  </div>
                  <div><h4>추천 순위 · 근거 <em>{oq ? `"${oq}"` : `${b.cat1} ${b.cat2} · ${b.court}`}</em></h4>
                    <div className="tools" style={{ margin: "0 0 10px" }}>
                      <input value={oq} onChange={(e) => setOq(e.target.value)} placeholder="변호사 검색 — 이름 · 분야 · 출신 · 경력" />
                    </div>
                    <table className="tb">
                      <thead><tr><th>변호사</th><th className="r">분야</th><th className="r">인접</th><th className="r">관할</th><th className="r">직위</th><th className="r">합계</th><th /></tr></thead>
                      <tbody>
                        {rank.slice(0, 8).map((l) => (
                          <tr key={l.n}>
                            <td><div className="n2">{l.n}{sess.favs.includes(l.n) ? " ★" : ""}</div>
                              <div style={{ fontSize: 9, color: "var(--mut)", fontWeight: 300 }}>{l.pos}{l.o ? ` · ${l.o}` : ""}</div></td>
                            <td className="r">{l.score?.parts?.field || "–"}</td>
                            <td className="r">{l.score?.parts?.near || "–"}</td>
                            <td className="r">{l.score?.parts?.court || "–"}</td>
                            <td className="r">{l.score?.parts?.pos || "–"}</td>
                            <td className="tot">{l.score?.s}</td>
                            <td><button className="sb" onClick={() => act.detail(l.n)}>화면 공유</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {osd && <OsDetail l={osd} fee={sess.fee} all={cat.fee.__all} feeKey={b.feeKey} />}
                </div>
              )}
              {!connected && <p className="sub" id="vhint" style={{ fontSize: 10, marginTop: 12 }}>행의 <b>화면 공유</b>를 누르면 그 고객의 태블릿에 인사 화면이 뜹니다. 누르기 전까지 태블릿은 브랜드 영상만 재생합니다.</p>}
            </section>
            <section className="rgt">
              <div className="rtab"><span className="on">고객화면</span><span className="st">{rst}</span>
                {connected ? <button className="unshare sm" onClick={act.unshare}>공유 해제</button> : null}
              </div>
              {!connected ? (
                <div className="oempty">
                  <div className="lg"><Logo /></div>
                  <div className="ttl">상담 태블릿을 연결하세요</div>
                  <p className="d">미러링 시 고객 화면 미리보기가 여기에 표시됩니다.</p>
                  <ol>
                    <li><i>1</i>상담 태블릿 앱에서 이름을 입력해 입장합니다.</li>
                    <li><i>2</i>아래 목록에서 연결할 태블릿을 선택합니다.</li>
                    <li><i>3</i>방문 예정 목록에서 고객을 선택합니다.</li>
                  </ol>
                  <p className="w">연결 가능한 태블릿이 없습니다. 상담 태블릿 앱에서 먼저 입장해 주세요.</p>
                </div>
              ) : (
                <div className="mirror">
                  <div className="mfr"><div className="mscale"><div className="mclone">
                    <Tablet cat={cat} sess={sess} act={act} mirror />
                  </div></div></div>
                  <div className="mfoot"><span>{watch[0]}</span><span className="ml">실시간 미러링 · 보기 전용</span></div>
                </div>
              )}
            </section>
          </div>
          {sess.writeOpen ? <WriteModal cat={cat} sess={sess} act={act} /> : null}
          {sess.signOpen ? <SignModal cat={cat} sess={sess} act={act} /> : null}
        </div>
      </div>
    </div>
  );
}

function OsDetail({ l, fee, all, feeKey }) {
  const pct = (v) => Math.round(v / 50000000 * 100);
  return (
    <div>
      <h4>{l.n} {l.pos} <em>고객이 열어 본 프로필</em></h4>
      <div className="tiles" style={{ marginBottom: 14 }}>
        <div className="tile"><div className="v">{l.f.length}</div><div className="k">담당 분야</div></div>
        <div className="tile"><div className="v">{fee?.n}</div><div className="k">유사 사건</div></div>
        <div className="tile wait"><div className="v">종결 결과<br />집계 없음</div><div className="k">데이터 정비 후</div></div>
      </div>
      {fee && (
        <div className="pr"><div className="h">제안 금액 가이드<span>{feeKey} · 유사 {fee.n}건</span></div>
          <div className="b">
            <div className="rg">{man(fee.p25)} — {man(fee.p75)}</div>
            <div className="rn">YK-OS 선임 목록의 <b>약정금</b> 실적 분포(25~75 백분위). 부가세 포함.</div>
            <div className="bar"><i style={{ left: `${pct(fee.p25)}%`, right: `${100 - pct(fee.p75)}%` }} /></div>
            <div className="bl"><span>₩0</span><span>₩50,000,000</span></div>
            <div className="kv"><span>중앙값</span><span>{won(fee.mid)}</span></div>
            <div className="kv"><span>전체 사건 중앙값</span><span>{won(all.mid)}</span></div>
            <div className="kv"><span>성공보수 · 민사·가사</span><span>경제적 이익의 5~10%</span></div>
            <div className="kv"><span>성공보수 · 형사</span><span>정액 — 불기소·무죄 시 협의</span></div>
          </div>
        </div>
      )}
      {l.d?.links ? (
        <div style={{ marginTop: 14 }}><div className="lnk">
          <div className="h">처분권자 접점<span>YK-OS 전용 · 고객 화면 비노출</span></div>
          <div className="b">{l.d.links.map((x) => (
            <div className="lr" key={x.t}><span className="lk2">{x.k}</span><span className="lt" dangerouslySetInnerHTML={{ __html: x.t + (x.e ? `<em>${x.e}</em>` : "") }} /></div>
          ))}</div>
        </div></div>
      ) : null}
    </div>
  );
}
