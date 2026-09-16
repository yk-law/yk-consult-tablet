/* 데이터는 data/*.js 에서 전역으로 주입된다 */
const FIELD={A:["형사","조사·재판·구속"],B:["성범죄","고소·수사·재판"],C:["학교폭력","학폭위·형사"],D:["마약","투약·유통"],
 E:["교통사고","음주·뺑소니·보상"],F:["기업법무","회사·계약·공정거래"],G:["지식재산권","특허·상표·영업비밀"],H:["회생·파산","법인 회생"],
 I:["부동산·건설","공사·분양·명도"],J:["이혼","이혼·재산분할"],K:["민사","손해배상·금전"],L:["가사·상속","상속·유류분·후견"],
 M:["군형사","군사법·징계"],N:["중대재해","산업안전"],O:["노동·산재","해고·임금·재해"],P:["행정","처분취소·헌법"],
 Q:["의료","의료과실"],R:["조세","세무·관세"],S:["금융·증권","경제범죄·투자"]};
const NEAR={K:["I","P","Q","S"],A:["B","D","E","M"],J:["L","K"],L:["J","K"],I:["K","F"],F:["S","R","G"],O:["N","P"],B:["C","A"],E:["A","K"],S:["F","A"],P:["K","O"]};
const POS={대표:["박찬","한만수","권순일","정창호","배성범","박춘기","한상진","김경","양호산","배인구","유병두","추원식","최영운","변민선","나찬기","천기홍","강경훈","김범한"],
 파트너:["김동진","김윤정","정병실","송각엽","김택형","임효진","곽노주","김형원","심현희","조인선","현민석","박재완"],고문:["양동학"]};
const ORIGIN={박찬:"부장판사",권순일:"대법관",정창호:"ICC 재판관",배성범:"고검장",박춘기:"부장판사",한상진:"부장검사",김경:"부장판사",
 양호산:"부장검사",배인구:"가정법원 부장판사",유병두:"차장검사",최영운:"부장검사",변민선:"부장판사",나찬기:"차장검사",천기홍:"부장검사",
 김동진:"부장판사",김윤정:"부장판사",정병실:"부장판사",송각엽:"부장판사",김택형:"판사",양동학:"판사",한만수:"조세법 전문",강경훈:"형사법·이혼 전문"};
let CTX={field:"K",court:"서울중앙지방법원",label:"민사 손해배상",feeKey:"손해배상"};

/* 예약 목록 — YK-OS 「상담 태블릿 › 상담 내용 › 콜」 탭을 그대로 추종한다.
   필드명·값 도메인은 실제 화면과 동일: 고객 유형(개인/기업) · 고객 역할(사건 당사자/사건 위임인/추천인/기타)
   · 사건 당사자와의 관계 · 사건 종류(2단) · 유입 경로 · 사건개요(영업전략팀)
   고객명은 전부 가명, 연락처는 예시값. */


let BK=BOOKINGS[0];          // 현재 화면 공유 중인 예약
let CONNECTED=false;         // 상담실장이 화면 공유를 지정했는가
let SIGNED={};               // 예약별 전자서명 완료(시연)
const ROLE_HINT={"사건 당사자":"본인 사건으로 오셨습니다","사건 위임인":"당사자를 대신해 위임하러 오셨습니다",
  "추천인":"다른 분을 소개하러 오셨습니다","기타":"그 밖의 사유로 오셨습니다"};

const CASES=[{c:"민사 / 상간소송",r:"전부 승소",t:"상간소송 피고 항소 기각 — 5,000만 원 청구 방어"},
 {c:"민사 / 상간소송",r:"전부 승소",t:"위자료 청구 기각 — 사실혼 관계 인정"},
 {c:"민사 / 상간소송",r:"전부 승소",t:"상간녀위자료소송 — 4,000만 원 전액 인용"},
 {c:"민사 / 상간소송",r:"합의 성립",t:"상간녀 위자료 합의 — 3,000만 원 지급"},
 {c:"교통사고 / 음주운전",r:"무죄",t:"항소심 무죄 — 고의 운전 부재 입증"},
 {c:"교통사고 / 음주운전",r:"무죄",t:"무죄 — 긴급피난 정당행위 인정"},
 {c:"성범죄 / 카촬",r:"기소유예",t:"초범 기소유예 — 경찰조사 대응"},
 {c:"성범죄 / 카촬",r:"무죄",t:"무죄 — 전 연인 불법촬영 고소 방어"}];
const REVIEWS=[{f:"기업법무",t:"억울한 업무방해 고소, YK 조력에 불기소",l:["박재완","현민석","장현준","곽민규","김현준"]},
 {f:"기업법무",t:"형사 고소 60건 중 1건만 인정돼 약식명령",l:["조인선","곽노주","홍석일"]},
 {f:"민사",t:"차량 필름시공 중 합판 등 파손, 피해 배상받음",l:["김채민","김서영","조예은"]},
 {f:"학교폭력",t:"초등학생 학폭위 회부 위기, 학교장 자체 종결",l:["손현태","김은정"]},
 {f:"이혼",t:"혼인 파탄으로 인한 이혼, 조정으로 마무리",l:["마수정"]},
 {f:"민사",t:"허위보도 손해배상청구·정정보도청구 전부 방어",l:["박찬호","최황선"]},
 {f:"형사",t:"연인을 가장한 투자사기, 가해자 실형",l:["함진주"]}];
const CF=["전체","민사","교통사고","성범죄"], RF=["전체","민사","기업법무","이혼","형사","학교폭력"];
const AF=["전체","고문","전문위원","자문위원"];

const L=RAW.trim().split(/\s+/).map(s=>{const [n,c]=s.split(":");
  const pos=POS.대표.includes(n)?"대표변호사":(POS.파트너.includes(n)?"파트너변호사":(POS.고문.includes(n)?"고문변호사":"변호사"));
  return {n,f:(c||"").split("").filter(Boolean),pos,o:ORIGIN[n]||null,d:DETAIL[n]||null};});
const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const won=v=>"₩"+v.toLocaleString("ko-KR");
const man=v=>(v/10000).toLocaleString("ko-KR")+"만원";
const ph=(l,c)=>IMG[l.n]?`<div class="ph ${c}"><img src="${IMG[l.n]}" alt="${l.n}"></div>`:`<div class="ph ${c}"><div class="mono">${l.n[0]}</div></div>`;

function score(l){const p={};let s=0;
  const hit=l.f.includes(CTX.field); if(hit){s+=100;p.field=100;}
  const near=(NEAR[CTX.field]||[]).filter(c=>l.f.includes(c));
  if(near.length){p.near=Math.min(near.length*8,24);s+=p.near;}
  const court=!!(l.d&&(l.d.career.join(" ")+" "+(l.d.links||[]).map(x=>x.t).join(" ")).includes(CTX.court));
  if(court){s+=40;p.court=40;}
  const pv=l.pos==="대표변호사"?10:(l.pos==="파트너변호사"?6:(l.pos==="고문변호사"?4:0));
  if(pv){s+=pv;p.pos=pv;}
  if(l.d){s+=6;p.detail=6;}
  s+=l.f.length; return {s,parts:p,court,hit,near};}
function reasons(l){const {court,near,hit}=score(l),o=[];
  if(hit) o.push({t:FIELD[CTX.field][0]+" 담당"});
  if(court) o.push({t:CTX.court+" 근무 이력"});
  if(near.length) o.push({t:"관련 "+near.slice(0,2).map(c=>FIELD[c][0]).join(" · "),k:"s"});
  if(l.o) o.push({t:l.o+" 출신",k:"s"});
  return o.slice(0,3);}
function relCareer(l){return l.d.career.map(c=>{let v=0;
  if(c.includes(CTX.court)) v+=100;
  if(/민사|손해배상/.test(c)) v+=40;
  if(/재판부|부장판사/.test(c)) v+=10;
  if(/건설|의료|보험/.test(c)) v+=8; return {c,v};}).sort((a,b)=>b.v-a.v);}
const sorted=a=>a.slice().sort((x,y)=>score(y).s-score(x).s||x.n.localeCompare(y.n,"ko"));
function hay(l){if(l._h)return l._h;const p=[l.n,l.pos,l.o||"",...l.f.map(c=>FIELD[c][0]+" "+FIELD[c][1])];
  if(l.d)p.push(l.d.edu,l.d.tr,l.d.career.join(" "),(l.d.cases||[]).join(" "));return (l._h=p.join(" "));}
const match=(l,q)=>hay(l).toLowerCase().includes(q.toLowerCase());

