# Spec: Transformation Move Library v1

## Purpose

Define the catalog of transformation moves used by the Narrative Transformation Engine. All moves map into the four core developmental moves (Wake Up, Clean Up, Grow Up, Show Up). The library has four layers: Core WCGS, Nation Move Overlay, Archetype Move Style, optional Superpower Extension. Nation and Archetype layers flavor prompts so quests feel distinct per nation and archetype. Superpowers extend archetypes for allyship-domain quest generation.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Move taxonomy | Four layers: core (WCGS), nation, archetype, optional superpower. Nation/archetype modify or extend core; superpower extends archetype for allyship. |
| Move types | wake_up, clean_up, grow_up, show_up (PersonalMoveType). |
| Quest seed shape | One prompt per WCGS stage: wake_prompt, cleanup_prompt, grow_prompt, show_objective, bar_prompt. |
| Nation profiles | Each nation has preferred_move_types and move_modifiers. See [nation-move-profiles.md](../../../docs/architecture/nation-move-profiles.md). |
| Archetype profiles | Each archetype has move_style and preferred_core_moves. |
| Selection logic | lock → core move → nation modifier → archetype style → prompt. |

## Conceptual Model

| Layer | Role |
|-------|------|
| **WCGS** | Universal transformation grammar |
| **Nation** | Cultural lens (how transformation is approached) |
| **Archetype** | Personal expression (8 trigram-linked Playbooks; how the player embodies agency) |
| **Superpower** | Allyship prestige; domain-specific advanced specialization (optional) |

## Move Data Model

```ts
type PersonalMoveType = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
type MoveLayer = 'core' | 'nation' | 'archetype'

interface TransformationMove {
  moveId: string
  moveType: PersonalMoveType
  moveLayer: MoveLayer
  description?: string
  promptTemplate: string  // supports {actor}, {state}, {object}
  inputRequirements?: string[]
  targetEffect?: string
  compatibleLockTypes?: LockType[]
  nationRestrictions?: string[]  // nation ids; empty = all
  archetypeRestrictions?: string[]  // archetype keys; empty = all
}
```

## Layer 1: Core Moves (WCGS)

### Wake Up

- **Purpose**: Increase awareness of a narrative pattern.
- **Focus**: awareness, observation, curiosity.
- **Example**: `wake_observe_pattern` — "What story are you telling yourself about {object}?"

### Clean Up

- **Purpose**: Resolve shadow material or emotional charge.
- **Focus**: shadow integration, emotional alchemy, projection work.
- **Example**: `cleanup_shadow_dialogue` — "If {state} could speak, what would it say?"

### Grow Up

- **Purpose**: Expand perspective and cognitive flexibility.
- **Focus**: perspective shift, reframing, developmental movement.
- **Example**: `grow_reframe` — "What might {object} be trying to teach you?"

### Show Up

- **Purpose**: Translate insight into real-world action.
- **Focus**: behavioral experimentation, practice, courage.
- **Example**: `show_small_action` — "What is one small action where {object} is allowed?"

## Layer 2: Nation Move Profiles

Nations modify or extend core moves. Each nation has:

- `emotion_channel`: Emotional Alchemy channel (fear, anger, sadness, neutrality, joy).
- `developmental_emphasis`: WCGS bias (e.g. Argyra → wake_up, grow_up).
- `move_style_modifiers`: How prompts are flavored (e.g. precision, directness, gentleness).
- `quest_flavor_modifiers`: How quest seeds vary by nation.

See [nation-move-profiles](../nation-move-profiles/spec.md) (EF) and [docs/architecture/nation-move-profiles.md](../../../docs/architecture/nation-move-profiles.md).

## Layer 3: Archetype Move Style

Archetypes shape how the player expresses agency. Each archetype has:

- `move_style`: Narrative flavor (e.g. narrative, meaning).
- `preferred_core_moves`: Which WCGS stages align with this archetype.

## Selection Logic

```
1. Detect narrative lock
2. Select core move (WCGS) for each stage
3. Apply nation modifier (if nationId provided)
4. Apply archetype style (if archetypeKey provided; archetypeKey = playbook slug)
5. Apply superpower overlay (if superpowerId provided, compatible, unlocked, domain-relevant)
6. Generate prompt/action via template substitution
```

## Integration with Narrative Transformation Engine

Pipeline becomes:

```
Narrative Input
→ Narrative Parse
→ Lock Detection
→ WCGS Move Selection
→ Nation Move Overlay
→ Archetype Move Overlay
→ Optional Superpower Extension
→ Quest Seed Generation
```

## Quest Seed Shape (WCGS-Aligned)

```ts
interface QuestSeed {
  questSeedType: 'narrative_transformation'
  wake_prompt: string
  cleanup_prompt: string
  grow_prompt: string
  show_objective: string
  bar_prompt: string
  nation_flavor?: string
  archetype_style?: string
}
```

## Functional Requirements

- **FR1**: Core move catalog with at least one prompt template per WCGS stage.
- **FR2**: Nation Move Profiles for all 5 nations (Argyra, Pyrakanth, Lamenth, Virelune, Meridia).
- **FR3**: Archetype move styles for all 8 Playbooks (see [archetype-move-styles](../archetype-move-styles/spec.md)).
- **FR3b**: Optional superpower overlay when unlocked and domain-relevant (see [superpower-move-extensions](../superpower-move-extensions/spec.md)).
- **FR4**: Selection logic: lock → core → nation → archetype → prompt.
- **FR5**: Template substitution: {actor}, {state}, {object}
- **FR6**: Quest seed includes all four WCGS stages

## Testing Requirements

- Moves integrate with narrative parse output.
- Nation modifiers affect move selection.
- Archetype styles alter prompts.
- Quest seeds include all four WCGS stages.

## Constraints

- Maintain WCGS developmental loop; do not bypass.
- Do not create large move libraries yet.
- Compatible with BAR mechanics and quest grammar.
- No hardcoded psychological interpretations.

## Dependencies

- [narrative-transformation-engine](../narrative-transformation-engine/spec.md) (ED)
- [quest-grammar](src/lib/quest-grammar/)
- [nations](src/lib/game/nations.ts)

## References

- [docs/architecture/nation-move-profiles.md](../../../docs/architecture/nation-move-profiles.md)
- [archetype-move-styles](../archetype-move-styles/spec.md) — 8 Playbooks, archetypeKey = playbook slug
- [superpower-move-extensions](../superpower-move-extensions/spec.md) — Allyship prestige layer
- [docs/architecture/archetype-key-reconciliation.md](../../../docs/architecture/archetype-key-reconciliation.md) — Playbook slug vs ARCHETYPE_KEYS
- [content/moves-index.md](../../../content/moves-index.md)
