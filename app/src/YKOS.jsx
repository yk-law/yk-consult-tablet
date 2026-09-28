import { useEffect, useMemo, useState } from "react";
import Logo from "./Logo.jsx";
import Tablet from "./Tablet.jsx";
import SignForm from "./SignForm.jsx";
import { DEMO_TODAY, ST_CLS, addDays, visitWhen } from "./util.jsx";

/** 고객 태블릿이 지금 어느 장면에 있는지. 실장이 한눈에 보는 문구. */
const WATCH = {
  wait: ["대기 화면", "예약자 확인을 기다리는 중"],
  film: ["브랜드 영상", "무음 반복 재생 중"],
  report: ["사건요약", "예약 때 말씀하신 내용 확인 중"],
  counsel: ["상담 변호사", "담당 변호사 프로필"],
  "counsel-video": ["상담 변호사", "소개 영상 재생 중"],
  seniors: ["전문인력", "고문·전문위원 둘러보는 중"],
};

/** 방문 예정일 이동. 실제 YK-OS는 화살표 하나에 라벨 하나다. */
const DAY_LABEL = { "-1": "어제", 0: "오늘", 1: "내일" };

export default function YKOS({ cat, data, booking, connected, screen, act }) {
  const [vq, setVq] = useState("");
  const [off, setOff] = useState(0);
  const [signId, setSignId] = useState(null);

  const want = addDays(DEMO_TODAY, off);
  const rows = useMemo(() => {
    const q = vq.trim().toLowerCase();
    return (cat?.bookings || [])
      .filter((x) => x.date === want)
      .filter((x) => !q || [x.name, x.tel, x.cat1, x.cat2].join(" ").toLowerCase().includes(q))
      .sort((a, z) => a.time.localeCompare(z.time));
  }, [cat, vq, want]);

  const sign = signId ? (cat?.bookings || []).find((b) => b.id === signId) : null;
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
              {sign ? <SignForm booking={sign} onBack={() => setSignId(null)} /> : <>
              <div className="vhd">
                <h3>방문 예정 목록</h3>
                <div className="dnav">
                  <button onClick={() => setOff(off - 1)} aria-label="이전 날짜">‹</button>
                  <span className="lb">{DAY_LABEL[off] || want.slice(5)}</span>
                  <button onClick={() => setOff(off + 1)} aria-label="다음 날짜">›</button>
                </div>
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
                      {/* 실제 YK-OS 규칙. 상담 내용을 작성해야 선임 계약이 열린다. */}
                      <span className="vb">{x.wrote ? "상담 내용 보기" : "상담 내용 작성"}</span>
                      {x.wrote
                        ? <button className="vb sign" onClick={() => setSignId(x.id)}>선임 계약</button>
                        : <span className="vb off">선임 계약</span>}
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

                  {/* 09-28 회의: 화면 제어를 세분화하지 않는다. 고객이 태블릿에서 직접 움직이고,
                      실장은 지금 어디를 보는지만 확인한다. 조작은 연결·해제뿐. */}
                  <div className="watch">
                    <div>
                      <div className="l">지금 이 화면</div>
                      <div className="t">{watch[0]}</div>
                      <div className="d">{watch[1]}</div>
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

                </div>
              ) : (
                <p className="sub" style={{ fontSize: 10, marginTop: 12 }}>
                  행의 <b>화면 공유</b>를 누르면 그 고객의 태블릿에 인사 화면이 뜹니다. 누르기 전까지 태블릿은 브랜드 영상만 재생합니다.
                </p>
              )}
              </>}
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
