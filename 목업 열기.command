#!/bin/bash
# API 없이 예전 vanilla 목업만 엽니다. 수정 후에는 브라우저에서 Cmd+R.
cd "$(dirname "$0")" || exit 1
open "vanilla/index.html"
