#!/bin/bash
# SessionStart hook — mirror every committed skill into the path Claude Code
# discovers skills from. Committed skills live in .agents/skills/, but this repo
# gitignores .claude/, so none of them are visible to skill discovery. This hook
# symlinks each .agents/skills/<name> into .claude/skills/<name>.
#
# Full mirror: ALL skills (run-* and the reference-doc skills alike). Idempotent;
# only manages symlinks it owns, never clobbers a real file/dir, and prunes its
# own stale symlinks whose source skill has been removed.
set -euo pipefail

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
src="$root/.agents/skills"
dst="$root/.claude/skills"

[ -d "$src" ] || exit 0
mkdir -p "$dst"

shopt -s nullglob

# Mirror every skill dir.
for d in "$src"/*/; do
  name="$(basename "$d")"
  link="$dst/$name"
  if [ -L "$link" ]; then
    ln -sfn "${d%/}" "$link"      # refresh an existing symlink
  elif [ -e "$link" ]; then
    :                             # a real file/dir is there — leave it alone
  else
    ln -s "${d%/}" "$link"
  fi
done

# Prune symlinks we own that point into .agents/skills but whose source is gone.
for link in "$dst"/*; do
  [ -L "$link" ] || continue
  target="$(readlink "$link")"
  case "$target" in
    "$src"/*) [ -e "$link" ] || rm -f "$link" ;;
  esac
done

exit 0
