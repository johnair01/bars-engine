# Spec Kit Feature Request
## Orb Encounter Grammar v0
### API-First Encounter Engine for Game Master–Modulated Anomaly Scenes

Status: Draft for implementation  
Purpose: Define a canonical encounter grammar for Orb-style anomaly scenes in BARs Engine, with modulation by the six faces of the Game Master.

---

# 1. Objective

Implement an encounter engine that creates the feeling of:

- ordinary reality becoming thin
- an unexpected intelligence making contact
- the player being noticed by the world
- a meaningful interpretive choice
- a consequential world response
- a playable continuation

This feature should not copy *The Orb Evaluation*.
It should extract and operationalize the **experience grammar** that makes that style of encounter work.

The encounter engine must support six Game Master faces as modulating intelligences:

- Shaman
- Challenger
- Regent
- Architect
- Diplomat
- Sage

These faces do not replace the encounter structure.
They alter how the structure is expressed.

---

# 2. Core Design Principle

The world does not merely present content.
The world **notices** the player.

Orb-style encounters are not primarily about plot.
They are about **contact with intelligence**.

The encounter grammar must therefore generate:

- context
- anomaly
- contact
- interpretation
- decision
- world response
- continuation

This sequence is canonical.

---

# 3. Canonical Encounter Structure

Every Orb-style encounter contains the following phases.

## 3.1 Context

A recognizable mundane situation.

Purpose:
- ground the player
- lower skepticism
- establish the ordinary world

Example functions:
- commuting
- waiting
- reading
- preparing
- wandering
- working
- resting

## 3.2 Anomaly

Something breaks the frame of the ordinary.

Purpose:
- create rupture
- produce attention
- initiate wonder, tension, or challenge

Examples:
- a voice speaks unexpectedly
- an object behaves impossibly
- a pattern appears
- an NPC enters without introduction
- a question appears in the player's mind

## 3.3 Contact

The anomaly reveals itself as an intelligence or presence.

Purpose:
- shift from strangeness to relationship
- create the sensation of being addressed

Examples:
- the world asks a question
- an NPC directly notices the player
- a force invites participation
- a scene becomes dialogic

## 3.4 Interpretation

The player must decide what kind of thing this encounter is.

Purpose:
- require meaning-making
- activate the player's epistemic stance

Interpretive moves may include:
- skepticism
- curiosity
- reverence
- resistance
- analysis
- openness

## 3.5 Decision

The player makes a meaningful move.

Purpose:
- convert passive encounter into active participation

Examples:
- answer
- step closer
- challenge back
- withdraw
- observe
- accept invitation

## 3.6 World Response

The world answers the player's move.

Purpose:
- establish that the system is responsive
- reveal the intelligence behind the encounter
- produce consequence

Examples:
- the contact deepens
- the anomaly resolves
- a new path opens
- an NPC stance changes
- an artifact appears

## 3.7 Continuation

The encounter leaves behind momentum.

Purpose:
- open the next scene
- create narrative persistence
- emit structured outputs

Possible outputs:
- BAR seed
- quest hook
- vibeulon event
- relationship update
- scene handoff
- campaign signal

---

# 4. The Six Game Master Faces

The six faces of the Game Master are not separate encounter engines.

They are **modulators** of the same encounter grammar.

Each face alters:
- tone
- pressure
- voice of contact
- style of challenge
- preferred artifact type
- preferred continuation logic

## 4.1 Shaman

Primary function:
- threshold
- mystery
- contact with the unseen
- initiation

Modulation:
- anomalies feel numinous
- contact feels mythic or ritual
- interpretation tends toward reverence, curiosity, or altered seeing
- responses may involve symbols, visions, omens, liminal NPCs

Best used when:
- the world should feel enchanted
- the player is at a threshold
- the encounter should deepen mystery

## 4.2 Challenger

Primary function:
- testing
- confrontation
- sharpening
- courage

Modulation:
- anomalies feel disruptive or provocative
- contact may mock, dare, or expose weakness
- interpretation tends toward defensiveness, resolve, or grit
- responses should increase tension productively

Best used when:
- the player must be tested
- resistance needs to become agency
- emotional alchemy vector involves anger or fear

## 4.3 Regent

Primary function:
- authority
- coherence
- law
- stewardship of order

Modulation:
- anomalies feel official, undeniable, consequential
- contact feels like the world asserting jurisdiction
- interpretation tends toward duty, alignment, and role clarity
- responses may involve obligation, legitimacy, rank, or consequence

