#!/usr/bin/env node
/* 기존 app/data/*.js 전역 데이터를 server/data JSON 으로 보낸다. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "server", "data");
await mkdir(out, { recursive: true });

const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of [
  "portraits.js",
  "lawyers.js",
  "details.js",
  "fee.js",
  "advisors.js",
  "bookings.js",
  "scenarios.js",
  "contracts.js",
]) {
  const code = await readFile(join(root, "app", "data", f), "utf8");
  vm.runInContext(code, ctx);
}

const FIELD = {
  A: ["형사", "조사·재판·구속"],
  B: ["성범죄", "고소·수사·재판"],
  C: ["학교폭력", "학폭위·형사"],
  D: ["마약", "투약·유통"],
  E: ["교통사고", "음주·뺑소니·보상"],
  F: ["기업법무", "회사·계약·공정거래"],
  G: ["지식재산권", "특허·상표·영업비밀"],
  H: ["회생·파산", "법인 회생"],
  I: ["부동산·건설", "공사·분양·명도"],
  J: ["이혼", "이혼·재산분할"],
  K: ["민사", "손해배상·금전"],
  L: ["가사·상속", "상속·유류분·후견"],
  M: ["군형사", "군사법·징계"],
  N: ["중대재해", "산업안전"],
  O: ["노동·산재", "해고·임금·재해"],
  P: ["행정", "처분취소·헌법"],
  Q: ["의료", "의료과실"],
  R: ["조세", "세무·관세"],
  S: ["금융·증권", "경제범죄·투자"],
};
const NEAR = {
  K: ["I", "P", "Q", "S"],
  A: ["B", "D", "E", "M"],
  J: ["L", "K"],
  L: ["J", "K"],
  I: ["K", "F"],
  F: ["S", "R", "G"],
  O: ["N", "P"],
  B: ["C", "A"],
  E: ["A", "K"],
  S: ["F", "A"],
  P: ["K", "O"],
};
const POS = {
  대표: [
    "박찬", "한만수", "권순일", "정창호", "배성범", "박춘기", "한상진", "김경",
    "양호산", "배인구", "유병두", "추원식", "최영운", "변민선", "나찬기", "천기홍",
    "강경훈", "김범한",
  ],
  파트너: [
    "김동진", "김윤정", "정병실", "송각엽", "김택형", "임효진", "곽노주", "김형원",
    "심현희", "조인선", "현민석", "박재완",
  ],
  고문: ["양동학"],
};
const ORIGIN = {
  박찬: "부장판사", 권순일: "대법관", 정창호: "ICC 재판관", 배성범: "고검장",
  박춘기: "부장판사", 한상진: "부장검사", 김경: "부장판사", 양호산: "부장검사",
  배인구: "가정법원 부장판사", 유병두: "차장검사", 최영운: "부장검사",
  변민선: "부장판사", 나찬기: "차장검사", 천기홍: "부장검사", 김동진: "부장판사",
  김윤정: "부장판사", 정병실: "부장판사", 송각엽: "부장판사", 김택형: "판사",
  양동학: "판사", 한만수: "조세법 전문", 강경훈: "형사법·이혼 전문",
};

const DETAIL = ctx.window.DETAIL;
const lawyers = ctx.window.RAW.trim().split(/\s+/).map((s) => {
  const [n, c] = s.split(":");
  const pos = POS.대표.includes(n)
    ? "대표변호사"
    : POS.파트너.includes(n)
      ? "파트너변호사"
      : POS.고문.includes(n)
        ? "고문변호사"
        : "변호사";
  return {
    n,
    f: (c || "").split("").filter(Boolean),
    pos,
    o: ORIGIN[n] || null,
    d: DETAIL[n] || null,
    photo: Boolean(ctx.window.IMG[n]),
  };
});

const dump = async (name, data) => {
  await writeFile(join(out, name), JSON.stringify(data, null, 2), "utf8");
  console.log(" ", name, JSON.stringify(data).length);
};

await dump("bookings.json", ctx.window.BOOKINGS);
await dump("advisors.json", ctx.window.ADV);
await dump("fee.json", ctx.window.FEE);
await dump("scenarios.json", ctx.window.SCENARIO);
await dump("firm.json", ctx.window.FIRM);
await dump("sign.json", {
  auth: ctx.window.SIGN_AUTH,
  rank: ctx.window.SIGN_RANK,
  agr: ctx.window.SIGN_AGR,
  fee: ctx.window.SIGN_FEE,
  pay: ctx.window.SIGN_PAY,
  orgs: ctx.window.SIGN_ORGS,
});
await dump("fields.json", { FIELD, NEAR });
await dump("lawyers.json", lawyers);
await dump("portraits.json", ctx.window.IMG);
await dump("cases.json", [
  { c: "민사 / 상간소송", r: "전부 승소", t: "상간소송 피고 항소 기각 — 5,000만 원 청구 방어" },
  { c: "민사 / 상간소송", r: "전부 승소", t: "위자료 청구 기각 — 사실혼 관계 인정" },
  { c: "민사 / 상간소송", r: "전부 승소", t: "상간녀위자료소송 — 4,000만 원 전액 인용" },
  { c: "민사 / 상간소송", r: "합의 성립", t: "상간녀 위자료 합의 — 3,000만 원 지급" },
  { c: "교통사고 / 음주운전", r: "무죄", t: "항소심 무죄 — 고의 운전 부재 입증" },
  { c: "교통사고 / 음주운전", r: "무죄", t: "무죄 — 긴급피난 정당행위 인정" },
  { c: "성범죄 / 카촬", r: "기소유예", t: "초범 기소유예 — 경찰조사 대응" },
  { c: "성범죄 / 카촬", r: "무죄", t: "무죄 — 전 연인 불법촬영 고소 방어" },
]);
await dump("reviews.json", [
  { f: "기업법무", t: "억울한 업무방해 고소, YK 조력에 불기소", l: ["박재완", "현민석", "장현준", "곽민규", "김현준"] },
  { f: "기업법무", t: "형사 고소 60건 중 1건만 인정돼 약식명령", l: ["조인선", "곽노주", "홍석일"] },
  { f: "민사", t: "차량 필름시공 중 합판 등 파손, 피해 배상받음", l: ["김채민", "김서영", "조예은"] },
  { f: "학교폭력", t: "초등학생 학폭위 회부 위기, 학교장 자체 종결", l: ["손현태", "김은정"] },
  { f: "이혼", t: "혼인 파탄으로 인한 이혼, 조정으로 마무리", l: ["마수정"] },
  { f: "민사", t: "허위보도 손해배상청구·정정보도청구 전부 방어", l: ["박찬호", "최황선"] },
  { f: "형사", t: "연인을 가장한 투자사기, 가해자 실형", l: ["함진주"] },
]);
console.log("ok", out);
