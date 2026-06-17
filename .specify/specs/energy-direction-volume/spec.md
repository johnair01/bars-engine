# Spec: Energy — Direction × Volume

## Purpose

Split the engine's single `energyDelta` (+2 / +1 / −1) into **two orthogonal axes**: **direction** (the moral/quality axis — transcend / generative / control) and **volume** (how much emotional energy a move admits or moves). The fifth move, **Open Up**, has no natural place on the direction scale because it is a **volume/intake** operation — the *source term* that admits fuel before the other moves metabolize it.

**Problem**: `energyDelta` conflates "what kind of move" (direction) with "how much fuel flows" (volume). Open Up exposed this: it is neither transcend, generative, nor control — it is intake. There is currently no way to represent admitting energy distinct from spending/transforming it.

**Practice**: Deftness Development — spec kit first, deterministic over AI. **This change is gameplay-affecting** (energy feeds the alchemy engine), so it ships **behind a feature flag, default off**, with a byte-identical no-op guarantee when disabled.

> **Depends on** [`integral-axes`](../integral-axes/spec.md) (the inner/outer board): Open Up = Gather Resource *inner* = the intake cell, which is the conceptual home of "volume."

## Design Decisions

| Topic | Decision |
|-------|----------|
| Two axes | `EnergyProfile = { direction: EnergyDirection; volume: number }`. **Direction** = existing transcend(+2)/generative(+1)/control(−1) quality axis. **Volume** ≥ 0 = magnitude of emotional energy admitted/moved. |
| Open Up's role | Open Up is the canonical **intake/source** term: high volume, no direction (or a neutral direction). It admits fuel; Clean → Grow → Show then act on it. |
| `energyDelta` retained | Kept as a **derived/back-compat accessor** (`energyDelta = directionValue(direction)`). Volume is additive and separate; existing call sites keep compiling and behaving identically. |
| Flag-gated | `INTEGRAL_ENERGY_VOLUME` (default **off**). Off → alchemy-engine output is **byte-identical** to current. On → volume becomes observable in the economy. |
| Risk posture | Highest-risk change in the Integral Axes effort. No schema change in the first slice; flag + back-compat + a regression assertion are mandatory before merge. |
| Wilber alignment | Volume = the *intake* dimension that Open Up names (bars-engine coinage — **not** Wilber's *Opening Up*/lines; see `FOUNDATIONS.md` divergence note). |

## Conceptual Model

| Axis | Meaning | Values | Set by |
|------|---------|--------|--------|
| **Direction** | quality/moral direction of the move | transcend `+2`, generative `+1`, control `−1` | the 15 canonical moves (existing) |
| **Volume** | emotional energy admitted/moved | `≥ 0` (intake-weighted for Open Up) | new — Open Up is the source/intake term |

| Dimension | This Spec |
|-----------|-----------|
| **Energy** | direction × volume (this spec defines the second axis) |
| **Personal throughput** | Open Up = intake; Clean/Grow/Show = metabolize/build/spend |
| **WHERE** | `src/lib/alchemy-engine/*`, `src/lib/quest-grammar/move-engine.ts` |

## API / Type Contracts (API-First)

```ts
// src/lib/alchemy-engine/types.ts  (and mirrored where energyDelta lives)
export type EnergyDirection = 'transcend' | 'generative' | 'control'

export interface EnergyProfile {
  direction: EnergyDirection
  volume: number // >= 0
}

/** Back-compat: maps direction → the legacy signed integer. Volume is separate. */
export function energyDelta(p: EnergyProfile): number // transcend +2, generative +1, control -1
```

- **No new external surface.** Changes are internal to the alchemy engine + move definitions, gated by `INTEGRAL_ENERGY_VOLUME`.

## User Stories

### P1: Intake distinct from direction
**As a designer**, I want Open Up to register as **intake/volume** rather than being mis-scored on the transcend/control scale, so the economy can model "fuel admitted" separately from "quality of move."
**Acceptance**: `EnergyProfile { direction, volume }` exists; `energyDelta` derivable; alchemy output unchanged when the flag is off / volume defaults to 0.

## Functional Requirements

### Phase 1 — Types + back-compat (no behavior change)
- **FR1**: Add `EnergyDirection` + `EnergyProfile` to `src/lib/alchemy-engine/types.ts`; map the 15 canonical moves' `energyDelta` → `direction`; default `volume: 0`.
- **FR2**: Add `energyDelta(profile)` back-compat accessor; keep all current call sites compiling unchanged.
- **FR3**: Regression assertion — with the flag off, alchemy-engine output is identical to current behavior.

### Phase 2 — Volume semantics (flag-gated)
- **FR4**: Add `INTEGRAL_ENERGY_VOLUME` feature flag (default off); document in `docs/ENV_AND_VERCEL.md`.
- **FR5**: Define Open Up's intake `volume` contribution and how volume participates in the economy when the flag is on. Resolve the **volume scale** open question first.
- **FR6**: `npm run check` + `npm run build` green; flag-on path covered by tests.

## Non-Functional Requirements
- **Zero regression** with the flag off (byte-identical output; FR3 asserts it).
- **Back-compat**: `energyDelta` remains available everywhere it is used today.
- **`packages/bars-core` parity** out of scope (pre-fifth-move copy; `energyDelta` source there is reference-only).

## Out of Scope
- The allyship domain board → [`integral-axes`](../integral-axes/spec.md).
- Persisted energy fields / schema changes (none in first slices).
- UI surfacing of volume.

## Open Questions
1. **Volume scale** — unbounded, normalized 0–1, or tiered? Blocks Phase 2; must be decided before the flag turns on.
2. **Direction for Open Up** — does intake carry a neutral direction, or is direction *optional* on a pure-volume move? (Lean: direction optional; Open Up is volume-only.)
3. **Economy interaction** — when volume is on, does it cap/scale subsequent metabolizing moves (Clean/Grow/Show), or accumulate as a separate reserve?

## Dependencies / References
- Depends on: [`integral-axes`](../integral-axes/spec.md) (Open Up = Gather Resource inner / intake cell), [`fifth-move-open-up`](../fifth-move-open-up/spec.md).
- Code: `src/lib/alchemy-engine/types.ts`, `src/lib/quest-grammar/move-engine.ts` (and `packages/bars-core/src/quest-grammar/move-engine.ts` for the 15-move `energyDelta` reference).
- Conceptual: `FOUNDATIONS.md` (Emotional Alchemy / energy economy; Wilber divergence note).
- Prisma/fail-fix: [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
</content>
