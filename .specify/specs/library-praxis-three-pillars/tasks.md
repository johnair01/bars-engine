# Tasks: Library Praxis — Three Pillars

## Phase A — Metadata

- [x] **T.A1** Add `metadata-shape.md` documenting JSON fields: `praxisPillar`, `designIntentSummary`, optional `strandNote`, `relatedWikiSlugs`.
- [x] **T.A2** Add TypeScript type + parse helpers for book praxis metadata (`src/lib/books/praxisMetadata.ts`).
- [x] **T.A3** Admin UI: display pillar badge + intent on book row or detail; form or inline edit to set pillar + `designIntentSummary` (server action `updateBookPraxisMetadata`).
- [x] **T.A4** Tag the three books: *Antifragile* → `antifragile`; *Wealth of Networks* → `commons_networks`; *Complete Focusing Instructions* → `felt_sense` (via `scripts/tag-praxis-books.ts`).

## Phase B — Documentation

- [x] **T.B1** Author `docs/ANTIFRAGILE_DEV_PRAXIS.md` (fail-fix, cert feedback, roadblock as fuel).
- [x] **T.B2** Author `docs/COMMONS_NETWORKS_PRAXIS.md` (Benkler lens → BAR/campaign/thread; diplomat strand note).
- [x] **T.B3** Author `docs/FELT_SENSE_321_PRAXIS.md` (trainable skill; 321 as practice; non-clinical; link official Focusing resources if desired).

## Phase C — Player-facing hook

- [x] **T.C1** Choose touchpoint → decided: all three touchpoints implemented in PHOS Phase 3 (321, charge, quest unpack). See `docs/FELT_SENSE_321_PRAXIS.md` and PHOS tasks.
- [x] **T.C2** Felt-sense copy added to `/capture`, `/shadow/321`, and `/quest/[id]/unpack` as part of PHOS Phase 3.

## Verification

- [x] **T.V1** `npm run check` passes (0 errors). Build verified.
- [x] **T.V2** Three books tagged via script; docs authored and cross-referenced with ANALYSIS.md.
