# Plan: Transformation Move Library v1

## Overview

Implement the three-layer transformation move catalog: Core WCGS, Nation Move Overlay, Archetype Move Style. Integrate with Narrative Transformation Engine. Update quest seed shape to WCGS-aligned (wake_prompt, cleanup_prompt, grow_prompt, show_objective, bar_prompt).

## Phases

### Phase 1: Core Moves

- Add `src/lib/narrative-transformation/moves/core-moves.ts`.
- Define core move catalog with prompt templates per WCGS.
- Each move: moveId, moveType, promptTemplate, compatibleLockTypes.
- Template substitution: {actor}, {state}, {object}.

### Phase 2: Nation Move Profiles

- Add `src/lib/narrative-transformation/moves/nation-profiles.ts`.
- Define NationMoveProfile: preferred_move_types, move_modifiers, example prompts per nation.
- Nations: argyra, pyrakanth, lamenth, virelune, meridia.
- Map to Nation model element (metal, fire, water, wood, earth).

### Phase 3: Archetype Move Style

- Add `src/lib/narrative-transformation/moves/archetype-profiles.ts`.
- Define ArchetypeMoveProfile: move_style, preferred_core_moves.
- Archetypes from nations.ts ARCHETYPE_KEYS.

### Phase 4: Selection Logic

- Add `src/lib/narrative-transformation/moves/selectMoves.ts`.
- Implement: selectMoves(parsed, nationId?, archetypeKey?) → TransformationMove[].
- Implement: generateQuestSeed(parsed, selectedMoves, nationId?, archetypeKey?) → QuestSeed.

### Phase 5: Integration

- Update Narrative Transformation Engine types and move generation.
- Update quest seed shape in API.
- Unit tests for selection, nation overlay, archetype overlay.

## Implementation Layout

```
src/lib/narrative-transformation/
  moves/
    core-moves.ts
    nation-profiles.ts
    archetype-profiles.ts
    selectMoves.ts
    index.ts
  types.ts  (update TransformationMove, QuestSeed)
  __tests__/
    selectMoves.test.ts
```
