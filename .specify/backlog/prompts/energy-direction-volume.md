# Spec Kit Prompt: Energy — Direction × Volume

## Role
You are a Spec Kit agent splitting the engine's energy economy into direction × volume.

## Objective
`energyDelta` (+2/+1/−1) conflates direction (transcend/generative/control) with volume (how much fuel flows). Open Up is a volume/intake operation with no place on the direction scale. Introduce `EnergyProfile { direction, volume }`, keep `energyDelta` as a derived back-compat accessor, and gate all volume behavior behind a flag (default off) with a byte-identical no-op guarantee.

## Prompt (API-First)
> Implement Energy Direction×Volume per [.specify/specs/energy-direction-volume/spec.md](../../specs/energy-direction-volume/spec.md). **API-first**: add `EnergyProfile` + `energyDelta()` accessor before any behavior change. Gate volume behind `INTEGRAL_ENERGY_VOLUME` (default off). Prove flag-off output is byte-identical to current. Depends on `integral-axes`.

## Requirements
- **Surfaces**: none — internal to alchemy-engine + move-engine, flag-gated.
- **Mechanics**: direction = existing quality axis; volume ≥ 0 = intake magnitude; Open Up = source term.
- **Persistence**: none in first slices.
- **API**: `EnergyProfile { direction, volume }`; `energyDelta(profile)` back-compat accessor.
- **Verification**: regression assertion (flag off ⇒ identical output); flag-on tests; `npm run check` + `npm run build`.

## Checklist (API-First Order)
- [ ] Decide volume scale (OQ1) + direction-optional (OQ2) before building
- [ ] `EnergyProfile` + `energyDelta()` accessor; all call sites compile unchanged
- [ ] `INTEGRAL_ENERGY_VOLUME` flag (default off) documented in `docs/ENV_AND_VERCEL.md`
- [ ] Regression: flag-off output byte-identical
- [ ] `npm run build` + `npm run check` — fail-fix

## Deliverables
- [x] .specify/specs/energy-direction-volume/spec.md
- [x] .specify/specs/energy-direction-volume/plan.md
- [x] .specify/specs/energy-direction-volume/tasks.md
- [ ] BACKLOG.md entry (assign next ID; **depends on** `integral-axes`) + `npm run backlog:seed`

## Risk
Highest-risk change in the effort — feeds real alchemy math. Additive + flagged + regression-asserted before merge.
</content>
