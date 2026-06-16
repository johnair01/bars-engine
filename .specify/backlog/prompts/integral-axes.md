# Spec Kit Prompt: Integral Axes — Domain inner/outer + Energy direction/volume

## Role
You are a Spec Kit agent implementing the two-by-two AQAL refinement of the engine's WHERE and Energy dimensions.

## Objective
The fifth move (Open Up) exposed that `WAVE_TO_DOMAIN`, `ELEMENT_TO_DOMAINS`, and `energyDelta` are secretly one-dimensional. Add the interior/exterior (left-hand/right-hand) axis as a first-class second dimension: domains gain `inner`/`outer` cells (8-cell board, moves = inner column, Grow Up = altitude), and energy splits into `direction` × `volume` (Open Up = the intake/volume term).

## Prompt (API-First)
> Implement Integral Axes per [.specify/specs/integral-axes/spec.md](../../specs/integral-axes/spec.md). **API-first**: land `AllyshipAspect` / `MoveCellAffinity` (types.ts) and the `EnergyProfile { direction, volume }` contract before consumers. Replace `WAVE_TO_DOMAIN` with `MOVE_CELL_AFFINITY`, keeping `pickExperienceForPlayer`'s string return (cosmetic-only). Energy axis is flag-gated (`INTEGRAL_ENERGY_VOLUME`, default off) and gameplay-affecting — split to a follow-on slice if needed.

## Requirements
- **Surfaces**: none in Phase 1–2 (ontology + quest-grammar internals); UI deferred (Verification Quest required when it lands).
- **Mechanics**: domain×aspect board; moves map to inner cells; Grow Up defers to nation context; energy direction (transcend/generative/control) separated from volume (intake ≥ 0).
- **Persistence**: deferred to Phase 4 — `allyshipDomainAspect String?` on `CustomBar`/`Instance` with full migration discipline.
- **API**: no new external surface; alchemy-engine energy change is internal + flag-gated; `energyDelta` retained as back-compat accessor.
- **Verification**: `npm run check` per phase; flag-off energy output identical to current.

## Checklist (API-First Order)
- [ ] `AllyshipAspect` + `MoveCellAffinity` types defined
- [ ] `WAVE_TO_DOMAIN` → `MOVE_CELL_AFFINITY`; `pickExperienceForPlayer` signature unchanged
- [ ] `EnergyProfile` + flag; `energyDelta` back-compat accessor
- [ ] Phase 4 only: `migrate dev` + commit `prisma/migrations/`
- [ ] `npm run build` + `npm run check` — fail-fix

## Deliverables
- [x] .specify/specs/integral-axes/spec.md
- [x] .specify/specs/integral-axes/plan.md
- [x] .specify/specs/integral-axes/tasks.md
- [ ] BACKLOG.md entry (assign next ID; depends on `fifth-move-open-up`) + `npm run backlog:seed`
</content>
