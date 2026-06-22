# Spec Kit Prompt: Integral Axes — Allyship Domain inner/outer

## Role
You are a Spec Kit agent implementing the inner/outer (left-hand/right-hand) refinement of the engine's allyship domains.

## Objective
The fifth move (Open Up) exposed that `WAVE_TO_DOMAIN` and `ELEMENT_TO_DOMAINS` are one-dimensional. Add the interior/exterior axis: each of the 4 domains gains `inner`/`outer` cells (8-cell board). The 5 WAVE moves are the inner column; Grow Up is an ordinary inner move (vertical altitude lives in the Six Faces, not in moves). Energy direction×volume is a **separate dependent spec** (`energy-direction-volume`).

## Prompt (API-First)
> Implement Integral Axes per [.specify/specs/integral-axes/spec.md](../../specs/integral-axes/spec.md). **API-first**: land `AllyshipAspect` / `MoveCellAffinity` (types.ts) before consumers. Replace `WAVE_TO_DOMAIN` with `MOVE_CELL_AFFINITY`, keeping `pickExperienceForPlayer`'s string return (cosmetic-only). No `altitude` field on moves. Persistence (`allyshipDomainAspect`) deferred to Phase 3.

## Requirements
- **Surfaces**: none in Phase 1–2 (ontology + quest-grammar internals); UI deferred (Verification Quest required when it lands).
- **Mechanics**: domain×aspect board; moves map to inner cells; Open Up & Grow Up share Gather Resource (inner).
- **Persistence**: deferred to Phase 3 — `allyshipDomainAspect String?` on `CustomBar`/`Instance` with full migration discipline.
- **API**: no new external surface; `pickExperienceForPlayer` signature unchanged; `moveDomain()` is the seam.
- **Verification**: `npm run check` per phase (exhaustiveness over `PersonalMoveType`).

## Checklist (API-First Order)
- [ ] `AllyshipAspect` + `MoveCellAffinity` types defined (no `altitude` field)
- [ ] `WAVE_TO_DOMAIN` → `MOVE_CELL_AFFINITY`; `pickExperienceForPlayer` signature unchanged
- [ ] Phase 3 only: `migrate dev` + commit `prisma/migrations/`
- [ ] `npm run build` + `npm run check` — fail-fix

## Deliverables
- [x] .specify/specs/integral-axes/spec.md
- [x] .specify/specs/integral-axes/plan.md
- [x] .specify/specs/integral-axes/tasks.md
- [ ] BACKLOG.md entry (assign next ID; depends on `fifth-move-open-up`) + `npm run backlog:seed`

## Live frontier (not in scope)
The outer/allyship column has no move grammar yet — the WAVE moves are all inner. See spec Open Question §1.
</content>
