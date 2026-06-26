# Tasks: Lens Integration Refactor

Phase order P1→P5. Resolve the spec's § Open decisions for a phase before building it.
Each phase: migration committed with schema, `npm run build` + `npm run check`, cert quest.

## P1 — Lens + Observatory  (LENS1)
- [ ] P1.1 `Lens` model + migration `add_lens`; regenerate client.
- [ ] P1.2 `src/actions/lenses.ts`: `getObservatory`, `getOrCreateTodayLens`, `getLens(level)`, `upsertLens`.
- [ ] P1.3 `/observatory` + `/observatory/[level]` — 7 independently navigable levels (auth-gated).
- [ ] P1.4 Verification quest `cert-observatory-v1`.

## P2 — BAR.lensId + developmentStage  (LENS2)
- [ ] P2.1 `CustomBar.lensId` + `developmentStage` + migration; regenerate.
- [ ] P2.2 `src/lib/development-stage/` canonical machine + legacy `maturity`→`developmentStage` mapping.
- [ ] P2.3 Backfill script (maturity → developmentStage); idempotent.
- [ ] P2.4 TTV `commitTask` sets `lensId = today's lens` + `developmentStage='Captured'`.
- [ ] P2.5 Verification quest `cert-bar-lens-stage-v1`.

## P3 — Garden + Plant flow  (LENS3)
- [ ] P3.1 `Garden` model + `CustomBar.gardenId` + `experienceIntent` + migration.
- [ ] P3.2 Actions: `chooseLens`, `plantBar` (Six Questions gate), garden queries.
- [ ] P3.3 `/garden` (personal) Planted+ only; reconcile `/bars/garden`.
- [ ] P3.4 Verification quest `cert-garden-plant-v1`.

## P4 — Provenance + Vibeulon attribution  (LENS4)
- [ ] P4.1 `ProvenanceLink` + `CustomBar.parentQuestId` + `Vibulon` attribution fields + migration.
- [ ] P4.2 `getBarProvenance(barId)` query helper + unit test over a seeded graph.
- [ ] P4.3 Refit `mintVibulon` callers (incl. Tier 2 TTVE) to populate attribution.
- [ ] P4.4 Verification quest `cert-provenance-graph-v1`.

## P5 — Cultivate/Harvest + hooks  (LENS5)
- [ ] P5.1 Stage transitions on loop moves (3·2·1, grow, charge) → `Cultivating`.
- [ ] P5.2 Harvest → `Harvested` + attributed mint.
- [ ] P5.3 Wire 3·2·1-on-BAR (CGLA H3) + TTV-on-BAR hooks.
- [ ] P5.4 Verification quest `cert-cultivate-harvest-v1`.

## Cross-cutting
- [ ] X.1 After P2/P4, re-scope `tap-the-vein-tier-2` (TTVE attribution; TTVS/TTV3 lens-flow) + update BACKLOG rows.