let stack=[],cur="intro",favs=[];
function nav(s,push=true){
  if(push&&cur&&cur!==s) stack.push(cur);
  cur=s;
  document.querySelectorAll(".pane").forEach(p=>p.classList.remove("on"));
  document.getElementById("s-"+s).classList.add("on");
  document.getElementById("nav").classList.toggle("hide",s==="intro"||s==="brief"||s==="sign");
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===s||(b.dataset.t==="home"&&s==="browse")));
  document.getElementById("scr").scrollTop=0;
  if(s==="fav") renderFav(); if(s==="adv") renderAdv(); if(s==="sign") renderSignTab();
  watch();}
function back(){nav(stack.pop()||"home",false);}
function start(){ if(!CONNECTED) return; nav("brief"); }

/* 예약 정보 확인 여부에 따라 다음 화면이 갈린다.
   확인함  → 추천 변호사 (사건 기준으로 고른 3인이 주인공)
   나중에 → 둘러보기 (추천은 참고로 내리고, 업무사례·후기·전문가를 앞에 둔다)
   상담실장은 고객이 어느 쪽을 골랐는지 알아야 한다. */
let CONFIRMED=false;
function confirmBrief(){CONFIRMED=true;nav("home");watch();}
function skipBrief(){CONFIRMED=false;renderRec();search2();nav("browse");watch();}
function goLawyers(){nav(CONFIRMED?"home":"browse");}
function reset(){favs=[];stack=[];CONFIRMED=false;SIGNED={};closeSign();closeWrite();document.getElementById("q").value="";document.getElementById("q2").value="";search2();
  CONNECTED=false;MV=BK.memo.map(()=>null);
  applyBooking(BOOKINGS[0],false);setVisitRange("today");nav("intro",false);badge();osFav();}

/* 상담실장이 목록에서 「화면 공유」를 누르면 그 예약이 태블릿에 연결된다 */
function share(id){
  const b=BOOKINGS.find(x=>x.id===id); if(!b) return;
  const again = CONNECTED && BK.id===id;
  CONNECTED=true; applyBooking(b,true);
  favs=[];stack=[];CONFIRMED=false;badge();osFav();
  if(!again) nav("intro",false);
  renderVisit();}
/* 공유 해제 — 태블릿을 대기 화면으로 되돌린다 */
function unshare(){
  CONNECTED=false; favs=[]; stack=[]; CONFIRMED=false;
  document.getElementById("q").value=""; search();
  document.getElementById("q2").value=""; search2();
  applyBooking(BK,false); renderVisit(); nav("intro",false); badge();}

function applyBooking(b,connected){
  BK=b; MV=BK.memo.map(()=>null);
  CTX={field:b.field,court:b.court,label:`${b.cat1} ${b.cat2}`,feeKey:b.feeKey};
  L.forEach(l=>{delete l._s;});
  document.getElementById("ctxbar").innerHTML = connected
    ? `상담실장이 연결한 상담 · <b>${esc(b.name)}</b> <span class="alias">가명</span> · ${esc(b.cat1)} ${esc(b.cat2)} · ${esc(b.court)}`
    : `상담실장 화면과 아직 연결되지 않았습니다 · 대기 중`;
  document.getElementById("tlk").textContent = connected? "상담실장 화면과 연결됨" : "연결 대기";
  document.getElementById("tlk").classList.toggle("on", !!connected);
  document.getElementById("rst").textContent = connected? `${b.branch} · ${b.name}(가명) 님` : "미연결";
  document.getElementById("mirBtn").classList.toggle("on",connected);
  document.getElementById("connWho").textContent = connected? `${b.name}(가명) · ${b.branch}` : "—";
  document.getElementById("rUnshare").classList.toggle("hidden",!connected);
  document.getElementById("vhint").classList.toggle("hidden",connected);
  document.getElementById("osMirror").classList.toggle("hidden",!connected);
  document.getElementById("osEmpty").classList.toggle("hidden",connected);
  document.getElementById("osLive").classList.toggle("hidden",!connected);
  document.getElementById("intro-hi").classList.toggle("hidden",!connected);
  document.getElementById("intro-wait").classList.toggle("hidden",connected);
  if(connected){document.getElementById("bkEng").textContent=`콜 탭 · eng_id ${b.id}`;
    renderIntro();renderBrief();renderRec();search();search2();osSearch();
    osDetail(sorted(L.filter(l=>l.f.includes(CTX.field)))[0]||L[0],false);}
  watch();}

/* 방문 예정 목록 — 고객명 · 사건 유형 · 연락처 검색 (YK-OS 현행 화면과 동일한 카드형)
   기간 기준일은 시연 시계(2026-09-04)와 맞춘다. 주는 월요일 시작. */
const ST_CLS={"상담 중":"now","곧 시작":"soon"};
const YOIL=["일","월","화","수","목","금","토"];
const DEMO_TODAY="2026-09-04";
let VRANGE="today";
function parseYMD(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);}
function fmtYMD(dt){return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;}
function addDays(s,n){const d=parseYMD(s);d.setDate(d.getDate()+n);return fmtYMD(d);}
function weekMon(s){const d=parseYMD(s),day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return fmtYMD(d);}
function inVisitRange(date){
  if(VRANGE==="today") return date===DEMO_TODAY;
  if(VRANGE==="tomorrow") return date===addDays(DEMO_TODAY,1);
  const mon=weekMon(DEMO_TODAY);
  if(VRANGE==="week"){const sun=addDays(mon,6);return date>=mon&&date<=sun;}
  if(VRANGE==="next"){const nmon=addDays(mon,7),nsun=addDays(nmon,6);return date>=nmon&&date<=nsun;}
  return true;}
