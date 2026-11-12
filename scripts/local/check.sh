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

# A step whose exit 2 means "this machine cannot run me": skipped, with the reason the check printed, never a failure.
step_maybe_skip() { # name, command...
  local name="$1"; shift
  printf '\n── %s ──\n' "$name"
  local code=0
  "$@" >".local-dev/check/$name.log" 2>&1 || code=$?
  if [ "$code" -eq 0 ]; then echo "ok"; return; fi
  if [ "$code" -eq 2 ]; then echo "skipped"; tail -2 ".local-dev/check/$name.log"; return; fi
  echo "FAILED (log: .local-dev/check/$name.log)"; tail -25 ".local-dev/check/$name.log"; failed+=("$name")
}

$DEV up || { echo "local database could not start"; exit 1; }
step check $DEV run -- npm run check
# The frame half of the look gate (board row bld-gate-home-2, answered a): one hearth still, then the ramp and the
# lights read off it compared to the look dataset. It can lack a browser or a copy of three, which are skips (exit 2,
# reported as skipped here) and not faults; only a real drift stops the push.
step_maybe_skip look-frame $DEV run -- npm run check:look:frame
step vitest $DEV run -- npm run test:vitest
if [ "${1:-}" = "--build" ]; then
  step build $DEV run -- npm run build
fi

echo
if [ ${#failed[@]} -eq 0 ]; then echo "All local checks passed."; else echo "Failed: ${failed[*]}"; exit 1; fi
