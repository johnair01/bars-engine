#!/usr/bin/env bash
# Smoke-test the Books Context API (same checks you need before wiring ChatGPT).
# Usage:
#   export BASE=https://your-deployment.vercel.app
#   export BOOKS_CONTEXT_API_KEY=your-secret
#   # optional: export BOOK_ID=clx...  (first book from list, for deeper checks)
#   bash scripts/smoke-books-context-api.sh
#
# Automates: HTTP checks + pretty errors. Does NOT set Vercel env or create Custom GPTs.

set -euo pipefail

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -n "${BASE:-}" ]] || die "Set BASE to your deployment root, e.g. export BASE=https://my-app.vercel.app"
[[ -n "${BOOKS_CONTEXT_API_KEY:-}" ]] || die "Set BOOKS_CONTEXT_API_KEY (same value as in Vercel)"

BASE="${BASE%/}"
AUTH_HEADER="Authorization: Bearer ${BOOKS_CONTEXT_API_KEY}"

echo "== 1) GET /api/admin/books?compact=1 =="
code=$(curl -sS -o /tmp/bca-books.json -w "%{http_code}" -H "$AUTH_HEADER" "$BASE/api/admin/books?compact=1")
[[ "$code" == "200" ]] || die "Expected HTTP 200, got $code. Body: $(cat /tmp/bca-books.json)"
echo "OK ($code) — sample:"
head -c 400 /tmp/bca-books.json
echo ""
echo ""

if [[ -n "${BOOK_ID:-}" ]]; then
  echo "== 2) GET /api/admin/books/$BOOK_ID (metadata) =="
  code=$(curl -sS -o /tmp/bca-book.json -w "%{http_code}" -H "$AUTH_HEADER" "$BASE/api/admin/books/$BOOK_ID")
  [[ "$code" == "200" ]] || die "Expected HTTP 200, got $code. Body: $(cat /tmp/bca-book.json)"
  echo "OK ($code)"
  echo ""

  echo "== 3) GET /api/admin/books/$BOOK_ID/quests?compact=1 =="
  code=$(curl -sS -o /tmp/bca-quests.json -w "%{http_code}" -H "$AUTH_HEADER" "$BASE/api/admin/books/$BOOK_ID/quests?compact=1")
  [[ "$code" == "200" ]] || die "Expected HTTP 200, got $code. Body: $(cat /tmp/bca-quests.json)"
  echo "OK ($code) — sample:"
  head -c 400 /tmp/bca-quests.json
  echo ""
else
  echo "== 2–3) Skipped (no BOOK_ID) =="
  echo "To test single book + quests, pick an id from the JSON above and run:"
  echo "  export BOOK_ID=<paste-id-here>"
  echo "  bash scripts/smoke-books-context-api.sh"
fi

echo ""
echo "All automated checks passed."
