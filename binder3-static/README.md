# 바인더#3 정적 검토본

YK-OS 고객 태블릿 화면(바인더#3)을 운영팀 공유와 디자인 수정용으로 고정한 것입니다. 서버 없이 `index.html` 을 열면 됩니다.

## 내용

- 사건 26건: 콜 내용은 전부 더미입니다(`_build/dummy_cases.json`). 고객명은 홍길동, 상담 일시는 2026-11-01 14:00 입니다.
- 문항·지위·맞춤 설명: 더미 콜로 Gemma 를 한 번 돌린 결과입니다. 생성 문구는 법무 검수 전입니다.
- 상담 변호사 10명, 사건별 전문 인력, YK 소개, 업무 사례: DB 와 홈페이지 공개 정보를 고정했습니다.
- 변호사 사진과 글꼴은 인터넷에서 받습니다.

## 고치는 곳

| 고칠 것 | 파일 |
|---|---|
| 화면 마크업 | `index.html` 의 `<template>` |
| 디자인 | `binder3.css` (`review.css` 는 검토본 전용) |
| 동작 | `binder3.js` |

`index.html` 표기: `{{이름}}` 값, `data-if` / `data-unless` 조건, `data-each="항목 in 목록"` 반복, `data-action` 버튼 동작.

고친 뒤에는 `binder3.css` 와 마크업 변경을 YK-OS `apps/console/src/pages/visit/binder3/` 에 옮깁니다.

## 데이터 다시 만들기

```bash
cd ~/sources/YKOS/apps/backend
python ~/sources/yk-consult-tablet/binder3-static/_build/build_data.py
```
