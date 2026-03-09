# Spec: Archetype Influence Overlay v1

## Purpose

Define how the **8 canonical trigram archetypes** modify the expression of transformation quests. Archetypes represent fundamental agency patterns; they influence **how** a player performs transformation moves, not which moves exist.

**Correction**: This spec replaces earlier references that incorrectly used Allyship Superpowers as archetypes. Superpowers remain a **separate extension layer** and must not be used in archetype overlay logic.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Archetype source | 8 canonical archetypes with trigram correspondence |
| Superpowers | Separate extension layer; never collapse with archetypes |
| Influence scope | Experiment objectives, Integration prompts, quest action style, prompt phrasing |
| Non-influence | Move selection, lock detection, nation emotional channel, WCGS structure |

## Canonical Archetypes (Trigram Correspondence)

| Trigram | Archetype |
|---------|-----------|
| Heaven | The Bold Heart |
| Water | The Danger Walker |
| Fire | The Truth Seer |
| Mountain | The Still Point |
| Wind | The Subtle Influence |
| Earth | The Devoted Guardian |
| Thunder | The Decisive Storm |
| Lake | The Joyful Connector |

Source: [canonical-archetypes.ts](../../src/lib/canonical-archetypes.ts), [iching-alignment.ts](../../src/lib/iching-alignment.ts).

## System Position

Archetypes exist as an **agency overlay layer** in the transformation pipeline:

```
Narrative Input
→ Transformation Move Selection
→ Quest Template
→ Nation Emotional Lens
→ Archetype Influence Overlay
→ Quest Seed
```

Archetypes must never replace: WCGS developmental stages, Transformation Move Registry, Nation Move Profiles. They only affect **style of expression**.

## Archetype Influence Model

```ts
interface ArchetypeInfluenceProfile {
  archetype_id: string       // slug: bold-heart, danger-walker, etc.
  archetype_name: string    // The Bold Heart, etc.
  trigram: string           // Heaven, Water, etc.
  agency_pattern: string[]  // initiative, creative leadership, etc.
  action_style: string[]    // how Experiment stage expresses
  reflection_style: string[] // how Integration stage reflects
  integration_style: string[] // how completion integrates
  prompt_modifiers: string[]  // example phrasings
  quest_style_modifiers: string[] // leadership quests, risk navigation, etc.
}
```

## Archetype Profiles

### The Bold Heart (Heaven)

- **Agency pattern**: initiative, creative leadership, courageous beginning
- **Transformation expression**: Experiment → initiate a bold action; Integrate → reflect on the new path created
- **Example prompt modifier**: "What courageous step could open a new path here?"
- **Quest style modifiers**: leadership quests, first-move actions, initiative challenges

### The Danger Walker (Water)

- **Agency pattern**: risk navigation, adaptation, depth exploration
- **Transformation expression**: Experiment → navigate a small controlled risk; Integrate → reflect on what the risk revealed
- **Example prompt modifier**: "What small risk could safely reveal something new?"
- **Quest style modifiers**: risk navigation quests, fear exploration, uncertainty challenges

### The Truth Seer (Fire)

- **Agency pattern**: illumination, clarity, truth revelation
- **Transformation expression**: Experiment → reveal or speak a truth; Integrate → record the clarity that emerged
- **Example prompt modifier**: "What truth is asking to be illuminated?"
- **Quest style modifiers**: truth speaking quests, insight quests, clarity exercises

### The Still Point (Mountain)

- **Agency pattern**: stillness, boundaries, stability
- **Transformation expression**: Experiment → pause or hold a boundary; Integrate → observe what became clear through stillness
- **Example prompt modifier**: "What happens if you pause instead of reacting?"
- **Quest style modifiers**: meditative quests, boundary practice, grounding challenges

### The Subtle Influence (Wind)

- **Agency pattern**: gradual change, persistent shaping, system influence
- **Transformation expression**: Experiment → attempt a small influence; Integrate → observe what shifted
- **Example prompt modifier**: "What small influence could begin shifting this system?"
- **Quest style modifiers**: habit changes, gentle persuasion, system nudges

### The Devoted Guardian (Earth)

- **Agency pattern**: support, stewardship, stability creation
- **Transformation expression**: Experiment → provide support or build structure; Integrate → reflect on what stability enabled
- **Example prompt modifier**: "What support could help this situation grow?"
- **Quest style modifiers**: care quests, stewardship challenges, resource building

### The Decisive Storm (Thunder)

- **Agency pattern**: sudden action, pattern disruption, breakthrough
- **Transformation expression**: Experiment → take a bold disruptive action; Integrate → observe the change triggered
- **Example prompt modifier**: "What bold action would break this pattern?"
- **Quest style modifiers**: breakthrough quests, pattern disruption, shock actions

### The Joyful Connector (Lake)

- **Agency pattern**: joy, connection, shared experience
- **Transformation expression**: Experiment → invite or create shared experience; Integrate → reflect on how connection changed the situation
- **Example prompt modifier**: "Who could share this experience with you?"
- **Quest style modifiers**: collaboration quests, social experiments, celebration quests

## Integration Rules

**Archetypes modify:**
- Experiment stage objective
- Integration stage reflection
- Prompt phrasing
- Quest action style

**Archetypes must not modify:**
- Move selection
- Lock detection
- Nation emotional channel
- WCGS structure

## Example Generation

**Input**: "I am afraid of failing"  
**Template**: Courage Experiment Arc  
**Nation**: Argyra  
**Archetype**: Danger Walker  

**Generated quest seed** (archetype overlay applied):
- Observe: Notice when fear appears.
- Invert: What risk might be hidden in this fear?
- Experiment: Take one small action that involves controlled uncertainty.
- Integrate: Capture what navigating that risk revealed.

## Functional Requirements

- **FR1**: `ArchetypeInfluenceProfile` type with all fields.
- **FR2**: `getArchetypeInfluenceProfile(archetypeKey)` returns profile for canonical archetypes.
- **FR3**: `applyArchetypeOverlay(questSeed, profile)` modifies experiment/integration prompts.
- **FR4**: Quest generation pipeline passes archetypeKey to overlay; overlay applies before final seed.
- **FR5**: Superpower logic remains separate; no archetype definition references superpowers.

## Testing Requirements

- Archetype overlay modifies experiment objectives.
- Archetype overlay modifies integration prompts.
- Archetype overlay does not change move registry logic.
- Nation + archetype combinations produce different quest outputs.
- Superpower extensions are never invoked by archetype overlay.

## Constraints

- Support all 8 canonical archetypes.
- Preserve trigram correspondence.
- Remain independent of superpower extensions.
- Compatible with quest templates and move registry.
- Avoid collapsing archetypes with superpowers.
- Favor: clear agency expression, lightweight overlays, stable extensibility.

## Dependencies

- [transformation-move-registry](../transformation-move-registry/spec.md)
- [archetype-move-styles](../archetype-move-styles/spec.md)
- [nation-move-profiles](../nation-move-profiles/spec.md)
- [canonical-archetypes](../../src/lib/canonical-archetypes.ts)

## References

- [docs/architecture/archetype-key-reconciliation.md](../../docs/architecture/archetype-key-reconciliation.md)
- [docs/architecture/transformation-move-registry.md](../../docs/architecture/transformation-move-registry.md)
- [docs/architecture/nation-move-profiles.md](../../docs/architecture/nation-move-profiles.md)
