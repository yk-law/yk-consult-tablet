이 화면은 해석하지 말고 그대로 옮긴다. 바꿔야 하면 바꾸지 말고 질문으로 남긴다.

고객용 상담 태블릿 View 인계 명세. 정답 이미지는 `handoff/golden/{기기}-{화면}.png`. 시안·아티팩트와 다르면 **이 문서 + golden**을 따른다. 데이터는 저장소 가명 목업만 쓴다.

---

## 바꾸면 안 되는 것 (AGENTS.md 전제 1~8 요약)

1. 기기는 두 대다 — 상담 태블릿(고객) ≠ YK-OS(상담실장 데스크탑). 한 화면 모드 전환이 아니다.
2. 태블릿에 로그인 없음 — YK-OS에서 「화면 공유」 전엔 브랜드 대기만.
3. 태블릿은 고객향 View — 담당 변호사 선택·상담 기록·스케줄 관리를 두지 않는다. 사건 요약 1뎁스에서만 「네/아니오」를 받고, 모두 골라야 2뎁스로 간다.
4. 시연 목업은 고객 태블릿 View만 — YK-OS 미러링·화면 공유 조작 UI를 이 앱에 다시 넣지 않는다.
5. 승패소율 지표를 만들지 않는다.
6. 실제 의뢰인 이름·전화번호를 넣지 않는다. 목업 이름은 전부 가명.
7. 처분권자 접점은 YK-OS 전용. 고객 화면에는 사실 서술만.
8. 확장 질문 시나리오는 YK-OS 전용. 고객에게 사건을 늘려 파는 것처럼 보이지 않게 한다.

추가로: 근거 없는 수치를 띄우지 않는다. 광고 심의 리스크 문구(전관 암시·승률)는 사실 서술로만. 박스·그림자·둥근 모서리로 위계를 만들지 않는다(전문인력 카드 프레임 예외).

---

## 기기 · golden 파일명

| 기기 id | viewport | deviceScaleFactor |
|---|---|---|
| `tablet-landscape` | 1194×834 | 2 |
| `tablet-portrait` | 834×1194 | 2 |
| `desktop` | 1280×900 | 1 |

파일명: `{기기}-{화면}.png` (예: `tablet-landscape-report.png`).

| 화면 id | 딥링크 (`?c=한지우&…`) | 대기 셀렉터 | 비고 |
|---|---|---|---|
| `confirm` | `v=tab&theme=light` | `.confirmpane:not(.preppane)` | 내방 예약 확인 |
| `prep` | `s=prep` | `.preppane` | 상담 준비 |
| `firm` | `s=firm` | `.firmpane` | 법무법인 YK 소개 |
| `report` | `s=report` | `.yh-check` | 사건 요약 1뎁스 |
| `topics` | `s=topics` | `.yh-steps` | 사건 요약 2뎁스 |
| `counsel` | `s=counsel` | `.counselpane .profile` | 상담 변호사(바인더 프로필) |
| `seniors` | `s=seniors` | `.seniorpane` | 전문 인력 |
| `youtube` | `s=youtube` | `.youtube-stories` | YK 변호사 이야기 |

대기 영상(`s=film`)은 인계 캡처에서 제외 가능.

---

## 화면별 구성 순서

### confirm — 예약 확인
1. 로고(`.welcome-ci`) + 「법무법인 YK를 찾아주셔서 감사합니다.」
2. 제목: `{가명} 고객님, 반갑습니다.`
3. 「예약하신 시간과 장소를 확인해 주세요.」
4. 일시 · 상담실(`.who-card`)
5. CTA 「네, 맞습니다」 / 「제 예약이 아니에요」
6. (예약 불일치 시) 「예약 정보를 확인합니다.」 + 「담당 직원이…」 + 「예약 정보 다시 보기」
7. MYK QR 블록은 코드상 `SHOW_RESERVATION_QR === false` 로 숨김

