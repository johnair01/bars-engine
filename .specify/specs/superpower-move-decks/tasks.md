# Tasks: Superpower Move Decks (Expansion Packs)

Each superpower deck = a standalone **60-card** pack (move × level × aspect), isolated from the base deck and base pool. Additive; no schema/resolver/validator changes. Drafts are inert (never pooled) until promoted.

## Phase 1 — Structure + profiles + helpers
- [ ] **T1** `superpowers/profiles.ts`: `SUPERPOWER_PROFILES` (gift, shadow, inner-character, outer-character) for all six.
- [ ] **T2** Reconcile the six `Superpower` keys with `superpower-move-extensions` (enum is source of truth).
- [ ] **T3** `superpowers/grid.ts`: `buildSuperpowerDeck(sp, cells)` enforcing exactly 60 cells (every move × operation × aspect), id `sp-<sp>-<MOVE>-<OP>-<ASPECT>`, fixed tags.
- [ ] **T4** `superpowers/pools.ts`: `poolWithSuperpowers(base, owned)` and `citeSuperpowerMove(card, loadout, subject, owned)` (pure; citation is coordinate-only, no content).

## Phase 2 — Generate + author decks (draft)
- [ ] **T5** `connector.ts` — 60 cells from the spec's worked example as the canonical pattern. `origin:'ai'`, `status:'draft'`.
- [ ] **T6** `strategist.ts`, `escape-artist.ts`, `disruptor.ts`, `storyteller.ts` — 60 each via the Generation Method (profile × level register × move purpose); each cell: name, essence, 2–4 steps, fixed tags, shadow-check.
- [ ] **T7** `alchemist.ts` — resolve the open question: ship a 60-grid or document re-skin of the substrate (do not duplicate substrate into the base pool).
- [ ] **T8** Every card passes `validateTechnique`.

## Phase 3 — Assemble, verify, isolate
- [ ] **T9** `superpowers/index.ts`: `SUPERPOWER_DECKS`, `superpowerDeck(sp)`, `publishedDeck(sp)` (status filter).
- [ ] **T10** `scripts/assemble-superpower-decks.ts`: write `public/superpower-decks/<sp>.json` (mirror `assemble-allyship-deck.ts`).
- [ ] **T11** `scripts/superpower-coverage.ts`: owned pack resolves a class card on every base card (both subjects); unowned resolves none but `citeSuperpowerMove` returns a coordinate.
- [ ] **T12** `__tests__/superpower-decks.test.ts`:
  - each deck has exactly 60 cells covering every (move × operation × aspect);
  - all valid; ids unique;
  - **base isolation**: `CANONICAL_TECHNIQUES` has zero `superpowers`-tagged cards; `allyship-deck.json` length === 120;
  - owned vs unowned resolution differs; `citeSuperpowerMove` always resolvable without content.
- [ ] **T13** `vitest run src/lib/technique-library`, `tsc --noEmit`, `eslint` — fail-fix.

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
