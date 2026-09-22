# YK 상담 태블릿

법무법인 YK 내방 상담 현장용 **고객 태블릿** + 상담실장용 **YK-OS** 연동 프로젝트.
현재 진행 과제는 **온라인 바인더** — 실물 변호사 프로필 바인더의 디지털 대체.
**목적은 내방 대비 선임율을 올리는 것.**

## 30초 만에 시작하기

```bash
node tools/dev.mjs        # FastAPI :8000 + Vite :5173
```

브라우저에서 http://localhost:5173 을 연다. Finder에서는 **`개발서버 시작.command`** 를 더블클릭.
자세한 내용은 **`README-개발.md`**.

## 무엇을 고치면 되나

| 고치고 싶은 것 | 파일 |
|---|---|
| 예약자·사건·콜 메모 | `server/data/bookings.json` |
| 확장 질문 시나리오 | `server/data/scenarios.json` |
| 고객 태블릿 화면 | `app/src/Tablet.jsx` |
| 상담실장 YK-OS 화면 | `app/src/YKOS.jsx` |
| 선임 계약 서식 | `app/src/Paper.jsx` · `SignModal.jsx` |
| 디자인 | `app/src/styles.css` |
| 추천 점수·계약 초안 | `server/catalog.py` |
| 세션 API | `server/main.py` |

## 저장소 구조

```
AGENTS.md              에이전트용 컨텍스트 — 먼저 읽을 것
README-개발.md         로컬 개발 · 딥링크 · 빌드
.cursor/rules/         Cursor 프로젝트 규칙

app/                   React 프론트 (Vite)
  src/  Tablet · YKOS · Paper · SignModal · WriteModal
server/                FastAPI
  main.py · catalog.py · data/*.json
vanilla/               예전 HTML/JS 목업 (비교용)

tools/
  dev.mjs                FastAPI + Vite 동시 기동
  check.mjs              스모크 점검 (서버가 켜져 있어야 함)
  export-json.mjs        vanilla 데이터 → server/data JSON

docs/                  01~06
data/                  파싱 결과물
assets/portraits/      바인더에서 추출한 인물 사진 13장
```

## 현재 만들어져 있는 것

**고객 태블릿** — 대기(미연결/연결) · 예약 정보 확인 · 추천 목록 · 둘러보기 · 프로필 상세 · 전문가 · 관심 · 업무사례 · 후기 · 전자서명
**상담실장 YK-OS** — 방문 예정 목록(검색·화면공유·공유해제) · 고객 화면 미러링 · 예약 정보 · 교차검증 · 확장 질문 시나리오 · 추천 순위표 · 상담 내용 작성 · 선임 계약

태블릿과 YK-OS는 FastAPI 세션을 폴링해서 같은 상담을 본다. 화면 장표가 아니다.

## 원본 자료 (저장소 밖)
- 구성원바인더 PDF 512MB — `~/Downloads/260623_[법무법인YK] 구성원바인더_법원.pdf`
- Confluence `yknext.atlassian.net/wiki/spaces/YKP` — 278790188 UX / 283049986 녹취 / 224264236 YK-OS 릴리즈로그
- YK-OS `ykos.yklawfirm.co.kr` — 상담 태블릿 `/#/app/visit`, 선임 목록 `/#/app/engagement/management/contract`
- 홈페이지 `yklawfirm.co.kr` — 변호사 `/member/lawyer`, 고문 `/member/advisory`, 전문위원 `/member/expert`, 자문위원 `/member/consultant`
