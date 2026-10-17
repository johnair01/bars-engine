# Plan: board-home

Spec: [spec.md](spec.md) · Ruling: Wendell, chat 2026-10-16 (`council/callsheets/board-plumbing.md`)

## Approach

1. Extract the serving logic of `src/app/board/route.ts` into `src/app/board/serve.ts`, parameterized by board
   name (page URL per board, per-board cache, `boardShim(board, returnTo)`).
2. `/board` keeps serving nonprofit; new `/board/council` route serves `board/council-board.html` from main.
3. Extend the shim: parameterize the board name it saves as and the login return path. The council page's store
   and mcp calls were diffed against the nonprofit page's before writing: identical collections, identical two
   `mcp.callTool` calls (Claude Code Remote `fire_trigger` — the page's Send is hidden by the builds — and
   Vercel `web_fetch_vercel_url` for the Tap the Vein status check, already answered by the shim).
4. Confirm the store side handles `board=council`: `src/lib/board/save.ts` `BOARDS`, the schema fixture,
   `/api/board/pull`, and `board/fetch_store.py` (reads `BOARD` env, default nonprofit).
5. Record what is left (artifact store migration, doc repointing, retirement) in the callsheet — those need a
   Claude session signed in to the owning organization, not this repo.

## Write-race discipline (2026-10-16)

Fetch before recording, push immediately after; on rejection: fetch → rebase → row-union → rebuild. Rulings and
records are append-only ledger files; `board_data.json` changes ride in the same commit as their ledger record.

## Test plan

- `npx vitest run` on: `src/app/board/__tests__/shim.test.ts` (new), `src/lib/__tests__/board-save-contract.test.ts`,
  `src/app/api/board/saves/__tests__/route.test.ts`, `src/lib/board/__tests__/dispatch.test.ts`,
  `src/lib/__tests__/vitest-include-registration.test.ts`.
- `npx tsc --noEmit` clean on `src/app/board/**`.
- Home repo: `python3 -m pytest -q tests` after the callsheet and INDEX updates.