### prep — 상담 준비
1. 로고 + 감사 문구(동일)
2. 「상담을 준비하고 있습니다.」
3. 「잠시 후 법무법인 YK 소개 영상이 시작됩니다.」
4. 로딩 점 3개(`.prep-loading`)

### firm — 법무법인 YK 소개
1. 슬로건 lead + 슬로건 + 영문
2. 통계(`firm.stats`) + 기준 월
3. 탭: 법원 경력 변호사 / 검찰 경력 변호사 / 고문 및 전문위원 / 업무사례
4. 분야별 전문 센터 목록(관련 분야 뱃지)
5. 「사건 요약 보기」

### report — 사건 요약 1뎁스
1. 「예약하실 때 말씀하신 내용입니다.」
2. lead: 맞는지 확인 / 다른 부분은 상담에서 다시
3. 문장별 「네」/「아니오」(모두 골라야 다음)
4. 「모든 항목에 네 또는 아니오를 골라 주세요…」
5. 「법무법인 YK 소개로」 / 「상담에서 함께 볼 내용」

### topics — 사건 요약 2뎁스
1. 「오늘 상담에서 함께 볼 내용입니다.」
2. lead + (있으면) 상담 분야
3. 지위 질문(있을 때): 「어떤 경우에 해당하시나요?」
4. 단계 목록(`.yh-steps`) · 진행 순서 · 여쭤볼 내용 · 자료 · 유사 사례
5. 「더 여쭤보고 싶은 점은…」 + 「사건 요약으로/말씀하신 내용으로」 · 「상담 변호사 확인하기」

### counsel — 상담 변호사 프로필
1. (팀 복수 시) 탭
2. 좌 사진 / 우 대표 경력·이름·직위·출신·소개·학력
3. 업무 분야 및 사례 · 이력 사항(경력·수상·논문·저서)
4. 「사건 요약으로」 / 「전문 인력 살펴보기」

### seniors — 전문 인력
1. 「다양한 경험을 갖춘 전문 인력을 소개합니다.」
2. 「주요 업무 분야와 경력입니다.…」
3. 캐러셀 카드 · 포커스 정보 · 「프로필 보기」
4. 전체 N명 · 일시정지/재생 · 이전/다음
5. 「상담 변호사로」 / 「YK 변호사 이야기 보기」

### youtube — YK 변호사 이야기
1. 「The Lawyer On Your Side」
2. 설명 문단
3. 영상 카드 목록(변호사명·헤드라인·「보기」)
4. 「전문 인력으로」

하단 퍼널 내비(여정 구간): 법무법인 YK 소개 · 사건 요약 · 상담 변호사 · 전문 인력 · YK 변호사 이야기. QR: 「상담 기록과 사건 진행은 YourK에서…」

---

## 문구 원문 표 (`app/src` 그대로)

