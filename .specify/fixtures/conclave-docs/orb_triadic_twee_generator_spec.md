# Spec Kit Feature Request
## Orb Triadic Twee Generator v0

Repository: bars-engine  
Status: Draft for implementation  
Purpose: Generate a first-pass `.twee` encounter from:
- Player Nation
- Player Archetype
- a randomly selected Emotional Alchemy growth vector
- Orb-style encounter grammar
- fixed 9-passage triadic pacing

This feature is intentionally narrow.
Its job is not to produce perfect literature.
Its job is to prove that the system can:
1. choose a valid developmental direction
2. express it through a recognizable encounter
3. compile it into canonical `.twee`
4. allow admin editing afterward

---

# 1. Objective

Implement a generator that outputs a playable `.twee` file using the following inputs:

- `nation`
- `archetype`
- `emotional_vector`
- optional `gm_face`

The output must follow the **Orb-style 9-passage encounter grammar**.

This feature is a vertical slice.
It should wire together:
- Emotional Alchemy direction
- identity scaffolding (Nation + Archetype)
- encounter grammar
- `.twee` output
- admin revision workflow

This feature does **not** need to produce final prose quality.
It needs to produce useful, editable, structurally correct test content.

---

# 2. Canonical Output Shape

The generator must output a valid `.twee` file.

The generated encounter must always contain exactly **9 passages**.

Passage structure:

1. `context_1`
2. `context_2`
3. `context_3`
4. `anomaly_1`
5. `anomaly_2`
6. `anomaly_3`
7. `choice`
8. `response`
9. `artifact`

The choice is always exactly **one passage**.

This is the canonical triadic grammar for v0.

---

# 3. Emotional Alchemy Inputs

The generator does not invent emotional movement.
It selects a valid growth vector from the canonical Emotional Alchemy system.

## 3.1 Canonical vectors for v0

- fear:dissatisfied -> fear:neutral
- fear:neutral -> fear:satisfied

- anger:dissatisfied -> anger:neutral
- anger:neutral -> anger:satisfied

- sadness:dissatisfied -> sadness:neutral
- sadness:neutral -> sadness:satisfied

- joy:dissatisfied -> joy:neutral
- joy:neutral -> joy:satisfied

- neutrality:dissatisfied -> neutrality:neutral
- neutrality:neutral -> neutrality:satisfied

## 3.2 Emotional semantics

Fear:
- dissatisfied = anxiety / worry / panic
- neutral = orientation / vigilance
- satisfied = excitement / courage / readiness

Anger:
- dissatisfied = frustration / irritation / rage
- neutral = clarity / boundaries / decisiveness
- satisfied = triumph / agency / bravery

Sadness:
- dissatisfied = grief / heaviness / despair
- neutral = acceptance / tenderness / sincerity
- satisfied = poignance / meaning / reverence

Joy:
- dissatisfied = restlessness / scattered enthusiasm / manic seeking
- neutral = appreciation / curiosity / play
- satisfied = bliss / vitality / celebration

Neutrality:
- dissatisfied = numbness / dissociation / disengagement
- neutral = presence / groundedness / balance
- satisfied = peace / stillness / equanimity

## 3.3 Generator rule

The generator must select **one** emotional vector for the encounter.

This may be:
- explicitly supplied
- randomly selected from allowed vectors
- filtered by campaign or stage rules later

For v0, random selection is acceptable.

---

# 4. Identity Inputs

The generator must use:
- Player Nation
- Player Archetype

These inputs do not determine the vector.
They modulate:
- language
- symbolism
- anomaly flavor
- choice style
- artifact phrasing

## 4.1 Nation effect

Nation should alter:
- environmental imagery
- symbolic logic
- tone of the world
- what feels “native” or familiar inside the encounter

Example:
- a more mystical nation may generate anomalies as omens, whispers, dreams, living symbols
- a more structural nation may generate anomalies as maps, patterns, mechanisms, hidden designs

## 4.2 Archetype effect

Archetype should alter:
- what kind of challenge the encounter offers
- what kind of agency the player is invited into
- what kind of BAR is likely to emerge

Example:
- Connector -> relational interpretation
- Storyteller -> symbolic / narrative interpretation
- Strategist -> pattern / systems interpretation
- Alchemist -> transformation / integration interpretation
- Escape Artist -> avoidance / freedom / lateral move tension
- Disruptor -> contradiction / challenge / rupture interpretation

These are examples only.
Use the canonical archetype definitions already present in the codebase if available.

---

# 5. Orb 9-Passage Grammar

The generator must follow this rhythm.

## 5.1 Context triad

### context_1
Purpose:
- establish ordinary reality
- create grounding
- begin emotional positioning

### context_2
Purpose:
- deepen context
- introduce subtle tension
- begin moving the player emotionally

### context_3
Purpose:
- complete contextual emotional shift
- prepare the rupture
- create readiness for anomaly

Rule:
Context is not static exposition.
Context itself must move the player.

## 5.2 Anomaly triad

### anomaly_1
Purpose:
- break the frame
- introduce impossible or strange event

### anomaly_2
Purpose:
- deepen the anomaly
- establish that this is not noise

### anomaly_3
Purpose:
- reveal contact or intelligence behind the anomaly
- set up the choice

Rule:
The anomaly must escalate across the three passages.

## 5.3 Choice

### choice
Purpose:
- present exactly one meaningful interpretive or participatory decision point

Rule:
The choice passage always contains the player’s decision options.

Rule:
The options should reflect both:
- the emotional vector
- the player’s archetype

## 5.4 Response

### response
Purpose:
- the world answers the player’s move
- the emotional vector begins resolving
- the player feels the world is responsive

Rule:
Response should be immediate and legible.

## 5.5 Artifact