function visitWhen(b){
  const dt=parseYMD(b.date), yy=String(dt.getFullYear()).slice(2);
  const md=`${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  return `<span class="ymd">${yy}-${md}</span><span class="dow">${YOIL[dt.getDay()]}</span><span class="tm">${b.time}</span>`;}
function setVisitRange(r){
  VRANGE=r;
  document.querySelectorAll("#vrange button").forEach(b=>b.classList.toggle("on",b.dataset.range===r));
  renderVisit();}
function renderVisit(){
  const q=(document.getElementById("vq").value||"").trim().toLowerCase();
  const rows=BOOKINGS.filter(b=>inVisitRange(b.date)&&(!q||[b.name,b.tel,b.cat1,b.cat2].join(" ").toLowerCase().includes(q)))
    .slice().sort((x,y)=>x.date.localeCompare(y.date)||x.time.localeCompare(y.time));
  document.getElementById("vbody").innerHTML = rows.length? rows.map(b=>{
    const on=CONNECTED&&BK.id===b.id;
    return `<div class="vcard ${on?"cur":""}">
      <span class="vwhen"><span class="dt">${visitWhen(b)}</span><span class="st ${ST_CLS[b.st]||""}">${esc(b.st)}</span></span>
      <span class="vn">${esc(b.name)}</span><span class="alias">가명</span>
      <span class="vt">${esc(b.tel)}</span>
      <span class="vg">${esc(b.cat1)}&gt;${esc(b.cat2)}</span>
      <button class="vb wr" onclick="openWrite('${b.id}')">상담 내용 작성</button>
      <button class="vb wr" onclick="openSign('${b.id}')">${SIGNED[b.id]?"서명 완료":"선임 계약"}</button>
      <button class="vb share ${on?"on":""}" onclick="${on?"unshare()":`share('${b.id}')`}"
        title="${on?"누르면 공유를 해제합니다":"이 고객의 태블릿에 연결합니다"}">${on?"공유 중 · 해제":"화면 공유"}</button>
    </div>`;}).join("")
    : `<p class="sub vempty">${q?"검색 결과가 없습니다.":"이 기간에 방문 예정인 고객이 없습니다."}</p>`;}

/* ── 예약 확인 화면 ─────────────────────────────── */
let MV=BK.memo.map(()=>null);   // 문장별 확인 결과: true 맞아요 / false 달라요 / null 미확인
function renderIntro(){
  document.getElementById("hiName").textContent=BK.name;
  document.getElementById("hiRes").textContent=`${BK.at} · ${BK.branch} · ${BK.cat1} ${BK.cat2}`;}
function renderBrief(){
  const rows=[
    ["유형", BK.type, BK.type==="기업"?"법인 명의로 접수되었습니다":"개인 명의로 접수되었습니다"],
    ["역할", BK.role, (ROLE_HINT[BK.role]||"")+(BK.rel?` · 사건 당사자와의 관계 <b>${esc(BK.rel)}</b>`:"")],
    ["사건 종류", `<span class="bpath">${esc(BK.cat1)}<i>›</i>${esc(BK.cat2)}</span>`, `선임 형태 ${esc(BK.form)} · 유입 ${esc(BK.inflow)}`],
    ["방문", BK.at, `${esc(BK.branch)}`]];
  document.getElementById("bcard").innerHTML=rows.map(([k,v,s])=>
    `<div class="brow"><div class="k">${esc(k)}</div><div class="v">${v}${s?`<span class="sub2">${s}</span>`:""}</div></div>`).join("");
  const none = !BK.memo.length;                       // 콜에서 사건 설명이 없었던 경우
  document.getElementById("memoBlk").classList.toggle("hidden",none);
  if(!none){
    document.getElementById("memo").innerHTML=BK.memo.map((t,i)=>
      `<div class="mrow ${MV[i]===false?"wrong":""}"><span class="no">${String(i+1).padStart(2,"0")}</span>
        <div class="tx">${esc(t)}</div>
        <div class="yn"><button class="y ${MV[i]===true?"on":""}" onclick="mark(${i},true)">맞아요</button>
          <button class="n ${MV[i]===false?"on":""}" onclick="mark(${i},false)">달라요</button></div></div>`).join("");
    const bad=MV.filter(v=>v===false).length, done=MV.filter(v=>v!==null).length;
    document.getElementById("bnote").innerHTML= bad
      ? `<b style="color:var(--acc)">${bad}가지를 다르다고 표시하셨습니다.</b> 상담실장에게 바로 전달되었으니, 상담 때 그 부분부터 짚어드립니다.`
      : (done===BK.memo.length ? "확인 감사합니다. 상담실장이 그대로 진행합니다."
         : "전화 상담 때 받아둔 내용이라 실제와 다를 수 있습니다. 다른 부분은 <b>달라요</b>를 눌러주세요.");
  }
  document.querySelector("#s-brief .sub").innerHTML = none
    ? "예약하실 때 받아둔 정보입니다.<br>사건 이야기는 상담 때 편하게 말씀해 주세요."
    : "전화 상담에서 받아둔 내용입니다. 맞는지만 확인해 주시면<br>상담이 훨씬 빨라집니다.";
  document.querySelector("#s-brief .bgo").textContent = none
    ? "네, 추천 변호사 보기" : "네, 맞습니다 · 추천 변호사 보기";
  osBk();}
let LASTMARK=-1, markT=null;
function mark(i,v){
  MV[i]=(MV[i]===v?null:v); LASTMARK=i; renderBrief();
  const bad=MV.filter(x=>x===false).length;
  document.getElementById("rst").textContent = bad? `고객 정정 요청 ${bad}건` : "고객 확인 중";
  clearTimeout(markT); markT=setTimeout(()=>{LASTMARK=-1;osBk();},2600);}

/* YK-OS 쪽 예약 정보 + 교차검증 결과 */
function osBk(){
  const g=[["유형",BK.type],["역할",BK.role],["당사자와의 관계",BK.rel||"—"],["사건 종류",`${BK.cat1} › ${BK.cat2}`],
    ["선임 형태",BK.form],["유입 경로",`${BK.inflow} · ${BK.kw}`]];
  document.getElementById("osBk").innerHTML=`<div class="bk"><div class="h">콜 탭 등록 정보<span>고객 화면과 동일</span></div>
    <div class="b"><div class="bkg">${g.map(([k,v])=>`<div class="i"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("")}</div></div></div>`;

  const none=!BK.memo.length;
  const bad=MV.filter(v=>v===false).length, done=MV.filter(v=>v!==null).length;
  document.getElementById("xcnt").textContent = none? "해당 없음"
    : (done? `${done}/${BK.memo.length} 확인${bad?` · 정정 ${bad}`:""}` : "고객 확인 대기");

  document.getElementById("osX").innerHTML = none
    ? `<div class="bk none"><div class="b">
         <div class="nonel">고객 사전 교차검증 내용 없음</div>
         <p>콜 단계에서 사건 내용을 받아두지 못했습니다.${BK.memoNote?` <b>${esc(BK.memoNote)}</b>`:""}</p>
         <p class="s">고객 태블릿에도 교차검증 화면을 띄우지 않습니다. 사실관계는 상담에서 처음부터 들으셔야 합니다.</p>
       </div></div>`
    : `<div class="bk"><div class="h">사건개요(영업전략팀) 문장별 확인
         <span class="rt ${done<BK.memo.length?"on":""}">${done<BK.memo.length?"고객 확인 중":"확인 완료"}</span></div>
       <div class="b">${BK.memo.map((t,i)=>{const v=MV[i];
         return `<div class="xr ${v===false?"n":""} ${i===LASTMARK?"just":""}"><span class="st ${v===true?"y":(v===false?"n":"w")}">${v===true?"맞음":(v===false?"정정":"미확인")}</span><span>${esc(t)}</span></div>`;}).join("")}
         ${bad?`<p class="sub" style="font-size:10px;margin-top:10px"><b style="color:var(--acc)">정정 ${bad}건</b> — 상담 시작 시 이 문장부터 다시 확인하고, 사건개요를 수정하세요.</p>`:""}</div></div>`;
  osScenario();}

/* ── 확장 질문 시나리오 (상담실장 전용) ──────────────────
   내방 1건을 1건으로 끝내지 않기 위해, 사건 종류에서 파생될 수 있는 건과
   그것을 확인하는 질문을 띄운다. 고객 태블릿에는 노출하지 않는다. */
let ASKED={};
function osScenario(){
  const box=document.getElementById("osSc"); if(!box) return;
  const rows=(window.SCENARIO&&(SCENARIO[BK.cat2]||SCENARIO[BK.cat1]))||[];
  document.getElementById("scCnt").textContent = rows.length? `${BK.cat1} › ${BK.cat2} · ${rows.length}건` : "해당 없음";
  if(!rows.length){box.innerHTML=`<p class="sub" style="font-size:10.5px">이 사건 종류의 파생 시나리오가 아직 등록되지 않았습니다.</p>`;return;}
  box.innerHTML=`<div class="bk sc"><div class="h">이런 건으로 넓어질 수 있습니다<span>고객 화면 비노출</span></div>
    <div class="b">${rows.map((r,i)=>{const on=ASKED[BK.id+":"+i];
      return `<div class="scr2 ${on?"on":""}">
        <div class="sk">${esc(r.k)}</div>
        <div class="sq">${esc(r.q)}</div>
        <button class="sask" onclick="askedTog(${i})">${on?"확인함":"물어보기"}</button></div>`;}).join("")}
      <p class="sub" style="font-size:10px;margin-top:10px">확인한 항목은 상담 기록의 <b>위임 사무</b>에 반영하세요. 실제로 존재하는 건만 담습니다.</p>
    </div></div>`;}
function askedTog(i){const k=BK.id+":"+i; ASKED[k]=!ASKED[k]; osScenario();}

function starBtn(l){const on=favs.includes(l.n);
  return `<button class="star ${on?"on":""}" onclick="event.stopPropagation();fav('${l.n}')">${on?"★":"☆"}</button>`;}
function fav(n){const i=favs.indexOf(n); i>=0?favs.splice(i,1):favs.push(n);
  renderRec();search();if(cur==="fav")renderFav();if(cur==="detail"&&window.__cd)detail(window.__cd,false);
  badge();osFav();}
function badge(){const b=document.getElementById("favBadge");b.textContent=favs.length;b.classList.toggle("hidden",!favs.length);}

function renderRec(){
  const top=sorted(L.filter(l=>l.f.includes(CTX.field))).slice(0,3);
  const html=
   `<div class="rechd"><span class="t">추천 변호사</span><span class="s">${CTX.label} · ${CTX.court}</span></div>`+
   top.map((l,i)=>`<div class="rr" onclick="detail('${l.n}')"><span class="rk">${String(i+1).padStart(2,"0")}</span>
     ${ph(l,"m")}
     <div><div class="nm"><span class="n">${l.n}</span><span class="p">${l.pos}</span>${l.o?`<span class="bo">${l.o} 출신</span>`:""}</div>
       <div class="why">${reasons(l).map(r=>`<span class="wc ${r.k||""}">${esc(r.t)}</span>`).join("")}</div></div>
     ${starBtn(l)}</div>`).join("");
  document.getElementById("recWrap").innerHTML=html;
  const w2=document.getElementById("recWrap2"); if(w2)w2.innerHTML=html;}

/* 둘러보기 화면의 검색 — 결과 렌더는 search()와 같은 형식 */
function search2(){
  const q=(document.getElementById("q2").value||"").trim(), el=document.getElementById("sres2");
  if(!q){el.innerHTML="";return;}
  const rows=sorted(L.filter(l=>match(l,q))).slice(0,12);
  el.innerHTML=rows.length? rows.map(l=>
    `<div class="lrow" onclick="detail('${l.n}')">${ph(l,"s")}
      <div><div class="nm"><span class="n">${l.n}</span><span class="p">${l.pos}</span>${l.o?`<span class="bo">${l.o}</span>`:""}</div>
        <div class="fl">${l.f.slice(0,6).map(c=>`<span class="f ${c===CTX.field?"hit":""}">${FIELD[c][0]}</span>`).join("")}</div></div>
      ${starBtn(l)}</div>`).join("") : `<p class="empty">일치하는 변호사가 없습니다.</p>`;}

function search(){
  const q=(document.getElementById("q").value||"").trim(), el=document.getElementById("sres");
  if(!q){el.innerHTML="";return;}
  const rows=sorted(L.filter(l=>match(l,q))).slice(0,25);
  el.innerHTML=`<div class="cnt">"${esc(q)}" 검색 ${rows.length}명</div>`+(rows.length?rows.map(l=>
    `<div class="lrow" onclick="detail('${l.n}')">${ph(l,"s")}
      <div><div class="nm"><span class="n">${l.n}</span><span class="p">${l.pos}</span>${l.o?`<span class="bo">${l.o}</span>`:""}</div>
        <div class="fl">${l.f.slice(0,6).map(c=>`<span class="f ${c===CTX.field?"hit":""}">${FIELD[c][0]}</span>`).join("")}</div></div>
      ${starBtn(l)}</div>`).join(""):`<p class="empty">일치하는 변호사가 없습니다.</p>`);}

function detail(name,push=true){
  const l=L.find(x=>x.n===name); if(!l) return; window.__cd=name;
  const d=l.d, fee=FEE[CTX.feeKey]||FEE.__all;
  const rel=CASES.filter(c=>c.c.includes("민사")).slice(0,3);
  const mine=REVIEWS.filter(r=>r.l.includes(l.n));
  document.getElementById("dbody").innerHTML=`
   <div class="dh">${ph(l,"l")}
     <div>${l.o?`<span class="bo">${l.o} 출신</span>`:""}
       <div class="dn">${l.n}</div><div class="dp">${l.pos}</div>
       <div class="fl" style="margin-top:10px">${l.f.map(c=>`<span class="f ${c===CTX.field?"hit":""}">${FIELD[c][0]}</span>`).join("")}</div>
       ${d?`<div class="dc"><b>${esc(d.edu)}</b><br>${esc([d.exam,d.tr].filter(Boolean).join(" · "))}</div>`:""}</div></div>
   <div class="why" style="margin-top:16px">${reasons(l).map(r=>`<span class="wc ${r.k||""}">${esc(r.t)}</span>`).join("")}</div>
   ${d?`<div class="blk"><h3>주요 경력 <em>고객님 사건과 가까운 순</em></h3>
     ${relCareer(l).map(x=>`<div class="cl ${x.v>=40?"rel":""}">${esc(x.c)}${x.v>=100?`<span class="rtag">관할 법원</span>`:(x.v>=40?`<span class="rtag">같은 분야</span>`:"")}</div>`).join("")}</div>
   <div class="blk"><h3>${d.pub?"주요 저서 및 논문":"주요 업무사례"}</h3>
     <div class="bul">${(d.pub||d.cases||[]).map(c=>`<div>${esc(c)}</div>`).join("")}</div></div>`
   :`<div class="blk"><h3>프로필 <em>상세 준비 중</em></h3><p class="sub">담당 분야까지 확인됩니다. 경력·업무사례는 순차적으로 채워집니다.</p></div>`}
   <div class="blk"><h3>비용 안내 <em>손해배상 사건 기준</em></h3>
     <div class="fee"><div class="h">약정금 (착수금 총액)<span>부가세 포함</span></div>
       <div class="b"><div class="rng">${man(fee.p25)} — ${man(fee.p75)}</div>
         <div class="s2">최근 손해배상 사건 ${fee.n}건의 실제 약정금 분포입니다. 사건 난이도와 소송물가액에 따라 달라지며, 정확한 금액은 상담실장이 안내드립니다.</div>
         <div class="kv"><span>중앙값</span><span>${man(fee.mid)}</span></div>
         <div class="kv"><span>성공보수</span><span>경제적 이익의 5~10%</span></div></div></div></div>
   <div class="blk"><h3>관련 업무사례 <em>yklawfirm.co.kr</em></h3>${rel.map(caseHTML).join("")}</div>
   ${mine.length?`<div class="blk"><h3>이 변호사 후기 <em>${mine.length}건</em></h3>${mine.map(revHTML).join("")}</div>`:""}
   <div class="cta">${starBtn(l)}<button class="btn p" onclick="askFor('${l.n}')">이 변호사로 상담받고 싶어요</button></div>
   <p class="sub" style="margin-top:10px;text-align:center;font-size:10.5px">누르시면 상담실장에게 전달됩니다. 선임이 확정되는 것은 아닙니다.</p>`;
  nav("detail",push);}
function askFor(n){if(!favs.includes(n))favs.push(n);
  const b=document.querySelector("#dbody .btn.p");
  b.textContent="상담실장에게 전달되었습니다";b.style.background="var(--ok)";b.disabled=true;
  document.getElementById("rst").textContent="고객 문의 도착";badge();osFav();}

function renderFav(){const el=document.getElementById("favList");
  if(!favs.length){el.innerHTML=`<p class="empty">아직 담아두신 변호사가 없습니다.<br>추천 목록에서 별표를 눌러보세요.</p>`;return;}
  el.innerHTML=favs.map(n=>{const l=L.find(x=>x.n===n);
    return `<div class="lrow" onclick="detail('${n}')">${ph(l,"s")}
      <div><div class="nm"><span class="n">${l.n}</span><span class="p">${l.pos}</span>${l.o?`<span class="bo">${l.o}</span>`:""}</div>
        <div class="why">${reasons(l).map(r=>`<span class="wc ${r.k||""}">${esc(r.t)}</span>`).join("")}</div></div>${starBtn(l)}</div>`;}).join("");}

let af="전체";
function renderAdv(){
  document.getElementById("ach").innerHTML=AF.map(f=>`<button class="chip ${f===af?"on":""}" onclick="af='${f}';renderAdv()">${f}</button>`).join("");
  const rows=ADV.filter(a=>af==="전체"||a.r===af);
  document.getElementById("acnt").textContent=`${rows.length}명${af!=="전체"?" · "+af:""}`;
  document.getElementById("alist").innerHTML=rows.map(a=>
    `<div class="advrow"><div><div class="an">${a.n}</div><div class="ar">${a.c||"—"}</div></div><span class="ab">${a.r}</span></div>`).join("");}

function caseHTML(c){const m=/합의|기소유예/.test(c.r);
  return `<div class="cc"><span class="r ${m?"m":""}">${c.r}</span><div><div class="t">${esc(c.t)}</div><div class="c">${esc(c.c)}</div></div></div>`;}
function revHTML(r){return `<div class="rv"><div class="q">${esc(r.t)}</div><div class="m">${esc(r.f)}${r.l.length?` · 담당 <b>${esc(r.l.join(" · "))}</b>`:""}</div></div>`;}
let cf="전체",rf="전체";
function renderCases(){document.getElementById("cch").innerHTML=CF.map(f=>`<button class="chip ${f===cf?"on":""}" onclick="cf='${f}';renderCases()">${f}</button>`).join("");
  document.getElementById("clist").innerHTML=CASES.filter(c=>cf==="전체"||c.c.includes(cf)).map(caseHTML).join("");}
function renderRev(){document.getElementById("rch").innerHTML=RF.map(f=>`<button class="chip ${f===rf?"on":""}" onclick="rf='${f}';renderRev()">${f}</button>`).join("");
  document.getElementById("rlist").innerHTML=REVIEWS.filter(r=>rf==="전체"||r.f===rf).map(revHTML).join("");}

/* 우측 「고객화면」 = 고객 태블릿 화면의 실시간 복제(보기 전용).
   id 중복을 피하려고 복제본에서는 id를 모두 떼어낸다. */
function syncMirror(){
  const box=document.getElementById("mclone"); if(!box) return;
  if(!CONNECTED){box.innerHTML="";return;}
  const src=document.getElementById("scr");
  const c=src.cloneNode(true);
  c.removeAttribute("id");
  c.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));
  c.querySelectorAll("video").forEach(n=>n.remove());
  box.innerHTML=""; box.appendChild(c);
  const m={intro:"대기 화면",brief:"예약 정보 확인",home:"추천 변호사",detail:(window.__cd||"")+" 프로필",
    fav:"관심 변호사",adv:"고문·전문위원·자문위원",case:"업무사례",review:"의뢰인 후기",sign:"소송위임계약서"};
  document.getElementById("mnow").textContent=m[cur]||"—";}

