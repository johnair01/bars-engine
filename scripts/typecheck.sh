#!/usr/bin/env bash
# Typecheck bars-engine's TypeScript, scoped, with node and typescript found for you.
#
#   bash scripts/typecheck.sh                       the files this branch changed (fast, seconds)
#   bash scripts/typecheck.sh --full                the whole project (slow: minutes, ~2,800 files)
#   bash scripts/typecheck.sh src/lib/board/*.ts    named files
#
# Why this exists (2026-11-22): an agent reported "node crashes on the tsc entry point and typescript isn't resolvable."
# Neither was true. node was off PATH, typescript was installed, and the full-project tsc simply runs longer than an
# agent's 5-minute command timeout, leaving no output that looks like a crash. This script removes all three traps:
# it finds node, it uses the repo's own typescript, and by default it checks only what changed. See docs/typecheck.md.
set -euo pipefail

cd "$(dirname "$0")/.."   # the bars-engine root

# 1. node: PATH first, then the usual installs. Never depend on a shell profile.
NODE=""
if command -v node >/dev/null 2>&1; then
  NODE="node"
else
  for cand in /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do
    if [ -x "$cand" ]; then NODE="$cand"; break; fi
  done
fi
if [ -z "$NODE" ]; then
  echo "typecheck: no node found (tried PATH, /opt/homebrew/bin, /usr/local/bin, /usr/bin)" >&2
  exit 2
fi

# 2. typescript: the repo's own, so the version matches CI. Never a global install.
TSC="node_modules/typescript/bin/tsc"
if [ ! -f "$TSC" ]; then
  echo "typecheck: $TSC missing; run npm ci first" >&2
  exit 2
fi

mode="changed"
files=()
for arg in "$@"; do
  case "$arg" in
    --full) mode="full" ;;
    -h|--help) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) files+=("$arg") ;;
  esac
done

if [ "$mode" = "full" ]; then
  # Not every environment has the same memory. Ask the machine (scripts/heap-mb.sh) instead of hardcoding a number that
  # fails on a small box and wastes headroom on a large one. TYPECHECK_HEAP_MB overrides the guess.
  HEAP="$(bash scripts/heap-mb.sh)"
  echo "typecheck: the whole project, ${HEAP} MB heap. ~2,800 .ts files plus .next/types; this takes minutes. Be patient." >&2
  echo "typecheck: if it dies with 'JavaScript heap out of memory', lower it with TYPECHECK_HEAP_MB=2048, or use the" >&2
  echo "typecheck: scoped mode (no --full) which only checks what changed and needs far less." >&2
  exec "$NODE" "--max-old-space-size=$HEAP" "$TSC" --noEmit --skipLibCheck -p tsconfig.json
fi

# 3. Scoped: named files, else what this branch changed.
if [ ${#files[@]} -eq 0 ]; then
  base="$(git merge-base HEAD origin/main 2>/dev/null || echo HEAD~1)"
  list="$(git diff --name-only --diff-filter=ACMR "${base}...HEAD" 2>/dev/null || true)"
  if [ -z "$list" ]; then
    list="$( { git diff --name-only --diff-filter=ACMR 2>/dev/null || true; git ls-files -o --exclude-standard 2>/dev/null || true; } )"
  fi
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    case "$f" in *.ts|*.tsx|*.mts) ;; *) continue ;; esac
    # The repo's tsconfig excludes __tests__; a scoped run must not reintroduce them or it fails on test-only types.
    case "$f" in *__tests__*) continue ;; esac
    [ -f "$f" ] && files+=("$f")
  done <<EOF
$list
EOF
fi

if [ ${#files[@]} -eq 0 ]; then
  echo "typecheck: nothing changed to check. Use --full for the whole project." >&2
  exit 0
fi

echo "typecheck: ${#files[@]} file(s), strict" >&2

# `paths` cannot be passed on the command line (TS6064), so write a short config that extends the real one and narrows
# `include` to these files. It lives inside the repo so `extends`, the alias map and moduleResolution resolve exactly as
# CI sees them, and it is removed on exit.
tmp="./.typecheck-scoped.json"
{
  printf '{\n  "extends": "./tsconfig.json",\n  "compilerOptions": { "noEmit": true, "skipLibCheck": true },\n  "include": ['
  for f in "${files[@]}"; do printf '"%s",' "$f"; done
  printf '],\n  "exclude": ["node_modules"]\n}\n'
} > "$tmp"
trap 'rm -f "$tmp"' EXIT

# Not `exec`: exec replaces this shell, so the trap above would never run and the temp config would be left behind.
"$NODE" "$TSC" --noEmit --skipLibCheck -p "$tmp"
