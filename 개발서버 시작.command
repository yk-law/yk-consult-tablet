#!/bin/bash
# 더블클릭하면 FastAPI + Vite 가 켜지고 브라우저가 열립니다. 끄려면 이 창에서 Ctrl+C.
cd "$(dirname "$0")" || exit 1

export PATH="/tmp/node-v22.14.0-darwin-arm64/bin:$PATH"

if ! command -v python3 >/dev/null 2>&1; then
  echo ""
  echo "  Python 3 가 필요합니다."
  echo ""
  read -n 1 -s -r -p "  아무 키나 누르면 닫힙니다."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js가 설치되어 있지 않습니다."
  echo "  https://nodejs.org 에서 LTS 버전을 받아 설치한 뒤 다시 실행해 주세요."
  echo ""
  read -n 1 -s -r -p "  아무 키나 누르면 닫힙니다."
  exit 1
fi

python3 -m pip install -q -r server/requirements.txt
if [ ! -d app/node_modules ]; then
  (cd app && npm install)
fi

( sleep 1.8; open "http://localhost:5173" ) &
node tools/dev.mjs
