#!/usr/bin/env bash
# The checks a Claude session runs before it pushes a bars-engine branch, now that Vercel builds no preview for a
# branch (docs/LOCAL_FIRST_TESTING.md, "Before you push"). Everything runs against this workspace's local database.
#
#   scripts/local/check.sh           lint, type-check, build-reliability verifiers, vitest, and the look check when public/between or
#                                    public/calrunia changed
#                                    copy-scan (fails the run on any hit; see below)
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
# Cloud containers set NODE_OPTIONS to include --use-openssl-ca, which next build's worker processes reject
# ("Initiated Worker with invalid NODE_OPTIONS env variable"), so the build step fails in 23s with no code fault.
# The build step runs without that flag (measured 2026-11-25: build passes, 157s).
BUILD_NODE_OPTIONS="$(printf '%s' "${NODE_OPTIONS:-}" | sed -E 's/(^| )--use-openssl-ca( |$)/ /g')"
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
# The first four parts of `npm run check`, in order, then lint, tsc and vitest at the same time (they are
# independent; measured 2026-11-25 on 4 cores: 158s together against 194s one after another). Same commands, same
# gate; eslint keeps a cache in .local-dev (113s cold, 1s with nothing changed) and tsc is incremental through
# tsconfig.tsbuildinfo (66s cold, 8s warm), so a workspace that keeps its files gets faster each run.
step check-prep $DEV run -- bash -c 'npm run db:generate && npm run verify:build-reliability && npm run check:look && npm run check:registry'
pstep() { # name, command...: start in the background; the loop below reports it
  local name="$1"; shift
  ( "$@" >".local-dev/check/$name.log" 2>&1; echo $? >".local-dev/check/$name.code" ) &
  pnames+=("$name")
}
pnames=()
rm -f .local-dev/check/lint.code .local-dev/check/tsc.code .local-dev/check/vitest.code
pstep lint $DEV run -- npx eslint --cache --cache-location .local-dev/eslintcache
pstep tsc $DEV run -- npx tsc --noEmit
pstep vitest $DEV run -- npm run test:vitest
wait
for n in "${pnames[@]}"; do
  printf '\n── %s ──\n' "$n"
  if [ "$(cat ".local-dev/check/$n.code" 2>/dev/null)" = "0" ]; then echo "ok"; else
    echo "FAILED (log: .local-dev/check/$n.log)"; tail -25 ".local-dev/check/$n.log"; failed+=("$n")
  fi
done
# The frame half of the look gate (board row bld-gate-home-2, answered a): one hearth still, then the ramp and the
# lights read off it compared to the look dataset. It can lack a browser or a copy of three, which are skips (exit 2,
# reported as skipped here) and not faults; only a real drift stops the push.
step --skip-2 look-frame $DEV run -- npm run check:look:frame -- --post
# The editorial check for player-facing copy (scripts/copy-scan.py): lines with no concrete referent, trailing and,
# and-joins, and-chains, negation pairs, over every file in scripts/copy-scan.files, whole file. It FAILS the run on any
# hit (Wendell, 2026-11-17, board row copy-scan-gate-1: "C, Fail it, and rewrite the 19 older lines too"). A hit is
# rewritten, or, only when the words are his own or a string the reader owns, listed in scripts/copy-scan.allow with why.
echo; echo "── copy-scan ──"
python3 scripts/copy-scan.py --strict || { echo "FAILED: rewrite the line (.claude/skills/no-ai-slop/concrete-referent.md)"; failed+=("copy-scan"); }
# The lexicon gate (scripts/voice_gate.py, spec voice-desk): a watched word on a screen that never showed it, a banned or
# struck word, and a line Wendell already rewrote all fail. A new coinage only warns. Known debt: scripts/voice-gate.baseline.
echo; echo "── copy-scan --lexicon ──"
python3 scripts/copy-scan.py --lexicon || { echo "FAILED: say what the word names on that screen first, or use a plain word (python3 scripts/voice-packet.py <screen>)"; failed+=("copy-scan-lexicon"); }
python3 -m unittest tests/test_voice_gate.py || failed+=("voice-gate-tests")
if look_touched; then step look node scripts/local/look-check.mjs; else echo; echo "── look ── (skipped: no change under public/between or public/calrunia; LOOK_CHECK=1 forces it)"; fi
if [ "${1:-}" = "--build" ]; then
  step build env NODE_OPTIONS="$BUILD_NODE_OPTIONS" $DEV run -- npm run build
fi

echo
if [ ${#failed[@]} -eq 0 ]; then echo "All local checks passed."; else
  echo "Failed: ${failed[*]}"
  [ -n "$drift" ] && echo "node_modules has drifted from package-lock.json; run npm ci before believing these failures."
  exit 1
fi
