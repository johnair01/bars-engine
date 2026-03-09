# Nation Move Profiles v0

## Purpose

Nation Move Profiles define how each nation influences the transformation move system. Each nation represents a **culture of practice** connected to one Emotional Alchemy channel. Profiles encode three things: **emotional channel**, **developmental emphasis**, **move style**. Nations become distinct transformation ecologies.

## Emotional Alchemy Mapping

| Nation | Element | Emotion Channel |
|--------|---------|-----------------|
| Argyra | metal | fear |
| Pyrakanth | fire | anger |
| Lamenth | water | sadness |
| Meridia | earth | neutrality |
| Virelune | wood | joy |

These channels shape how transformation occurs. Each nation expresses distinct movement patterns.

## Nation Move Profile Model

```ts
interface NationMoveProfile {
  nationId: string
  emotionChannel: 'fear' | 'anger' | 'sadness' | 'neutrality' | 'joy'
  element: 'metal' | 'fire' | 'water' | 'earth' | 'wood'
  developmentalEmphasis: PersonalMoveType[]  // WCGS bias
  preferredMoves: string[]
  moveStyleModifiers: string[]
  questFlavorModifiers: string[]
  exampleMoveFlavors: string[]
}
```

Profile influences: move selection weighting, prompt phrasing, quest design, narrative framing.

---

## Argyra

**Element**: metal | **Emotion Channel**: fear

**Core theme**: discernment, clarity, boundaries, truth

**Transformation style**: Fear becomes awareness and precision.

| Field | Value |
|-------|-------|
| Developmental emphasis | wake_up, grow_up |
| Preferred moves | pattern_recognition, system_observation, truth_clarification, boundary_detection |
| Move style modifiers | precision, strategic_awareness, calm_observation |
| Quest flavor modifiers | investigation, mapping_systems, strategic_insight |

**Example move flavor**:
- What pattern is this fear revealing?
- What boundary is asking to be seen?
- What signal is this fear trying to clarify?

---

## Pyrakanth

**Element**: fire | **Emotion Channel**: anger

**Core theme**: will, transformation, courage, power

**Transformation style**: Anger becomes movement and decisive action.

| Field | Value |
|-------|-------|
| Developmental emphasis | clean_up, show_up |
| Preferred moves | shadow_confrontation, boundary_assertion, action_challenge, courage_experiments |
| Move style modifiers | directness, intensity, challenge |
| Quest flavor modifiers | trials, courage_tests, breakthrough_actions |

**Example move flavor**:
- What boundary is anger demanding?
- What action is waiting to be taken?
- What truth is asking to be spoken?

---

## Lamenth

**Element**: water | **Emotion Channel**: sadness

**Core theme**: depth, grief, memory, release

**Transformation style**: Sadness becomes depth and emotional integration.

| Field | Value |
|-------|-------|
| Developmental emphasis | clean_up, wake_up |
| Preferred moves | grief_dialogue, emotional_witnessing, story_excavation, memory_reflection |
| Move style modifiers | gentleness, depth, compassion |
| Quest flavor modifiers | reflection, journaling, storytelling |

**Example move flavor**:
- What loss is asking to be honored?
- What story beneath the sadness wants to be heard?
- What truth is surfacing through grief?

---

## Meridia

**Element**: earth | **Emotion Channel**: neutrality

**Core theme**: balance, integration, stability, grounding

**Transformation style**: Neutrality becomes integration and equilibrium.

| Field | Value |
|-------|-------|
| Developmental emphasis | grow_up, wake_up |
| Preferred moves | perspective_balancing, systems_thinking, integration_reflection |
| Move style modifiers | groundedness, balance, stability |
| Quest flavor modifiers | mediation, systems_reflection, balance_quests |

**Example move flavor**:
- What perspective might balance this situation?
- What holds all sides of this experience?
- What remains steady beneath this moment?

---

## Virelune

**Element**: wood | **Emotion Channel**: joy

**Core theme**: growth, creativity, connection, possibility

**Transformation style**: Joy becomes expansion and creative exploration.

| Field | Value |
|-------|-------|
| Developmental emphasis | wake_up, show_up |
| Preferred moves | creative_reframing, possibility_generation, playful_experimentation |
| Move style modifiers | playfulness, imagination, optimism |
| Quest flavor modifiers | creative_quests, exploration, discovery |

**Example move flavor**:
- What possibility is hidden here?
- What new path could grow from this moment?
- What experiment would feel joyful to try?

---

## Move Selection Influence

| Nation | WCGS Bias |
|--------|-----------|
| Argyra | wake_up, grow_up |
| Pyrakanth | clean_up, show_up |
| Lamenth | clean_up, wake_up |
| Meridia | grow_up, wake_up |
| Virelune | wake_up, show_up |

Creates different transformation rhythms per nation.

## Quest Flavor Influence

Quest seeds incorporate nation identity:

| Nation | Example Quest Flavor |
|--------|----------------------|
| Argyra | Investigate the pattern beneath your fear. Map the system producing this experience. |
| Pyrakanth | Take one courageous action that asserts your boundary. |
| Lamenth | Write the story beneath this sadness. |
| Meridia | What perspective might balance this situation? |
| Virelune | Experiment with a joyful new approach. |

## Integration

Pipeline:

```
Narrative Parse
→ Lock Detection
→ WCGS Core Moves
→ Nation Move Profile Overlay
→ Archetype Move Style
→ Quest Generation
```

## Usage

```ts
const profile = getNationMoveProfile(nationId)
// Apply profile.developmentalEmphasis for move ordering
// Apply profile.moveStyleModifiers for prompt phrasing
// Apply profile.questFlavorModifiers for quest seed flavor
```

## References

- [move-engine.ts](../../src/lib/quest-grammar/move-engine.ts) — Emotional Alchemy canonical moves
- [nations.ts](../../src/lib/game/nations.ts) — Nation definitions
- [transformation-move-library spec](../../.specify/specs/transformation-move-library/spec.md)
