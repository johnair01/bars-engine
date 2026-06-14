#!/usr/bin/env bash
#
# setup-gsd-browser.sh — resolve (or install) a Chrome/Chromium binary for GSD Browser.
#
# GSD Browser (@opengsd/gsd-browser) drives Chrome over the DevTools Protocol and
# does NOT bundle a browser — it needs a real Chrome/Chromium binary on disk.
# This script finds one (or installs Playwright's Chromium) and prints its path.
#
# Modes:
#   (default)   Resolve an existing browser. Print path to stdout, exit 0.
#               If none found, print guidance to stderr, exit 1.
#   --install   As above, but download Playwright Chromium if none is found.
#   --check     Never fail (exit 0 always). For SessionStart hooks: prints a
#               one-line status to stderr; does not download anything.
#
# Resolution order:
#   1. $GSD_CHROME_PATH                (explicit override — set this in CI/web)
#   2. macOS system Google Chrome
#   3. A real Linux google-chrome / chromium binary (NOT the Ubuntu snap shim)
#   4. Playwright-managed Chromium under ~/.cache/ms-playwright
#
# NETWORK NOTE: installing Chromium downloads from cdn.playwright.dev. In
# restrictive egress environments (e.g. Claude Code web with a strict network
# policy) that host must be allowlisted, OR set $GSD_CHROME_PATH to a
# pre-installed browser. Hosts confirmed BLOCKED in our sandbox (2026-06-12):
# cdn.playwright.dev, dl.google.com, storage.googleapis.com. The Ubuntu Noble
# `chromium-browser` apt package is only a snap shim and will not run headless.
#
set -euo pipefail

MODE="${1:-resolve}"

is_script() { head -c2 "$1" 2>/dev/null | grep -q '#!'; }   # detect snap/shell shims

find_chrome() {
  # 1. explicit override
  if [[ -n "${GSD_CHROME_PATH:-}" && -x "${GSD_CHROME_PATH}" ]]; then
    echo "${GSD_CHROME_PATH}"; return 0
  fi
  # 2. macOS
  local mac="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  [[ -x "$mac" ]] && { echo "$mac"; return 0; }
  local mac_canary="/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
  [[ -x "$mac_canary" ]] && { echo "$mac_canary"; return 0; }
  # 3. real Linux binaries (skip the snap shim, which is a shell script)
  local c p
  for c in google-chrome google-chrome-stable chromium chromium-browser; do
    p="$(command -v "$c" 2>/dev/null || true)"
    if [[ -n "$p" ]] && ! is_script "$p"; then echo "$p"; return 0; fi
  done
  # 4. Playwright-managed chromium
  p="$(ls -d "${HOME}/.cache/ms-playwright"/chromium-*/chrome-linux/chrome 2>/dev/null | sort | tail -1 || true)"
  [[ -n "$p" && -x "$p" ]] && { echo "$p"; return 0; }
  return 1
}

GUIDANCE="No Chrome/Chromium found for GSD Browser.
  • Local dev: install Google Chrome, or run: scripts/setup-gsd-browser.sh --install
  • Restricted egress (web/CI): allowlist cdn.playwright.dev then --install,
    or set GSD_CHROME_PATH=/path/to/chrome"

case "$MODE" in
  --check)
    if path="$(find_chrome)"; then
      echo "✓ GSD Browser: using $path" >&2
    else
      echo "ℹ GSD Browser: no Chrome yet. ${GUIDANCE}" >&2
    fi
    exit 0
    ;;
  --install)
    if path="$(find_chrome)"; then echo "$path"; exit 0; fi
    echo "No Chrome found — installing Playwright Chromium…" >&2
    npx -y playwright@latest install chromium >&2
    path="$(ls -d "${HOME}/.cache/ms-playwright"/chromium-*/chrome-linux/chrome 2>/dev/null | sort | tail -1 || true)"
    if [[ -z "$path" || ! -x "$path" ]]; then
      echo "ERROR: Chromium install failed (egress?). ${GUIDANCE}" >&2
      exit 1
    fi
    echo "$path"
    ;;
  resolve|*)
    if path="$(find_chrome)"; then echo "$path"; exit 0; fi
    echo "${GUIDANCE}" >&2
    exit 1
    ;;
esac
