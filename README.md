# YK 상담 태블릿

법무법인 YK 내방 상담 현장용 **고객 태블릿** + 상담실장용 **YK-OS** 연동 프로젝트.
현재 진행 과제는 **온라인 바인더** — 실물 변호사 프로필 바인더의 디지털 대체.
**목적은 내방 대비 선임율을 올리는 것.**

## 30초 만에 시작하기

```bash
node tools/dev.mjs        # → http://localhost:5173
```

저장하면 브라우저가 자동으로 새로고침됩니다. Node가 없으면 `app/index.html` 을 그대로 열어도 됩니다.
Finder에서는 **`개발서버 시작.command`** 또는 **`목업 열기.command`** 를 더블클릭.
자세한 내용은 **`README-개발.md`**.

## 무엇을 고치면 되나

| 고치고 싶은 것 | 파일 |
|---|---|
| 예약자·사건·콜 메모 (시연 내용 대부분) | `app/data/bookings.js` |
| 확장 질문 시나리오 | `app/data/scenarios.js` |
| 화면 구조·문구 | `app/index.html` |
| 디자인 | `app/styles.css` |
| 동작·추천 로직 | `app/app.js` |

## 저장소 구조

```
AGENTS.md              에이전트용 컨텍스트 — 먼저 읽을 것
README-개발.md         로컬 개발 · 딥링크 · 빌드
.cursor/rules/         Cursor 프로젝트 규칙

app/                   ★ 원본. 여기만 고친다
  index.html · styles.css · app.js
  data/  bookings · scenarios · lawyers · advisors · details · fee · portraits

tools/
  dev.mjs                라이브 리로드 개발 서버 (의존성 0)
  build.mjs              단일 HTML 파일로 빌드 → dist/
  check.mjs              전 화면 스모크 점검 (playwright 필요)
  split.py               단일 파일 → app/ 재분해

docs/
  01-배경과-현황.md
  02-결정사항.md         결정 로그 (날짜순, 변경 이력 포함)
  03-미결논점.md         아직 정하지 못한 것
  04-데이터소스.md       파싱 출처·방법·검증 여부
  05-화면정의.md         화면 구조와 디자인 토큰
  06-다음-작업.md        우선순위

data/                  파싱 결과물
  lawyers.txt / .csv     변호사 316명(고유 이름) · 홈페이지 표기 318건
  advisors.csv           고문 28 · 전문위원 61 · 자문위원 9 = 98명
  구성원바인더_법원.json  바인더 13인 상세 프로필
  binder_raw_text.txt    바인더 PDF 텍스트 원문

assets/portraits/      바인더에서 추출한 인물 사진 13장
dist/                  빌드 결과물 (git 미추적)
mockups/
  yk-online-binder.html  2026-09-03 정적 비교본 (참고 보관)
```

## 현재 만들어져 있는 것

**고객 태블릿** — 대기(미연결/연결) · 예약 정보 확인 · 추천 목록 · 둘러보기 · 프로필 상세 · 전문가 · 관심 · 업무사례 · 후기
**상담실장 YK-OS** — 방문 예정 목록(검색·화면공유·공유해제) · 고객 화면 미러링 · 예약 정보 · 교차검증 · 확장 질문 시나리오 · 추천 순위표 · 상담 내용 작성 모달

전부 실제로 동작합니다. 화면 장표가 아닙니다.

## 원본 자료 (저장소 밖)
- 구성원바인더 PDF 512MB — `~/Downloads/260623_[법무법인YK] 구성원바인더_법원.pdf`
- Confluence `yknext.atlassian.net/wiki/spaces/YKP` — 278790188 UX / 283049986 녹취 / 224264236 YK-OS 릴리즈로그
- YK-OS `ykos.yklawfirm.co.kr` — 상담 태블릿 `/#/app/visit`, 선임 목록 `/#/app/engagement/management/contract`
- 홈페이지 `yklawfirm.co.kr` — 변호사 `/member/lawyer`, 고문 `/member/advisory`, 전문위원 `/member/expert`, 자문위원 `/member/consultant`
