#!/bin/bash
# 더블클릭하면 개발 서버가 켜지고 브라우저가 열립니다. 끄려면 이 창에서 Ctrl+C 또는 창 닫기.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js가 설치되어 있지 않습니다."
  echo ""
  echo "  https://nodejs.org 에서 LTS 버전을 받아 설치한 뒤 다시 실행해 주세요."
  echo "  설치 없이 지금 바로 보려면 app/index.html 을 더블클릭하면 됩니다."
  echo "  (자동 새로고침만 안 되고 나머지는 똑같습니다. 수정 후 Cmd+R)"
  echo ""
  read -n 1 -s -r -p "  아무 키나 누르면 닫힙니다."
  exit 1
fi

( sleep 1.2; open "http://localhost:5173" ) &
node tools/dev.mjs
