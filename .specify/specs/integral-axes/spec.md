# Spec: Integral Axes — Domain inner/outer + Energy direction/volume

## Purpose

Apply AQAL quadrant rigor to two engine dimensions that the fifth move (**Open Up**) revealed as secretly one-dimensional:

1. **WHERE (allyship domains)** — each of the four domains has an **inner** (left-hand: interior / intention / felt) cell and an **outer** (right-hand: exterior / behavior + systems) cell. Four domains × {inner, outer} = an **8-cell board**. The five personal-throughput **moves are predominantly the inner column.**
2. **Energy** — the canonical `energyDelta` (+2/+1/−1) conflates two things: the *direction* of a move (transcend / generative / control) and its *volume* (how much emotional energy enters/flows). Open Up is a **volume/intake** operation with no natural place on the direction scale. Separate energy into **direction × volume**.

**Problem**: `WAVE_TO_DOMAIN` pretends move→domain is 1:1; `ELEMENT_TO_DOMAINS` lists domains with no inner/outer distinction; `energyDelta` is a single signed integer. None of these can represent Open Up (receptivity/intake = Gather Resource *inner*, a volume operation) without distortion. Resolving the fifth move surfaced all three as the same missing structure: the interior/exterior axis.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. This is an **ontology + grammar-first** effort; persistence and UI land in clearly-marked later phases.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Core structure | Adopt the **interior/exterior (left-hand/right-hand) axis** from AQAL as a first-class second dimension on both WHERE and Energy. Domains and energy become **two-by-two**, not flat. |
| Domain aspect | Introduce `AllyshipAspect = 'inner' \| 'outer'`. Each domain string gains an orthogonal aspect. **Inner = left-hand** (I/We interiors: meaning, felt energy, parts, alchemy). **Outer = right-hand** (It/Its exteriors: objective resources, behaviors, systems, marketing) — including **allyship** (you can only touch another's interior via the right-hand). |
| Moves are the inner column | The five moves map to **inner cells** of domains: Wake→Raise Awareness (inner), Open→Gather Resource (inner), Clean→Skillful Organizing (inner), Show→Direct Action (inner). **Grow Up = altitude/levels** (vertical development), not a field cell — it does **not** get a fixed domain and instead defers to player context. |
| `WAVE_TO_DOMAIN` evolution | Replace the move→single-string map with **`MOVE_CELL_AFFINITY: Record<PersonalMoveType, MoveCellAffinity>`** carrying `{ domain, aspect }` (+ optional secondary). `pickExperienceForPlayer` keeps returning a domain string (back-compat) but derives it from the affinity. **Narrative-flavor only** — no progress/energy effect (verified in fifth-move trace). |
| Energy = direction × volume | Split the single `energyDelta` into **`energyDirection`** (`transcend:+2 \| generative:+1 \| control:−1` — the existing moral/quality axis) and **`energyVolume`** (≥0 — how much emotional energy the move admits/moves; **intake** for Open Up). `energyDelta` is retained as a derived/back-compat accessor during migration. |
| Wilber alignment | Inner/outer = interior/exterior quadrants (canonical AQAL). Open Up stays **bars-engine's receptivity/intake coinage** (see `FOUNDATIONS.md` divergence note), now positioned as the **volume/intake** term — *not* Wilber's "lines" meaning. |
| Phasing & risk | **Phase 1–2 (domains)** are low-risk: `WAVE_TO_DOMAIN` is cosmetic. **Phase 3 (energy)** is **gameplay-affecting** (energyDelta feeds the alchemy engine) and ships behind a flag with its own verification — may be split to a follow-on slice. |
| Persistence | Deferred. First slices are **type/ontology-level**. A persisted `allyshipDomainAspect` on `CustomBar`/`Instance` is specified here but gated to a later phase with full Prisma migration discipline. |

## Conceptual Model

### The 8-cell board (WHERE × aspect)

| Domain | Inner (left-hand: I/We) | Outer (right-hand: It/Its — incl. allyship) |
|--------|--------------------------|----------------------------------------------|
| **Gather Resource** | open self to the emotional energy to do the work *(= Open Up)* | acquire objective resources **or** help another gather *their* inner resource (the human resource) |
| **Raise Awareness** | storytelling, meaning-making *(= Wake Up)* | marketing — letting people know what's up |
| **Skillful Organizing** | self-governance, parts work *(= Clean Up)* | organizing the right-hand quadrants (structures/systems) |
| **Direct Action** | doing an emotional-alchemy move *(= Show Up, aligned doing)* | right-quadrant action in the world |

> Allyship lives in the **outer** column: acting on/with others is necessarily exterior (right-hand). Development lives in the **inner** column.

### Moves vs. the board (two axes, not one table)

The moves are heterogeneous Integral operations, not four peers in one field (cf. Wilber's paths):

| Move | Kind | Inner cell |
|------|------|------------|
| Wake Up | states / awareness | Raise Awareness (inner) |
| Open Up | **receptivity / intake (volume)** | Gather Resource (inner) |
| Clean Up | shadow | Skillful Organizing (inner) |
| Show Up | embodiment | Direct Action (inner) |
| Grow Up | **levels / altitude (vertical)** | *none — defers to player context* |

### Energy: direction × volume

| Axis | Meaning | Values | Set by |
|------|---------|--------|--------|
| **Direction** | quality/moral direction of the move | transcend `+2`, generative `+1`, control `−1` | existing 15 canonical moves |
| **Volume** | how much emotional energy is admitted/moved | `≥ 0` (intake-weighted for Open Up) | new — Open Up is the canonical intake/source term |

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player (Nation/Archetype WAVE profiles inform affinity, later) |
| **WHAT** | The WHERE board + the Energy economy model |
| **WHERE** | `src/lib/quest-grammar/*`, `src/lib/alchemy-engine/*`, `FOUNDATIONS.md`, `.specify/memory/conceptual-model.md` |
| **Energy** | direction × volume (this spec defines the second axis) |
| **Personal throughput** | 5 moves; inner column of the board + Grow Up (altitude) |

## API / Type Contracts (API-First)

No runtime route changes in Phase 1–2. Type-level first.

```ts
// src/lib/quest-grammar/types.ts
export type AllyshipAspect = 'inner' | 'outer'

export interface MoveCellAffinity {
  /** Primary domain cell this move expresses in (narrative-flavor). */
  domain: string
  aspect: AllyshipAspect
  /** Optional lighter secondary cell. */
  secondary?: { domain: string; aspect: AllyshipAspect }
  /** True for vertical/altitude moves (Grow Up) with no fixed field. */
  altitude?: boolean
}
```

```ts
// src/lib/quest-grammar/canonical-kernel.ts — replaces WAVE_TO_DOMAIN
const MOVE_CELL_AFFINITY: Record<PersonalMoveType, MoveCellAffinity> = {
  wakeUp: { domain: 'Raise Awareness', aspect: 'inner' },
  openUp: { domain: 'Gather Resource', aspect: 'inner' },
  cleanUp: { domain: 'Skillful Organizing', aspect: 'inner' },
  showUp: { domain: 'Direct Action', aspect: 'inner' },
  growUp: { domain: 'Gather Resource', aspect: 'inner', altitude: true }, // defers to context
}

// Back-compat: pickExperienceForPlayer still returns a domain string.
export function moveDomain(move: PersonalMoveType): string // = MOVE_CELL_AFFINITY[move].domain
```

```ts
// Energy (Phase 3) — src/lib/alchemy-engine/types.ts & quest-grammar move-engine.ts
export type EnergyDirection = 'transcend' | 'generative' | 'control'
export interface EnergyProfile {
  direction: EnergyDirection   // +2 / +1 / -1 mapped from direction
  volume: number               // >= 0, intake magnitude
}
/** Back-compat: energyDelta = directionValue(direction) (volume is additive, separate). */
```

- **Server Action / Route**: none new in Phase 1–2. Phase 3 energy changes are internal to the alchemy engine (no new external surface) and flag-gated.

## User Stories

### P1: Coherent domain framing for every move
**As a player**, I want quests generated for my archetype to be framed in the domain *cell* that fits my move (e.g. Open Up → Gather Resource *inner*, "opening to the energy"), so the narrative feels true to how I work — including Grow Up not being forced into a field that doesn't fit.
**Acceptance**: `MOVE_CELL_AFFINITY` drives Q1 flavor; Grow Up defers to nation context rather than a fixed domain; existing four-move framings are unchanged or improved; `npm run check` green.

### P2: Energy that distinguishes intake from direction
**As a designer**, I want Open Up to register as **intake/volume** rather than being mis-scored on the transcend/control direction scale, so the energy economy can model "fuel admitted" separately from "quality of move."
**Acceptance**: `EnergyProfile { direction, volume }` exists; `energyDelta` remains derivable; alchemy-engine outputs unchanged when volume defaults to 0 (no regression behind flag off).

## Functional Requirements

### Phase 1 — Ontology / docs
- **FR1**: `FOUNDATIONS.md` — add the **8-cell board** table and the **inner = left-hand / outer = right-hand** definition; note moves are the inner column and Grow Up = altitude. Extend the existing Wilber-divergence note to position Open Up as the **volume/intake** term.
- **FR2**: `.specify/memory/conceptual-model.md` — add `AllyshipAspect` and the domain×aspect board; add the energy direction×volume table.

### Phase 2 — Domain inner/outer (types + cosmetic-safe refactor)
- **FR3**: Add `AllyshipAspect` and `MoveCellAffinity` to `types.ts`.
- **FR4**: Replace `WAVE_TO_DOMAIN` with `MOVE_CELL_AFFINITY` in `canonical-kernel.ts`; expose `moveDomain()`; keep `pickExperienceForPlayer` signature/return type identical (derives domain from affinity). Grow Up uses `altitude` to prefer nation-context domain over its placeholder.
- **FR5**: Audit all `WAVE_TO_DOMAIN` readers (per fifth-move trace: only `pickExperienceForPlayer`) and migrate; no behavior change beyond the Grow Up context-deferral and the (already shipped) Open Up value.

### Phase 3 — Energy direction × volume (gameplay-affecting, flag-gated)
- **FR6**: Add `EnergyDirection` + `EnergyProfile` to alchemy-engine and quest-grammar types; map the 15 canonical moves' `energyDelta` → `direction`; default `volume: 0`.
- **FR7**: Define Open Up's intake `volume` contribution; gate any economy behavior change behind a feature flag (`INTEGRAL_ENERGY_VOLUME`), default off → `energyDelta` unchanged.
- **FR8**: Provide `energyDelta` back-compat accessor so existing call sites keep working.

### Phase 4 — Persistence (deferred; full Prisma discipline)
- **FR9**: Add `allyshipDomainAspect String?` to `CustomBar` (and mirror on `Instance` where `allyshipDomain` exists). Requires migration + committed SQL. **Not in first slice.**

### Phase 5 — Verify
- **FR10**: `npm run check` green at each phase; `npm run build` unaffected. Phase 3 adds alchemy-engine unit assertions: flag-off output is byte-identical to current.

## Non-Functional Requirements
- **No behavior regression**: Phase 1–2 are cosmetic (narrative flavor only). Phase 3 is no-op with the flag off.
- **Back-compat**: `pickExperienceForPlayer` return type unchanged; `energyDelta` remains available.
- **`packages/bars-core` parity** is **out of scope** — that copy is the pre-fifth-move version (no `openUp` in `PersonalMoveType`); porting is tracked separately.

## Persisted data & Prisma (Phase 4 only)

| Check | Done |
|-------|------|
| Prisma fields named in Design Decisions / API Contracts (`allyshipDomainAspect String?`) | ☐ |
| `tasks.md` includes `npx prisma migrate dev --name add_allyship_aspect` + commit `prisma/migrations/…` | ☐ |
| Verification: `npm run db:sync`; `npm run check` | ☐ |
| Human glanced at `migration.sql` (additive) | ☐ |

> Phases 1–3 ship **no** schema change. Do not start Phase 4 without the migration discipline above.

## Out of Scope (this effort)
- UI surfaces for inner/outer (domain pickers, board visualizations) — separate spec; a **Verification Quest is required** when those land.
- Remapping the 15-emotional-move engine's element grammar.
- `packages/bars-core` fifth-move/axis port.

## Open Questions
1. **Grow Up's domain fallback** — when nation context is absent, what does an altitude move return for Q1 flavor? (Proposal: random from `EXPERIENCE_OPTIONS`, matching the existing no-context fallback.)
2. **Outer-cell moves** — do any moves (or future ally-moves) live in the *outer* column, or is the player-throughput WAVE inherently inner-only with allyship handled elsewhere?
3. **Volume scale** — is `volume` unbounded, normalized 0–1, or tiered? Needs design before Phase 3 economy effects turn on.

## Dependencies / References
- Builds on: [`fifth-move-open-up`](../fifth-move-open-up/spec.md) (resolved Open Up → Gather Resource), `FOUNDATIONS.md` Wilber-divergence note.
- Code: `src/lib/quest-grammar/{types,canonical-kernel,random-unpacking,compileQuestCore}.ts`, `src/lib/alchemy-engine/types.ts`, `packages/bars-core/src/quest-grammar/move-engine.ts` (energyDelta reference).
- Conceptual: [spec-kit-translator SKILL](../../../.agents/skills/spec-kit-translator/SKILL.md), `.specify/memory/conceptual-model.md`.
- Prisma workflow (Phase 4): [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md), [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
</content>
</invoke>