function watch(){const m={intro:["대기 화면",`${BK.name}(가명) 님 예약 인사 노출 중`],
  brief:["예약 정보 확인",`${BK.type} · ${BK.role} · ${BK.cat1} ${BK.cat2} — 콜 메모 교차검증 중`],
  home:["추천 변호사","예약 정보 확인함 · 상위 3명"],
  browse:["둘러보기","예약 정보 확인을 미룸 · 추천은 참고로만"],
  detail:[(window.__cd||"")+" 프로필","고객이 상세를 보는 중"],fav:["관심 변호사",favs.length+"명 담김"],
  adv:["고문·전문위원·자문위원",""],case:["업무사례",""],review:["의뢰인 후기",""],
  sign:["소송위임계약서","YK-OS에서 보낸 기본서식 · 전자서명"]};
  const [t,d]=m[cur]||["—",""];
  const w=document.getElementById("watch"); if(w)w.innerHTML=`<div><div class="l">지금 이 화면</div><div class="t">${esc(t)}</div><div class="d">${esc(d)}</div></div>`;
  syncMirror();}
function osFav(){document.getElementById("favCnt").textContent=favs.length+"명";
  document.getElementById("osFav").innerHTML=favs.length?favs.map(n=>{const l=L.find(x=>x.n===n);
    return `<div class="fav">${ph(l,"xs")}<div style="flex:1"><div style="font-weight:700;font-size:11.5px">${l.n} <span style="font-weight:300;color:var(--mut);font-size:10px">${l.pos}</span></div>
      <div style="font-size:9.5px;color:var(--mut);font-weight:300">${reasons(l).map(r=>r.t).join(" · ")}</div></div>
      <button class="sb" onclick="osDetail(L.find(x=>x.n==='${n}'),false)">상세</button></div>`;}).join("")
    :`<p class="sub" style="font-size:10px">고객이 아직 담은 변호사가 없습니다.</p>`;}
