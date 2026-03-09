# Spec: Archetype Move Styles v0

## Purpose

Define how the 8 core trigram-linked Playbooks modify the expression of transformation moves. Archetypes shape baseline agency—how the player moves through the world, perceives, responds, and orients. They do not replace WCGS or Nation profiles. Archetypes are base identity; Superpowers (allyship prestige) are a separate extension layer.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Archetype source | 8 Playbooks from [PLAYBOOK_TRIGRAM](src/lib/iching-alignment.ts): The Bold Heart, The Devoted Guardian, etc. |
| Archetype key | Playbook slug (bold-heart, devoted-guardian, etc.) per [avatar-utils](src/lib/avatar-utils.ts) |
| Separation | Archetypes = base agency; Superpowers = advanced allyship specialization (separate spec) |
| Influence | Prompt phrasing, action objectives, quest style—not lock detection or nation channels |

## Canonical 8 Archetypes

| Archetype Key | System Name | Trigram |
|---------------|-------------|---------|
| bold-heart | The Bold Heart | Heaven |
| devoted-guardian | The Devoted Guardian | Earth |
| decisive-storm | The Decisive Storm | Thunder |
| danger-walker | The Danger Walker | Water |
| still-point | The Still Point | Mountain |
| subtle-influence | The Subtle Influence | Wind |
| truth-seer | The Truth Seer | Fire |
| joyful-connector | The Joyful Connector | Lake |

Source: [iching-alignment.ts](src/lib/iching-alignment.ts) PLAYBOOK_TRIGRAM, [seed-narrative-content.ts](scripts/seed-narrative-content.ts).

## Archetype Move Style Model

```ts
interface ArchetypeMoveStyle {
  archetypeId: string       // playbook slug, e.g. bold-heart
  trigram: string           // Heaven, Earth, Thunder, etc.
  systemName: string       // The Bold Heart, etc.
  agencyStyle: string[]    // how this being moves through the world
  preferredMoveExpression: string[]  // WCGS stages emphasized
  actionPatterns: string[] // default engagement patterns
  promptModifiers: string[] // how to phrase prompts
  questStyleModifiers: string[] // how quests feel
  compatibleSuperpowerExtensions?: string[]  // for future Superpower spec
}
```

## Per-Archetype Profiles

### bold-heart (Heaven)

- **Agency style**: initiation, creative force, first mover
- **Preferred moves**: show_up, wake_up
- **Action patterns**: start before ready, break stalemate, transform stuck into movement
- **Prompt modifiers**: directness, creative spark, initiation
- **Quest style**: bold action, first steps, creative force

### devoted-guardian (Earth)

- **Agency style**: nurturing, grounding, holding space
- **Preferred moves**: show_up, clean_up
- **Action patterns**: check on others, absorb blows, empower allies
- **Prompt modifiers**: care, support, grounding
- **Quest style**: coalition-building, nurturing, devoted support

### decisive-storm (Thunder)

- **Agency style**: decisive moment, shock, breaking point
- **Preferred moves**: show_up, clean_up
- **Action patterns**: sense tension, disrupt stagnation, seize initiative
- **Prompt modifiers**: intensity, decisive action, shock
- **Quest style**: breakthrough, decisive action, shock the system

### danger-walker (Water)

- **Agency style**: flow, adaptation, thrive in chaos
- **Preferred moves**: clean_up, show_up
- **Action patterns**: head toward danger, adapt mid-stream, turn disaster into victory
- **Prompt modifiers**: flow, adaptation, danger-sense
- **Quest style**: adaptive action, flow state, danger as teacher

### still-point (Mountain)

- **Agency style**: deliberate stopping, sanctuary, immovable
- **Preferred moves**: show_up, clean_up
- **Action patterns**: stop when others rush, create sanctuary, hold ground
- **Prompt modifiers**: stillness, grounding, sanctuary
- **Quest style**: anchor, stability, deliberate pause

### subtle-influence (Wind)

- **Agency style**: gentle persistence, unseen change, infiltration
- **Preferred moves**: show_up, wake_up
- **Action patterns**: notice small cracks, gently push, reveal change already made
- **Prompt modifiers**: subtlety, persistence, unseen hand
- **Quest style**: gentle influence, infiltration, reveal

### truth-seer (Fire)

- **Agency style**: radiant clarity, illumination, speak what is real
- **Preferred moves**: wake_up, clean_up
- **Action patterns**: call out elephant, illuminate truth, reveal solution
- **Prompt modifiers**: clarity, illumination, truth
- **Quest style**: illumination, truth-telling, radiant clarity

### joyful-connector (Lake)

- **Agency style**: open delight, connection, network effect
- **Preferred moves**: show_up, wake_up
- **Action patterns**: share with strangers, turn tension into play, network into cooperation
- **Prompt modifiers**: joy, connection, playfulness
- **Quest style**: connection, joy, cooperative force

## Integration with Nation Profiles

Nation determines emotional transformation pathway. Archetype determines how the player acts within that pathway.

```
Narrative → WCGS → Nation emotional lens → Archetype agency expression → Quest seed
```

Same lock + different archetype = different quest style, even when nation remains the same.

## Quest Seed Shape

Add archetype_style to quest seed:

```ts
interface QuestSeed {
  questSeedType: 'narrative_transformation'
  wake_prompt: string
  cleanup_prompt: string
  grow_prompt: string
  show_objective: string
  bar_prompt: string
  nation_flavor?: string
  archetype_style?: string  // how this archetype flavors the quest
}
```

## Functional Requirements

- **FR1**: ArchetypeMoveStyle type with archetypeId, trigram, agencyStyle, promptModifiers, questStyleModifiers.
- **FR2**: Profiles for all 8 archetypes (bold-heart through joyful-connector).
- **FR3**: getArchetypeMoveStyle(archetypeKey) returns profile.
- **FR4**: applyArchetypeOverlay(moves, profile) modifies prompt phrasing.
- **FR5**: Quest seeds include archetype_style when archetypeKey provided.

## Testing Requirements

- Archetype styles influence prompt generation.
- Archetypes alter quest objective style.
- WCGS stages remain intact.
- Nation + archetype combinations produce distinct quest outputs.
- Archetypes remain separate from superpower extensions.

## Constraints

- Support all 8 base archetypes.
- Preserve trigram linkage.
- Remain independent of superpower logic.
- Compatible with future superpower overlays.
- Do not hardcode allyship superpowers into archetype definitions.

## Dependencies

- [transformation-move-library](../transformation-move-library/spec.md) (EE)
- [iching-alignment](src/lib/iching-alignment.ts)
- [nations](src/lib/game/nations.ts)

## References

- [docs/architecture/nation-move-profiles.md](../../../docs/architecture/nation-move-profiles.md)
- [content/moves-index.md](../../../content/moves-index.md)
