# Tasks: Energy — Direction × Volume

Implement per [spec.md](./spec.md) / [plan.md](./plan.md). **Blocked on** [`integral-axes`](../integral-axes/spec.md) Phase 1–2 and the volume-scale decision (spec OQ1). Run `npm run check` after each phase (fail-fix).

## Phase 0 — Decide before building
- [ ] **T1**: Resolve **volume scale** (OQ1: unbounded / normalized 0–1 / tiered) and whether `direction` is optional for pure-intake moves (OQ2). Record in spec.

## Phase 1 — Types + back-compat (no behavior change)
- [ ] **T2**: `src/lib/alchemy-engine/types.ts` — add `EnergyDirection`, `EnergyProfile`; default `volume: 0`. (FR1)
- [ ] **T3**: `src/lib/quest-grammar/move-engine.ts` — map the 15 canonical moves' `energyDelta` → `direction`. (FR1)
- [ ] **T4**: Add `energyDelta(profile)` back-compat accessor; keep all current call sites compiling unchanged. (FR2)
- [ ] **T5**: Regression assertion — **flag-off** alchemy-engine output identical to current for all 15 moves. (FR3)
- [ ] **T6**: `npm run check` green; commit + push.

## Phase 2 — Volume semantics (flag-gated, gameplay-affecting)
- [ ] **T7**: Add `INTEGRAL_ENERGY_VOLUME` feature flag (default off); document in `docs/ENV_AND_VERCEL.md`. (FR4)
- [ ] **T8**: Define Open Up's intake `volume` contribution + how volume participates when the flag is on (per T1 decision). (FR5)
- [ ] **T9**: Tests for the flag-on path; `npm run check` + `npm run build` green. (FR6)
- [ ] **T10**: Commit + push.

## Notes
- **Zero-regression contract:** flag off ⇒ byte-identical output (T5 asserts it). Do not merge Phase 2 without it.
- `energyDelta` stays available everywhere it is used today (derived accessor).
- `packages/bars-core` parity out of scope (reference-only `energyDelta` source).
</content>