function osSearch(){const q=(document.getElementById("oq").value||"").trim();
  const pool=q?sorted(L.filter(l=>match(l,q))):sorted(L.filter(l=>l.f.includes(CTX.field)));
  document.getElementById("rkctx").textContent=q?`"${q}" ${pool.length}명`:`${CTX.label} · ${CTX.court}`;
  rank(pool.slice(0,8));}
function rank(top){
  if(!top.length){document.getElementById("rank").innerHTML=`<p class="sub" style="font-size:10px">검색 결과가 없습니다.</p>`;return;}
  document.getElementById("rank").innerHTML=`<table class="tb">
   <thead><tr><th>변호사</th><th class="r">분야</th><th class="r">인접</th><th class="r">관할</th><th class="r">직위</th><th class="r">합계</th><th></th></tr></thead>
   <tbody>${top.map(l=>{const s=score(l);
    return `<tr><td><div class="n2">${l.n}${favs.includes(l.n)?' <span style="color:var(--gold)">★</span>':''}</div>
      <div style="font-size:9px;color:var(--mut);font-weight:300">${l.pos}${l.o?" · "+l.o:""}</div></td>
      <td class="r">${s.parts.field||"–"}</td><td class="r">${s.parts.near||"–"}</td><td class="r">${s.parts.court||"–"}</td>
      <td class="r">${s.parts.pos||"–"}</td><td class="tot">${s.s}</td>
      <td><button class="sb" onclick="pushTo('${l.n}',this)">화면 공유</button></td></tr>`;}).join("")}</tbody></table>`;}
function pushTo(n,btn){document.querySelectorAll(".sb").forEach(b=>{if(b.textContent==="공유 중"){b.classList.remove("on");b.textContent="화면 공유";}});
  btn.classList.add("on");btn.textContent="공유 중";detail(n);osDetail(L.find(x=>x.n===n),true);}
function osDetail(l,pushed){const d=l.d,fee=FEE[CTX.feeKey]||FEE.__all,pct=v=>Math.round(v/50000000*100);
  document.getElementById("osd").innerHTML=`
   <h4>${l.n} ${l.pos} <em>${pushed?"실무자가 공유한 화면":"고객이 열어 본 프로필"}</em></h4>
   <div class="tiles" style="margin-bottom:14px">
     <div class="tile"><div class="v">${l.f.length}</div><div class="k">담당 분야</div></div>
     <div class="tile"><div class="v">${fee.n}</div><div class="k">유사 사건</div></div>
     <div class="tile wait"><div class="v">종결 결과<br>집계 없음</div><div class="k">데이터 정비 후</div></div></div>
   <div class="pr"><div class="h">제안 금액 가이드<span>${CTX.feeKey} · 유사 ${fee.n}건</span></div>
     <div class="b"><div class="rg">${man(fee.p25)} — ${man(fee.p75)}</div>
       <div class="rn">YK-OS 선임 목록의 <b>약정금</b> 실적 분포(25~75 백분위). 부가세 포함.</div>
       <div class="bar"><i style="left:${pct(fee.p25)}%;right:${100-pct(fee.p75)}%"></i></div>
       <div class="bl"><span>₩0</span><span>₩50,000,000</span></div>
       <div class="kv"><span>중앙값</span><span>${won(fee.mid)}</span></div>
       <div class="kv"><span>전체 사건 중앙값</span><span>${won(FEE.__all.mid)}</span></div>
       <div class="kv"><span>성공보수 · 민사·가사</span><span>경제적 이익의 5~10%</span></div>
       <div class="kv"><span>성공보수 · 형사</span><span>정액 — 불기소·무죄 시 협의</span></div></div></div>
   ${d&&d.links?`<div style="margin-top:14px"><div class="lnk">
     <div class="h">처분권자 접점<span>YK-OS 전용 · 고객 화면 비노출</span></div>
     <div class="b">${d.links.map(x=>`<div class="lr"><span class="lk2">${x.k}</span><span class="lt">${x.t}${x.e?`<em>${x.e}</em>`:""}</span></div>`).join("")}</div></div></div>`:""}`;}


function view(v){document.querySelectorAll(".seg button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
  window.__v=v;
  document.getElementById("stage").className="stage "+(v==="both"?"two":"one");
  document.getElementById("tabDev").classList.toggle("hidden",v==="os");
  document.getElementById("osDev").classList.toggle("hidden",v==="tab");}

document.getElementById("oemptyLogo").innerHTML=document.querySelector(".mk .ci").innerHTML;
renderCases();renderRev();renderAdv();renderVisit();applyBooking(BOOKINGS[0],false);nav("intro",false);

/* ── 딥링크 ─────────────────────────────────────────────
   ?c=<예약id|이름>   그 예약으로 화면 공유된 상태로 시작
   &s=<화면>          intro|brief|home|detail|adv|fav|case|review|sign
   &d=<변호사이름>    그 변호사 상세를 연 상태
   &v=tab|os|both     좌/우 보기
   예)  ?c=이도현&s=brief&v=both
        ?c=228271&d=박찬&v=os
   고칠 화면으로 바로 들어가기 위한 것. 처음부터 클릭하지 않아도 된다. */
(function deepLink(){
  const q=new URLSearchParams(location.search); if(![...q.keys()].length) return;
  const c=q.get("c");
  if(c){const b=BOOKINGS.find(x=>x.id===c||x.name===c); if(b) share(b.id);}
  const v=q.get("v"); if(["tab","os","both"].includes(v)) view(v);
  const d=q.get("d");
  if(d&&CONNECTED&&L.some(l=>l.n===d)){detail(d);return;}
  const s=q.get("s");
  if(s&&document.getElementById("s-"+s)&&(CONNECTED||s==="intro")) nav(s);
})();

/* ── 상담 내용 작성 ────────────────────────────────
   YK-OS 「[고객명(역할) - 사건종류] 상담 정보」 모달을 그대로 옮긴 것.
   탭 6개: 1 콜 / 2 상담 / 3 선임 / 4 부서 배당 / 5 사건 수행 / 6 종료.
   ★ 온라인 바인더에서 확인된 내용(교차검증 정정 · 확장 질문 · 관심 변호사 · 약정금 가이드)이
     이 화면으로 넘어오게 한 것이 기존 화면과의 차이다. 상담실장이 옮겨 적지 않는다. */
const WTABS=["콜","상담","선임","부서 배당","사건 수행","종료"];
let WB=null, wtab=0;

function openWrite(id){
  WB=BOOKINGS.find(x=>x.id===id)||BK; wtab=0;
  document.getElementById("wTitle").textContent=`[${WB.name}(${WB.role}) - ${WB.cat2}] 상담 정보`;
  document.getElementById("wEng").textContent=`eng_id ${WB.id}`;
  document.getElementById("wov").classList.remove("hidden");
  renderWrite();}
function closeWrite(){document.getElementById("wov").classList.add("hidden");}
function wgo(i){wtab=i;renderWrite();}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeWrite();closeSign();}});

