#!/usr/bin/env bash
# The checks a Claude session runs before it pushes a bars-engine branch, now that Vercel builds no preview for a
# branch (docs/LOCAL_FIRST_TESTING.md, "Before you push"). Everything runs against this workspace's local database.
#
#   scripts/local/check.sh           lint, type-check, build-reliability verifiers, vitest, and the look check when public/between or
#                                    public/calrunia changed
#   scripts/local/check.sh --build   the same, then the full production build (`npm run build`) on the local database
#
# A step that fails is reported and the rest still run, so one report names every failure. Exit status is non-zero
# when any step failed. Failures that already exist on main are listed in docs/LOCAL_FIRST_TESTING.md.
#
# A node_modules that has drifted from package-lock.json is named before anything runs, because lint and type errors
# from that tree belong to the tree and not to the branch (2026-11-12: six errors from a plugin version the lock does
# not pin, gone after `npm ci` with no code change).
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
DEV="bash scripts/local/dev.sh"
# tsc over this repo needs more than the default 2 GB heap.
case " ${NODE_OPTIONS:-} " in *max-old-space-size*) ;; *) export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=6144" ;; esac
mkdir -p .local-dev/check
failed=()
# The lockfile is the only tree this report speaks for; a stale one produces failures the code does not have.
drift="$(node scripts/local/lock-drift.mjs 2>&1)" || true
if [ -n "$drift" ]; then
  echo "node_modules has drifted from package-lock.json:"
  printf '%s\n' "$drift" | sed 's/^/  /'
  echo "  Lint and type results may belong to this tree, not to the branch. Run npm ci, then run this again."
fi

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

# The look check (scripts/local/look-check.mjs) renders the hollow headless and holds it, and the look dataset, to the
# baseline. It runs only when the branch touches the Between's look, so other lanes' push loops stay as fast as before;
# LOOK_CHECK=1 forces it and LOOK_CHECK=0 skips it.
look_touched() {
  case "${LOOK_CHECK:-auto}" in 1) return 0 ;; 0) return 1 ;; esac
  local base; base="$(git merge-base HEAD origin/main 2>/dev/null || true)"
  { [ -n "$base" ] && git diff --name-only "$base"; git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null \
    | grep -qE '^(public/between/|public/calrunia/|scripts/local/look)'
}

$DEV up || { echo "local database could not start"; exit 1; }
step check $DEV run -- npm run check
# The frame half of the look gate (board row bld-gate-home-2, answered a): one hearth still, then the ramp and the
# lights read off it compared to the look dataset. It can lack a browser or a copy of three, which are skips (exit 2,
# reported as skipped here) and not faults; only a real drift stops the push.
step --skip-2 look-frame $DEV run -- npm run check:look:frame -- --post
step vitest $DEV run -- npm run test:vitest
if look_touched; then step look node scripts/local/look-check.mjs; else echo; echo "── look ── (skipped: no change under public/between or public/calrunia; LOOK_CHECK=1 forces it)"; fi
if [ "${1:-}" = "--build" ]; then
  step build $DEV run -- npm run build
fi

echo
if [ ${#failed[@]} -eq 0 ]; then echo "All local checks passed."; else
  echo "Failed: ${failed[*]}"
  [ -n "$drift" ] && echo "node_modules has drifted from package-lock.json; run npm ci before believing these failures."
  exit 1
fi
