# Plan: Integral Axes — Domain inner/outer + Energy direction/volume

> Implement per [spec.md](./spec.md). **API-first**: land `AllyshipAspect` / `MoveCellAffinity` types and the `EnergyProfile` contract before touching consumers or UI. Ontology docs first, then types, then cosmetic-safe refactor, then flag-gated energy.

## Architectural strategy

Two orthogonal axes share one root (the AQAL interior/exterior distinction), but they touch **different subsystems** with **different risk profiles**:

| Axis | Subsystem | Risk | Gate |
|------|-----------|------|------|
| Domain inner/outer | `quest-grammar` (`WAVE_TO_DOMAIN` → `MOVE_CELL_AFFINITY`) | **Low** — narrative-flavor only (fifth-move trace) | none |
| Energy direction/volume | `alchemy-engine` + `move-engine` (`energyDelta`) | **High** — feeds real energy math | feature flag, default off |

Therefore: **ship the domain axis first and independently**; treat the energy axis as a separable follow-on slice that can be paused without blocking the domain work. Persistence (Phase 4) is its own gated slice.

## Critical files

| File | Change |
|------|--------|
| `FOUNDATIONS.md` | 8-cell board table; inner/outer definition; extend Wilber-divergence note (Open Up = volume term) |
| `.specify/memory/conceptual-model.md` | `AllyshipAspect` + board + energy direction×volume tables |
| `src/lib/quest-grammar/types.ts` | add `AllyshipAspect`, `MoveCellAffinity` |
| `src/lib/quest-grammar/canonical-kernel.ts` | replace `WAVE_TO_DOMAIN` with `MOVE_CELL_AFFINITY`; add `moveDomain()`; keep `pickExperienceForPlayer` signature; Grow Up `altitude` deferral |
| `src/lib/quest-grammar/random-unpacking.ts` | (verify) consumer unaffected — still receives a domain string |
| `src/lib/alchemy-engine/types.ts` | `EnergyDirection`, `EnergyProfile`; `energyDelta` back-compat accessor |
| `packages/bars-core/src/quest-grammar/move-engine.ts` | reference only — energyDelta source of truth (parity port out of scope) |
| `prisma/schema.prisma` | **Phase 4 only** — `allyshipDomainAspect String?` on `CustomBar`/`Instance` |

## Trade-offs & decisions

- **`MoveCellAffinity` object vs. parallel maps.** Chose a single struct keyed by move so domain + aspect (+ altitude/secondary) travel together and stay exhaustive over `PersonalMoveType` (the type-safety net that caught the fifth move). Parallel `MOVE_TO_ASPECT` maps would drift.
- **Keep `pickExperienceForPlayer` return type (string).** Avoids a ripple through the cosmetic chain; the affinity is an internal detail. `moveDomain()` is the seam.
- **`energyDelta` retained as derived.** Splitting into `EnergyProfile` without a back-compat accessor would touch every alchemy call site at once. Derive `energyDelta` from `direction` and ship volume additively behind a flag → zero-regression path.
- **Grow Up = altitude, not a field.** Rather than invent a 5th domain, mark it `altitude: true` and defer to nation context. This also stops Open Up and Grow Up colliding on Gather Resource flavor.

## Verification approach

- Phase 1–2: `npm run check` (exhaustiveness over `PersonalMoveType` is the guard); spot-check `pickExperienceForPlayer` returns expected strings for each move + element.
- Phase 3: unit assertion that **flag-off** alchemy output equals current `energyDelta` behavior byte-for-byte; volume only observable with flag on.
- Phase 4: Prisma migration discipline (see spec § Persisted data).

## Sequencing

Phase 1 (docs) → Phase 2 (domain types + refactor, shippable alone) → **decision point** → Phase 3 (energy, flag-gated) → Phase 4 (persistence) → Phase 5 (verify rolled into each).
</content>
