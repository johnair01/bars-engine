# Data Model — Base BAR Move vs. Overlays (Nation / Face / CYOA)

> Status: design (map-first, pre-build). Captures the ground-up disambiguation
> raised 2026-06-17: **BARs personal throughput must not require Nation off the
> jump.** Inner/outer aspect belongs to the *base* move, not the Nation overlay.
> See spec.md (FR8 persistence) — this corrects where Phase 4 stored aspect.

## The layering

The five WAVE moves are the **base personal-throughput schema**. Nation (element),
Face (altitude), and CYOA are **overlays/surfaces** on top of the same base move —
the integral model the IOA/IAX specs already describe, now reflected in data.

| Layer | Concept | Move identity | Nation required? | Persisted on |
|-------|---------|---------------|------------------|--------------|
| **0 — Base BAR throughput** | personal development; the substrate | `moveType: PersonalMoveType` (wake/open/clean/grow/show) | **No** | `CustomBar.moveType` |
| **0 — Aspect (this work)** | inner (self) vs outer (allyship) + target | `moveAspect`, `allyshipTarget` | **No** | `CustomBar` (**to add**) |
| **0 — Domain (WHERE)** | allyship domain | `allyshipDomain` | No | `CustomBar.allyshipDomain` |
| **1 — World orientation** | Nation/element styling & nation moves | `NationMove` | Yes (after orientation) | `CustomBar.nation` / `QuestMoveLog` |
| **2 — Altitude** | GM Face register (Phase 3 healthy register) | `gameMasterFace` | No | `CustomBar.gameMasterFace` |
| **Surface — CYOA** | authoring/presentation over base moves | choices carry `moveType` | No | `createBarFromMoveChoice` → CustomBar |

`CustomBar` is already the convergence point: it carries `moveType`, `allyshipDomain`,
`nation`, `archetype`, `gameMasterFace` — all nullable, all base-first. Aspect is the
only missing field.

## The correction

Phase 4 added `moveAspect` / `allyshipTarget` to **`QuestMoveLog`**, whose `moveId`
is a **required FK to `NationMove`**. Consequence: *you cannot record an inner/outer
aspect for a base BAR move without first having a Nation* — the exact coupling we are
removing. Aspect is a property of the base move (`EnactedMove.move: PersonalMoveType`,
already so typed in `types.ts`), so it must live at Layer 0.

### Source of truth
- **`CustomBar.moveAspect` + `CustomBar.allyshipTarget` = the canonical record** of a
  base move's enactment direction.
- `QuestMoveLog.moveAspect/allyshipTarget` (Phase 4 columns) **demote to a secondary
  echo** for the Nation-overlay path only. Kept nullable (already applied to the DB);
  not the primary home. May be dropped in a later squash once nothing reads them.

## Base move-enactment record (Layer 0)

The existing grammar type is unchanged and is the in-memory shape:

```ts
// src/lib/quest-grammar/types.ts (already exists)
interface EnactedMove {
  move: PersonalMoveType            // base — no Nation
  aspect: MoveAspect                // 'inner' | 'outer'
  target?: AllyshipTarget           // required when outer
}
```

Persisted form = the columns already on `CustomBar` plus the two to add:

```
CustomBar.moveType        String?   // PersonalMoveType        (exists)
CustomBar.allyshipDomain  String?   // domain / WHERE          (exists)
CustomBar.moveAspect      String?   // 'inner' | 'outer'       (ADD)
CustomBar.allyshipTarget  String?   // individual|collective|system (ADD)
CustomBar.gameMasterFace  String?   // altitude overlay        (exists)
CustomBar.nation          String?   // world overlay           (exists)
```

No new table: a base move enactment **is** a CustomBar of the throughput. Aspect
joins `moveType` as a sibling column, consistent with `allyshipDomain`.

## Migration plan (additive, safe; build step — not yet executed)

1. `prisma/schema.prisma` — add `CustomBar.moveAspect String?` + `CustomBar.allyshipTarget String?`.
2. New migration `add_custom_bar_move_aspect` (ADD COLUMN ×2). Additive, nullable —
   no backfill, no breakage. (Phase 4's `add_move_aspect` on `quest_move_logs` stays.)
3. `create-bar.ts` and `create-bar-from-move-choice.ts` — set `moveAspect`/`allyshipTarget`
   beside the existing `moveType`. Validate the invariant with `isValidAspectTarget`
   (outer ⇒ target; inner ⇒ none) — reuse, do not re-implement.
4. Retarget the Server Action: `recordEnactedMove` writes to the base `CustomBar`
   (Nation-free), not `QuestMoveLog`. `moveId`/NationMove drops out of the base
   contract; questId/barId + aspect/target remain.
5. UI: the **inline Inner|Outer segmented control** (chosen treatment) lives on the
   base / CYOA move-taking surface, never gated on `player.nationId`.

## What this does NOT change
- The grammar (`move-aspect.ts`, `resolveMoveCell`, `describeMove`, face register) —
  already base-correct and Nation-free.
- The with/for shadow — still a documented seam, never encoded (engine does not judge).
- Phase 3 deliverables and the verification quest.

## Open items
- Whether to **revert** the Phase 4 `QuestMoveLog` columns now (PR #120 open) or leave
  them as the demoted echo. Lean: leave (already applied; nullable; harmless).
- Does the Nation-move path (`nation-moves.ts`) also write aspect to the base CustomBar
  it creates, so Layer 0 stays the single source even when entered via a Nation move?
  Lean: yes — Nation move is an overlay *expression* of a base move.
