# Spec: Integral Axes — Allyship Domain inner/outer

## Purpose

Apply AQAL quadrant rigor to the engine's **WHERE** dimension: each of the four allyship domains has an **inner** (left-hand: interior / intention / felt) cell and an **outer** (right-hand: exterior / behavior + systems, incl. allyship) cell. Four domains × {inner, outer} = an **8-cell board**. The five personal-throughput **moves are the inner column.**

**Problem**: `WAVE_TO_DOMAIN` pretends move→domain is 1:1 and `ELEMENT_TO_DOMAINS` lists domains with no inner/outer distinction. Neither can represent Open Up (receptivity/intake = Gather Resource *inner*) or the allyship/outer column without distortion. Resolving the fifth move surfaced the missing structure: the interior/exterior axis.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. This is an **ontology + grammar-first** slice; persistence and UI land in clearly-marked later phases.

> **Scope note:** The companion idea (energy `direction × volume`) is **split into its own dependent spec** — see [`energy-direction-volume`](../energy-direction-volume/spec.md). It touches the alchemy engine (real gameplay math), whereas this spec is narrative-flavor only. Keeping them separate decouples a safe change from a risky one.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Core structure | Adopt the **interior/exterior (left-hand/right-hand) axis** from AQAL as a first-class second dimension on the allyship domains. Domains become **two-by-two**, not flat. |
| Domain aspect | Introduce `AllyshipAspect = 'inner' \| 'outer'`. **Inner = left-hand** (I/We interiors: meaning, felt energy, parts, alchemy). **Outer = right-hand** (It/Its exteriors: objective resources, behaviors, systems, marketing) — including **allyship** (you can only touch another's interior via the right-hand). |
| Moves are the inner column | The five moves map to **inner cells**: Wake→Raise Awareness, Open→Gather Resource, Clean→Skillful Organizing, Show→Direct Action, **Grow→Gather Resource** (lines/capacity). Grow Up is an ordinary horizontal inner move — **not** "altitude." |
| Altitude lives elsewhere | Vertical development (Wilber's *Growing Up*) is the **Six Game Master Faces** (`choiceType: 'altitudinal'`), a separate existing axis. This spec does **not** touch it. No move carries an `altitude` flag. (See `FOUNDATIONS.md` → "Six Game Master Faces = Integral altitude levels".) |
| Open Up & Grow Up share a cell | Both land in Gather Resource (inner) — different *operations* in one field (receive vs. build capacity/lines). Acceptable: `WAVE_TO_DOMAIN` is cosmetic, no uniqueness constraint. |
| `WAVE_TO_DOMAIN` evolution | Replace the move→single-string map with **`MOVE_CELL_AFFINITY: Record<PersonalMoveType, MoveCellAffinity>`** carrying `{ domain, aspect }` (+ optional secondary). `pickExperienceForPlayer` keeps returning a domain string (back-compat), derived from the affinity. **Narrative-flavor only** — no progress/energy effect (verified in fifth-move trace). |
| Persistence | Deferred. First slice is **type/ontology-level**. A persisted `allyshipDomainAspect` on `CustomBar`/`Instance` is specified here but gated to a later phase with full Prisma migration discipline. |

## Conceptual Model

### The 8-cell board (WHERE × aspect)

| Domain | Inner (left-hand: I/We) | Outer (right-hand: It/Its — incl. allyship) |
|--------|--------------------------|----------------------------------------------|
| **Gather Resource** | open self to the emotional energy to do the work *(= Open Up)*; build capacity/lines *(= Grow Up)* | acquire objective resources **or** help another gather *their* inner resource (the human resource) |
| **Raise Awareness** | storytelling, meaning-making *(= Wake Up)* | marketing — letting people know what's up |
| **Skillful Organizing** | self-governance, parts work *(= Clean Up)* | organizing the right-hand quadrants (structures/systems) |
| **Direct Action** | doing an emotional-alchemy move *(= Show Up, aligned doing)* | right-quadrant action in the world |

> **Allyship lives in the outer column** — acting on/with others is necessarily exterior (right-hand). Development lives in the inner column.

### Three orthogonal axes (engine-canonical)

| Axis | What | Owner |
|------|------|-------|
| **Horizontal** | the 5 WAVE moves (*how I develop*) | `PersonalMoveType` |
| **Altitudinal** | the 6 Game Master faces = Integral altitude (*what level/lens*) | `GameMasterFace` |
| **The board** | 4 allyship domains × inner/outer (*where work lands*) | this spec |

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player (Nation/Archetype WAVE profiles inform affinity, later) |
| **WHAT** | The WHERE board (domains × aspect) |
| **WHERE** | `src/lib/quest-grammar/*`, `FOUNDATIONS.md`, `.specify/memory/conceptual-model.md` |
| **Energy** | unchanged here — see sibling spec `energy-direction-volume` |
| **Personal throughput** | 5 moves = inner column of the board |

## API / Type Contracts (API-First)

No runtime route changes. Type-level first.

```ts
// src/lib/quest-grammar/types.ts
export type AllyshipAspect = 'inner' | 'outer'

export interface MoveCellAffinity {
  /** Primary domain cell this move expresses in (narrative-flavor). */
  domain: string
  aspect: AllyshipAspect
  /** Optional lighter secondary cell. */
  secondary?: { domain: string; aspect: AllyshipAspect }
}
```

```ts
// src/lib/quest-grammar/canonical-kernel.ts — replaces WAVE_TO_DOMAIN
const MOVE_CELL_AFFINITY: Record<PersonalMoveType, MoveCellAffinity> = {
  wakeUp:  { domain: 'Raise Awareness',     aspect: 'inner' },
  openUp:  { domain: 'Gather Resource',     aspect: 'inner' },
  cleanUp: { domain: 'Skillful Organizing', aspect: 'inner' },
  growUp:  { domain: 'Gather Resource',     aspect: 'inner' },
  showUp:  { domain: 'Direct Action',       aspect: 'inner' },
}

// Back-compat seam: pickExperienceForPlayer still returns a domain string.
export function moveDomain(move: PersonalMoveType): string // = MOVE_CELL_AFFINITY[move].domain
```

- **Server Action / Route**: none new. The affinity is an internal detail of the cosmetic Q1-flavor chain.

## User Stories

### P1: Coherent domain framing for every move
**As a player**, I want quests generated for my archetype framed in the domain *cell* that fits my move (Open Up → Gather Resource *inner*, "opening to the energy"), so the narrative feels true to how I work.
**Acceptance**: `MOVE_CELL_AFFINITY` drives Q1 flavor; existing four-move framings unchanged or improved; `npm run check` green.

## Functional Requirements

### Phase 1 — Ontology / docs
- **FR1**: `FOUNDATIONS.md` — add the **8-cell board** table + inner/outer (left/right-hand) definition; note moves = inner column. *(Wilber crossover + faces↔altitude already added.)*
- **FR2**: `.specify/memory/conceptual-model.md` — add `AllyshipAspect`, the domain×aspect board, and the three-axes table.

### Phase 2 — Domain inner/outer (types + cosmetic-safe refactor)
- **FR3**: Add `AllyshipAspect` and `MoveCellAffinity` to `types.ts`.
- **FR4**: Replace `WAVE_TO_DOMAIN` with `MOVE_CELL_AFFINITY` (exhaustive over `PersonalMoveType`); expose `moveDomain()`; keep `pickExperienceForPlayer` signature/return type identical.
- **FR5**: Audit all `WAVE_TO_DOMAIN` readers (per fifth-move trace: only `pickExperienceForPlayer`) and migrate; no behavior change beyond the already-shipped Open Up value.
- **FR6**: `npm run check` green; spot-verify Q1 strings per move×element are coherent.

### Phase 3 — Persistence (deferred; full Prisma discipline)
- **FR7**: Add `allyshipDomainAspect String?` to `CustomBar` (+ mirror on `Instance`). Requires migration + committed SQL. **Not in first slice.**

## Non-Functional Requirements
- **No behavior regression**: Phase 1–2 are cosmetic (narrative flavor only).
- **Back-compat**: `pickExperienceForPlayer` return type unchanged.
- **`packages/bars-core` parity** is **out of scope** — that copy is the pre-fifth-move version (no `openUp` in `PersonalMoveType`).

## Persisted data & Prisma (Phase 3 only)

| Check | Done |
|-------|------|
| Prisma fields named in Design Decisions / API Contracts (`allyshipDomainAspect String?`) | ☐ |
| `tasks.md` includes `npx prisma migrate dev --name add_allyship_aspect` + commit `prisma/migrations/…` | ☐ |
| Verification: `npm run db:sync`; `npm run check` | ☐ |
| Human glanced at `migration.sql` (additive) | ☐ |

> Phases 1–2 ship **no** schema change.

## Out of Scope (this effort)
- **Energy direction×volume** → sibling spec [`energy-direction-volume`](../energy-direction-volume/spec.md).
- UI surfaces for inner/outer (domain pickers, board visualizations) — separate spec; a **Verification Quest is required** when those land.
- The 6-faces / altitude axis — already exists; untouched here.
- `packages/bars-core` fifth-move/axis port.

## Open Questions
1. **Inner vs. outer allyship — the outer column has no move grammar.** The five WAVE moves currently encode **inner allyship**: the ally's *own* interior development (left-hand/inner column). **Outer allyship** = enacting in the **right-hand quadrants of and with others**, across the altitude levels (the 6 faces) and across the domains — the outer column (marketing, organizing systems, direct action, resourcing others / "the human resource"). This column has **no moves of its own yet** — the engine's namesake is implied, not enacted. **This is the live frontier.** Design fork: *(a)* a separate outer-allyship move set, or *(b)* the same five moves gaining an `aspect: 'outer'` expression (a move becomes outer allyship when directed into others'/collective RH quadrants — making the board a **move × domain × aspect** matrix, modulated by face/altitude). **Lean: (b)** — it's why `MoveCellAffinity` already carries `aspect`. Out of scope here; flagged for a future spec.
2. **Aspect persistence shape** — when Phase 3 lands, is `allyshipDomainAspect` a sibling field, or do we encode aspect into the `allyshipDomain` string? (Lean: sibling field, typed.)

## Dependencies / References
- Builds on: [`fifth-move-open-up`](../fifth-move-open-up/spec.md) (Open Up → Gather Resource), `FOUNDATIONS.md` (Wilber crossover + faces↔altitude).
- Sibling: [`energy-direction-volume`](../energy-direction-volume/spec.md).
- Code: `src/lib/quest-grammar/{types,canonical-kernel,random-unpacking}.ts`.
- Conceptual: [spec-kit-translator SKILL](../../../.agents/skills/spec-kit-translator/SKILL.md), `.specify/memory/conceptual-model.md`.
- Prisma (Phase 3): [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md), [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
</content>
</invoke>
