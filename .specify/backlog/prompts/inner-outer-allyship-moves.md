# Spec Kit Prompt: Inner / Outer Allyship — Move Aspect Grammar

## Role
You are a Spec Kit agent giving allyship a move grammar.

## Objective
The five WAVE moves encode only **inner allyship** (self-development). Add the **outer** expression of each move — **outer allyship** = enacting in others'/collective right-hand quadrants, across the six face-levels and the four domains. Not a new move set: each move gains `aspect: 'inner' | 'outer'`, and outer moves carry an `AllyshipTarget`. The grammar is **authored data, not AI-generated** (dual-track, offline-capable, community-safe).

## Prompt (API-First)
> Implement Inner/Outer Allyship per [.specify/specs/inner-outer-allyship-moves/spec.md](../../specs/inner-outer-allyship-moves/spec.md). **API-first + deterministic**: land `MoveAspect` / `AllyshipTarget` / `EnactedMove` types and the authored `MOVE_ASPECT_MATRIX` (`move-aspect.ts`) before wiring/UI. Outer aspect resolves to the **outer cell** of the move's domain via `MoveCellAffinity`. Depends on `integral-axes`.

## Requirements
- **Surfaces**: none Phase 1–3 (ontology + quest-grammar internals); Phase 4 player inner/outer choice (Verification Quest required).
- **Mechanics**: move × aspect matrix; outer requires a target (individual/collective/system); faces modulate outer *style* via existing overlays (read-only).
- **Persistence**: deferred to Phase 4 — `QuestMoveLog.moveAspect` (+ optional `allyshipTarget`), full migration discipline.
- **API**: `EnactedMove { move, aspect, target? }`; `describeMove`, `isValidEnactedMove` (outer ⇒ target).
- **Verification**: matrix unit tests; `cert-inner-outer-allyship-v1` when UI lands.

## Checklist (API-First Order)
- [ ] `MoveAspect` / `AllyshipTarget` / `EnactedMove` types
- [ ] `MOVE_ASPECT_MATRIX` + `describeMove` + `isValidEnactedMove` (deterministic, exhaustive)
- [ ] Phase 3 bridge: outer aspect → outer domain cell
- [ ] Phase 4 only: `migrate dev` + commit `prisma/migrations/`; Verification Quest
- [ ] `npm run build` + `npm run check` — fail-fix

## Deliverables
- [x] .specify/specs/inner-outer-allyship-moves/spec.md
- [x] .specify/specs/inner-outer-allyship-moves/plan.md
- [x] .specify/specs/inner-outer-allyship-moves/tasks.md
- [ ] BACKLOG.md entry (assign next ID; **depends on** `integral-axes`) + `npm run backlog:seed`

## Dual-track note
Outer allyship is the most public/relational surface. Keep the **non-AI path first-class** (Portland community AI allergy). The matrix is deterministic; AI is optional flavor only.
</content>
