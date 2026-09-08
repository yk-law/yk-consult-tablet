# 로컬 개발 — 저장하면 바로 반영

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
node tools/dev.mjs
```

어느 쪽이든 켜두면, `app/` 아래 파일을 저장할 때마다 **브라우저가 스스로 새로고침**합니다.
게시도, 다운로드도 없습니다. (의존성 0, Node 18 이상)

## Node.js가 없다면

터미널에서 `node --version` 을 쳤을 때 버전이 안 나오면 설치가 필요합니다.
https://nodejs.org 에서 **LTS** 버전을 받아 설치하면 됩니다.

**설치 없이 당장 보고 싶다면** `app/index.html` 을 더블클릭하세요.
자동 새로고침만 안 되고 나머지는 전부 똑같습니다. 수정한 뒤 브라우저에서 **Cmd + R** 을 누르면 됩니다.
딥링크도 그대로 동작합니다.

## 어디를 고치면 되나

| 고치고 싶은 것 | 파일 | 크기 |
|---|---|---|
| **예약자·사건·콜 메모** (시연 내용 대부분) | `app/data/bookings.js` | 3 KB |
| 화면 구조·문구 | `app/index.html` | 17 KB |
| 디자인 | `app/styles.css` | 27 KB |
| 동작·추천 로직 | `app/app.js` | 28 KB |
| 변호사 명단 | `app/data/lawyers.js` | 5 KB |
| 고문·전문위원·자문위원 | `app/data/advisors.js` | 5 KB |
| 상세 프로필 14인 | `app/data/details.js` | 12 KB |
| 약정금 분포 | `app/data/fee.js` | 1 KB |
| 인물 사진 13장 | `app/data/portraits.js` | 189 KB — **건드릴 일 없음** |

이전에는 이 전부가 283KB 한 파일이었습니다. 사진이 67%를 차지하는데 매번 같이 다시 쓰였습니다.

## 딥링크 — 고칠 화면으로 바로 들어가기

매번 처음부터 클릭하지 않아도 됩니다.

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

```bash
npm i -D playwright && npx playwright install chromium   # 최초 1회
node tools/check.mjs
```

전 화면을 돌면서 **변호사 316 / 전문가 98 / 예약 4건**, 전문위원 혼입 여부, 미연결 기본값,
예약별 추천 3인, 콘솔 오류를 확인하고 `.check/` 에 스크린샷을 남깁니다.

## 공유용 단일 파일 만들기

```bash
node tools/build.mjs      # → dist/yk-binder-app.html
```

`app/` 을 한 파일로 합칩니다. 아티팩트 게시, 팀 공유, 태블릿 반입은 이 파일로 합니다.
`mockups/yk-binder-app.html` 도 같은 내용입니다.

## 다시 쪼개야 할 때

단일 파일만 있고 `app/` 을 다시 만들어야 하면:

```bash
python3 tools/split.py mockups/yk-binder-app.html app
```

## 주의

- **`app/` 이 원본입니다.** `dist/` 와 `mockups/` 는 빌드 결과물이라 직접 고치면 다음 빌드에 덮어써집니다.
- 브랜드 영상은 `yklawfirm.co.kr` 을 직접 참조합니다. 로컬·태블릿에서는 재생되지만 **아티팩트에서는 CSP로 차단**됩니다. 로고는 SVG를 파일에 넣어 어디서나 나옵니다.
