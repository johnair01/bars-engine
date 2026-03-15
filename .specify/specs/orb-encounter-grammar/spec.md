# Spec: Orb Encounter Grammar v0

**Feature:** `orb_encounter_grammar`
**Source doc:** `orb_encounter_grammar_spec.md`
**Ambiguity score:** 0.17
**Date:** 2026-03-14

---

## Objective

Implement an encounter engine that generates the feeling of:
- ordinary reality becoming thin
- an unexpected intelligence making contact
- the player being noticed by the world
- a meaningful interpretive choice
- a consequential world response
- a playable continuation

The engine extracts and operationalizes the **experience grammar** that makes Orb-style encounters work, modulated by the six faces of the Game Master.

The core experiential contract: **"something in this world noticed me."**

---

## Canonical Encounter Structure (7 phases)

Every Orb-style encounter contains these phases in sequence:

1. **Context** — mundane grounding (commuting, waiting, preparing)
2. **Anomaly** — frame break (voice, impossible object, pattern, NPC, inner prompt)
3. **Contact** — anomaly reveals as intelligence; player is addressed
4. **Interpretation** — player decides what kind of thing this is (skepticism, curiosity, reverence, resistance, analysis, openness)
5. **Decision** — meaningful player move (answer, step closer, challenge back, withdraw, observe, accept)
6. **World Response** — system answers the player's move; consequence is real
7. **Continuation** — leaves behind momentum; emits structured outputs

---

## The Six GM Faces (Modulators)

GM faces are **not** separate engines. They modulate the same encounter grammar.

| Face | Primary Function | Anomaly Style | Contact Voice | Artifact Affinity |
|------|-----------------|---------------|---------------|-------------------|
| **Shaman** | Threshold, mystery, initiation | Numinous | Mythic/ritual | memory_entry |
| **Challenger** | Testing, confrontation, courage | Provocative | Taunting/daring | quest_hook |
| **Regent** | Authority, coherence, law | Official/undeniable | World asserting jurisdiction | obligation |
| **Architect** | Structure, pattern, logic | Patterned/arranged | Puzzle/map | orientation |
| **Diplomat** | Relationship, translation, trust | Socially meaningful | Empathic/inviting | relationship_update |
| **Sage** | Spaciousness, witness, transcendence | Subtle/quiet | Says little | contemplation |

Each face modulates: anomaly style, contact voice, interpretation pressure, response style, artifact affinity.

---

## Relationship to Emotional Alchemy

Orb encounters are a **scene form** through which Emotional Alchemy becomes playable.

```
emotional vector → growth direction
GM face → encounter style
orb grammar → scene structure
Scene DSL → rendering
```

Example:
- `fear:dissatisfied → fear:neutral` + GM face: `architect`
- Result: context=unclear problem, anomaly=hidden map appears, contact=system notices confusion, decision=ask/inspect/withdraw, response=orientation increases

---

## v0 Scope

- **1 emotional vector:** `fear:dissatisfied → fear:neutral`
- **3 GM faces:** Architect, Challenger, Sage
- **3 anomaly types:** unexpected voice, impossible pattern, sudden NPC appearance
- **3 encounter seeds** (one per anomaly type)

---

## API Endpoints

### POST `/api/orb-encounters/generate`

Request:
```json
{
  "player_id": "string",
  "campaign_id": "string",
  "gm_face": "architect",
  "emotional_state": { "channel": "fear", "altitude": "dissatisfied" },
  "target_vector": { "channel": "fear", "from_altitude": "dissatisfied", "to_altitude": "neutral" },
  "context": { "campaign_phase": "string", "active_bars": [], "identity": { "nation": "string", "archetype": "string" } }
}
```

Response:
```json
{
  "encounter_id": "string",
  "grammar": { "context": {}, "anomaly": {}, "contact": {}, "interpretation": {}, "decision": {}, "world_response": {}, "continuation": {} },
  "gm_face": "architect",
  "scene_dsl": {},
  "artifact_affinities": ["bar_seed", "quest_hook"]
}
```

### POST `/api/orb-encounters/:encounter_id/resolve`

Request: `{ "choice_id": "string", "player_id": "string" }`

Response: `{ "world_response": {}, "state_updates": { "emotional_state": {}, "relationship_updates": [], "artifacts_emitted": [] }, "next_scene": {} }`

### POST `/api/orb-encounters/preview`

Purpose: Preview how the same skeleton changes under different GM faces (authoring/tuning tool).

Request: `{ "encounter_seed": {}, "gm_faces": ["shaman", "challenger", "sage"] }`

Response: `{ "previews": [{ "gm_face": "shaman", "modulated_encounter": {} }, ...] }`

---

## Data Models

- `orb_encounter_seeds` — canonical seed library (context_type, anomaly_type, contact_type, decision_type, artifact_affinities, allowed_vectors)
- `orb_encounters` — generated encounter instances (player, seed, gm_face, grammar JSON, scene_dsl JSON, status)
- `orb_encounter_resolutions` — player choice + world response record
- `gm_face_modifiers` — per-face modulation schema (anomaly_style, contact_voice, interpretation_pressure, response_style, artifact_affinity)
- `orb_artifact_emissions` — artifacts emitted from encounter resolution

---

## Acceptance Criteria

1. System generates Orb-style encounter from player state + GM face
2. Same encounter skeleton modulated by different GM faces produces distinct experiences
3. Encounter compiles to Scene DSL
4. Player makes a meaningful interpretive choice
5. World responds reflecting both GM face and player's move
6. Encounter emits continuation artifacts or state changes
7. Emotional vector and GM modulation remain distinct and legible in code
