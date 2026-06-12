#!/usr/bin/env bash
#
# gsd-ui-verify.sh — capture a GSD Browser visual baseline for a running URL.
#
# Produces, for a given page: a full-page PNG screenshot and an accessibility
# tree (JSON). Use it to baseline UI_COVENANT surfaces (element=color,
# altitude=border, stage=density) and to diff against on later changes.
#
# Usage:
#   scripts/gsd-ui-verify.sh <url> [out-dir] [name]
#
# Examples:
#   # MTGOA Level-1 Priya trust loop (start the app first: cd mtgoa-game && npm run dev)
#   scripts/gsd-ui-verify.sh http://localhost:5173/#l1-priya .gsd-artifacts priya-baseline
#
#   # Next.js page
#   scripts/gsd-ui-verify.sh http://localhost:3000/market .gsd-artifacts market-baseline
#
# Requires a Chrome binary (resolved by setup-gsd-browser.sh). Override with
# GSD_CHROME_PATH. The browser is found automatically on macOS (system Chrome).
#
set -euo pipefail

URL="${1:?usage: gsd-ui-verify.sh <url> [out-dir] [name]}"
OUT="${2:-.gsd-artifacts}"
NAME="${3:-baseline}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GSD_VERSION="0.1.29"
GSD=(npx -y "@opengsd/gsd-browser@${GSD_VERSION}")

CHROME="$("${SCRIPT_DIR}/setup-gsd-browser.sh" resolve)"
echo "Browser : ${CHROME}"
echo "Target  : ${URL}"
mkdir -p "${OUT}"

# The daemon persists between commands, so navigate then capture in sequence.
"${GSD[@]}" navigate "${URL}" --browser-path "${CHROME}"
"${GSD[@]}" screenshot --browser-path "${CHROME}" --format png --full-page \
  --output "${OUT}/${NAME}.png"
"${GSD[@]}" accessibility-tree --browser-path "${CHROME}" --json \
  > "${OUT}/${NAME}.a11y.json"

echo "Wrote   : ${OUT}/${NAME}.png"
echo "Wrote   : ${OUT}/${NAME}.a11y.json"
echo "Re-run after a change and diff the PNG / a11y JSON to verify the surface."
