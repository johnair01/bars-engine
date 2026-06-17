# Spec: Inner / Outer Allyship — Move Aspect Grammar

## Purpose

Give the engine's namesake — **allyship** — a move grammar. Today the five WAVE moves encode only **inner allyship** (the ally's own interior development, left-hand). This spec adds the **outer** expression of each move: **outer allyship** = enacting in the **right-hand quadrants of and with others/collective**, across the altitude levels (the six faces) and across the domains. Rather than a separate move set, each of the five moves gains an `aspect: 'inner' | 'outer'`. The board becomes a **move × domain × aspect** matrix, modulated by face/altitude.

**Problem**: The WAVE moves are all inner-directed (self-development). The engine is "Mastering the Game of Allyship," yet allyship-toward-others is *implied, not enacted* — there is no grammar for the outer column (marketing, organizing systems, direct action in the world, resourcing others). Players can develop themselves but cannot **take an ally move on behalf of / with others** in a first-class way.

**Practice**: Deftness Development — spec kit first, **deterministic over AI** (the matrix is data, not generated), API-first (contract before UI). Dual-track: outer allyship must work **with or without** language models, and degrade gracefully — the Portland community's AI allergy makes the non-AI path first-class here especially.

> **Origin**: the live frontier flagged in [`integral-axes`](../integral-axes/spec.md) Open Question §1.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Aspect, not a new move set | The five moves are unchanged in identity; each gains an **`aspect: 'inner' \| 'outer'`** expression. `inner` = existing self-development (default); `outer` = allyship enacted in others'/collective RH quadrants. (Fork option **(b)** from integral-axes OQ1 — `MoveCellAffinity` already carries `aspect`.) |
| Inner vs. outer = left-hand vs. right-hand | **Inner** acts on the ally's own interior (I/We). **Outer** acts in the exterior (It/Its) of/with others — you can only touch another's interior *via* their right-hand, so allyship is structurally outer. |
| Outer requires a target | Inner moves are self-directed. **Outer moves require an `AllyshipTarget`** (individual / collective / system) — this is the structural difference, and the basis for "with and for others." |
| Face/altitude modulates style | The **six faces** (altitude) shape *how* an outer move is enacted (a Red/Challenger outer Show Up ≠ a Teal/Sage outer Show Up). Faces modulate **style**, not which move. Reuse existing style systems (`FACE_META`, archetype/nation overlays); deep face-conditioning is out of scope here. Phase 3 adds only a read-only *healthy register* per face. |
| **with/for is the shadow reading of the face×cell** | The *with* (solidarity) ↔ *for* (paternalism/saviorism) distinction is **not an independent toggle** — it is the **vertical reading** of the same face×outer-cell. Altitude determines whether outer allyship lands as solidarity or saviorism: lower tiers (Red/Amber/Orange) default toward the **"for" shadow**, second-tier (Sage/Teal) holds **"with"** more naturally. Therefore faces should *inform the with/for default* when it is eventually built. Recorded as a **documented seam** in Phase 3; not enacted in code (would make the engine *judge* a move — violates "energy is fuel, not judgment"). Surfaced relationally by a face in dialogue, never hard-coded. |
| Deterministic matrix | The inner/outer expressions are **authored data** (`MOVE_ASPECT_MATRIX`), not AI-generated. AI may later *flavor* copy, but the grammar is deterministic and works offline. |
| Energy asymmetry deferred | Inner vs. outer moves likely have different energy signatures (outer may spend volume to benefit others). Out of scope; linked to [`energy-direction-volume`](../energy-direction-volume/spec.md). |
| Persistence deferred | Type/ontology-first. A persisted `moveAspect` (e.g. on `QuestMoveLog`) is specified but gated to a later phase with full Prisma discipline. |

## Conceptual Model

### The move × aspect matrix (the heart)

