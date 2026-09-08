#!/bin/bash
# Node.js 없이 목업을 바로 엽니다. 수정 후에는 브라우저에서 Cmd+R.
cd "$(dirname "$0")" || exit 1
open "app/index.html"
