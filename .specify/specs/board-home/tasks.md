# Tasks: board-home

Ruling: Wendell, chat 2026-10-16. Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

## Before the build

- [x] [claude] Cheap test recorded in spec.md: the board enum already carries `council` (save.ts + schema fixture).

## Steps only Wendell can take

- [ ] [wendell] **Do:** Save the claude.ai artifact's store with ArtifactData from the owning organization, so the
      migration reads every saved answer.
  **Where:** claude.ai, signed in to the organization that owns artifact DxyShVS8tmvJym4HAsgnho
  **Enter:** ArtifactData read of the board's store
  **Check:** the store's collections come back non-empty
  **Device:** computer · **Safe to stop after:** yes
- [ ] [wendell] **Do:** After a few clean days on /board/council, retire the claude.ai artifact.
  **Where:** claude.ai artifact page
  **Enter:** delete/unpublish the artifact
  **Check:** the board loads only from bars-engine
  **Device:** computer · **Safe to stop after:** yes

## Build

- [x] [claude] Extract serving logic into `src/app/board/serve.ts`; `/board` and `/board/council` route through it.
- [x] [claude] Parameterize the shim (`boardShim(board, returnTo)`); verify the council page's store and mcp calls
      against the nonprofit page's first (identical).
- [x] [claude] Confirm `/api/board/pull` and `board/fetch_store.py` handle `board=council` (no change needed; recorded
      in spec.md Contracts).
- [x] [claude] Register the new vitest suite in `vitest.config.ts`; all board suites pass; `tsc --noEmit` clean.

## Verify and ship

- [x] [claude] Definition of done in spec.md, checked (route, shim, store side).
- [ ] [claude] Doc repointing (AGENTS.md, CLAUDE.md, docs/pickup.md, pickup routine) — blocked until the artifact
      store migration lands; recorded in the callsheet.
- [ ] [claude] Ledger record written; this file ticked.
