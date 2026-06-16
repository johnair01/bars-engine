# Plan: Energy — Direction × Volume

> Implement per [spec.md](./spec.md). **API-first**: land `EnergyProfile { direction, volume }` + the `energyDelta` back-compat accessor before any behavior change. Everything new is **flag-gated** (`INTEGRAL_ENERGY_VOLUME`, default off). Depends on [`integral-axes`](../integral-axes/spec.md).

## Architectural strategy

This is the **high-risk** half of the Integral Axes effort: `energyDelta` feeds the alchemy engine's real math, unlike the cosmetic domain board. The safe path is **additive + reversible**:

1. Introduce `EnergyProfile` alongside `energyDelta` (don't replace).
2. Make `energyDelta` a derived accessor so every existing call site is untouched.
3. Default `volume: 0` and gate all volume behavior behind a flag.
4. Prove with a regression assertion that **flag-off output is byte-identical** to today.

Only after that scaffold is green do we design what volume *does* (Phase 2), which is blocked on the volume-scale decision.

## Critical files

| File | Change |
|------|--------|
| `src/lib/alchemy-engine/types.ts` | `EnergyDirection`, `EnergyProfile`, `energyDelta()` accessor |
| `src/lib/quest-grammar/move-engine.ts` | map 15 moves' `energyDelta` → `direction`; `volume: 0` default |
| `docs/ENV_AND_VERCEL.md` | document `INTEGRAL_ENERGY_VOLUME` |
| (tests) | regression: flag-off output identical to current |

## Trade-offs & decisions

- **Additive over replace.** Replacing `energyDelta` outright would touch every consumer at once and risk silent math drift. Derived accessor + flag isolates risk.
- **Volume default 0.** Guarantees the no-op path; volume is inert until explicitly designed and enabled.
- **Direction possibly optional.** A pure-intake move (Open Up) may have no direction; Phase 2 resolves whether `direction` becomes optional on `EnergyProfile`.

## Verification approach

- Phase 1: unit assertion that, with `INTEGRAL_ENERGY_VOLUME` off, alchemy-engine outputs equal the current `energyDelta`-based results for all 15 moves.
- Phase 2: flag-on tests exercising Open Up intake; `npm run build` + `npm run check`.

## Sequencing

**Blocked on**: `integral-axes` Phase 1–2 (conceptual home for "intake") + the volume-scale decision (spec OQ1).
Phase 1 (types + back-compat + regression assertion) → decide volume scale → Phase 2 (flag-gated semantics).
</content>
