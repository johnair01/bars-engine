# Spec: Nation Move Profiles v0

## Purpose

Define how Nations influence the transformation move system. Each Nation represents a culture of practice connected to one Emotional Alchemy channel. Nation Move Profiles modify how the system selects and expresses transformation moves in the WCGS loop. Nations become distinct transformation ecologies.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Emotional channel | Each nation maps to one channel: fear, anger, sadness, neutrality, joy. |
| Profile structure | emotion_channel, developmental_emphasis, preferred_moves, move_style_modifiers, quest_flavor_modifiers. |
| Influence | Move selection weighting, prompt phrasing, quest flavor generation. |
| Integration | Lightweight overlay on Transformation Move Library; WCGS loop preserved. |

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
type EmotionChannel = 'fear' | 'anger' | 'sadness' | 'neutrality' | 'joy'
type ElementKey = 'metal' | 'fire' | 'water' | 'earth' | 'wood'
type PersonalMoveType = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'

interface NationMoveProfile {
  nationId: string
  emotionChannel: EmotionChannel
  element: ElementKey
  developmentalEmphasis: PersonalMoveType[]  // WCGS bias order
  preferredMoves: string[]  // move type tags
  moveStyleModifiers: string[]
  questFlavorModifiers: string[]
  exampleMoveFlavors: string[]  // prompt patterns
}
```

Profile influences: move selection, move phrasing, quest design, narrative framing.

## Nation Profiles

### Argyra

- **Element**: metal
- **Emotion Channel**: fear
- **Core theme**: discernment, clarity, boundaries, truth
- **Transformation style**: Fear becomes awareness and precision
- **Developmental emphasis**: wake_up, grow_up
- **Preferred moves**: pattern_recognition, system_observation, truth_clarification, boundary_detection
- **Move style modifiers**: precision, strategic_awareness, calm_observation
- **Example move flavor**: "What pattern is this fear revealing?", "What boundary is asking to be seen?"
- **Quest flavor modifiers**: investigation, mapping_systems, strategic_insight

### Pyrakanth

- **Element**: fire
- **Emotion Channel**: anger
- **Core theme**: will, transformation, courage, power
- **Transformation style**: Anger becomes movement and decisive action
- **Developmental emphasis**: clean_up, show_up
- **Preferred moves**: shadow_confrontation, boundary_assertion, action_challenge, courage_experiments
- **Move style modifiers**: directness, intensity, challenge
- **Example move flavor**: "What boundary is anger demanding?", "What action is waiting to be taken?"
- **Quest flavor modifiers**: trials, courage_tests, breakthrough_actions

### Lamenth

- **Element**: water
- **Emotion Channel**: sadness
- **Core theme**: depth, grief, memory, release
- **Transformation style**: Sadness becomes depth and emotional integration
- **Developmental emphasis**: clean_up, wake_up
- **Preferred moves**: grief_dialogue, emotional_witnessing, story_excavation, memory_reflection
- **Move style modifiers**: gentleness, depth, compassion
- **Example move flavor**: "What loss is asking to be honored?", "What story beneath the sadness wants to be heard?"
- **Quest flavor modifiers**: reflection, journaling, storytelling

### Meridia

- **Element**: earth
- **Emotion Channel**: neutrality
- **Core theme**: balance, integration, stability, grounding
- **Transformation style**: Neutrality becomes integration and equilibrium
- **Developmental emphasis**: grow_up, wake_up
- **Preferred moves**: perspective_balancing, systems_thinking, integration_reflection
- **Move style modifiers**: groundedness, balance, stability
- **Example move flavor**: "What perspective might balance this situation?", "What holds all sides of this experience?"
- **Quest flavor modifiers**: mediation, systems_reflection, balance_quests

### Virelune

- **Element**: wood
- **Emotion Channel**: joy
- **Core theme**: growth, creativity, connection, possibility
- **Transformation style**: Joy becomes expansion and creative exploration
- **Developmental emphasis**: wake_up, show_up
- **Preferred moves**: creative_reframing, possibility_generation, playful_experimentation
- **Move style modifiers**: playfulness, imagination, optimism
- **Example move flavor**: "What possibility is hidden here?", "What experiment would feel joyful to try?"
- **Quest flavor modifiers**: creative_quests, exploration, discovery

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

Quest seeds incorporate nation identity. Examples:

- **Argyra**: "Investigate the pattern beneath your fear. Map the system producing this experience."
- **Pyrakanth**: "Take one courageous action that asserts your boundary."
- **Lamenth**: "Write the story beneath this sadness."
- **Virelune**: "Experiment with a joyful new approach."

## Integration with Transformation Engine

Pipeline:

```
Narrative Parse
→ Lock Detection
→ WCGS Core Moves
→ Nation Move Profile Overlay
→ Archetype Move Style
→ Quest Generation
```

Nation profiles influence: move selection weighting, prompt phrasing, quest flavor generation.

## Functional Requirements

- **FR1**: NationMoveProfile type with emotion_channel, developmental_emphasis, move_style_modifiers, quest_flavor_modifiers.
- **FR2**: Profiles for all 5 nations aligned with Emotional Alchemy mapping.
- **FR3**: getNationMoveProfile(nationId) returns profile.
- **FR4**: applyNationOverlay(coreMoves, profile) weights/orders moves.
- **FR5**: Quest seeds vary by nation when nationId provided.

## Testing Requirements

- Nation profiles influence move selection.
- Prompts reflect emotional channel.
- Quest seeds vary by nation.
- WCGS loop remains intact.

## Constraints

- Connect to Emotional Alchemy channels.
- Preserve WCGS developmental loop.
- Do not create separate transformation engines per nation.
- Favor lightweight overlays, cultural flavor, emotional coherence.

## Dependencies

- [transformation-move-library](../transformation-move-library/spec.md) (EE)
- [quest-grammar/move-engine](src/lib/quest-grammar/move-engine.ts)
- [nations](src/lib/game/nations.ts)

## References

- [docs/architecture/nation-move-profiles.md](../../../docs/architecture/nation-move-profiles.md)
