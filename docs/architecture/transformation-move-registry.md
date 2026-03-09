# Transformation Move Registry v0

## Purpose

The Transformation Move Registry is the canonical, machine-readable catalog of the engine's core transformation verbs. It serves as the single source of truth for moves used by:

- Narrative Transformation Engine
- WCGS developmental loop
- Nation Move Profiles
- Archetype Move Styles
- Quest generation systems
- BAR integration
- Onboarding and transformation quest pipelines

---

## Part 1: Canonical Move Set

### WCGS Mapping (Default Developmental Mapping)

| WCGS Stage | Moves |
|------------|-------|
| **Wake Up** | Observe, Name |
| **Clean Up** | Externalize, Feel |
| **Grow Up** | Reframe, Invert |
| **Show Up** | Experiment, Integrate |

### Move Definitions

#### Observe

- **Definition**: Increase awareness of a pattern without judgment.
- **Purpose**: Surface implicit narrative so it can be examined.
- **WCGS stage**: wake_up
- **Typical output type**: reflection
- **Compatible use cases**: pattern recognition, system mapping, boundary detection

#### Name

- **Definition**: Turn vague experience into explicit language.
- **Purpose**: Clarify what is being experienced so it can be addressed.
- **WCGS stage**: wake_up
- **Typical output type**: reflection, labeling
- **Compatible use cases**: emotional labeling, narrative clarification, truth articulation

#### Externalize

- **Definition**: Separate the pattern from identity.
- **Purpose**: Create distance between self and stuck narrative.
- **WCGS stage**: clean_up
- **Typical output type**: dialogue, somatic
- **Compatible use cases**: shadow work, projection work, parts dialogue

#### Feel

- **Definition**: Connect insight to embodied emotional awareness.
- **Purpose**: Ground cognitive work in somatic experience.
- **WCGS stage**: clean_up
- **Typical output type**: somatic, emotional alchemy
- **Compatible use cases**: emotional processing, body awareness, alchemy integration

#### Reframe

- **Definition**: Change interpretation of the experience.
- **Purpose**: Shift meaning without denying the experience.
- **WCGS stage**: grow_up
- **Typical output type**: reflection
- **Compatible use cases**: perspective shift, meaning-making, developmental movement

#### Invert

- **Definition**: Disrupt fixed assumptions.
- **Purpose**: Challenge rigid beliefs or identity claims.
- **WCGS stage**: grow_up
- **Typical output type**: reflection
- **Compatible use cases**: boundary-breaking questions, paradox, possibility expansion

#### Experiment

- **Definition**: Create a small behavioral test.
- **Purpose**: Translate insight into real-world action.
- **WCGS stage**: show_up
- **Typical output type**: action
- **Compatible use cases**: courage experiments, practice, behavioral activation

#### Integrate

- **Definition**: Capture learning and convert it into retained value.
- **Purpose**: Anchor transformation in a durable artifact.
- **WCGS stage**: show_up
- **Typical output type**: integration, BAR capture
- **Compatible use cases**: lesson capture, BAR creation, quest completion summary

---

## Part 2: Move Registry Data Model

### Schema

