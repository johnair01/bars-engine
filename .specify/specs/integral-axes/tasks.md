# Tasks: Integral Axes — Domain inner/outer + Energy direction/volume

Implement per [spec.md](./spec.md) / [plan.md](./plan.md). Check off as completed. Run `npm run check` after each phase (fail-fix).

## Phase 1 — Ontology / docs
- [ ] **T1**: `FOUNDATIONS.md` — add the 8-cell board table (domain × inner/outer) with the user's definitions; define inner = left-hand (I/We), outer = right-hand (It/Its, incl. allyship); note moves = inner column, Grow Up = altitude. (FR1)
- [ ] **T2**: `FOUNDATIONS.md` — extend the existing Wilber-divergence note: Open Up = the **volume/intake** term in the direction×volume economy. (FR1)
- [ ] **T3**: `.specify/memory/conceptual-model.md` — add `AllyshipAspect`, the domain×aspect board, and the energy direction×volume table. (FR2)

## Phase 2 — Domain inner/outer (low-risk, shippable alone)
- [ ] **T4**: `src/lib/quest-grammar/types.ts` — add `AllyshipAspect` and `MoveCellAffinity`. (FR3)
- [ ] **T5**: `src/lib/quest-grammar/canonical-kernel.ts` — replace `WAVE_TO_DOMAIN` with `MOVE_CELL_AFFINITY` (exhaustive over `PersonalMoveType`); mark `growUp` `altitude: true`. (FR4)
- [ ] **T6**: `canonical-kernel.ts` — add `export function moveDomain(move): string`; refactor `pickExperienceForPlayer` to derive from affinity, keeping signature + return type identical; for `altitude` moves with no nation context, fall back to `EXPERIENCE_OPTIONS` (Open Question §1). (FR4, FR5)
- [ ] **T7**: Grep-audit `WAVE_TO_DOMAIN` readers (expected: only `pickExperienceForPlayer`); migrate any stragglers. (FR5)
- [ ] **T8**: `npm run check` green; spot-verify Q1 strings per move×element are coherent. (FR10)
- [ ] **T9**: Commit + push Phase 1–2 (`fail-fix-workflow`).

## Decision point
- [ ] **T10**: Confirm with maintainer whether to proceed to Phase 3 (energy, gameplay-affecting) now or split to a follow-on slice.

## Phase 3 — Energy direction × volume (flag-gated, gameplay-affecting)
- [ ] **T11**: `src/lib/alchemy-engine/types.ts` — add `EnergyDirection`, `EnergyProfile`; map existing `energyDelta` → `direction`; `volume` default 0. (FR6)
- [ ] **T12**: Add `INTEGRAL_ENERGY_VOLUME` feature flag (default off); document in `docs/ENV_AND_VERCEL.md`. (FR7)
- [ ] **T13**: Define Open Up intake `volume` contribution; gate any economy effect behind the flag. (FR7)
- [ ] **T14**: Add `energyDelta` back-compat accessor (`= directionValue(direction)`); keep all current call sites compiling. (FR8)
- [ ] **T15**: Unit assertion — **flag-off** alchemy output identical to current behavior. (FR10)
- [ ] **T16**: `npm run check` + `npm run build` green; commit + push.

## Phase 4 — Persistence (separate gated slice; full Prisma discipline)
- [ ] **T17**: `prisma/schema.prisma` — add `allyshipDomainAspect String?` to `CustomBar` (+ mirror on `Instance`). (FR9)
- [ ] **T18**: `npx prisma migrate dev --name add_allyship_aspect`; commit `prisma/migrations/…` with `schema.prisma`.
- [ ] **T19**: `npm run db:sync`; then `migrate deploy`; then `npm run db:record-schema-hash` (per `docs/PRISMA_MIGRATE_STRATEGY.md`).
- [ ] **T20**: `npm run check` green; commit + push.

## Phase 5 — UI + Verification Quest (future, when surfaces land)
- [ ] **T21**: When inner/outer UI ships, add Verification Quest `cert-integral-axes-v1` (Twine + idempotent seed, per `cyoa-certification-quests`), framed toward the Bruised Banana Fundraiser. **Required before marking any UI feature complete.**

## Notes
- Phases 1–2 are independently shippable and carry no gameplay risk.
- Do **not** start Phase 4 without the migration steps (T18–T19) — shipping schema without a committed migration breaks `migrate deploy`.
- `packages/bars-core` parity is out of scope (pre-fifth-move copy).
</content>
