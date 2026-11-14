#!/usr/bin/env bash
# Contest runner — validate one contender's five scripts against the QA gate.
# Usage: bash runner.sh <contender_dir>
# Each contender dir holds bell.py, trigram_floor.py, guandao.py, hearth_jars.py, formation.py
set -uo pipefail
DIR="${1:?contender dir}"
HERE="$(cd "$(dirname "$0")" && pwd)"
PASS=0; FAIL=0
for f in bell.py trigram_floor.py guandao.py hearth_jars.py formation.py; do
  if [ ! -f "$DIR/$f" ]; then echo "MISSING $f — forfeit"; FAIL=$((FAIL+1)); continue; fi
  if OUT="$(python3 "$HERE/qa.py" "$DIR/$f" "$DIR")"; then
    echo "PASS $f"; PASS=$((PASS+1)); echo "$OUT"
  else
    echo "FAIL $f"; FAIL=$((FAIL+1)); echo "$OUT"
  fi
done
echo "RESULT $DIR pass=$PASS fail=$FAIL"
[ "$FAIL" -eq 0 ]