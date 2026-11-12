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

step() { # name, command...
  local name="$1"; shift
  printf '\n── %s ──\n' "$name"
  if "$@" >".local-dev/check/$name.log" 2>&1; then echo "ok"; else echo "FAILED (log: .local-dev/check/$name.log)"; tail -25 ".local-dev/check/$name.log"; failed+=("$name"); fi
}

$DEV up || { echo "local database could not start"; exit 1; }
step check $DEV run -- npm run check
# The frame half of the look gate (board row bld-gate-home-2, answered a): one hearth still, then the ramp and the
# lights read off it compared to the look dataset. It needs Playwright chromium; a machine without one says so and
# the rest of the checks still run (a check that cannot run skips, and only a fault stops the push).
if node "$ROOT/scripts/check-look-frame.mjs" --available >/dev/null 2>&1; then
  step look-frame $DEV run -- npm run check:look:frame
else
  printf '\n\u2500\u2500 look-frame \u2500\u2500\nskipped: no Playwright chromium on this machine (npm i -D playwright && npx playwright install chromium)\n'
fi
step vitest $DEV run -- npm run test:vitest
if [ "${1:-}" = "--build" ]; then
  step build $DEV run -- npm run build
fi

echo
if [ ${#failed[@]} -eq 0 ]; then echo "All local checks passed."; else echo "Failed: ${failed[*]}"; exit 1; fi
