#!/usr/bin/env bash
# Launched by Cursor MCP so we get a sane PATH (GUI Cursor often lacks Homebrew).
# See docs/CURSOR_MCP_TROUBLESHOOTING.md
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$REPO_ROOT"
exec npx tsx scripts/mcp-serve-with-backend.ts