/* ── 선임 계약 · 소송위임계약서 (YK-OS /#/app/visit/sign) ── */
let SB=null, CT=null, SIGN_ERR="";
const SIGN_OPEN={case:true, agr:true, fee:true, org:true};
function wonPlain(v){return v? Number(v).toLocaleString("ko-KR") : "　　　　";}
function hasTerm(id){
  if(!CT) return false;
  if(id==="delegation"||id==="special") return CT.agreement.includes(id);
  return CT.fee.includes(id);}
function togAgr(id){
  const i=CT.agreement.indexOf(id);
  if(i>=0) CT.agreement.splice(i,1); else CT.agreement.push(id);
  renderSignOS();}
function togFee(id){
  if(id==="retainer") return;
  const i=CT.fee.indexOf(id);
  if(i>=0) CT.fee.splice(i,1); else CT.fee.push(id);
  renderSignOS();}
function togAcc(k){SIGN_OPEN[k]=!SIGN_OPEN[k]; renderSignOS();}
function setTpl(v){CT.template=v; CT.civil=v==="civil"; renderSignOS();}
function livePaper(){const el=document.getElementById("sprev"); if(el&&CT) el.innerHTML=paperHTML(CT,false);}
function orgSel(key,cur){
  return `<select onchange="CT.${key}=this.value;livePaper()">${["",...SIGN_ORGS].map(o=>
    `<option value="${esc(o)}" ${o===cur?"selected":""}>${o||"선택"}</option>`).join("")}</select>`;}
function openSign(id){
  SB=BOOKINGS.find(x=>x.id===id)||BK;
  CT=contractFor(SB);
  SIGN_ERR="";
  if(CONNECTED&&BK.id===SB.id&&favs.length)
    CT.opinion=`${CT.opinion} 고객 관심 변호사: ${favs.join(" · ")}.`;
  document.getElementById("sTitle").textContent=`선임 계약`;
  document.getElementById("sEng").textContent=`eng_id ${SB.id} · ${SB.name}(가명)`;
  document.getElementById("sov").classList.remove("hidden");
  renderSignOS();}
function closeSign(){const el=document.getElementById("sov"); if(el) el.classList.add("hidden");}
function saveSignDraft(){
  SIGN_ERR="저장했습니다. 서식 원문은 그대로이고, 왼쪽 값만 반영됩니다.";
  const n=document.getElementById("sErr"); if(n){n.textContent=SIGN_ERR; n.className="serr ok";}}
function sendContract(){
  if(!SB||!CT) return;
  SIGN_ERR="";
  if(!CT.org1){SIGN_ERR="최소 1개의 희망 배당 부서를 선택해주세요."; SIGN_OPEN.org=true; renderSignOS(); return;}
  if(!String(CT.opinion||"").trim()){SIGN_ERR="부서 배당 의견을 입력해주세요."; SIGN_OPEN.org=true; renderSignOS(); return;}
  closeSign();
  share(SB.id);
  nav("sign",false);}
function ssec(k,label,body){
  return `<section class="ssec ${SIGN_OPEN[k]?"":"fold"}">
    <button type="button" class="shd" onclick="togAcc('${k}')">${esc(label)}<i>${SIGN_OPEN[k]?"▾":"▸"}</i></button>
    <div class="sbd">${body}</div></section>`;}
function renderSignOS(){
  if(!CT||!SB) return;
  const r=CT.retainer, suc=CT.success, tr=CT.travel;
  const chk=(on,fn,id,label,lock)=>
    `<button type="button" class="sch ${on?"on":""} ${lock?"lock":""}" onclick="${lock?"":`${fn}('${id}')`}">${esc(label)}</button>`;
  document.getElementById("sform").innerHTML=`
    <div class="stpl" role="group" aria-label="사용할 템플릿">
      <button type="button" class="${CT.template==="criminal"?"on":""}" onclick="setTpl('criminal')">형사</button>
      <button type="button" class="${CT.template==="civil"?"on":""}" onclick="setTpl('civil')">민·가사</button>
    </div>
    ${ssec("case","사건",`
      <div class="wgrid c2">
        <div class="wf2"><label>사건번호</label><input value="${esc(CT.caseNo)}" oninput="CT.caseNo=this.value;livePaper()"></div>
        <div class="wf2"><label>사건명</label><input value="${esc(CT.caseName)}" oninput="CT.caseName=this.value;livePaper()"></div>
        <div class="wf2"><label>위임인</label><div class="bx fill">${esc(CT.client)} (가명)</div></div>
        <div class="wf2"><label>상대방</label><input value="${esc(CT.opponent)}" oninput="CT.opponent=this.value;livePaper()"></div>
        <div class="wf2"><label>관할</label><input value="${esc(CT.jurisdiction)}" oninput="CT.jurisdiction=this.value;livePaper()"></div>
        <div class="wf2"><label>소송물가액</label><input placeholder="미입력이면 서식에서 비움" value="${esc(CT.litigationAmount)}" oninput="CT.litigationAmount=this.value;livePaper()"></div>
      </div>`)}
    ${ssec("agr","약정 조건",`
      <p class="snote">위임사무·특약사항. 체크한 항목만 서식에 들어갑니다.</p>
      <div class="schips">${SIGN_AGR.map(t=>chk(hasTerm(t.id),"togAgr",t.id,t.label,false)).join("")}</div>
      <div class="wf2 full" style="margin-top:10px"><label>위임사무</label>
        <textarea rows="3" ${hasTerm("delegation")?"":"disabled"} oninput="CT.delegation=this.value;livePaper()">${esc(CT.delegation)}</textarea></div>
      <div class="wf2 full" style="margin-top:10px"><label>특약사항</label>
        <textarea rows="3" ${hasTerm("special")?"":"disabled"} oninput="CT.special=this.value;livePaper()">${esc(CT.special)}</textarea></div>`)}
    ${ssec("fee","보수 조건",`
      <p class="snote">착수금은 기본 포함. 성공보수·출장비는 필요할 때만 켭니다. 착수금 ${man(r.amount)}은 ${esc(r.feeKey)} 약정금 중앙값(${r.feeN}건) 시연값입니다.</p>
      <div class="schips">${SIGN_FEE.map(t=>chk(hasTerm(t.id),"togFee",t.id,t.label,t.id==="retainer")).join("")}</div>
      <div class="wgrid c2" style="margin-top:10px">
        <div class="wf2"><label>착수금 금액 (원)</label><input inputmode="numeric" value="${r.amount||""}" oninput="CT.retainer.amount=Number(String(this.value).replace(/\\D/g,''))||0;livePaper()"></div>
        <div class="wf2"><label>착수금 지급시기</label><input value="${esc(r.timing)}" oninput="CT.retainer.timing=this.value;livePaper()"></div>
        <div class="wf2"><label>분할납부</label><input placeholder="없으면 비움" value="${esc(r.installments)}" oninput="CT.retainer.installments=this.value;livePaper()"></div>
        <div class="wf2"><label>착수금 부가세</label>
          <select onchange="CT.retainer.vat=this.value;livePaper()"><option ${r.vat==="별도"?"selected":""}>별도</option><option ${r.vat==="포함"?"selected":""}>포함</option></select></div>
        <div class="wf2"><label>결제수단</label>
          <select onchange="CT.retainer.method=this.value;livePaper()">${SIGN_PAY.map(p=>`<option ${p.label===r.method?"selected":""}>${p.label}</option>`).join("")}</select></div>
      </div>
      ${hasTerm("success")?`<div class="wgrid c2" style="margin-top:10px">
        <div class="wf2"><label>성공보수 정액 (원)</label><input placeholder="비율만 쓸 거면 비움" value="${esc(suc.fixed)}" oninput="CT.success.fixed=this.value;livePaper()"></div>
        <div class="wf2"><label>경제적 이익 비율 (%)</label><input value="${esc(suc.pct)}" oninput="CT.success.pct=this.value;livePaper()"></div>
        <div class="wf2 full"><label>성공보수 지급시기</label><textarea rows="3" oninput="CT.success.timing=this.value;livePaper()">${esc(suc.timing)}</textarea></div>
      </div>`:""}
      ${hasTerm("travel")?`<div class="wgrid c2" style="margin-top:10px">
        <div class="wf2"><label>출장비 일당 (원)</label><input value="${esc(tr.daily)}" oninput="CT.travel.daily=this.value;livePaper()"></div>
        <div class="wf2"><label>출장비 예치금 (원)</label><input value="${esc(tr.deposit)}" oninput="CT.travel.deposit=this.value;livePaper()"></div>
      </div>`:""}`)}
    ${ssec("org","부서 배당",`
      <p class="snote">태블릿으로 보내려면 희망 배당 부서 1과 의견이 필요합니다.</p>
      <div class="wgrid c2">
        <div class="wf2"><label>희망 배당 부서/지사 1. *</label>${orgSel("org1",CT.org1)}</div>
        <div class="wf2"><label>희망 배당 부서/지사 2.</label>${orgSel("org2",CT.org2)}</div>
        <div class="wf2"><label>희망 배당 부서/지사 3.</label>${orgSel("org3",CT.org3)}</div>
      </div>
      <div class="wf2 full" style="margin-top:10px"><label>부서 배당 의견 *</label>
        <textarea rows="3" oninput="CT.opinion=this.value">${esc(CT.opinion)}</textarea></div>`)}
    <p class="serr ${/저장/.test(SIGN_ERR)?"ok":""}" id="sErr">${esc(SIGN_ERR)}</p>`;
  livePaper();}
