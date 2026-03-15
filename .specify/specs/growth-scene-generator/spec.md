# Spec: Growth Scene Generator v0

**Feature:** `growth_scene_generator`
**Source doc:** `growth_scene_generator_spec.md`
**Ambiguity score:** 0.16
**Date:** 2026-03-14

---

## Objective

Implement a procedural scene generator that produces playable narrative scenes based on Emotional Alchemy vectors.

The generator transforms:

```
player emotional state → growth vector → scene template → Scene DSL → playable cards → artifact emissions
```

This is the **core gameplay loop** of BARs Engine.

---

## Core Loop

```
player emotional state
→ growth vector determined
→ scene template selected (deterministic, via selectScene)
→ Scene DSL compiled
→ cards rendered
→ player choice
→ NPC animates response (via NPC constitution verb)
→ artifact emitted (BAR / quest / vibeulon)
→ emotional state updated
```

---

## Inputs

```
player_emotional_state  (channel + altitude)
campaign_phase
active_bars
player_identity         (archetype + nation)
```

---

## Emotional Alchemy Rules

Channels: `fear | anger | sadness | joy | neutrality`
Altitudes: `dissatisfied | neutral | satisfied`

Growth vectors move upward (dissatisfied → neutral → satisfied).

v0 requires only **3 vectors**:
- `fear:dissatisfied → fear:neutral`
- `anger:dissatisfied → anger:neutral`
- `sadness:dissatisfied → sadness:neutral`

Each vector has **3 scene templates** = 9 total for v0.

---

## Scene DSL Format

```yaml
scene_id: fog_001
vector: fear:dissatisfied→fear:neutral
cards:
  - text: "The situation has become unclear."
  - text: "You notice tension in your chest."
  - text: "Something here wants clarification."
choices:
  - ask_a_question
  - summarize_the_problem
  - withdraw
```

---

## NPC Integration

NPCs **animate** scenes; they do not generate them.

```
scene generated → NPC selected via constitution → NPC performs scene verb
```

Allowed verbs: `reveal_lore | ask_question | challenge_player | affirm_player | offer_quest_seed | reflect_bar | redirect_scene | deepen_scene | handoff_to_other_npc`

---

## Artifact Emission

Possible emissions: `BAR | quest_hook | vibeulon | relationship_update | memory_entry`

Emission must pass:
1. Emotional Alchemy legality
2. Campaign phase validation
3. Regent GM oversight

---

## API Endpoints

### POST `/api/growth-scenes/generate`

Request:
```json
{
  "player_id": "string",
  "emotional_state": { "channel": "fear", "altitude": "dissatisfied" },
  "campaign_phase": "stage_1",
  "active_bars": []
}
```

Response:
```json
{
  "scene_id": "string",
  "vector": "fear:dissatisfied→fear:neutral",
  "scene_dsl": {}
}
```

### POST `/api/growth-scenes/resolve`

Request:
```json
{ "scene_id": "string", "choice": "ask_a_question" }
```

Response:
```json
{
  "emotional_state_update": {},
  "artifacts_emitted": [],
  "npc_actions": []
}
```

---

## Acceptance Criteria

1. System reads player emotional state
2. Correct growth vector computed
3. Scene template selected deterministically
4. Scene DSL produced
5. Cards render in UI
6. Player choices resolve scene
7. NPC animates outcome via constitution verb
8. Artifact emission occurs
9. Emotional state updates
10. Loop continues
