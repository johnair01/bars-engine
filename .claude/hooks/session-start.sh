#!/bin/bash
# SessionStart hook — bridge committed "run" skills into the path the `run` skill
# auto-discovers. The run skill greps .claude/skills/*/SKILL.md, but this repo
# gitignores .claude/ and keeps committed skills in .agents/skills/. Without this
# bridge, run-* skills (e.g. run-mtgoa-game) are invisible to that discovery.
#
# Scope: only `.agents/skills/run-*` — surfacing run-skills, NOT registering every
# reference-doc skill as invocable. Idempotent; only manages symlinks it owns and
# never clobbers a real file/dir.
set -euo pipefail

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
src="$root/.agents/skills"
dst="$root/.claude/skills"

[ -d "$src" ] || exit 0
mkdir -p "$dst"

shopt -s nullglob
for d in "$src"/run-*/; do
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

exit 0
