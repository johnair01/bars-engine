# Spec: Narrative Transformation Engine v0

**Strategy:** How ED fits campaign automation, NPC moves, and decks vs registry overlap — see [STRATEGIC_ALIGNMENT.md](./STRATEGIC_ALIGNMENT.md).

## Purpose

Add a bounded subsystem that converts a player's stuck narrative into a playable transformation loop. The engine parses narrative structure, detects lock types, generates transformation moves, links to Emotional Alchemy / 3-2-1, and produces quest seeds. Not a therapy engine—a psychotech gameplay layer for turning narrative rigidity into structured movement.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Parsing | Heuristic-first for v0; avoid full NLP. Deterministic where possible. |
| Lock detection | Simple categories: identity, emotional, action, possibility. |
| Move generation | WCGS (Wake Up, Clean Up, Grow Up, Show Up) via [Transformation Move Library](../transformation-move-library/spec.md). |
| Output | Quest seeds/templates, not full campaign quests. |
| Integration | Compatible with Emotional First Aid, 321 Shadow, quest grammar, BAR capture. |
| Safety | Prompts and options only; no hidden scoring or diagnostic authority. |

## Conceptual Model

| Element | Maps To |
|---------|---------|
| **WHO** | Actor (player or self-reference in narrative) |
| **WHAT** | State (emotion/condition), Object (what state attaches to) |
| **WHERE** | Lock type (identity, emotional, action, possibility) |
| **Energy** | Transformation move → emotional movement |
| **Throughput** | Quest seed → reflection + alchemy + action + BAR |

## API Contracts (API-First)

### POST /api/narrative-transformations/parse

**Input**: `{ rawText: string }`  
**Output**: `{ actor, state, object, negations?, confidence } | { error }`

### POST /api/narrative-transformations/moves

**Input**: `{ parseId?, parsed: ParsedNarrative, moveTypes?: string[] }`  
**Output**: `{ moves: TransformationMove[] } | { error }`

### POST /api/narrative-transformations/quest-seed

**Input**: `{ parsed, selectedMoves?, nationId?, archetypeKey?, context? }`  
**Output**: `{ wake_prompt, cleanup_prompt, grow_prompt, show_objective, bar_prompt } | { error }`

### POST /api/narrative-transformations/full

**Input**: `{ rawText, nationId?, archetypeKey?, context? }`  
**Output**: `{ parse, moves, alchemyPrompts?, quest321?, questSeed } | { error }`

## Data Models

### ParsedNarrative

```ts
{
  rawText: string
  actor: string
  state: string
  object: string
  negations?: string[]
  lockType?: 'identity' | 'emotional' | 'action' | 'possibility'
  confidence?: number
}
```

### TransformationMove

```ts
{
  moveId: string
  moveType: 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
  prompt: string
  targetEffect?: string
  sourceParseId?: string
}
```

### QuestSeed

```ts
{
  questSeedType: 'narrative_transformation'
  wake_prompt: string
  cleanup_prompt: string
  grow_prompt: string
  show_objective: string
  bar_prompt: string
}
```

## Functional Requirements

### Phase 1: Parse + Lock Detection

- **FR1**: Heuristic parser extracts actor, state, object from short narratives (e.g. "I am afraid of failing").
- **FR2**: Lock detector classifies into identity/emotional/action/possibility.
- **FR3**: Parse contract returns structured object with confidence.

### Phase 2: Transformation Moves

- **FR4**: Move catalog from [Transformation Move Library](../transformation-move-library/spec.md): WCGS (wake_up, clean_up, grow_up, show_up).
- **FR5**: Move generation returns prompts and target effects; nation/archetype overlay applied when context provided.
- **FR6**: Each move has move_id, move_type (WCGS), purpose, input requirements, output pattern.

### Phase 3: Emotional Alchemy Link

- **FR7**: Map narrative state to emotional channel (fear, shame, anger, confusion).
- **FR8**: Generate alchemy prompts (felt sense, somatic, WAVE).
- **FR9**: Compatible with existing [emotional-first-aid](src/actions/emotional-first-aid.ts) and [emotional-alchemy](src/lib/quest-grammar/emotional-alchemy.ts).

### Phase 4: 3-2-1 Link (Optional)

- **FR10**: Generate 3rd/2nd/1st person prompts for shadow work pathway.
- **FR11**: Compatible with 321 Shadow Process (CM).

### Phase 5: Quest Seed Generation

- **FR12**: Produce wake_prompt, cleanup_prompt, grow_prompt, show_objective, bar_prompt (one per WCGS stage).
- **FR13**: Quest seed compatible with quest grammar and CustomBar creation.

### Phase 6: Nation/Archetype Integration

- **FR14**: When nationId provided, apply [Nation Move Profiles](../../../docs/architecture/nation-move-profiles.md) overlay.
- **FR15**: When archetypeKey provided, apply archetype move style overlay.

## Non-Functional Requirements

- Deterministic where possible; AI fallback only when heuristics insufficient.
- No diagnostic authority; no hidden scoring.
- Bounded and inspectable; favor prompts and options.

## Dependencies

- [transformation-move-library](../transformation-move-library/spec.md) (EE)
- [emotional-first-aid](src/actions/emotional-first-aid.ts)
- [quest-grammar](src/lib/quest-grammar/)
- [321-efa-integration](../321-efa-integration/spec.md) (CM)

## References

- [docs/architecture/narrative-transformation-engine.md](../../../docs/architecture/narrative-transformation-engine.md)
- [docs/architecture/narrative-transformation-api.md](../../../docs/architecture/narrative-transformation-api.md)
- [docs/architecture/nation-move-profiles.md](../../../docs/architecture/nation-move-profiles.md)
- [docs/quest-bar-flow-grammar.md](../../../docs/architecture/quest-bar-flow-grammar.md)
