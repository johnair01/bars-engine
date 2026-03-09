# Narrative Transformation API v0

## Overview

API-first contracts for the Narrative Transformation Engine. Service-layer functions may be exposed as server actions or REST routes. UI-independent.

---

## POST /api/narrative-transformations/parse

Parse raw narrative text into structured components.

### Request

```json
{
  "rawText": "I am afraid of failing"
}
```

### Response

```json
{
  "rawText": "I am afraid of failing",
  "actor": "I",
  "state": "afraid",
  "object": "failing",
  "negations": [],
  "lockType": "emotional",
  "confidence": 0.78
}
```

### Errors

- `400`: Invalid or empty input
- `500`: Parse failure

---

## POST /api/narrative-transformations/moves

Generate candidate transformation moves from a parsed narrative.

### Request

```json
{
  "parsed": {
    "rawText": "I am afraid of failing",
    "actor": "I",
    "state": "afraid",
    "object": "failing",
    "lockType": "emotional"
  },
  "moveTypes": ["wake_up", "clean_up", "grow_up", "show_up"],
  "nationId": "argyra",
  "archetypeKey": "story_teller"
}
```

`moveTypes` is optional; omit to generate all WCGS moves. `nationId` and `archetypeKey` apply flavor overlays.

### Response

```json
{
  "moves": [
    {
      "moveId": "wake_observe_pattern",
      "moveType": "wake_up",
      "prompt": "What story are you telling yourself about failing?",
      "targetEffect": "increase awareness"
    },
    {
      "moveId": "cleanup_shadow_dialogue",
      "moveType": "clean_up",
      "prompt": "If fear could speak, what would it say?",
      "targetEffect": "shadow integration"
    }
  ]
}
```

---

## POST /api/narrative-transformations/quest-seed

Generate a quest seed from parsed narrative and optionally selected moves.

### Request

```json
{
  "parsed": {
    "rawText": "I am afraid of failing",
    "actor": "I",
    "state": "afraid",
    "object": "failing",
    "lockType": "emotional"
  },
  "selectedMoves": [...],
  "nationId": "argyra",
  "archetypeKey": "story_teller",
  "context": {
    "questId": null,
    "campaignId": null
  }
}
```

### Response

```json
{
  "questSeedType": "narrative_transformation",
  "wake_prompt": "What story are you telling yourself about failing?",
  "cleanup_prompt": "If fear could speak, what would it say?",
  "grow_prompt": "What might failing be trying to teach you?",
  "show_objective": "Take one small action today where imperfect completion is allowed.",
  "bar_prompt": "Capture what you learned from taking this imperfect step."
}
```

---

## POST /api/narrative-transformations/full

One-shot: parse + moves + alchemy + 3-2-1 + quest seed.

### Request

```json
{
  "rawText": "I am afraid of failing",
  "nationId": "argyra",
  "archetypeKey": "story_teller",
  "context": {}
}
```

### Response

```json
{
  "parse": {
    "rawText": "I am afraid of failing",
    "actor": "I",
    "state": "afraid",
    "object": "failing",
    "lockType": "emotional",
    "confidence": 0.78
  },
  "moves": [...],
  "alchemyPrompts": {
    "feltSense": "Where do you feel the fear in your body?",
    "channel": "fear / metal",
    "suggestedMove": "WAVE + small-risk action"
  },
  "quest321": {
    "thirdPerson": "Failure is always watching me",
    "secondPerson": "Failure, what are you trying to show me?",
    "firstPerson": "I am the part that fears collapse and wants protection"
  },
  "questSeed": {
    "questSeedType": "narrative_transformation",
    "wake_prompt": "...",
    "cleanup_prompt": "...",
    "grow_prompt": "...",
    "show_objective": "...",
    "bar_prompt": "..."
  }
}
```

---

## Service-Layer Equivalents

If the project prefers server actions over REST:

| Route | Server Action |
|-------|---------------|
| POST /parse | `parseNarrative(rawText: string)` |
| POST /moves | `generateTransformationMoves(parsed, moveTypes?, nationId?, archetypeKey?)` |
| POST /quest-seed | `generateQuestSeed(parsed, selectedMoves?, nationId?, archetypeKey?, context?)` |
| POST /full | `transformNarrativeFull(rawText, nationId?, archetypeKey?, context?)` |

Export from `src/actions/narrative-transformation.ts` or `src/lib/narrative-transformation/`.
