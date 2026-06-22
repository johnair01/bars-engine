# Plan: Inner / Outer Allyship — Move Aspect Grammar

> Implement per [spec.md](./spec.md). **API-first + deterministic**: land `MoveAspect` / `AllyshipTarget` / `EnactedMove` types and the authored `MOVE_ASPECT_MATRIX` before any wiring or UI. Depends on [`integral-axes`](../integral-axes/spec.md).

## Architectural strategy

The grammar is **authored data, not generated** — this is the deftness move and the dual-track guarantee (works offline, no AI). Phases 1–3 are deterministic and low-risk; the only gameplay/UX surface (and its Verification Quest) is Phase 4.

Aspect rides on the structure `integral-axes` already built: `MoveCellAffinity.aspect`. An outer move resolves to the **outer cell** of its domain; inner → inner cell. So Phase 3 is mostly a bridge, not new machinery.

The one genuinely new structural idea: **outer moves carry a target.** Inner moves are self-directed; outer moves act on an `AllyshipTarget`. That asymmetry is the seam where "allyship" becomes first-class — enforce it with a type guard (`isValidEnactedMove`).

## Critical files

| File | Change |
|------|--------|
| `FOUNDATIONS.md` | move × aspect matrix + inner/outer allyship definition |
| `.specify/memory/conceptual-model.md` | `MoveAspect`, `AllyshipTarget`, matrix, aspect axis |
| `src/lib/quest-grammar/types.ts` | `MoveAspect`, `AllyshipTarget`, `EnactedMove` |
| `src/lib/quest-grammar/move-aspect.ts` (new) | `MOVE_ASPECT_MATRIX`, `describeMove`, `isValidEnactedMove` |
| `src/lib/quest-grammar/canonical-kernel.ts` | bridge: outer aspect → outer domain cell (via `MoveCellAffinity`) |
| `prisma/schema.prisma` | **Phase 4 only** — `QuestMoveLog.moveAspect` (+ `allyshipTarget`) |

## Trade-offs & decisions

- **Aspect parameter over a second move set.** Five moves × 2 aspects is simpler and truer than 10 moves; it keeps the WAVE intact and reuses the board's `aspect`.
- **Target required only for outer.** Models the real asymmetry without burdening inner moves. Coarse taxonomy first (individual/collective/system); a target *entity* deferred.
- **Deterministic matrix.** Offline-capable, community-safe, testable. AI is optional flavor on top, never load-bearing.
- **Face modulation = read-only reuse.** Don't build new altitude logic here; borrow existing overlays so scope stays contained.

## Verification approach

- Phase 2: unit tests for all 10 inner/outer phrasings + `isValidEnactedMove` (outer without target ⇒ invalid).
- Phase 3: assert outer aspect resolves to the outer domain cell; inner unchanged.
- Phase 4: Verification Quest `cert-inner-outer-allyship-v1` + Prisma discipline.

## Sequencing

**Blocked on** `integral-axes` Phase 2 (the `aspect`-bearing `MoveCellAffinity`).
Phase 1 (docs) → Phase 2 (types + matrix, shippable alone) → Phase 3 (grammar bridge) → Phase 4 (UX + persistence + Verification Quest).
</content>
