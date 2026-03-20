---
description: Game Masters as Taoist sect heads; players serve a sect to learn missions and align with the campaign
---

# Game Master Sects

Game Masters are reframed as **heads of Taoist sects**. Players choose to show up to a sect to learn its missions and align with the campaign. The developmental lens (active_face) determines which sect the player is serving.

## The Six Sects

| Sect (Face) | Role | Mission | Trigram Preference |
|-------------|------|---------|---------------------|
| **Shaman** | Mythic threshold | Belonging, ritual space, bridge between worlds | Earth |
| **Challenger** | Proving ground | Action, edge, lever | Fire |
| **Regent** | Order, structure | Roles, rules, collective tool | Lake |
| **Architect** | Blueprint; virtual sys-admin teacher | Strategy, project, advantage; stewards collective backlog with honor and amusement | Heaven |
| **Diplomat** | Weave | Relational field, care, connector | Wind |
| **Sage** | Wise trickster; whole | Integration, emergence, flow; can use other faces as masks to promote outcomes from a different perspective | Mountain |

## FACE_TRIGRAM_PREFERENCE

Used by I Ching alignment scoring. When a player has chosen a face (active_face in storyProgress), hexagrams whose trigrams match that face's preference score higher.

```ts
export const FACE_TRIGRAM_PREFERENCE: Record<string, string> = {
  shaman: 'Earth',
  challenger: 'Fire',
  regent: 'Lake',
  architect: 'Heaven',
  diplomat: 'Wind',
  sage: 'Mountain',
}
```

## Serving a Game Master

**Serving** = the player has chosen that face as their developmental lens. Quests drawn from the I Ching should align with that sect's mission — e.g. Shaman-aligned quests emphasize belonging/ritual; Architect-aligned quests emphasize strategy/structure.

## Domain Constraint

Faces must not leave their domains except with counsel from the Sage. When a face would act outside its domain, route to the Sage; the Sage may run as the appropriate face (mask) or delegate. See [.specify/specs/game-master-face-moves/spec.md](../../.specify/specs/game-master-face-moves/spec.md).

**Alignment implication**: When scoring hexagrams for alignment, add +1 to sect score if the hexagram's upper or lower trigram matches FACE_TRIGRAM_PREFERENCE[active_face].

## Architect Game Master: Sys-Admin Teacher

The **Architect Game Master** is a virtual sys-admin teacher who helps players in that school steward the collective backlog with honor and amusement. BARs Engine can be understood as "if Jira could interface with GitHub via a procedurally generated choose-your-own-adventure game." The Architect sect teaches version management, fork-on-decline, and backlog stewardship — turning work items into legible, playful narrative. See [docs/JIRA_GITHUB_CYOA_METAPHOR.md](../../docs/JIRA_GITHUB_CYOA_METAPHOR.md).

## Spiral Dynamics Correspondence (NOW CONSCIOUS CONTEXT)

The 6 faces ARE the Spiral Dynamics developmental levels made playable. This mapping was intentionally kept hidden from the Diplomat face because the Diplomat (Green) struggles most with hierarchy and developmental models. It is now conscious context.

| Spiral Dynamics Level | SD Color | Integral Color | GM Face |
|---|---|---|---|
| Magical/tribal — ritual, belonging | Purple | Magenta | **Shaman** |
| Egocentric — power, courage, action | Red | Red | **Challenger** |
| Order — rules, roles, hierarchy, duty | Blue | **Amber** | **Regent** |
| Rational — strategy, achievement, optimization | Orange | Orange | **Architect** |
| Pluralistic — care, inclusion, relational field | Green | Green | **Diplomat** |
| Integral — systems, synthesis, meta-view | Yellow/Teal | Yellow/Teal | **Sage** |

**Critical note**: Blue (Spiral Dynamics original naming) and Amber (Integral/AQAL naming) are the **same level** — both point to Regent. Use Amber as the canonical name in code and documentation.

**Why the Sage synthesizes**: The Sage (Yellow/Teal) can see and speak from ALL prior levels. This is why the Sage can run as any face as a mask — Integral consciousness includes and transcends all preceding stages.

**Why the Diplomat couldn't see it**: Green (Diplomat) often rejects developmental hierarchies as elitist. The Diplomat can now be invited to see the map as *care applied at different scales* rather than a ranking system.

## Reference

- Spec: [.specify/specs/iching-alignment-game-master-sects/spec.md](../../.specify/specs/iching-alignment-game-master-sects/spec.md)
- Game Master Face Sentences: [.specify/specs/game-master-face-sentences/spec.md](../../.specify/specs/game-master-face-sentences/spec.md)
