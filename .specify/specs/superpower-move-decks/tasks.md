# Tasks: Superpower Move Decks (Expansion Packs)

Each superpower deck = a standalone **60-card** pack (move × level × aspect), isolated from the base deck and base pool. Additive; no schema/resolver/validator changes. Drafts are inert (never pooled) until promoted.

> **Status (2026-06-20):** Phases 1–3 implemented on `claude/admiring-shannon-wlddtw`. All six decks generated as full 60-grids (incl. Alchemist, per direction) = 360 cards, assembled to `public/superpower-decks/<sp>.json`. 79 tests pass (60-cell completeness, base isolation, ownership-gated resolution, citation); `tsc` clean; eslint clean. Coverage = **120/120 for every superpower**. Cards are `status:'draft'`/`origin:'ai'` — inert until promoted (Phase 4). Implemented as a deterministic generator (`grid.ts`) over per-superpower vocabulary (`profiles.ts`, the curation surface) rather than 360 hand-written objects; refine by editing rows or overriding cells.

## Phase 1 — Structure + profiles + helpers
- [x] **T1** `superpowers/profiles.ts`: `SUPERPOWER_PROFILES` (gift, shadow, inner-character, outer-character) for all six.
- [x] **T2** Reconcile the six `Superpower` keys with `superpower-move-extensions` (enum is source of truth).
- [x] **T3** `superpowers/grid.ts`: `buildSuperpowerDeck(sp, cells)` enforcing exactly 60 cells (every move × operation × aspect), id `sp-<sp>-<MOVE>-<OP>-<ASPECT>`, fixed tags.
- [x] **T4** `superpowers/pools.ts`: `poolWithSuperpowers(base, owned)` and `citeSuperpowerMove(card, loadout, subject, owned)` (pure; citation is coordinate-only, no content).

## Phase 2 — Generate + author decks (draft)
- [x] **T5** `connector.ts` — 60 cells from the spec's worked example as the canonical pattern. `origin:'ai'`, `status:'draft'`.
- [x] **T6** `strategist.ts`, `escape-artist.ts`, `disruptor.ts`, `storyteller.ts` — 60 each via the Generation Method (profile × level register × move purpose); each cell: name, essence, 2–4 steps, fixed tags, shadow-check.
- [x] **T7** `alchemist.ts` — resolve the open question: ship a 60-grid or document re-skin of the substrate (do not duplicate substrate into the base pool).
- [x] **T8** Every card passes `validateTechnique`.

## Phase 3 — Assemble, verify, isolate
- [x] **T9** `superpowers/index.ts`: `SUPERPOWER_DECKS`, `superpowerDeck(sp)`, `publishedDeck(sp)` (status filter).
- [x] **T10** `scripts/assemble-superpower-decks.ts`: write `public/superpower-decks/<sp>.json` (mirror `assemble-allyship-deck.ts`).
- [x] **T11** `scripts/superpower-coverage.ts`: owned pack resolves a class card on every base card (both subjects); unowned resolves none but `citeSuperpowerMove` returns a coordinate.
- [x] **T12** `__tests__/superpower-decks.test.ts`:
  - each deck has exactly 60 cells covering every (move × operation × aspect);
  - all valid; ids unique;
  - **base isolation**: `CANONICAL_TECHNIQUES` has zero `superpowers`-tagged cards; `allyship-deck.json` length === 120;
  - owned vs unowned resolution differs; `citeSuperpowerMove` always resolvable without content.
- [x] **T13** `vitest run src/lib/technique-library`, `tsc --noEmit`, `eslint` — fail-fix.

## Phase 4 — Promotion + product wiring (later)
- [ ] **T14** Author promotes `draft → published` per deck.
- [ ] **T15** Entitlement source for `owned: Superpower[]` — defer to product layer; this feature only consumes it.

## Housekeeping
- [ ] **T16** `BACKLOG.md` entry + `npm run backlog:seed` (DB).
- [ ] **T17** When a pack-aware draw UI or store/entitlement surface is specced, add the required Verification Quest (Twine + seed).

## Verification (every phase)
- `vitest run src/lib/technique-library`; `tsc --noEmit`; `eslint` clean.
- Base deck stays 120; base pool free of superpower cards.
- `npm run check` + `npm run build` before merge (needs DB for `db:generate`).
