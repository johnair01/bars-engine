#!/usr/bin/env bash
# Vercel "Ignored Build Step" command. Exit 0 = skip the build, exit 1 = build. A production deploy whose changes
# since the last deployed commit are all in the class scripts/local/skip-class.sh names (docs, spec kits, notes) has
# nothing to build. Anything unclear builds: no previous commit, a diff that fails, a path outside the class.
# Branches get no preview (docs/LOCAL_FIRST_TESTING.md): only production builds. vercel.json overrides the dashboard setting,
# so this keeps that rule here.
[ "${VERCEL_ENV:-production}" = "production" ] || exit 0
PREV="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
git cat-file -e "$PREV^{commit}" 2>/dev/null || exit 1
files="$(git diff --name-only "$PREV" HEAD 2>/dev/null)" || exit 1
printf '%s\n' "$files" | bash "$(dirname "$0")/local/skip-class.sh"
