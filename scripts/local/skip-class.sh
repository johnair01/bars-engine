#!/usr/bin/env bash
# Reads changed paths on stdin. Exit 0 when EVERY path is in a class that cannot change what the app builds or
# what the checks read: docs, spec kits, the backlog, notes at the repo root, Blender source art, agent skills.
# Exit 1 when any path is outside that class, or when stdin is empty (an empty list is not a reason to skip).
# Used by the pre-commit hook (.husky/pre-commit), scripts/local/check.sh and scripts/vercel-ignore.sh.
#
# Not in the class on purpose: public/ (it ships to production only through a build, so skipping would drop the
# file), content/ and council/ (code reads them), src/, prisma/, tests/, scripts/, package files.
n=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  n=$((n + 1))
  case "$f" in
    docs/*|.specify/*|specs/*|issues/*|reports/*|strand-results/*|FEATURE_REQUESTS/*|art/*|.claude/*|.agents/*) ;;
    */*) exit 1 ;;
    *.md|*.txt|*.bak) ;;
    *) exit 1 ;;
  esac
done
[ "$n" -gt 0 ]
