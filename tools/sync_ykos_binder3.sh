#!/usr/bin/env bash
# YK-OS 바인더#3 원본을 POC(app/src/ykos)로 그대로 복사한다. 테스트 파일은 빼고, lib/client.ts(POC 용)는 건드리지 않는다.
# 사용: tools/sync_ykos_binder3.sh ~/dev/ykos-binder3-1117
# 받아 둔 응답(app/public/ykos-snapshot)은 따로 다시 받는다. 고친 뒤 YKOS_SOURCE 의 커밋을 커밋 메시지에 적는다.
set -euo pipefail
SRC="${1:?YK-OS 작업 폴더를 주세요}/apps/console"
DST="$(cd "$(dirname "$0")/.." && pwd)/app"
rm -rf "$DST/src/ykos/pages/visit/binder3"
mkdir -p "$DST/src/ykos/pages/visit/binder3" "$DST/src/ykos/pages/visit/utils" "$DST/src/ykos/lib/api" "$DST/public/assets/visit-binder3"
for f in "$SRC"/src/pages/visit/binder3/*; do
  case "$f" in *.test.*) ;; *) cp "$f" "$DST/src/ykos/pages/visit/binder3/" ;; esac
done
cp "$SRC/src/pages/visit/utils/visitConsultDisplay.ts" "$DST/src/ykos/pages/visit/utils/"
cp "$SRC/src/lib/api/api-visit-binder.ts" "$DST/src/ykos/lib/api/"
cp "$SRC"/public/assets/visit-binder3/* "$DST/public/assets/visit-binder3/"
git -C "$SRC" log -1 --format='YKOS_SOURCE %h %s'
