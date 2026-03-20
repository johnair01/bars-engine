# Narrative Transformation Engine

**Spec:** [.specify/specs/narrative-transformation-engine/spec.md](../../.specify/specs/narrative-transformation-engine/spec.md)  
**Strategy:** [.specify/specs/narrative-transformation-engine/STRATEGIC_ALIGNMENT.md](../../.specify/specs/narrative-transformation-engine/STRATEGIC_ALIGNMENT.md)

## Pipeline

```text
rawText
  → parseNarrative (actor, state, object, negations, lock_type)
  → selectDefaultMoveIds (WCGS slots → registry move_id)
  → assembleQuestSeed (transformation-move-registry)
```

Optional enrichments (Phase 3):

- **`buildTransformationHints`** — registry `EmotionChannel` (keyword heuristic), `deriveMovementPerNode` from [emotional-alchemy.ts](../../src/lib/quest-grammar/emotional-alchemy.ts), and a **321-style person triad** (third / second / first) for UI copy — not a full 321 session.
- **`renderContext`** on `assembleQuestSeed` — fills `{emotion_channel}`, `{nation_name}`, `{archetype_name}` in move prompt templates.

## Code

| Module | Role |
|--------|------|
| `src/lib/narrative-transformation/parse.ts` | Heuristic parse |
| `src/lib/narrative-transformation/lockDetection.ts` | Lock type |
| `src/lib/narrative-transformation/moves.ts` | Default move IDs |
| `src/lib/narrative-transformation/seedFromNarrative.ts` | `buildQuestSeedFromText` |
| `src/lib/narrative-transformation/alchemyHints.ts` | Channel + movement + 321 strings |
| `src/lib/narrative-transformation/fullPipeline.ts` | `runNarrativeTransformationFull` |

**Canonical moves:** [transformation-move-registry](../../src/lib/transformation-move-registry/) — ED does not duplicate the catalog.

## HTTP (optional)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/narrative-transformations/parse` | `{ "rawText": string }` | `{ parse }` |
| `POST` | `/api/narrative-transformations/full` | `{ "rawText": string, "archetypeKey"?: string, ... }` | `{ parse, hints, questSeed }` |

No auth in v0; call from server or lock down behind admin when exposing publicly.

## Tests

```bash
npm run test:narrative-transformation
```

## Example (library)

```ts
import { runNarrativeTransformationFull } from '@/lib/narrative-transformation/fullPipeline'

const { parse, hints, questSeed } = runNarrativeTransformationFull(
  "I'm afraid I'll disappoint everyone.",
  { archetypeKey: 'truth-seer' }
)
// hints.emotion_channel → 'fear'
// hints.movement_per_node →  six-beat translate/transcend hint
// questSeed.arc → wake/clean/grow/show/integrate prompts
```