| 위치 | 문구 |
|---|---|
| WaitFlow | 법무법인 YK를 찾아주셔서 감사합니다. |
| WaitFlow | 상담을 준비하고 있습니다. |
| WaitFlow | 잠시 후 법무법인 YK 소개 영상이 시작됩니다. |
| WaitFlow | 예약 정보를 확인합니다. |
| WaitFlow | 담당 직원이 예약 정보를 확인해 드립니다. / 이 화면을 그대로 두시면 됩니다. |
| WaitFlow | 예약 정보 다시 보기 |
| WaitFlow | {name} 고객님, 반갑습니다. |
| WaitFlow | 예약하신 시간과 장소를 확인해 주세요. |
| WaitFlow | 네, 맞습니다 |
| WaitFlow | 제 예약이 아니에요 |
| Film | 영상 건너뛰기 |
| Film | 영상을 불러오지 못했습니다 · YK 소개로 |
| CounselVideo | 프로필 바로 보기 |
| FirmIntro 탭 | 법원 경력 변호사 / 검찰 경력 변호사 / 고문 및 전문위원 |
| FirmIntro | 고문 / 경찰 경력 전문위원 |
| FirmIntro | 분야별 전문 센터 |
| FirmIntro | 이 사건과 관련된 분야 |
| FirmIntro | 사건 요약 보기 |
| FirmCases | 이 사건 분야의 업무사례가 아직 없습니다. |
| Summary | 예약하실 때 말씀하신 내용입니다. |
| Summary | 아래 내용이 맞는지 확인해 주세요. / 다른 부분은 상담에서 다시 여쭤보겠습니다. |
| Summary | 네 / 아니오 |
| Summary | 모든 항목에 네 또는 아니오를 골라 주세요. 고르신 답은 다른 쪽을 누르면 바뀝니다. |
| Summary | 법무법인 YK 소개로 / 상담에서 함께 볼 내용 |
| Report | 오늘 상담에서 함께 볼 내용입니다. |
| Report | 같은 고민으로 찾아오신 분들이 상담에서 많이 확인하신 내용입니다. / 정리해서 오실 필요는 없습니다. 이 순서로 편하게 말씀 나누시면 됩니다. |
| Report | 상담 분야 |
| PartyAsk | 어떤 경우에 해당하시나요? |
| PartyAsk | 고르시면 그에 맞는 내용으로 보여드립니다. 모르시면 넘어가셔도 됩니다. |
| PartyAsk | 수사를 받고 있거나 연락을 받았어요 / 재판을 받고 있어요 / 피해를 입었어요 / 상대방에게 청구하려고 해요 / 소장이나 청구를 받았어요 / 잘 모르겠어요 |
| Report | 상담에서 함께 볼 내용 / 일반적인 진행 순서 |
| Report | 실제 절차와 기간은 사건마다 다르며, 선임 계약 후 담당 변호사가 다시 안내합니다. |
| Report | 상담에서 여쭤볼 내용 / 가지고 계시면 도움이 되는 자료 |
| Report | 지금 없으셔도 괜찮습니다. 상담 후에 보내주셔도 됩니다. |
| Report | YK가 함께한 비슷한 사례 |
| Report | 법무법인 YK 홈페이지 업무사례에서 골랐습니다. 사건마다 사정이 달라 결과도 다를 수 있습니다. |
| Report | 더 여쭤보고 싶은 점은 상담에서 편하게 말씀해 주세요. |
| ReportNext 기본 | 상담 변호사 확인하기 |
| Counsel | 오늘 상담 변호사가 지정되지 않았습니다. |
| Profile | 주요 업무 분야 / 주요 경력 / 수상 내역 / 주요 업무 실적 / 논문·저서 / 관련 업무 사례 |
| Profile | 업무 분야 및 사례 / 이력 사항 |
| Profile | 경력 더 보기 / 경력 접기 |
| Profile CTA | 전문 인력 살펴보기 / 사건 요약으로 / 전문 인력 목록 |
| Seniors | 다양한 경험을 갖춘 전문 인력을 소개합니다. |
| Seniors | 주요 업무 분야와 경력입니다. / 프로필을 누르면 자세한 정보를 확인하실 수 있습니다. |
| Seniors | 주요 경력 / 업무 분야 / 프로필 보기 |
| Seniors | 현재 표시할 전문 인력 정보가 없습니다. |
| Seniors | 상담 변호사로 / YK 변호사 이야기 보기 |
| Seniors | 설문 참여하기 *(onNext 있을 때만)* |
| Journey QR | 상담 기록과 사건 진행은 / YourK에서 확인하세요 |
| Journey QR | 상담 뒤에도 이어서 보실 수 있습니다. / QR코드를 스캔하세요. |
| YoutubeStories | The Lawyer On Your Side |
| YoutubeStories | YK 변호사들이 사건을 바라보는 관점과 상담에서 중요하게 생각하는 점을 이야기합니다. / 관심 있는 영상을 선택해 편하게 살펴보세요. |
| YoutubeStories | 보기 / 전문 인력으로 |
| Myk (예약 QR 켤 때) | 법률 과정을 더 쉽게, 의뢰인의 곁에 더 가까이 |
| Myk | 법무법인 YK의 상담과 사건 진행을 편리하게 확인하고 이어갈 수 있습니다. |
| firm_intro.json | 고객중심 법률파트너 / 법무법인 YK / People. Promise. Performance. |