| Move | **Inner** (self-development, left-hand) | **Outer** (allyship in others' right-hand) | Domain cell |
|------|------------------------------------------|---------------------------------------------|-------------|
| **Wake Up** | see for yourself — notice your own charge, privilege, what's true | **raise others' awareness** — help others see; witness, storytell, market the cause | Raise Awareness |
| **Open Up** | open to receive emotional energy / possibility / emergence within | **make space for others** — help another gather *their* inner resource (the human resource); hold a receptive container | Gather Resource |
| **Clean Up** | parts work, shadow, self-governance | **repair the systems** — organize/clean collective & structural distortion around others | Skillful Organizing |
| **Grow Up** | build your own capacity / developmental lines | **develop others** — mentor, resource, build others' capacity | Gather Resource |
| **Show Up** | aligned doing — embody your insight, take your own action | **direct action with/for others** — RH action in the world on behalf of the cause | Direct Action |

> Inner = the **development** column. Outer = the **allyship** column. Same move, two directions of enactment.

### Three axes + aspect

| Axis | What |
|------|------|
| Horizontal | the 5 WAVE moves |
| **Aspect** | inner ↔ outer (self-development ↔ allyship) — **this spec** |
| Altitudinal | the 6 faces (modulate outer *style*) |
| Board | 4 domains × inner/outer cells ([`integral-axes`](../integral-axes/spec.md)) |

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player (ally) + an `AllyshipTarget` (the other/collective/system) for outer moves |
| **WHAT** | The move-aspect grammar (inner/outer expression of each move) |
| **WHERE** | `src/lib/quest-grammar/*`, `FOUNDATIONS.md`, `.specify/memory/conceptual-model.md` |
| **Energy** | inner/outer energy asymmetry deferred → `energy-direction-volume` |
| **Personal throughput** | 5 moves, each enactable inner (develop) or outer (ally) |

## API / Type Contracts (API-First)

```ts
// src/lib/quest-grammar/types.ts
export type MoveAspect = 'inner' | 'outer'
export type AllyshipTarget = 'individual' | 'collective' | 'system'

export interface EnactedMove {
  move: PersonalMoveType
  aspect: MoveAspect
  /** Required when aspect === 'outer'; omitted for inner (self-directed). */
  target?: AllyshipTarget
}
```

```ts
// src/lib/quest-grammar/move-aspect.ts (new) — deterministic matrix
interface MoveAspectExpression { inner: string; outer: string }
const MOVE_ASPECT_MATRIX: Record<PersonalMoveType, MoveAspectExpression> = { /* per table above */ }

/** Deterministic description of an enacted move. No AI. */
export function describeMove(m: EnactedMove): string
/** Type guard: outer moves must carry a target. */
export function isValidEnactedMove(m: EnactedMove): boolean
```

- **No new external surface** in Phase 1–2. Phase 3 quest-grammar wiring is internal; Phase 4 UI adds a player-facing inner/outer choice (Server Action) — define before building, with a Verification Quest.

## User Stories

### P1: Take an ally move, not just a self move
**As a player**, I want to choose whether a move is **inner** (work on myself) or **outer** (act with/for others), so the game can represent allyship — not only personal development.
**Acceptance**: `EnactedMove` supports `aspect` + `target`; `describeMove` returns the correct inner/outer phrasing for all five moves; outer requires a target (validated).

### P2: Allyship works without AI
**As a Portland community member wary of AI**, I want outer allyship to be fully playable with deterministic, authored content, so the practice never depends on a language model.
**Acceptance**: the matrix is static data; all Phase 1–3 behavior is deterministic and offline-capable.

## Functional Requirements

### Phase 1 — Ontology / docs
- **FR1**: `FOUNDATIONS.md` — add the **move × aspect matrix** + the inner-allyship/outer-allyship definition; cite "Mastering the Game of Allyship" influence.
- **FR2**: `.specify/memory/conceptual-model.md` — add `MoveAspect`, `AllyshipTarget`, the matrix, and the aspect axis.

### Phase 2 — Types + deterministic matrix
- **FR3**: Add `MoveAspect`, `AllyshipTarget`, `EnactedMove` to `types.ts`.
- **FR4**: Add `move-aspect.ts` with `MOVE_ASPECT_MATRIX` (exhaustive over `PersonalMoveType`), `describeMove`, `isValidEnactedMove` (outer ⇒ target required).
- **FR5**: `npm run check` green; unit tests for the matrix (all 10 inner/outer phrasings) + target validation.

### Phase 3 — Quest-grammar wiring (deterministic)
- **FR6**: Bridge to [`integral-axes`](../integral-axes/spec.md): an outer-aspect move resolves to the **outer cell** of its domain in `MoveCellAffinity`; inner → inner cell. Surface aspect in generated quest framing (still cosmetic/narrative).
- **FR7**: Optional face-style modulation of outer phrasing via existing overlays — **read-only reuse**, no new face logic.

### Phase 4 — UX + persistence (later; Verification Quest required)
- **FR8**: Player-facing inner/outer choice on move-taking (Server Action); a `moveAspect` (+ optional target) persisted on `QuestMoveLog`. Full Prisma discipline.
- **FR9**: **Verification Quest** `cert-inner-outer-allyship-v1` (Twine + idempotent seed), framed toward the Bruised Banana Fundraiser (e.g. "take an outer Show Up to invite a guest").

## Non-Functional Requirements
- **Dual-track / no-AI-required**: deterministic matrix; offline-capable; AI only optional flavor.
- **Backward compatible**: existing moves default to `aspect: 'inner'`; outer is additive.
- **Community-sensitive**: outer allyship is the most public/relational surface — copy reviewed against the Portland AI-allergy guidance.
- **`packages/bars-core` parity** out of scope.

## Persisted data & Prisma (Phase 4 only)

| Check | Done |
|-------|------|
| Prisma fields named (`QuestMoveLog.moveAspect String?`, optional `allyshipTarget String?`) | ☐ |
| `tasks.md` includes `npx prisma migrate dev --name add_move_aspect` + commit `prisma/migrations/…` | ☐ |
| Verification: `npm run db:sync`; `npm run check` | ☐ |
| Human glanced at `migration.sql` (additive) | ☐ |

> Phases 1–3 ship **no** schema change.

## Out of Scope
- Energy asymmetry inner vs. outer → [`energy-direction-volume`](../energy-direction-volume/spec.md).
- Deep face/altitude conditioning of outer style (reuse existing overlays only).
- A formal `AllyshipTarget` entity/model (string-typed for now).
- `packages/bars-core` port.

## Open Questions
1. **Target taxonomy** — is `individual / collective / system` sufficient, or do outer moves need a richer target (e.g. a specific player, campaign, or NPC)? (Lean: start coarse; enrich when UX lands.)
2. **Energy of allyship** — does an outer move *spend* the ally's volume to benefit a target, or generate shared energy? Resolve with EDV.
3. **Reciprocity** — does an outer move on a target create a corresponding inner/outer hook for *that* target (the relational weave / Diplomat lens)? Future.
4. **with/for enactment** — *resolved as a seam* (see Design Decisions): with/for is the vertical reading of the face×outer-cell, faces inform the default. Open part: *when* it surfaces (which UX/phase) and *how* a face offers the shadow relationally without the engine passing judgment. Six Faces council (2026-06-16) consensus: record now, enact later.

## Dependencies / References
- Depends on: [`integral-axes`](../integral-axes/spec.md) (board + `aspect`), [`fifth-move-open-up`](../fifth-move-open-up/spec.md).
- Related: [`energy-direction-volume`](../energy-direction-volume/spec.md) (energy asymmetry).
- Influence: "Mastering the Game of Allyship" (Wendell Britt) — see `FOUNDATIONS.md` Framework Influences.
- Code: `src/lib/quest-grammar/{types,canonical-kernel,move-aspect}.ts`; overlays in `nation/` + archetype move styles.
- Verification: [cyoa-certification-quests](../cyoa-certification-quests/); Prisma (Phase 4): [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md).
</content>
