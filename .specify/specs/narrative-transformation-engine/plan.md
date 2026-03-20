# Plan: Narrative Transformation Engine v0

**Strategy:** [STRATEGIC_ALIGNMENT.md](./STRATEGIC_ALIGNMENT.md) — registry owns moves + `assembleQuestSeed`; ED is text → `ParsedNarrative` → registry.

## Overview

Bounded pipeline: **raw text → parse + lock** (ED) → **move selection + quest seed** ([transformation-move-registry](../transformation-move-registry/spec.md)). No second move catalog.

## Phases

### Phase 1 — Parse + lock *(done)*

- `src/lib/narrative-transformation/`: `parse.ts`, `lockDetection.ts`, `types.ts`, tests.

### Phase 2 — Registry glue

- **`moves.ts` (thin):** Map `NarrativeParseResult` + optional overrides → default **registry `move_id` bundle** (wake/clean/grow/show/integrate) using `getMovesByLockType` / `getMovesByStageAndLock` — not new named moves.
- **`seedFromNarrative.ts` (or `questSeed.ts`):** Call `assembleQuestSeed` from `@/lib/transformation-move-registry` with parsed narrative + lock + bundle; re-export or narrow type for callers.
- Unit tests: selection + seed shape (deterministic fixtures).

### Phase 3 — Hints + HTTP *(shipped; optional for product)*

- **`alchemyHints.ts`:** emotion channel, `deriveMovementPerNode`, 321-style person triad; registry `assembleQuestSeed(..., { renderContext })` for template placeholders.
- **API:** `POST /api/narrative-transformations/parse` | `/full`.
- **Docs:** `docs/architecture/narrative-transformation-engine.md` (includes example).

## Layout (target)

```
src/lib/narrative-transformation/
  index.ts
  types.ts
  parse.ts
  lockDetection.ts
  moves.ts              # default move-id selection → registry
  seedFromNarrative.ts  # assembleQuestSeed wrapper
  alchemyHints.ts       # channel + movement + 321 triad
  fullPipeline.ts       # parse + hints + seed (API)
  __tests__/
```

## Out of scope

- Duplicate WCGS / “Perspective Shift” catalogs in ED.
- Full NLP, multi-turn dialogue, therapy UX.
- Campaign automation, NPC turn logic, deck state (other specs).