동적 본문(사건 요약 문장·변호사 약력·업무사례 제목)은 가명 목업 JSON/`topics.json`을 따른다. 화면에 「전관」「승소율」「의뢰인」「콜 단계」「진술」「YK-OS」 고객 카피를 쓰지 않는다.

---

## 색 · 글자 · 간격 토큰 (golden = `.binder-theme.theme-light`)

golden은 `?theme=light` → `.binder-theme.theme-light`. 아래 hex는 `app/src/colors.css`의 `--yk-*` 정의와 `.binder-theme` 139~158행 매핑을 풀어 적은 값이다. **golden과 다르면 golden을 우선**하고, 토큰 불일치는 질문으로 남긴다.

### `.binder-theme` 별칭 → 실제 hex (light)

| 별칭 | 매핑 | hex |
|---|---|---|
| `--ink` / `--ink2` | `--yk-foreground` | `#202631` |
| `--mut` / `--mut2` | `--yk-muted-foreground` | `#626873` |
| `--ivory` | `--yk-background` | `#FFFFFF` |
| `--ivory2` | `--yk-muted` | `#EDEFF5` |
| `--sf` | `--yk-card` | `#FFFFFF` |
| `--hair` | `--yk-border` | `#D5DBE5` |
| `--hair2` | `--yk-input` | `#80858D` |
| `--gold` | `--yk-secondary-foreground` | `#102169` |
| `--acc` | `--yk-primary` | `#102169` |
| `--acc-d` | `--yk-primary-pressed` | `#081449` |
| `--acc-s` | `--yk-selected` | `#F3F5FC` |
| (글자) `--yk-primary-foreground` | — | `#FFFFFF` |
| (hover) `--yk-primary-hover` | — | `#1B3074` |
| (선택글자) `--yk-selected-foreground` | — | `#102169` |
| (선택테두리) `--yk-selected-border` | — | `#3754A0` |
| (링크) `--yk-link` / hover / pressed | — | `#263F86` / `#102169` / `#081449` |

### CTA · 여정 내비 · radius (golden이 쓰는 값)

| 항목 | 값 |
|---|---|
| CTA `.go` (`.binder-theme`) | solid 배경 `--yk-primary` `#102169`, 글자 `--yk-primary-foreground` `#FFFFFF`, border 동일. hover `#1B3074`, active `#081449` |
| 여정 `.jnav button.on` | 배경 `#102169` / 글자 `#FFFFFF` / weight 600. hover `#1B3074`, active `#081449` |
| 예약 확인 `.confirm-actions .go` / `.ghost` | `border-radius: 8px` |
| 1뎁스 「네/아니오」 `.yh-check-a button` | `border-radius: 8px` |
| 지위 칩 `.yh-party-o button` | `border-radius: 8px` |
| 여정 foot·예약 복귀·주요 CTA 버튼 | 대체로 `border-radius: 8px` |
| 전문인력 「프로필 보기」 등 pill | `border-radius: 999px` |
| `.chip`(레거시) | radius 미지정(0에 가깝게). golden 둥근 버튼은 위 8px/999px를 따름 |
| 구분선 | 1px `var(--hair)` → `#D5DBE5` (또는 `color-mix`로 60% 투명) |

### 글자 · 간격

| 토큰 | 값 |
|---|---|
| `--font` | `"SUIT Variable",-apple-system,BlinkMacSystemFont,system-ui,sans-serif` |
| `--font-serif` | `"YK MaruBuri","MaruBuri",serif` |
| `.lbl` | 10.5px / 700 / letter-spacing `.26em` / uppercase / `var(--gold)` → `#102169` |
| `.h1` | serif 500 / 26px / line-height 1.42 / letter-spacing `-0.018em` / `var(--ink)` → `#202631` |
| `.sub` | 13.5px / `var(--ink2)` / line-height 1.85 |
| `.pane` padding | `32px 26px 36px` |
| prep 제목 | serif 32px / line-height 44px / letter-spacing `-0.02em` |
| body letter-spacing | `-0.003em` |
| 2뎁스 `.reportpane .yh-steps .n` | 14px / 500 / `var(--bt-muted)` `#626873` (테두리·배경 없음). 구 다크 시안의 골드 번호 아님 |

