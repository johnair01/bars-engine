# Spec: Superpower Move Extensions v0

## Purpose

Define how advanced Allyship Superpowers extend the move styles of base archetypes. Superpowers are domain-specific advanced specializations that sit on top of the core archetype system. They are not base archetypes. They add advanced move options, modify quest emphasis, and unlock specialized action types for allyship-domain quest generation.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Superpower vs Archetype | Superpowers = allyship prestige; Archetypes = base agency. Do not collapse. |
| Compatibility | Each superpower attaches to one or more base archetypes (explicit mapping). |
| Unlock logic | Only apply when player has unlocked; quest domain calls for it. |
| Domain | Allyship domains: GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING. |

## Core Design Model

```
WCGS → Nation → Base Archetype → Optional Superpower Extension → Quest Seed
```

Superpowers add advanced move options, modify quest emphasis, unlock specialized action types. They do not replace the base archetype, redefine nation channels, or bypass the core developmental loop.

## Superpower Extension Model

```ts
type AllyshipDomain = 'GATHERING_RESOURCES' | 'DIRECT_ACTION' | 'RAISE_AWARENESS' | 'SKILLFUL_ORGANIZING'

interface SuperpowerExtension {
  superpowerId: string
  systemName: string
  baseArchetypeCompatibility: string[]  // archetype keys, e.g. joyful-connector
  domain: 'allyship'
  extensionMoveStyles: string[]
  advancedActionPatterns: string[]
  unlockRequirements?: string[]
  questModifiers: string[]
}
```

## Superpower Catalog (ChatGPT Archetypes → Superpower Layer)

| Superpower | System Name | Compatible Base Archetypes | Domain Emphasis |
|------------|-------------|---------------------------|-----------------|
| connector | Connector | joyful-connector, devoted-guardian | RAISE_AWARENESS, GATHERING_RESOURCES |
| storyteller | Storyteller | truth-seer, subtle-influence | RAISE_AWARENESS |
| strategist | Strategist | bold-heart, still-point | SKILLFUL_ORGANIZING |
| alchemist | Alchemist | danger-walker, truth-seer | DIRECT_ACTION, emotional alchemy |
| escape-artist | Escape Artist | subtle-influence, danger-walker | DIRECT_ACTION |
| disruptor | Disruptor | decisive-storm, danger-walker | DIRECT_ACTION |

## Role in Quest Generation

Superpower extensions influence:

- Advanced quest objectives
- Domain-specific allyship tasks
- Higher-order reflection prompts
- Specialized collaboration patterns

They only appear when:

- The player has unlocked them
- The quest domain (allyshipDomain) calls for them
- The generation mode includes advanced specialization

## Compatibility Rules

- A superpower MUST attach to one or more base archetypes.
- Compatibility is explicit; do not assume universal compatibility.
- When applying: check player's archetype is in baseArchetypeCompatibility.
- When applying: check allyshipDomain matches quest context.

## Functional Requirements

- **FR1**: SuperpowerExtension type with superpowerId, baseArchetypeCompatibility, extensionMoveStyles, questModifiers.
- **FR2**: Superpower catalog for Connector, Storyteller, Strategist, Alchemist, Escape Artist, Disruptor.
- **FR3**: getSuperpowerExtension(superpowerId) returns extension.
- **FR4**: isSuperpowerCompatible(superpowerId, archetypeKey) checks compatibility.
- **FR5**: applySuperpowerOverlay only when unlocked and domain-relevant.

## Testing Requirements

- Superpowers only apply when compatible with base archetype.
- Superpower overlays preserve base archetype identity.
- Allyship quest generation differs when extensions are present.
- Quest seeds still preserve WCGS structure.

## Constraints

- Do not replace base archetype.
- Do not redefine nation emotional channels.
- Do not bypass core developmental loop.
- Favor explicit compatibility; no universal superpower application.

## Dependencies

- [archetype-move-styles](../archetype-move-styles/spec.md) (EG)
- [transformation-move-library](../transformation-move-library/spec.md) (EE)
- Allyship domains: [allyship-domain-definitions](../../memory/allyship-domain-definitions.md)

## References

- [content/lore-index.md](../../../content/lore-index.md) — Allyship Domains
- [prisma/schema.prisma](../../../prisma/schema.prisma) — CustomBar.allyshipDomain