Best used when:
- campaign coherence matters
- the encounter should establish world authority
- scene consequences need to feel binding

## 4.4 Architect

Primary function:
- structure
- pattern recognition
- system design
- logic

Modulation:
- anomalies feel patterned or intelligently arranged
- contact speaks through puzzles, maps, design logic, hidden systems
- interpretation tends toward analysis and discovery
- responses should reveal structure

Best used when:
- the player needs orientation
- the encounter should reveal system logic
- growth vector requires clarity

## 4.5 Diplomat

Primary function:
- relationship
- alignment
- translation
- trust-building

Modulation:
- anomalies feel socially meaningful
- contact invites empathy, perspective-taking, and relational negotiation
- interpretation tends toward understanding and bridge-building
- responses often involve dialogue and affiliation

Best used when:
- the encounter concerns trust, misunderstanding, or alliance
- the player must coordinate with others
- emotional vector touches sadness or neutrality

## 4.6 Sage

Primary function:
- spaciousness
- perspective
- witness
- transcendence

Modulation:
- anomalies feel subtle, quiet, and deep
- contact may say very little
- interpretation tends toward contemplation and perspective shift
- responses may involve silence, clarity, or widened awareness

Best used when:
- less is more
- a scene should open depth without pressure
- the encounter should reframe the player's understanding

---

# 5. Modulation Model

Game Master faces modulate specific encounter phases.

## 5.1 Modulation Points

Each encounter may apply modulation at these phases:

- anomaly
- contact
- interpretation prompt
- world response
- continuation

Not every phase requires heavy modulation.
v0 should support selective modulation.

## 5.2 Modulation Schema

```json
{
  "gm_face": "challenger",
  "modulates": {
    "anomaly_style": "provocative",
    "contact_voice": "taunting",
    "interpretation_pressure": "high",
    "response_style": "testing",
    "artifact_affinity": "quest_hook"
  }
}
```

---

# 6. Relationship to Emotional Alchemy

Orb-style encounters may be generated in response to emotional alchemy vectors.

The encounter grammar does not replace Emotional Alchemy.
It provides a **scene form** through which Emotional Alchemy can become playable.

Example:
- fear:dissatisfied -> fear:neutral
- gm_face: architect

Possible result:
- context = unclear problem
- anomaly = hidden map appears
- contact = system notices your confusion
- decision = ask, inspect, or withdraw
- response = orientation increases

## Implementation Advice

- emotional vector decides the growth direction
- GM face decides the style of the encounter
- encounter grammar decides the scene structure

This keeps the architecture layered and clear.

---

# 7. API-First System Overview

Architecture flow:

```text
player state
    ↓
emotional vector
    ↓
encounter request
    ↓
gm face modulation
    ↓
orb encounter compiled
    ↓
scene dsl
    ↓
runtime cards
    ↓
choice resolution
    ↓
artifact / state updates
```

---

# 8. Encounter Request Schema

## 8.1 Generate Encounter Request

```json
{
  "player_id": "string",
  "campaign_id": "string",
  "gm_face": "architect",
  "emotional_state": {
    "channel": "fear",
    "altitude": "dissatisfied"
  },
  "target_vector": {
    "channel": "fear",
    "from_altitude": "dissatisfied",
    "to_altitude": "neutral"
  },
  "context": {
    "campaign_phase": "string",
    "active_bars": ["string"],
    "identity": {
      "nation": "string",
      "archetype": "string",
      "developmental_lens": "string"
    }
  }
}
```

---

# 9. Encounter Response Schema

## 9.1 Generate Encounter Response

```json
{
  "encounter_id": "string",
  "grammar": {
    "context": {},
    "anomaly": {},
    "contact": {},
    "interpretation": {},
    "decision": {},
    "world_response": {},
    "continuation": {}
  },
  "gm_face": "architect",
  "scene_dsl": {},
  "artifact_affinities": [
    "bar_seed",
    "quest_hook"
  ]
}
```

---

# 10. API Endpoints

## 10.1 Generate Orb Encounter

`POST /orb-encounters/generate`

Purpose:
Generate a new Orb-style encounter from emotional state + GM face + context.

Request:
See encounter request schema.

Response:
See encounter response schema.

---

## 10.2 Resolve Orb Encounter Choice

`POST /orb-encounters/:encounter_id/resolve`

Payload:

