# Tasks: Superpower Move Decks

Additive content on the existing `technique-library`. No schema/resolver/validator changes. Generated moves land as `status: 'draft'` (inert) until the author promotes them.

## Phase 1 — Structure + profiles
- [ ] **T1** `src/lib/technique-library/superpowers/profiles.ts`: `SuperpowerProfile` interface + `SUPERPOWER_PROFILES` for all six (gift, shadow, inner/outer signature names) per spec table.
- [ ] **T2** Reconcile the six `Superpower` keys with `superpower-move-extensions` (enum is source of truth); note any rename.
- [ ] **T3** Structural helper/convention + a test fixture asserting the 13-slot shape (5 basic moves one-per-BasicMove; 6 altitude one-per-Operation; 2 signatures inner+outer).

## Phase 2 — Generate + author decks (draft)
- [ ] **T4** `connector.ts` — 13 moves from the spec's worked example (the canonical pattern). `source.origin:'ai'`, `status:'draft'`.
- [ ] **T5** `strategist.ts`, `escape-artist.ts`, `disruptor.ts`, `storyteller.ts` — 13 each, via the Generation Method (profile + operation chapters + deck grammar). Each move: imperative name, one-line essence, 2–4 steps, correct tags, a shadow-check line.
- [ ] **T6** `alchemist.ts` — the 2 signatures + any altitude deltas not covered by the substrate (document why the rest is inherited).
- [ ] **T7** Every generated move passes `validateTechnique` (cover via the deck test, it.each).

## Phase 3 — Aggregate, cover, verify
- [ ] **T8** `superpowers/index.ts`: `SUPERPOWER_TECHNIQUES` (all) + a `publishedSuperpowerMoves()` selector (`status==='published'`).
- [ ] **T9** `canonical.ts`: merge only `published` superpower moves into `CANONICAL_TECHNIQUES`.
- [ ] **T10** `scripts/superpower-coverage.ts`: for each superpower, run a loadout with that superpower in both slots over the 120 cards (both subjects); report cards-with-≥1 class move; expect 120/120 once published.
- [ ] **T11** `__tests__/superpower-decks.test.ts`: 13-slot shape per deck; tags correct; all valid; **draft decks excluded** from the published pool.
- [ ] **T12** `vitest run src/lib/technique-library`, `tsc --noEmit`, `eslint` — fail-fix.

## Phase 4 — Promotion (author-gated)
- [ ] **T13** Author reviews each deck and flips `status` → `published` (per deck or per move). Only then do they enter play.
- [ ] **T14** Re-run coverage; confirm 120/120 per published superpower; update strand notes.

## Housekeeping
- [ ] **T15** `BACKLOG.md` entry + `npm run backlog:seed` (DB).
- [ ] **T16** When a loadout-picker / draw UI is specced, add the required Verification Quest (Twine + seed).

## Verification (every phase)
- `vitest run src/lib/technique-library`; `tsc --noEmit`; `eslint` clean.
- `npm run check` + `npm run build` before merge to main (needs DB for `db:generate`).
