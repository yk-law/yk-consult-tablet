import { useEffect, useMemo, useState } from "react";
import Logo from "./Logo.jsx";
import Tablet from "./Tablet.jsx";
import { api } from "./api.js";
import { ST_CLS, man, visitWhen, won } from "./util.jsx";

/** 고객 태블릿이 지금 어느 장면에 있는지. 실장이 한눈에 보는 문구. */
const WATCH = {
  wait: ["대기 화면", "예약자 확인을 기다리는 중"],
  film: ["브랜드 영상", "무음 반복 재생 중"],
  report: ["사건요약", "예약 때 말씀하신 내용 확인 중"],
  counsel: ["상담 변호사", "담당 변호사 프로필"],
  "counsel-video": ["상담 변호사", "소개 영상 재생 중"],
  seniors: ["전문인력", "고문·전문위원 둘러보는 중"],
};

/** 실장이 태블릿으로 넘길 수 있는 장면. 설문은 09-28 회의에서 뺐다. */
const PUSH = [
  ["wait", "내방"],
  ["film", "영상"],
  ["report", "사건요약"],
  ["counsel", "상담 변호사"],
  ["seniors", "전문인력"],
];

export default function YKOS({ cat, data, booking, connected, screen, act }) {
  const [vq, setVq] = useState("");
  const [oq, setOq] = useState("");
  const [rank, setRank] = useState([]);
  const [osd, setOsd] = useState(null);

  const rows = useMemo(() => {
    const q = vq.trim().toLowerCase();
    return (cat?.bookings || []).filter(
      (x) => !q || [x.name, x.tel, x.cat1, x.cat2].join(" ").toLowerCase().includes(q),
    );
  }, [cat, vq]);

  useEffect(() => {
    if (!booking) return;
    api.search(oq, { field: booking.field, court: booking.court, limit: 8 }).then(setRank);
  }, [oq, booking]);

  useEffect(() => {
    const n = rank[0]?.n;
    if (!n) { setOsd(null); return; }
    api.lawyer(n).then(setOsd);
  }, [rank]);

  const fee = cat && booking ? (cat.fee[booking.feeKey] || cat.fee.__all) : null;
  const watch = WATCH[screen] || ["—", ""];
  const rst = connected ? `${booking?.branch} · ${booking?.name}(가명) 님` : "미연결";

  return (
    <div className="os" id="osDev">
      <div className="ostop">
        <span className="oico">⌂</span><span className="oico">▤</span><span className="oico">▣</span>
        <span className="sp2" />
        <button className={`mir${connected ? " on" : ""}`}>미러링 <i /></button>
        <span className="clk">2026.09.04 13:20</span>
        <span className="me"><span className="av">고</span>고재완</span>
      </div>

      <div className="osw">
        <nav className="rail">
          {["홈", "인입", "콜", "콜백", "상담 예약", "상담 목록"].map((t) => <span className="ri" key={t}>{t}</span>)}
          <span className="ri on">상담 태블릿</span>
          {["선임 대기", "선임 목록", "미선임 목록", "부서배당 목록", "사건배당 요청", "사건수행 목록", "나의 사건", "서면", "종료"].map((t) => <span className="ri" key={t}>{t}</span>)}
          <span className="ri sec">검색</span>
          <span className="ri">맨파워 통합검색</span><span className="ri">성공 사례 검색</span>
        </nav>

        <div className="osm">
          <div className="split">
            {/* 좌 — 상담실장이 보는 화면 */}
            <section className="lft">
              <div className="vhd">
                <h3>방문 예정 목록</h3>
                <div className="seg2"><button className="on">전체</button><button>형사</button><button>민·가사</button></div>
              </div>
              <div className="vsearch">
                <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" /><path d="M13.5 13.5 18 18" /></svg>
                <input value={vq} onChange={(e) => setVq(e.target.value)} placeholder="고객명, 사건 유형, 연락처로 검색" />
              </div>

              <div>
                {rows.map((x) => {
                  const on = connected && booking?.id === x.id;
                  return (
                    <div className={`vcard${on ? " cur" : ""}`} key={x.id}>
                      <span className="vwhen">
                        <span className="dt">{visitWhen(x)}</span>
                        <span className={`st ${ST_CLS[x.st] || ""}`}>{x.st}</span>
                      </span>
                      <span className="vn">{x.name}</span><span className="alias">가명</span>
                      <span className="vt">{x.tel}</span>
                      <span className="vg">{x.cat1}&gt;{x.cat2}</span>
                      <span className="vb">상담 내용 작성</span>
                      <span className="vb off">선임 계약</span>
                      <button
                        className={`vb share${on ? " on" : ""}`}
                        onClick={() => (on ? act.unshare() : act.share(x.id))}
                      >
                        {on ? "공유 중 · 해제" : "화면 공유"}
                      </button>
                    </div>
                  );
                })}
                {!rows.length && <p className="sub" style={{ fontSize: 11, padding: "20px 2px" }}>검색 결과가 없습니다.</p>}
              </div>

              {connected && booking ? (
                <div id="osLive">
                  <div className="conn">
                    <div>
                      <span className="l">연결됨</span>
                      <span className="t">{booking.name}(가명) · {booking.branch}</span>
                    </div>
                    <button className="unshare" onClick={act.unshare}>공유 해제</button>
                  </div>

                  {/* 09-28 회의 1번 — 태블릿 화면을 여기서 직접 넘긴다 */}
                  <div>
                    <h4>태블릿 화면 제어 <em>누르면 고객 화면이 바뀝니다</em></h4>
                    <div className="tctl">
                      {PUSH.map(([id, label]) => (
                        <button
                          key={id}
                          className={screen === id || (id === "counsel" && screen === "counsel-video") ? "on" : ""}
                          onClick={() => act.screen(id)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="watch" style={{ marginTop: 10 }}>
                      <div>
                        <div className="l">지금 이 화면</div>
                        <div className="t">{watch[0]}</div>
                        <div className="d">{watch[1]}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4>예약 정보 <em>콜 탭 · eng_id {booking.id}</em></h4>
                    <div className="bk">
                      <div className="h">콜 탭 등록 정보<span>고객 화면과 동일</span></div>
                      <div className="b"><div className="bkg">
                        {[["유형", booking.type], ["역할", booking.role], ["당사자와의 관계", booking.rel || "—"],
                          ["사건 종류", `${booking.cat1} › ${booking.cat2}`], ["선임 형태", booking.form],
                          ["유입 경로", `${booking.inflow}${booking.kw ? ` · ${booking.kw}` : ""}`]].map(([k, v]) => (
                            <div className="i" key={k}><div className="k">{k}</div><div className="v">{v}</div></div>
                          ))}
                      </div></div>
                    </div>
                  </div>

                  <div>
                    <h4>추천 순위 · 근거 <em>{oq ? `"${oq}"` : `${booking.cat1} ${booking.cat2} · ${booking.court}`}</em></h4>
                    <div className="tools" style={{ margin: "0 0 10px" }}>
                      <input value={oq} onChange={(e) => setOq(e.target.value)} placeholder="변호사 검색 — 이름 · 분야 · 출신 · 경력" />
                    </div>
                    <table className="tb">
                      <thead><tr><th>변호사</th><th className="r">분야</th><th className="r">인접</th><th className="r">관할</th><th className="r">직위</th><th className="r">합계</th><th /></tr></thead>
                      <tbody>
                        {rank.map((l) => (
                          <tr key={l.n}>
                            <td>
                              <div className="n2">{l.n}</div>
                              <div style={{ fontSize: 9, color: "var(--mut)", fontWeight: 300 }}>{l.pos}{l.o ? ` · ${l.o}` : ""}</div>
                            </td>
                            <td className="r">{l.score?.parts?.field || "–"}</td>
                            <td className="r">{l.score?.parts?.near || "–"}</td>
                            <td className="r">{l.score?.parts?.court || "–"}</td>
                            <td className="r">{l.score?.parts?.pos || "–"}</td>
                            <td className="tot">{l.score?.s}</td>
                            <td><button className="sb" onClick={() => act.pushLawyer(l.n)}>화면 공유</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {osd && <OsDetail l={osd} fee={fee} all={cat.fee.__all} feeKey={booking.feeKey} />}
                </div>
              ) : (
                <p className="sub" style={{ fontSize: 10, marginTop: 12 }}>
                  행의 <b>화면 공유</b>를 누르면 그 고객의 태블릿에 인사 화면이 뜹니다. 누르기 전까지 태블릿은 브랜드 영상만 재생합니다.
                </p>
              )}
            </section>

            {/* 우 — 고객 태블릿 연결 화면 (보기 전용) */}
            <section className="rgt">
              <div className="rtab">
                <span className="on">고객화면</span>
                <span className="st">{rst}</span>
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
                    {data ? <Tablet data={data} screen={screen} onScreen={() => {}} /> : null}
                  </div></div></div>
                  <div className="mfoot"><span>{watch[0]}</span><span className="ml">실시간 미러링 · 보기 전용</span></div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function OsDetail({ l, fee, all, feeKey }) {
  const pct = (v) => Math.round((v / 50000000) * 100);
  return (
    <div>
      <h4>{l.n} {l.pos} <em>고객이 열어 본 프로필</em></h4>
      {fee && (
        <div className="pr">
          <div className="h">제안 금액 가이드<span>{feeKey} · 유사 {fee.n}건</span></div>
          <div className="b">
            <div className="rg">{man(fee.p25)} — {man(fee.p75)}</div>
            <div className="rn">YK-OS 선임 목록의 <b>약정금</b> 실적 분포(25~75 백분위). 부가세 포함.</div>
            <div className="bar"><i style={{ left: `${pct(fee.p25)}%`, right: `${100 - pct(fee.p75)}%` }} /></div>
            <div className="bl"><span>₩0</span><span>₩50,000,000</span></div>
            <div className="kv"><span>중앙값</span><span>{won(fee.mid)}</span></div>
            <div className="kv"><span>전체 사건 중앙값</span><span>{won(all.mid)}</span></div>
          </div>
        </div>
      )}
      {l.d?.links ? (
        <div style={{ marginTop: 14 }}>
          <div className="lnk">
            <div className="h">처분권자 접점<span>YK-OS 전용 · 고객 화면 비노출</span></div>
            <div className="b">{l.d.links.map((x) => (
              <div className="lr" key={x.t}>
                <span className="lk2">{x.k}</span>
                <span className="lt" dangerouslySetInnerHTML={{ __html: x.t + (x.e ? `<em>${x.e}</em>` : "") }} />
              </div>
            ))}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