```json
{
  "move_id": "string",
  "move_name": "string",
  "move_category": "string",
  "wcgs_stage": "wake_up | clean_up | grow_up | show_up",
  "description": "string",
  "purpose": "string",
  "prompt_templates": [],
  "target_effect": "string",
  "typical_output_type": "reflection | dialogue | somatic | action | integration",
  "compatible_lock_types": [],
  "compatible_emotion_channels": [],
  "compatible_nations": [],
  "compatible_archetypes": [],
  "bar_integration": {},
  "quest_usage": {},
  "safety_notes": []
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `move_id` | string | Stable unique identifier (e.g. `observe`, `name`) |
| `move_name` | string | Human-readable name |
| `move_category` | string | awareness \| reframing \| emotional_processing \| behavioral_experiment \| integration |
| `wcgs_stage` | string | wake_up \| clean_up \| grow_up \| show_up |
| `description` | string | Short explanation of the move |
| `purpose` | string | What this move is intended to accomplish |
| `prompt_templates` | array | One or more templates for variable insertion |
| `target_effect` | string | What kind of shift the move aims to produce |
| `typical_output_type` | string | reflection \| dialogue \| somatic \| action \| integration |
| `compatible_lock_types` | array | identity_lock, emotional_lock, action_lock, possibility_lock |
| `compatible_emotion_channels` | array | fear, anger, sadness, neutrality, joy |
| `compatible_nations` | array | Nation IDs or empty if universal |
| `compatible_archetypes` | array | Archetype IDs or empty if universal |
| `bar_integration` | object | How the move interacts with BAR creation |
| `quest_usage` | object | How the move appears in generated quests |
| `safety_notes` | array | Scope boundaries, especially for emotionally intense moves |

---

## Part 3: Prompt Template Structure

### Variable Placeholders

| Variable | Source | Example |
|----------|--------|---------|
| `{actor}` | Parsed narrative | I |
| `{state}` | Parsed narrative | afraid |
| `{object}` | Parsed narrative | failing |
| `{emotion_channel}` | Nation / context | fear |
| `{nation_name}` | Nation profile | Argyra |
| `{archetype_name}` | Archetype profile | Bold Heart |

### Template Object

```json
{
  "template_id": "observe_basic_01",
  "template_text": "What story are you telling yourself about {object}?",
  "template_type": "reflection"
}
```

Each move may have multiple prompt templates. `template_type` may be: reflection, dialogue, somatic, action, integration.

---

## Part 4: Lock Type Compatibility

| Lock Type | Preferred Moves |
|-----------|-----------------|
| identity_lock | externalize, reframe |
| emotional_lock | name, feel, externalize |
| action_lock | invert, experiment |
| possibility_lock | reframe, experiment |

Moves may list compatible lock types. Selection logic weights moves by lock type when assembling quest seeds.

---

## Part 5: Nation Compatibility

Nation profiles weight or flavor moves. The registry stores compatibility metadata; nation overlays apply style.

| Nation | Element | Emotion Channel | Move Bias |
|--------|---------|----------------|-----------|
| Argyra | metal | fear | observe, reframe |
| Pyrakanth | fire | anger | externalize, experiment |
| Lamenth | water | sadness | feel, externalize |
| Meridia | earth | neutrality | observe, integrate |
| Virelune | wood | joy | reframe, experiment |

`compatible_nations` may be empty (universal) or list nation IDs for move-specific restrictions.

---

## Part 6: Archetype Compatibility

Archetypes modify how moves are expressed, not whether they exist. The registry allows compatibility metadata without hard-coding a single style. `compatible_archetypes` may be empty (universal).

---

## Part 7: BAR Integration Rules

| Move | BAR Connection |
|------|----------------|
| **Integrate** | Strong: capture lesson, record insight, mint BAR from experiment |
| **Experiment** | May create post-action BAR prompt |
| **Observe / Name** | May optionally generate pre-action BARs for tracking |

### bar_integration Object

```json
{
  "creates_bar": true,
  "bar_timing": "completion",
  "bar_type": "insight",
  "bar_prompt_template": "Capture what you learned from {object}."
}
```

---

## Part 8: Quest Usage Metadata

```json
{
  "quest_stage": "reflection | cleanup | growth | action | completion",
  "is_required_for_full_arc": false,
  "can_stand_alone": true,
  "suggested_follow_up_moves": ["feel", "reframe"]
}
```

- `quest_stage`: Where this move typically appears in a quest arc
- `is_required_for_full_arc`: Whether a full transformation arc should include this move
- `can_stand_alone`: Whether the move can be used without preceding moves
- `suggested_follow_up_moves`: Move IDs that commonly follow this one

---

## Part 9: Quest Seed Assembly

A standard transformation quest seed includes:

- One wake move (Observe or Name)
- One clean move (Externalize or Feel)
- One grow move (Reframe or Invert)
- One show move (Experiment or Integrate)
- One BAR capture/integration move (typically Integrate)

### Example Flow

```
Observe → Feel → Reframe → Experiment → Integrate
```

Not every generated quest uses all eight moves. The registry supports full-arc generation and shorter arcs.

---

## Part 10: Testing Requirements

Tests must verify:

1. All registry entries conform to schema
2. Moves can be filtered by WCGS stage
3. Moves can be filtered by lock type
4. Prompt templates render correctly with variable substitution
5. Registry entries support quest seed assembly
6. BAR integration metadata is present where required (Integrate, Experiment)

---

## Part 11: Constraints (v0)

- Include the canonical 8 moves
- Map clearly to WCGS
- Support nation/archetype compatibility metadata
- Remain machine-readable
- Support future template extraction and quest generation

Do not:

- Create dozens of move variants yet
- Build a full AI reasoning layer inside the registry
- Hardcode nation/archetype flavor into core move definitions

Favor:

- Stable registry objects
- Explicit metadata
- Composable quest generation
- Future extensibility

---

## Bridge Role

The registry is the bridge between:

- Narrative parsing
- Emotional alchemy
- Nation/archetype overlays
- Quest generation
- BAR capture

Moves must be: inspectable, reusable, composable, testable.
