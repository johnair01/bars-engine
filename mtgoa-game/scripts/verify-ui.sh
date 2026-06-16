#!/usr/bin/env bash
#
# verify-ui.sh — capture a GSD Browser visual baseline of an MTGOA screen.
#
# Builds the app, serves the production build with `vite preview`, captures a
# full-page screenshot + accessibility tree via the repo-root GSD Browser
# helper, then tears the server down. Use it to baseline UI_COVENANT surfaces
# (element=color, altitude=border, stage=density) and diff later changes.
#
# Usage:
#   npm run verify:ui                      # defaults to the Level-1 Priya trust loop
#   bash scripts/verify-ui.sh '#l1-priya' priya-baseline
#   bash scripts/verify-ui.sh '' home-baseline
#
# Requires a Chrome binary (auto-resolved by ../scripts/setup-gsd-browser.sh —
# finds system Chrome on macOS; set GSD_CHROME_PATH otherwise). In restricted
# egress environments the browser CDN must be allowlisted; see that script.
#
set -euo pipefail

ROUTE="${1:-#l1-priya}"
NAME="${2:-priya-baseline}"
PORT="${PORT:-5173}"

GAME_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${GAME_DIR}/.." && pwd)"
cd "${GAME_DIR}"

echo "▶ Building MTGOA…"
npm run build

echo "▶ Serving production build on :${PORT}…"
npx vite preview --port "${PORT}" --strictPort >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "${SERVER_PID}" 2>/dev/null || true' EXIT

echo "▶ Waiting for the server…"
for _ in $(seq 1 30); do
  curl -sf "http://localhost:${PORT}/" >/dev/null 2>&1 && break
  sleep 1
done

"${REPO_ROOT}/scripts/gsd-ui-verify.sh" \
  "http://localhost:${PORT}/${ROUTE}" "${GAME_DIR}/.gsd-artifacts" "${NAME}"
