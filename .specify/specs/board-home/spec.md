# Spec: board-home

## The ask

> "bars-engine becomes the one home of the Council Board." — Wendell, chat, 2026-10-16 (recorded in
> six-faces-council `council/callsheets/board-plumbing.md`, bullet `board-home`).

**Who it is for:** Wendell, the board's single owner (`BOARD_OWNER_PLAYER_ID`).
**What they feel now, and what should change:** the Council Board lives as a claude.ai artifact that must be
republished by hand after every main push, and its saved store can strand (docs/incidents.md 2026-10-15).
The board should live where the saves already go: bars-engine, behind his own sign-in.

## Purpose

Serve `board/council-board.html` from six-faces-council main at bars-engine's `/board/council`, with saves
in bars-engine's Postgres (`board=council`), so the board needs no claude.ai republish and no save waits on one.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Route shape | Separate route `/board/council` (not a `board` param on `/board`): each board keeps a stable URL, and `/board` stays the Nonprofit Board |
| Serving pattern | Copied from `src/app/board/route.ts`: fetch the built page from main with a 5-minute cache, wrap in a document shell, owner-gate via `isBoardOwner()` — shared in `src/app/board/serve.ts` |
| Shim | `boardShim(board, returnTo)` parameterizes the board name and login redirect; the council page's store calls are identical to the nonprofit page's (same collections, same two mcp calls), so no new capability is needed |
| Save contract | Already board-aware: `BOARDS` includes `'council'` in `src/lib/board/save.ts` and `fixtures/board-saves/board-save.schema.json`; `/api/board/pull` and `board/fetch_store.py` take `board` as a parameter/env |
| Artifact retirement | Not in this build: the claude.ai artifact retires only after a few clean days on the new page |

## Contracts

### GET /board/council

**Input**: owner sign-in cookie (falls back to `/login?returnTo=/board/council`).
**Output**: `board/council-board.html` from six-faces-council main, wrapped, `boardShim('council', '/board/council')` injected.

### POST/GET /api/board/saves, /api/board/pull (unchanged)

**Input**: `board=council` with any collection in `COLLECTIONS`.
**Output**: same store and pull contract as the nonprofit board, keyed by `board`.

## Reserved items

The claude.ai artifact's saved store. Moving it into Postgres (build step 4) is read with ArtifactData from the
owning organization — a Claude session signed in there does it; this spec never touches it.

## How we will know it failed

- **The cheap test, run before building:** `git grep "'council'" src/lib/board/save.ts` — the board enum already
  carries `council`, so the store side predates the route; only the page serving was missing.
- **The result that stops the work:** if the council page calls a capability the shim cannot stand in for
  (beyond the nonprofit page's two mcp calls), the shim grows it as a separate reviewed change, not silently.

## Definition of done

- [x] `/board/council` serves the council page to the owner; others are sent to `/login?returnTo=/board/council`.
- [x] The shim saves as `board=council`; the vitest suites (shim, save contract, saves route, registration guard) pass.
- [x] `board/fetch_store.py` confirmed to take `BOARD=council` (env), `/api/board/pull` confirmed board-parametric.
- [ ] Store migration from the claude.ai artifact into Postgres — Claude session with ArtifactData (Wendell's steps).
- [ ] AGENTS.md, CLAUDE.md, docs/pickup.md and the pickup routine point at the new page and store — after the
      migration, so the pickup never reads a store that is missing the artifact's saves.
- [ ] Retire the claude.ai artifact after a few clean days on the new page.
