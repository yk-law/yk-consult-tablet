/* 소송위임계약서 — YK-OS `/#/app/visit/sign` 기본서식·작성 UI.
   종이 본문은 원본 조문을 유지한다. 실제 의뢰인 인적정보는 넣지 않는다. */
window.FIRM={
  name:"법무법인 YK",
  spaced:"법 무 법 인 Y K",
  addr:"서울시 강남구 테헤란로 103",
  addr2:"서울 강남구 테헤란로 103(역삼동)",
  biz:"354-87-01611",
  reps:"대표변호사 강경훈, 김범한",
  svc:"서비스 법률서비스",
  tel:"(02) 522 - 4711",
  fax:"(02) 522 - 4743",
  bank:"하나은행 / 229-910030-10904 / 법무법인 YK"
};
window.SIGN_AUTH=[
  {id:"withdraw_suit",label:"소취하",d:"제기된 소송의 전부 또는 일부를 철회하여 소송을 종료할 수 있는 권한"},
  {id:"withdraw_appeal",label:"상소취하",d:"원심을 유지·확정하면서 상소의 신청을 철회할 수 있는 권한"},
  {id:"abandon_claim",label:"청구포기",d:"위임인의 청구가 이유 없다고 인정하여 소송을 종료할 수 있는 권한"},
  {id:"acknowledge_claim",label:"청구인낙",d:"상대방의 청구가 이유 있다고 인정하여 소송을 종료할 수 있는 권한"},
  {id:"withdraw_litigation",label:"소송탈퇴",d:"제3자가 소송에 참가한 경우 그 소송에서 탈퇴할 수 있는 권한(민사소송법 제80조)"}
];
window.SIGN_RANK=[
  {r:1,t:"대표변호사",f:"100"},{r:2,t:"파트너변호사",f:"80"},
  {r:3,t:"지사장, 부지사장 변호사",f:"80"},{r:4,t:"상담, 수석변호사",f:"50"},{r:5,t:"변호사",f:"30"}
];
/* 약정 조건 = 위임사무·특약 / 보수 조건 = 착수금·성공보수·출장비 */
window.SIGN_AGR=[{id:"delegation",label:"위임사무"},{id:"special",label:"특약사항"}];
window.SIGN_FEE=[{id:"retainer",label:"착수금"},{id:"success",label:"성공보수"},{id:"travel",label:"출장비"}];
window.SIGN_PAY=[{id:"transfer",label:"계좌이체"},{id:"card",label:"카드"}];
window.SIGN_ORGS=["본사 민사팀","본사 가사팀","본사 형사팀","본사 기업법무팀","본사 교통사고팀"];
window.contractFor=function(b){
  const fee=(window.FEE&& (FEE[b.feeKey]||FEE.__all))||{mid:0,n:0};
  const criminal=/형사|고소/.test(b.cat1);
  const opp={손해배상:"상대 운전자 (가명)",사실혼관계해소:"사실혼 상대방 (가명)",이혼:"배우자 (가명)",
    양육비:"전 배우자 (가명)",대여금:"차용인 (가명)",경제범죄고소:"피의자 (가명)"}[b.cat2]||"상대방 (가명)";
  const org1=/가사/.test(b.cat1)?"본사 가사팀":(/고소|형사/.test(b.cat1)?"본사 형사팀":(/기업/.test(b.cat1)?"본사 기업법무팀":"본사 민사팀"));
  return {
    engId:b.id, template:criminal?"criminal":"civil",
    major:b.cat1, minor:b.cat2, civil:!criminal,
    caseNo:"미접수", caseName:`${b.cat1} > ${b.cat2}`, client:b.name, opponent:opp,
    jurisdiction:b.court, litigationAmount:"",
    retainer:{timing:"소송위임계약시", amount:fee.mid, vat:"별도", installments:"", method:"계좌이체", feeN:fee.n, feeKey:b.feeKey},
    success:{timing:"합의시(조정시)\n또는 판결\n정본영수시", fixed:"", pct:"10", vat:"별도"},
    travel:{daily:"", deposit:""},
    delegation:`${b.cat1} ${b.cat2} 사건의 처리(당해 심급)`,
    special:"",
    phone:b.tel, email:"", address:"",
    agreement:["delegation"],
    fee:["retainer","success"],
    org1, org2:"", org3:"",
    opinion:`${b.cat1} ${b.cat2} 수행 요청. 상담은 ${b.branch}.`
  };
};