### artifact
Purpose:
- emit a BAR candidate, hook, signal, or other structured output
- mark the emotional shift
- create continuity for future scenes

Rule:
The artifact passage must leave behind usable game material.

---

# 6. Encounter Generation Logic

## 6.1 Input shape

```json
{
  "player_id": "string",
  "nation": "string",
  "archetype": "string",
  "emotional_vector": {
    "channel": "fear",
    "from_altitude": "dissatisfied",
    "to_altitude": "neutral"
  },
  "gm_face": "architect"
}
```

`gm_face` is optional in v0.
If not supplied, default to `architect` or another configured default.

## 6.2 Generation flow

1. Validate nation and archetype
2. Validate emotional vector
3. Select encounter seed appropriate to vector
4. Modulate seed by nation
5. Modulate player invitation and choice style by archetype
6. Apply GM face modulation if present
7. Expand into 9-passage Orb grammar
8. Compile into `.twee`
9. Save as draft for admin editing

---

# 7. Encounter Seed Requirements

The generator should not write from empty air.

It should use a small seed library.

Each seed should contain:

- mundane context type
- anomaly type
- contact style
- decision type
- artifact affinity
- allowed emotional vectors
- optional gm_face affinities

## 7.1 Example seed shape

```json
{
  "seed_id": "unexpected_passenger",
  "mundane_context": "waiting / transit / in-between moment",
  "anomaly_type": "unexpected voice",
  "contact_style": "direct question",
  "decision_type": "interpretive",
  "artifact_affinity": "bar_seed",
  "allowed_vectors": [
    "fear:dissatisfied->fear:neutral"
  ]
}
```

For v0, keep the seed library very small.
3–5 seeds is sufficient.

---

# 8. Twee Output Contract

The generated `.twee` should use canonical passage names.

Example:

```text
:: context_1
...

[[Continue|context_2]]

:: context_2
...

[[Continue|context_3]]

:: context_3
...

[[Continue|anomaly_1]]

:: anomaly_1
...

[[Continue|anomaly_2]]

:: anomaly_2
...

[[Continue|anomaly_3]]

:: anomaly_3
...

[[Choose|choice]]

:: choice
...
[[Option A|response]]
[[Option B|response]]
[[Option C|response]]

:: response
...

[[Continue|artifact]]

:: artifact
...

[[End Encounter|END]]
```

For v0, all choices may converge to a shared `response` passage if needed.
More nuanced branching can come later.

---

# 9. Admin Editing Workflow

The generated `.twee` file is a **draft artifact**.

Admins must be able to:

- preview generated `.twee`
- edit passage text
- edit choice labels
- change convergence / branching structure
- save revised version
- publish to encounter library

## Implementation rule

Do not require the generator to produce final-quality prose.
Optimize for:
- structural correctness
- emotional coherence
- editability

---

# 10. API Endpoints

## 10.1 Generate Orb Twee Encounter

`POST /orb-twee/generate`

Request:

```json
{
  "player_id": "string",
  "nation": "string",
  "archetype": "string",
  "emotional_vector": {
    "channel": "fear",
    "from_altitude": "dissatisfied",
    "to_altitude": "neutral"
  },
  "gm_face": "architect"
}
```

Response:

```json
{
  "encounter_id": "string",
  "seed_id": "string",
  "twee_content": "string",
  "metadata": {
    "nation": "string",
    "archetype": "string",
    "vector": "fear:dissatisfied->fear:neutral",
    "gm_face": "architect",
    "passage_count": 9,
    "status": "draft"
  }
}
```

---

## 10.2 Save Generated Draft

`POST /orb-twee/:encounter_id/save-draft`

Payload:

```json
{
  "twee_content": "string"
}
```

---

## 10.3 Publish Encounter

`POST /orb-twee/:encounter_id/publish`

Response:

```json
{
  "encounter_id": "string",
  "status": "published"
}
```

---

# 11. Data Models

Suggested models / tables:

- `orb_encounter_seeds`
- `generated_orb_twee_encounters`
- `generated_orb_twee_versions`
- `orb_encounter_metadata`

Optional:
- `gm_face_modulations`
- `encounter_playtest_logs`

---

# 12. Acceptance Criteria

1. The system can accept nation + archetype + emotional vector.
2. The system can select an appropriate encounter seed.
3. The system can generate a structurally correct 9-passage Orb-style encounter.
4. The output is valid `.twee`.
5. The generated prose reflects the supplied nation and archetype in some detectable way.
6. The encounter includes exactly one choice passage.
7. The response and artifact passages complete the loop.
8. The draft can be edited by admin after generation.
9. The encounter can be published into the game for testing.

---

# 13. Design Advice

## 13.1 Keep the first version narrow

Do not try to generate entire chapter chains.
Generate one encounter at a time.

## 13.2 Context must move the player

Context is not pure exposition.
Each of the three context passages should progressively alter the player's stance.

## 13.3 Anomaly must escalate

The anomaly triad should not repeat itself.
Each anomaly passage should increase strangeness, clarity, or perceived intelligence.

## 13.4 Choice should feel archetypally meaningful

Even if all choices converge in v0, they should still feel different.
The player should recognize their archetype in the available options.

## 13.5 Artifact should leave behind game material

Every generated encounter should end with something that can be used later:
- BAR candidate
- quest hook
- relationship update
- scene flag
- vibeulon trigger

---

# 14. What This Unlocks

This feature creates the first low-token, high-feedback content loop for BARs Engine.

It allows the system to:
- generate testable encounters
- honor Emotional Alchemy vectors
- honor Nation and Archetype identity
- output canonical `.twee`
- let admin refine the result
- quickly create playable content for feedback

This is the correct first step before building larger procedural libraries.