```json
{
  "choice_id": "string",
  "player_id": "string"
}
```

Response:

```json
{
  "world_response": {},
  "state_updates": {
    "emotional_state": {},
    "relationship_updates": [],
    "artifacts_emitted": []
  },
  "next_scene": {}
}
```

---

## 10.3 Preview Encounter Modulation

`POST /orb-encounters/preview`

Purpose:
Preview how the same encounter skeleton changes under different GM faces.

Payload:

```json
{
  "encounter_seed": {},
  "gm_faces": ["shaman", "challenger", "sage"]
}
```

Response:

```json
{
  "previews": [
    {
      "gm_face": "shaman",
      "modulated_encounter": {}
    },
    {
      "gm_face": "challenger",
      "modulated_encounter": {}
    }
  ]
}
```

This endpoint is useful for authoring, testing, and tuning.

---

# 11. Encounter Seed Model

To keep the system anti-fragile, the engine should generate from seeds, not huge authored scripts.

## 11.1 Encounter Seed Schema

```json
{
  "seed_id": "string",
  "context_type": "mundane",
  "anomaly_type": "voice|object|pattern|npc_appearance|inner_prompt",
  "contact_type": "question|invitation|challenge|witness|signal",
  "decision_type": "interpretive|relational|courage|curiosity|boundary",
  "artifact_affinities": ["bar_seed"],
  "allowed_vectors": ["fear:dissatisfied->fear:neutral"]
}
```

## Implementation Advice

- keep seed library small
- combine seed + emotional vector + GM face
- prefer recombination over content sprawl

---

# 12. Scene DSL Mapping

Orb encounters should compile into Scene DSL.

Mapping:

- context -> entry scene cards
- anomaly -> reveal or rupture cards
- contact -> dialogue or narrative cards
- interpretation -> choice or prompt cards
- decision -> choice card
- world_response -> reveal / response cards
- continuation -> artifact / continue / handoff cards

This allows Orb-style scenes to live inside the existing card-stage-scene architecture.

---

# 13. Minimal v0 Scope

v0 should support:

- one emotional vector:
  - fear:dissatisfied -> fear:neutral
- three GM faces:
  - Architect
  - Challenger
  - Sage
- three anomaly types:
  - unexpected voice
  - impossible pattern
  - sudden NPC appearance

This creates a manageable first slice while preserving the core grammar.

---

# 14. Acceptance Criteria

1. System can generate an Orb-style encounter from player state.
2. Same encounter skeleton can be modulated by different GM faces.
3. Encounter compiles to Scene DSL.
4. Player can make a meaningful interpretive choice.
5. World responds in a way that reflects both the GM face and the player's move.
6. Encounter emits continuation artifacts or state changes.
7. Emotional vector and GM modulation remain distinct and legible in implementation.

---

# 15. Design Advice

## 15.1 Do Not Copy Orb Literally

The goal is not to imitate chapter text.
The goal is to recreate the **feeling of being unexpectedly addressed by intelligence**.

## 15.2 Preserve Mystery

Do not over-explain the anomaly too quickly.
The player should have to interpret the encounter.

## 15.3 Favor Presence Over Lore

The encounter should feel alive before it feels informative.

## 15.4 Keep the Engine Layered

- Emotional Alchemy decides growth direction
- GM face decides world style
- Orb grammar decides encounter form
- Scene DSL decides rendering

## 15.5 Build the Feeling First

If one encounter produces the feeling:
“something in this world noticed me”

then the system is working.

---

# 16. Recommended Data Models

Suggested models / tables:

- `orb_encounter_seeds`
- `orb_encounters`
- `orb_encounter_resolutions`
- `gm_face_modifiers`
- `orb_artifact_emissions`

Optional:
- `orb_preview_logs`
- `orb_encounter_relationship_effects`

---

# 17. Why This Matters

This feature gives BARs Engine a way to create encounters that feel:

- surprising
- personal
- governed
- mythically intelligent

It creates the sensation that the world is not merely authored.
It is **responsive**.

That is the experiential quality being borrowed from the Orb-style chapter structure and translated into BARs Engine ontology.

---

# 18. Best Companion Specs

After this feature, the strongest companion artifacts are:

1. `gm_face_scene_modifiers.md`
2. `orb_encounter_seed_library.md`
3. `orb_encounter_runtime.md`
4. `bar_seeded_orb_encounters.md`

These will expand the system without changing its core grammar.