function renderSignTab(){
  const ct=CT&&SB&&SB.id===BK.id?CT:contractFor(BK);
  CT=ct; SB=BK;
  document.getElementById("signBody").innerHTML=SIGNED[BK.id]
    ? `<div class="signdone"><span class="lbl">전자서명</span><h2 class="h1">서명이 완료되었습니다</h2>
        <p class="sub">상담실장이 모두싸인 문서를 확인합니다. 이 화면의 이름은 가명입니다.</p>
        <button class="bgo" onclick="nav('fav')">관심 변호사로 돌아가기</button></div>`
    : paperHTML(ct,true);}
function signNow(){SIGNED[BK.id]=true; renderVisit(); renderSignTab(); watch();}
function paperHTML(ct,tab){
  const F=FIRM, ret=hasTerm("retainer"), suc=hasTerm("success"), trv=hasTerm("travel");
  const del=hasTerm("delegation"), sp=hasTerm("special");
  const amt=ret?wonPlain(ct.retainer.amount):"　　　　";
  const vat=ret?esc(ct.retainer.vat):"　　";
  const inst=ret&&ct.retainer.installments?`<div class="cl">분할납부: ${esc(ct.retainer.installments)}</div>`:"";
  const sucAmt=suc&&ct.success.fixed?wonPlain(ct.success.fixed):"　　　　";
  const pct=suc?esc(ct.success.pct):"　";
  const daily=trv&&ct.travel.daily?wonPlain(ct.travel.daily):"　　　";
  const dep=trv&&ct.travel.deposit?wonPlain(ct.travel.deposit):"　　　";
  const payRows=[
    ret?`<tr><th>착수금</th><td>${esc(ct.retainer.timing)}</td><td>금 ${amt} 원 (부가세 ${vat})<br>결제 ${esc(ct.retainer.method)}</td></tr>`:"",
    suc?`<tr><th>성공보수</th><td>${esc(ct.success.timing).replace(/\n/g,"<br>")}</td><td>경제적 이익의 ${pct}%</td></tr>`:"",
    trv?`<tr><th>출장비</th><td>출장시</td><td>일당 ${daily} 원 · 예치 ${dep} 원</td></tr>`:"",
    del?`<tr><th>위임사무</th><td colspan="2" class="left">${esc(ct.delegation)}</td></tr>`:"",
    sp&&ct.special?`<tr><th>특약사항</th><td colspan="2" class="left">${esc(ct.special)}</td></tr>`:""
  ].filter(Boolean).join("");
  const auth=SIGN_AUTH.map(a=>`<tr><th>${esc(a.label)}</th><td class="left">${esc(a.d)}</td><td>O</td></tr>`).join("");
  const ranks=SIGN_RANK.map(x=>`<tr><td>${x.r}</td><td>${esc(x.t)}</td><td>${x.f}</td></tr>`).join("");
  return `${tab?`<span class="lbl">위임계약</span><h2 class="h1">소송위임계약서</h2>
    <p class="sub">상담실장이 보낸 기본서식입니다. 내용 확인 후 아래에 서명해 주세요.<br>표시된 이름은 가명입니다. 주민번호·실주소는 비워 두었습니다.</p>`:""}
  <article class="paper">
    <header class="phd"><div class="fn">${esc(F.spaced)}</div>
      <div class="meta"><span>전화 ${esc(F.tel)}</span><span>${esc(F.addr)}</span><span>팩스 ${esc(F.fax)}</span></div>
      <h1>소송위임계약서</h1></header>
    <p class="party">위임인(갑) <b>${esc(ct.client)}</b> <i>가명</i><br>수임인(을) <b>${esc(F.name)}</b></p>
    <p>위 당사자들은 아래 소송사건의 처리에 관한 위임계약을 다음과 같이 체결한다.</p>
    <h3>사　　건</h3>
    <table class="pt"><tr><th>사건번호</th><td>${esc(ct.caseNo)}</td><th>사건명</th><td>${esc(ct.caseName)}</td></tr>
      <tr><th>의뢰인</th><td>${esc(ct.client)}</td><th>상대방</th><td>${esc(ct.opponent)}</td></tr>
      <tr><th>관할</th><td>${esc(ct.jurisdiction)}</td><th>소송물가액</th><td>${esc(ct.litigationAmount)}</td></tr></table>
    ${payRows?`<table class="pt"><tr><th>구분</th><th>지급시기</th><th>금액</th></tr>${payRows}</table>`:""}
    <p class="center">기타 계약의 내용은 별첨과 같다.</p>
    <p class="date">2026.  9.  4.</p>
    <div class="signers"><div>
      <div class="who">(갑) 위임인</div>
      <div>성명 : ${esc(ct.client)} (인)${SIGNED[ct.engId]?` <em class="ok">서명완료</em>`:""}</div>
      <div>주민번호 : </div>
      <div>연락처 : ${esc(ct.phone)}</div>
      <div>이메일 : </div>
      <div>주소 : </div>
    </div><div>
      <div class="who">(을) 수임인</div>
      <div>${esc(F.addr2)}</div>
      <div><b>${esc(F.name)}</b></div>
      <div>${esc(F.reps)}</div>
      <div>${esc(F.svc)}</div>
    </div></div>
    <p class="pg">- 1 -</p>
  </article>
  <article class="paper">
    <h3>아　　래</h3>
    <p><b>제1조 【목적】</b> 갑은 을에게 위 표시 사건의 처리(이하 “위임사무”라 한다)를 위임하고, 을은 이를 수임한다.</p>
    <p><b>제2조 【위임한계】</b> 갑이 을에게 위임하는 위임사무는 당해 심급에 한하고, 파기 환송된 사건이나 상소의 제기, 강제집행, 강제집행정지, 보전처분, 반소절차 등 부수적 절차에 관한 사항은 따로 정한다. 보전처분사건의 경우 이의사건 또는 취소사건은 별개의 위임사무로 한다.</p>
    <p><b>제3조 【수권범위】</b> ① 갑은 을에게 위 위임장 또는 선임서에 기재된 아래 특별수권사항에 대하여 특별수권을 부여하기로 한다.</p>
    <table class="pt sm">${auth}</table>
    <p><b>제4조 【수임인의 의무】</b> 을은 변호사로서 법령에 정한 권리와 의무에 입각하여, 위임의 내용에 따라 선량한 관리자의 주의를 다하여 위임사무를 처리한다.</p>
    <p><b>제5조 【자료제공 등】</b> 을이 위임사무를 처리하는데 필요하다고 인정하여 요구한 자료 또는 조회한 사항에 대하여 갑은 지체 없이 이에 응하여야 한다.</p>
    <p><b>제6조 【착수보수】</b> 갑은 을에게 위임계약의 성립과 동시에 착수보수로 금 <u>${amt}</u> 원(부가가치세 ${vat})을 지급한다 [입금계좌: ${esc(F.bank)}].</p>
    ${inst}
    <p><b>제7조 【성과보수】</b> ① 성과보수: 위임사무가 판결, 재판상 내지 재판외 화해(화해권고결정 포함), 조정(조정에 갈음한 결정 포함) 등으로 성공한 때에는 아래 구분에 의하여 성과보수를 지급하기로 한다.</p>
    <p class="ind">가. 전부 승소한 경우: 금 <u>${sucAmt}</u> 원(부가가치세 ${suc?esc(ct.success.vat):"　　"})<br>
    일부 승소한 경우: 위 금액을 승소비율로 계산한 금액<br>
    나. 승소로 얻은 경제적 이익가액의 <u>${pct}</u> %에 해당하는 금액<br>
    다. 상소심의 경우 달리 정함이 없는 한 상소심의 심판의 대상 전부를 기준으로 하여 승소 비율을 정한다.<br>
    라. ‘승소로 얻은 경제적 이익’이 금액일 경우 판결원리금을 기준으로 성공보수를 산정한다.</p>
    <p class="pg">- 2 -</p>
  </article>
  <article class="paper">
    <p>② 승소로 보는 경우: 아래의 경우는 승소로 보고 전항에 정한 성과보수를 지급하여야 한다.</p>
    <p class="ind">가. 을이 위임사무 처리를 위하여 상당한 노력을 투입한 후 갑이 임의로 청구 포기 또는 인낙, 소의 취하, 상소의 취하를 한 경우<br>
    나. 을의 소송수행 결과로 인하여 상대방이 청구 포기 또는 인낙, 소의 취하, 상소의 취하를 한 경우</p>
    <p><b>제8조 【비용부담】</b> ① 을이 위임사무를 처리하는데 필요한 인지대, 송달료, 감정료, 예납금, 보증금, 등사료, 국제전화료, 여비, 출장비, 보증보험료, 담보공탁금, 기타 필요한 실비는 보수와는 별도로 그 전액을 갑이 부담한다.</p>
    <p>② 출장 일당으로 1일 금 <u>${daily}</u> 원을 출장으로 인한 여비와 별도로 출장시 지급한다.</p>
    <p>③ 갑은 비용에 충당하기 위하여 금 <u>${dep}</u> 원을 예치한다. ④ 제3항의 예치금에서 비용과 출장 일당을 충당할 수 있다.</p>
    <p><b>제9조 【계약해지】</b> ① 을은 갑이 정당한 사유 없이 채무를 이행하지 않거나, 위임 관련 진술이 허위이거나, 정당한 사유 없이 비협조하여 위임업무가 불가능한 경우 계약을 해지할 수 있다. 해지 시 수행비용은 제10조에 따른다.</p>
    <p><b>제10조 【수행비용】</b> ① 착수금 반환 시 공제를 위한 수행비용은 아래와 같이 산정한다. 가. 변호사 보수: 직급별 변호사 보수(실제로 참여한 인원별). 나. 시간은 30분 단위 올림. 다. 법률문서는 1장당 30분.</p>
    <table class="pt sm nar"><tr><th>순번</th><th>직급</th><th>변호사보수(단위: 만원)</th></tr>${ranks}</table>
    <p class="fine">② 을의 수행비용은 약정 착수금을 한도로 산정한다.</p>
    <p class="pg">- 3 -</p>
  </article>
  ${tab?`<button class="bgo" onclick="signNow()">내용 확인 · 전자서명</button>`:""}`;}

