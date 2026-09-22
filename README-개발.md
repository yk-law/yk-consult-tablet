# 로컬 개발 — React + FastAPI

수정 → 확인 사이클에서 게시·다운로드·새로고침을 없애기 위한 구조입니다.

## 시작 — 셋 중 아무거나

### 1. 더블클릭 (제일 쉬움)
Finder에서 **`개발서버 시작.command`** 더블클릭.
검은 창이 뜨고 브라우저가 알아서 http://localhost:5173 을 엽니다.
끌 때는 그 창에서 **Ctrl + C** 를 누르거나 창을 닫으면 됩니다.

> 처음 한 번은 macOS가 "확인되지 않은 개발자" 경고를 낼 수 있습니다.
> 파일에서 **우클릭 → 열기 → 열기** 를 한 번 해주면 다음부터는 더블클릭으로 됩니다.

### 2. Cursor 안에서
1. `File > Open Folder` → `~/Downloads/YK_상담태블릿`
2. **Cmd + J** 로 터미널 열기
3. `node tools/dev.mjs` 입력 후 Enter
4. 터미널에 뜬 주소를 **Cmd + 클릭**

### 3. 터미널 앱
```bash
cd ~/Downloads/YK_상담태블릿
python3 -m pip install -r server/requirements.txt   # 최초 1회
cd app && npm install && cd ..                      # 최초 1회
node tools/dev.mjs
```

- API: http://127.0.0.1:8000
- 화면: http://localhost:5173  (`/api` 는 Vite가 FastAPI로 프록시)

`app/src/` 를 저장하면 Vite가 즉시 반영합니다. `server/` 를 저장하면 uvicorn이 다시 뜹니다.

## 어디를 고치면 되나

| 고치고 싶은 것 | 파일 |
|---|---|
| **예약자·사건·콜 메모** | `server/data/bookings.json` |
| 고객 태블릿 | `app/src/Tablet.jsx` |
| 상담실장 YK-OS | `app/src/YKOS.jsx` |
| 디자인 | `app/src/styles.css` |
| 추천 점수 · 계약 초안 | `server/catalog.py` |
| 세션 API | `server/main.py` |
| 확장 질문 | `server/data/scenarios.json` |
| 약정금 분포 | `server/data/fee.json` |

예전 vanilla HTML/JS는 `vanilla/` 에 비교용으로만 남아 있습니다. `목업 열기.command` 는 그 파일을 엽니다.

## 딥링크 — 고칠 화면으로 바로 들어가기

```
?c=<예약id 또는 이름>   그 예약으로 화면 공유된 상태
&s=<화면>              intro | brief | home | adv | fav | case | review
&d=<변호사 이름>        그 변호사 상세를 연 상태
&v=tab | os | both     고객 태블릿 / 상담실장 YK-OS / 나란히
```

```
http://localhost:5173/?c=이도현&s=brief&v=both
http://localhost:5173/?c=228271&d=박찬&v=os
http://localhost:5173/?v=os                  ← 미연결 상태 YK-OS
```

## 점검

서버가 켜진 상태에서:

```bash
node tools/check.mjs
```

카탈로그 수치(변호사 316 / 전문가 98 / 예약 6건), 미연결 기본값, 공유 후 추천 3인, 콘솔 오류를 확인하고 `.check/` 에 스크린샷을 남깁니다.

## 프론트 빌드

```bash
cd app && npm run build      # → app/dist
```

FastAPI는 `app/dist` 가 있으면 8000 포트에서 SPA도 같이 서빙합니다. 개발 중에는 Vite(5173)를 쓰는 편이 낫습니다.

## 주의

- **원본은 `app/src/` 와 `server/` 입니다.** `app/dist/` · `dist/` · `mockups/` 는 빌드 결과물입니다.
- 세션은 서버 메모리 한 건입니다. uvicorn을 재시작하면 공유 상태가 풀립니다.
- 브랜드 영상은 `yklawfirm.co.kr` 을 직접 참조합니다. 로컬·태블릿에서는 재생되지만 망분리 환경에서는 영상만 빠집니다.