### `:root` 버건디 표 (golden 미사용 · 기본 테마)

`styles.css` `:root`의 `--acc #6E2739` · `--gold #A98A4B` · `--ivory #FBFAF7` 등은 **golden(`theme=light`)에서 쓰이지 않는다.** 바인더 테마가 없을 때의 기본값으로만 남아 있다.

---

## 정렬 규칙

- 예약 확인·준비: 본문 세로 가운데, 가로 중앙(`.confirm-main` 중앙 정렬). CTA는 주 버튼이 위/강조(radius 8px solid primary), ghost가 보조(radius 8px).
- 사건 요약·YK 소개: `.yh-body` 최대 `min(920px, 100%)` 가운데. 제목 serif, lead 아래 헤어라인.
- 1뎁스 확인: 문장 왼쪽, 「네/아니오」 오른쪽(좁은 폭에서는 세로 스택). 버튼 radius 8px.
- 2뎁스 단계: `01`… muted(`#626873`) 번호 + 제목/본문 2열. 항목 사이 구분선은 번호 열을 비운 채 본문 아래에만.
- 상담 변호사: 상단 좌 사진(상반신 크롭) / 우 메타. 아래 전폭 섹션. 길면 스크롤.
- 전문 인력: 가로 캐러셀, 포커스 카드 확대. 카드 안 사진은 상체 크롭. 등급 별은 카드 바깥 상단(이 시안의 캐러셀 UI를 따름). 「프로필 보기」는 pill(999px).
- 여정 구간: 상단 CI 헤더 + 하단/측면 내비·YourK QR. on 상태는 navy `#102169`. 대기·준비·필름에서는 여정 내비 숨김.
- 위계는 선과 여백. golden의 주 CTA·칩은 radius 8px(일부 pill 999px)이며, 레거시 「칩·배지 0~2px」 원칙을 golden에 억지로 맞추지 않는다(전문인력 프레임 예외는 유지).

---

## 상태 목록

| 상태 | golden | 비고 |
|---|---|---|
| 예약 확인 기본 | `*-confirm.png` | 가명·일시·상담실 |
| 예약 불일치 | (캡처 생략) | 「제 예약이 아니에요」 후 도움 화면 — 옮길 때 문구 표 따름 |
| 상담 준비 | `*-prep.png` | 로딩 애니메이션은 캡처 시 정지 |
| YK 소개 | `*-firm.png` | 기본 탭 법원 경력 |
| 사건 요약 1뎁스 미응답 | `*-report.png` | 전부 골라야 다음 활성 |
| 사건 요약 2뎁스 | `*-topics.png` | 1뎁스 없거나 통과 후 |
| 상담 변호사 | `*-counsel.png` | 지정 없으면 empty 문구 |
| 전문 인력 목록 | `*-seniors.png` | 자동 넘김 일시정지 후 캡처 |
| 전문 인력 상세 | (목록에서 진입) | 상담 변호사와 같은 프로필 골격 |
| YK 변호사 이야기 | `*-youtube.png` | 목록만(재생 레이어 제외) |
| 대기 영상 | 제외 | `s=film` |

비교: `node handoff/compare.mjs` — 동일 조건 재촬영 후 pixelmatch, **차이율 > 0.5%** 이면 실패(종료코드 1).

---

## 개발자 AI에게

- UI-SPEC.md가 있는 화면은 **그대로 옮긴다**. 간격·글자·문구·버튼 순서를 재해석하지 않는다.
- 시안 링크는 미리보기용. 정의·golden과 다르면 정의·golden.
- 바꿔야 할 것 같으면 추측 구현하지 말고 질문으로 남긴다.
