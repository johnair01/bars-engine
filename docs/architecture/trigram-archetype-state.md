# Trigram Archetype State

## Purpose

Trigram archetypes are no longer only player-facing labels. In Calrunia and bars-engine, each trigram is a stateful interpretive object that can inform player handbook copy, NPC seed data, and deterministic quest prompt assembly.

## Canonical Dimensions

Each trigram has four implementation layers:

- **Inner expression:** how the energy manifests in reflection, rest, inner work, or meditation state.
- **Outer expression:** how the same energy manifests in action, relationship, and the world of senses.
- **Developmental spectrum:** young/forming expression versus developed/full expression.
- **Hexagram position:** upper means expressing outward; lower means driving from beneath.

Developmental spectrum is not a shadow/light axis. Young expression is still the same energy, but earlier in its formation.

## Positional Hexagram Rule

Calrunia reads a hexagram as directional:

- **Upper trigram:** the visible or presenting force in the situation.
- **Lower trigram:** the motivating, grounding, or driving force beneath the presentation.

Therefore, Heaven over Earth and Earth over Heaven are not equivalent. They use the same two trigrams but tell different situational stories.

## Engine Surfaces

- `packages/bars-core/src/shared/iching-struct.ts` owns upper/lower trigram structure.
- `packages/bars-core/src/archetype-overlay/profiles.ts` exposes inner/outer, developmental, hexagram-position, and natural-opposition hooks for the eight canonical archetypes.
- `src/lib/kotter-quest-seed-grammar.ts` uses the positional rule when composing deterministic hexagram essence copy.

## Lore Surfaces

- `docs/handbook/archetypes/*.md` and `src/content/handbook/archetypes/*.md` carry player-facing inner/outer and developmental canon.
- `The Library/04 Quests/Campaigns/inner-garden/lore/Calrunia Game World/NPC_Design_Advocates/*.md` carries sect voice, hexagram positions, and natural opposition.
- `docs/architecture/CALRUNIA_NATION_SECT_INTERSECTIONS.md` defines the first priority nation x sect seed textures.

## Expansion Rules

- Add new dimensions to canonical profile data before prompt surfaces depend on them.
- Keep nation and sect identity separate: nation is origin and emotional channel; sect is chosen practice path.
- Expand the full nation x sect matrix only when an NPC roster, questline, or seed-data requirement makes a combination concrete.
