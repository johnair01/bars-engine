# Plan: Lens Integration Refactor

Heavily phased. Each phase is independently shippable with a migration (authored
DB-free per docs/PRISMA_MIGRATE_STRATEGY.md; `db push` forbidden) + a cert quest.
Resolve the relevant § Open decisions before each phase.

## P1 — Lens + Observatory skeleton
- `prisma/schema.prisma`: `Lens` model (+ `Player.lenses`, `CustomBar.lens` later) → migration `add_lens`.
- `src/actions/lenses.ts`: `getObservatory()`, `getOrCreateTodayLens()`, `getLens(level)`, `upsertLens(...)`.
- `src/app/observatory/page.tsx` + `/observatory/[level]/page.tsx` (7 levels, independently navigable). Auth-gated.

## P2 — BAR.lensId + developmentStage
- `CustomBar`: `lensId`, `developmentStage` → migration `add_bar_lens_stage`.
- Backfill: map `seedMetabolization.maturity` → `developmentStage` (one-shot script).
- `commitTask` (TTV, already creates the BAR via H1): set `lensId = today's lens`, `developmentStage = 'Captured'`.
- Stage helpers in `src/lib/development-stage/` (canonical machine + legacy mapping).

## P3 — Garden first-class + Plant flow
- `Garden` model + `CustomBar.gardenId` + `experienceIntent` → migration.
- Actions: `chooseLens(barId, lensId)`, `plantBar(barId, gardenId, answers)` (Six Questions gate), garden queries.
- `/garden` (personal) shows Planted+ only; reconcile/redirect `/bars/garden`.

## P4 — Provenance graph + Vibeulon attribution
- `ProvenanceLink` model + `CustomBar.parentQuestId`; `Vibulon` gains
  `completedBARId/lensId/campaignId/emotionalChannel/growthSource` → migration.
- `getBarProvenance(barId)` query helper (parents/children/artifacts/vibeulons/links).
- Refit `mintVibulon` callers (esp. Tier 2 **TTVE**) to populate attribution.

## P5 — Cultivate/Harvest + future hooks
- Stage transitions on loop moves (3·2·1, grow-to-quest/daemon, charge) → `Cultivating`; completion → `Harvested` + attributed mint.
- Wire future hooks (3·2·1-on-BAR CGLA H3, TTV-on-BAR).

## Cross-cutting
- This reshapes **tap-the-vein-tier-2**: after P2/P4, re-scope TTVE (attribution),
  TTVS/TTV3 (lens-flow), TTVU (already grows quest via H1). Update that spec's rows.
- Each user-facing slice ships a `cert-*` quest; `npm run build` + `npm run check` per phase.
