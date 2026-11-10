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
step vitest $DEV run -- npm run test:vitest
if look_touched; then step look node scripts/local/look-check.mjs; else echo; echo "── look ── (skipped: no change under public/between or public/calrunia; LOOK_CHECK=1 forces it)"; fi
if [ "${1:-}" = "--build" ]; then
  step build $DEV run -- npm run build
fi

echo
if [ ${#failed[@]} -eq 0 ]; then echo "All local checks passed."; else echo "Failed: ${failed[*]}"; exit 1; fi
