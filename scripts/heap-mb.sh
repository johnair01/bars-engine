#!/usr/bin/env bash
# How much memory this machine can give the typecheck, in MB, on stdout.
#
#   bash scripts/heap-mb.sh          # e.g. 3072
#
# Why: not every environment has the same memory. A hardcoded --max-old-space-size fails on a small box (node dies with
# "JavaScript heap out of memory") and wastes headroom on a large one. This asks the machine, then takes a share it can
# actually afford: the smaller of half the physical RAM and what is free right now, capped at what the run needs and
# floored at what it can start with. Override with TYPECHECK_HEAP_MB when you know better than the guess.
#
# The full-project run needed ~2 GB and died there; with 6 GB it finished. So the useful range is roughly 2-6 GB, and a
# machine that cannot spare 2 GB should be told to use the scoped mode rather than left to fail.
set -euo pipefail

MEM_MB=""

if [ -n "${TYPECHECK_HEAP_MB:-}" ]; then
  echo "$TYPECHECK_HEAP_MB"
  exit 0
fi

os="$(uname -s)"
case "$os" in
  Darwin)
    if command -v sysctl >/dev/null 2>&1; then
      bytes="$(sysctl -n hw.memsize 2>/dev/null || echo 0)"
      [ "$bytes" -gt 0 ] 2>/dev/null && MEM_MB=$((bytes / 1048576))
    fi
    ;;
  Linux)
    if [ -r /proc/meminfo ]; then
      kb="$(awk '/^MemTotal:/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
      [ -n "$kb" ] && [ "$kb" -gt 0 ] 2>/dev/null && MEM_MB=$((kb / 1024))
    fi
    ;;
esac

# Free right now, so a busy machine does not get a budget it cannot honour. Best effort; absence is not fatal.
FREE_MB=""
if command -v vm_stat >/dev/null 2>&1; then
  FREE_MB="$(vm_stat 2>/dev/null | awk '/Pages free|Pages inactive/ {gsub(/\./,"",$3); s+=$3*4096} END {printf "%d", s/1048576}' 2>/dev/null || true)"
elif [ -r /proc/meminfo ]; then
  FREE_MB="$(awk '/^MemAvailable:/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || true)"
fi

# Nothing detectable: a conservative middle. Better a slow run than a false refusal.
if [ -z "$MEM_MB" ] || [ "$MEM_MB" -le 0 ] 2>/dev/null; then
  echo 3072
  exit 0
fi

# Half the physical RAM: leaves the machine usable while the compiler runs.
HALF=$((MEM_MB / 2))

# Do not claim more than is free: if more than a quarter of the machine is available, use that quarter, else fall back to
# half the RAM (modern kernels make "free" look tiny because they cache aggressively).
BUDGET="$HALF"
if [ -n "$FREE_MB" ] && [ "$FREE_MB" -gt $((MEM_MB / 4)) ] 2>/dev/null; then
  BUDGET="$FREE_MB"
fi

CAP=6144   # what the full run actually needed to finish
FLOOR=1536 # below this, node may not even start the compiler

[ "$BUDGET" -gt "$CAP" ] && BUDGET="$CAP"
[ "$BUDGET" -lt "$FLOOR" ] && BUDGET="$FLOOR"

echo "$BUDGET"
