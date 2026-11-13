#!/usr/bin/env bash
# The checks a Claude session runs before it pushes a bars-engine branch, now that Vercel builds no preview for a
# branch (docs/LOCAL_FIRST_TESTING.md, "Before you push"). Everything runs against this workspace's local database.
#
#   scripts/local/check.sh           lint, type-check, build-reliability verifiers, vitest
#   scripts/local/check.sh --build   the same, then the full production build (`npm run build`) on the local database
#
# A step that fails is reported and the rest still run, so one report names every failure. Exit status is non-zero
# when any step failed. Failures that already exist on main are listed in docs/LOCAL_FIRST_TESTING.md.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
DEV="bash scripts/local/dev.sh"
# tsc over this repo needs more than the default 2 GB heap.
case " ${NODE_OPTIONS:-} " in *max-old-space-size*) ;; *) export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=6144" ;; esac
mkdir -p .local-dev/check
failed=()

step() { # [--skip-2] name, command...  (with --skip-2, exit 2 means this machine cannot run it: skipped, never failed)
  local skip2=0
  if [ "$1" = "--skip-2" ]; then skip2=1; shift; fi
  local name="$1"; shift
  printf '\n── %s ──\n' "$name"
  local code=0
  "$@" >".local-dev/check/$name.log" 2>&1 || code=$?
  if [ "$code" -eq 0 ]; then echo "ok"; return; fi
  if [ "$skip2" -eq 1 ] && [ "$code" -eq 2 ]; then echo "skipped"; tail -2 ".local-dev/check/$name.log"; return; fi
  echo "FAILED (log: .local-dev/check/$name.log)"; tail -25 ".local-dev/check/$name.log"; failed+=("$name")
}

$DEV up || { echo "local database could not start"; exit 1; }
step check $DEV run -- npm run check
# The frame half of the look gate (board row bld-gate-home-2, answered a): one hearth still, then the ramp and the
# lights read off it compared to the look dataset. It can lack a browser or a copy of three, which are skips (exit 2,
# reported as skipped here) and not faults; only a real drift stops the push.
step --skip-2 look-frame $DEV run -- npm run check:look:frame -- --post
step vitest $DEV run -- npm run test:vitest
if [ "${1:-}" = "--build" ]; then
  step build $DEV run -- npm run build
fi

echo
if [ ${#failed[@]} -eq 0 ]; then echo "All local checks passed."; else echo "Failed: ${failed[*]}"; exit 1; fi
