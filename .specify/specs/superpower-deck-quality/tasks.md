# Tasks: Superpower Deck Quality

> **Status (2026-06-20):** Phases 1 & 3 implemented on `claude/admiring-shannon-wlddtw`. Additive `Technique` anatomy fields + `quality.ts` (RUBRIC + `assessQuality`) + car-campaign harness (`campaigns.ts`, `superpowers/quality-harness.ts`, `scripts/superpower-quality-report.ts`). 88 tests pass; tsc + eslint clean. **Baseline → after hero cells (loadout escape_artist/connector): 12 cards lifted to L4; campaign-ready cells 0 → 24/120; below-L3 60 → 48.** 89 tests pass (incl. publish gate: no published card < L3). Hero cells authored as matched escape_artist-inner + connector-outer pairs at 6 shared (move×face) coords via `superpowers/overrides/`. Remaining lift = T8 (profile floor to L2) + more hero cells.

Measurement first, then content. Additive schema; base deck/resolver/validator unchanged. Gap analysis: [gap-analysis.md](gap-analysis.md).

## Phase 1 — Rubric + assessment
- [x] **T1** `types.ts`: add optional `primaryQuestion`, `campaignQuestion`, `forbiddenMoves`, `remediation`, `tell {working, performed}`, `example`, `qualityLevel` to `Technique`.
- [x] **T2** `quality.ts`: `RUBRIC` (the 12 criteria with id/name/group/source) + deterministic `assessQuality(t) → { level, met[], unmet[] }`. Mark heuristic criteria (#1, #2, #12).
- [x] **T3** `__tests__/quality.test.ts`: a generated stub scores L0/L1; a fully-anatomized fixture scores L4; level mapping correct.

## Phase 2 — Gap analysis
- [x] **T4** `gap-analysis.md` — current distribution, schema + content gaps, worked $8,500 examples (current vs target) across domains/faces/moves, prioritized remediation. *(done in this spec)*

## Phase 3 — Campaign harness
- [x] **T5** `__tests__/fixtures/campaign-car.ts`: `CAR_CAMPAIGN` (goal + per-domain framing).
- [x] **T6** `scripts/superpower-quality-report.ts`: for a loadout, walk every (move × face × domain) base cell, surface the superpower card, run `assessQuality`, print a table by domain/face/move + a punch-list of cells `< L3`.
- [x] **T7** `__tests__/superpower-quality.test.ts`: harness runs deterministically; report shape stable.

## Phase 4 — Close the gap (content)
- [ ] **T8** `profiles.ts` enrichment + `grid.ts` population so generation emits **L2** anatomy (optimizesFor / forbiddenMoves / failureModes / remediation / tell from richer per-move material).
- [x] **T9** `superpowers/overrides/` — hand-author **hero cells to L4** for the campaign-critical coordinates (Connector-outer × {Open, Show} × {Diplomat, Challenger, Architect, Sage}; Escape-Artist-inner × Clean × {Shaman, Challenger}; then Storyteller-outer narrative cells). Apply via `decks.ts`.
- [x] **T10** Guard test: no `status:'published'` superpower card scores `< L3` (recompute via `assessQuality`).
- [x] **T11** `vitest`, `tsc --noEmit`, `eslint` — fail-fix.

## Phase 5 — Promote + measure lift
- [ ] **T12** Promote cells reaching L3+ to `published`; re-run the harness; record before/after `< L3` counts in the strand.

## Housekeeping
- [ ] **T13** `BACKLOG.md` entry + `npm run backlog:seed`.
- [ ] **T14** When a draw/authoring UI ships, add the Verification Quest.

## Verification (every phase)
- `vitest run src/lib/technique-library`; `tsc --noEmit`; `eslint` clean.
- `tsx scripts/superpower-quality-report.ts` — car-campaign report; `< L3` count trending down.
- Base deck stays 120; base pool free of pack cards.
