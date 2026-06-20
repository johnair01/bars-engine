#!/usr/bin/env bash
#
# check-superpower-branch.sh — pull the Mobility Quest superpower branch and run
# lint + type-check + the superpower unit tests. Mac/Linux terminal.
#
#   ./scripts/check-superpower-branch.sh
#   REPO_DIR=/path/to/bars-engine ./scripts/check-superpower-branch.sh
#
set -euo pipefail

BRANCH="claude/determined-ramanujan-rfq6a4"
# Defaults to the repo this script lives in; override with REPO_DIR=…
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

cd "$REPO_DIR"
echo "▶ Repo: $(pwd)"

# Stash any local changes so the checkout is clean (restored at the end if present)
STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "▶ Stashing local changes…"
  git stash push -u -m "pre-check-$(date +%s)" && STASHED=1
fi

echo "▶ Fetching $BRANCH…"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "▶ Installing deps (npm ci, falling back to npm install)…"
npm ci || npm install

echo "▶ Running lint + type-check (npm run check)…"
npm run check

echo "▶ Running the superpower unit tests (tsx)…"
for t in \
  src/lib/superpowers/quiz/__tests__/score.test.ts \
  src/lib/superpowers/__tests__/translate.test.ts \
  src/lib/superpowers/__tests__/routing.test.ts; do
  echo "  — $t"
  npx tsx "$t"
done

if [ "$STASHED" -eq 1 ]; then
  echo "▶ Note: your earlier local changes are in 'git stash' (run: git stash pop)"
fi

echo "✅ Done."