const wf=(label,val,cls="",hint="")=>
  `<div class="wf2 ${cls.includes("full")?"full":""}"><label>${esc(label)}</label>
     <div class="bx ${val?cls.replace("full","").trim():"em "+cls.replace("full","").trim()}">${val||"입력"}</div>
     ${hint?`<div class="hint">${hint}</div>`:""}</div>`;

function renderWrite(){
  document.getElementById("wtabs").innerHTML=WTABS.map((t,i)=>
    `<button class="${i===wtab?"on":""}" onclick="wgo(${i})"><i>${i+1}</i>${t}</button>`).join("");
  const b=WB, live=CONNECTED&&BK.id===b.id;
  const body=document.getElementById("wbody");
  if(wtab!==0){
    body.innerHTML=`<div class="wsoon"><div class="t">${WTABS[wtab]} 탭</div>
      <p>현행 YK-OS 화면을 그대로 씁니다. 온라인 바인더가 바꾸는 것은 <b>콜 탭</b>뿐입니다.<br>
      선임·배당·수행·종결 흐름은 손대지 않습니다.</p></div>`;
    return;}

  /* 교차검증 정정 결과 */
  const corr = live? b.memo.map((t,i)=>[t,MV[i]]).filter(([,v])=>v===false).map(([t])=>t) : [];
  const none = !b.memo.length;
  /* 확장 질문에서 확인한 항목 → 위임 사무 후보 */
  const fee=FEE[b.feeKey]||FEE.__all;

  body.innerHTML=`
   <div class="wsec"><h5>기본 정보<em>방문 예약</em></h5>
     <div class="wgrid">
       ${wf("방문 예정 지사",b.branch)}${wf("방문 예정일",b.at)}${wf("시간대","방문예약")}
     </div>
     <div class="wgrid" style="margin-top:11px">${wf("상담 지정 / 특이사항","",'full')}</div></div>

   <div class="wsec"><h5>고객 정보<em>고객 1 · ${esc(b.name)}</em></h5>
     <div class="wgrid">
       ${wf("고객 유형",b.type,"fill")}${wf("고객 역할",b.role,"fill")}${wf("사건 당사자와의 관계",b.rel||"")}
       ${wf("고객명",b.name+" (가명)")}${wf("전화번호",b.tel)}${wf("성별","")}
       ${wf("나이","")}${wf("거주지역","")}${wf("추가 고객 정보","")}
     </div>
     <p class="wnote">소득·총자산은 현행 화면 그대로 두었습니다. 고객 태블릿에는 노출하지 않습니다.</p></div>

   <div class="wsec"><h5>상담 정보<em>사건</em></h5>
     <div class="wgrid">
       ${wf("사건 종류",`${b.cat1} › ${b.cat2}`,"fill")}${wf("법정 사건명","")}${wf("선임 형태",b.form)}
       ${wf("상담유형","")}${wf("방문 부서 / 지사",b.branch)}${wf("상담 배정 부서","")}
       ${wf("유입 경로",b.inflow)}${wf("유입 키워드",b.kw)}${wf("실제 상담 날짜","")}
     </div>
     <div class="wgrid" style="margin-top:11px">
       <div class="wf2 full"><label>사건개요 (영업전략팀)
         ${live&&!none?`<span class="wpull">고객 확인 반영됨</span>`:""}</label>
         <div class="bx ta ${none?"em":""}">${none
           ? "콜 단계에서 사건 내용을 받지 못했습니다.\n"+(b.memoNote||"")+"\n상담에서 처음부터 청취해 이 칸을 채우세요."
           : esc(b.memo.join("\n"))}</div>
         ${corr.length?`<div class="wcorr"><span class="l">고객이 다르다고 표시한 문장 ${corr.length}건</span>
           ${corr.map(t=>`<div>· ${esc(t)}</div>`).join("")}</div>`:""}
         ${live&&!none&&!corr.length?`<div class="hint">고객이 태블릿에서 확인한 내용입니다.</div>`:""}
       </div></div></div>

   <div class="wsec"><h5>상담 기록<em>상담 중 작성</em></h5>
     <div class="wgrid c2">
       ${wf("기초 사실","","full")}${wf("상담 내용","","full")}
       ${wf("의뢰인 강조 및 요청사항","")}${wf("의뢰인 특이사항 및 환불 방지 주의사항","")}
     </div>
     <div class="wgrid" style="margin-top:11px">
       ${wf("위임 사무","","full")}
       ${wf("특약 사항","","full")}
       <div class="wf2 full"><label>부서 배당 의견
         ${live&&favs.length?`<span class="wpull">고객 관심 ${favs.length}명</span>`:""}</label>
         <div class="bx ta ${live&&favs.length?"":"em"}">${live&&favs.length
           ? "고객이 태블릿에서 담아 둔 변호사: "+esc(favs.join(" · ")) : "입력"}</div></div>
     </div></div>

   <div class="wsec"><h5>금액<em>부가세 별도</em></h5>
     <div class="wgrid">
       ${wf("상담료","₩0")}
       <div class="wf2"><label>제안 금액 <span class="wpull">약정금 실적</span></label>
         <div class="bx fill">${man(fee.p25)} — ${man(fee.p75)}</div>
         <div class="hint">${esc(b.feeKey)} ${fee.n}건 · 중앙값 ${man(fee.mid)}</div></div>
       ${wf("소가 (예상)","")}
     </div>
     <p class="wnote">제안 금액은 YK-OS 선임 목록의 약정금 분포에서 가져온 <b>가이드</b>입니다. 확정 금액이 아닙니다.</p></div>`;}
