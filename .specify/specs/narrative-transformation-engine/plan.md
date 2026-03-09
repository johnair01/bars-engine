# Plan: Narrative Transformation Engine v0

## Overview

Implement a bounded transformation pipeline: Narrative Input → Parse → Boundary Detection → Transformation Move Generation → Emotional Alchemy Link → Quest Seed. Use heuristic parsing and a small move catalog. Integrate with Emotional First Aid, 321 Shadow, and quest grammar without overbuilding.

## Phases

### Phase 1: Foundation (Parse + Lock Detection)

- Add `src/lib/narrative-transformation/` module.
- Implement heuristic parser: extract actor, state, object from patterns like "I am X of Y", "I can't X", "I'm just this way".
- Implement lock detector: identity, emotional, action, possibility.
- Define types: `ParsedNarrative`, `LockType`.
- Unit tests for parse and lock detection.

### Phase 2: Transformation Moves

- Define move catalog: Perspective Shift, Boundary Disruption, Energy Reallocation.
- Implement move generator: given parsed narrative + lock type, return candidate moves.
- Define `TransformationMove` type.
- Unit tests for move generation.

### Phase 3: Emotional Alchemy + 3-2-1 Link

- Map state → emotional channel (fear, shame, anger, confusion).
- Generate alchemy prompts (felt sense, somatic, WAVE).
- Generate optional 3-2-1 prompts (3rd/2nd/1st person).
- Integrate with existing `emotional-alchemy.ts` and 321 tool.

### Phase 4: Quest Seed Generation

- Implement quest seed generator: reflection, alchemy, action experiment, BAR prompt.
- Ensure output compatible with quest grammar and BAR creation.
- Define `QuestSeed` type.

### Phase 5: API + Integration

- Add server actions or API routes: parse, moves, quest-seed, full.
- Wire into Emotional First Aid intake (optional: suggest transformation pathway when issueText present).
- Documentation: architecture, API, examples.

## Implementation Layout

```
src/lib/narrative-transformation/
  index.ts
  parse.ts
  lockDetection.ts
  moves.ts
  alchemyLink.ts
  quest321.ts
  questSeed.ts
  types.ts
  __tests__/
    parse.test.ts
    lockDetection.test.ts
    moves.test.ts
    questSeed.test.ts
```

## Out of Scope (v0)

- Full NLP or linguistic theory.
- Conversational agent or multi-turn inference.
- Rich therapy dialogue.
- Massive ontology of psychological states.
