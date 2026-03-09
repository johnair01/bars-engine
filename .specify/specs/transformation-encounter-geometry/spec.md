# Spec: Transformation Encounter Geometry v0

## Purpose

Define the encounter geometry used by the Bars-engine to structure transformation interactions. Encounter geometry determines **interaction dynamics**—how quests, challenges, and narrative events unfold—independent of transformation moves themselves.

## Core Concept

Transformation encounters occur within a **3-axis interaction space**:

| Axis | Poles |
|------|-------|
| 1 | Hide ↔ Seek |
| 2 | Truth ↔ Dare |
| 3 | Interior ↔ Exterior |

Each encounter has a position within this cube. Position determines: interaction tone, challenge type, player objective, narrative framing.

The cube does not generate quests directly. It defines **interaction geometry** that transformation moves and quest templates inhabit.

## Design Rule

The system remains **independent** of the move registry and quest templates. It provides encounter classification only. No embedded quest logic.

## 8 Primary Encounter Types

| Type | Hide/Seek | Truth/Dare | Interior/Exterior |
|------|------------|------------|-------------------|
| Hidden Truth | hide | truth | interior |
| Hidden Challenge | hide | dare | interior |
| Revealed Insight | seek | truth | interior |
| Inner Breakthrough | seek | dare | interior |
| Protected Truth | hide | truth | exterior |
| Quiet Action | hide | dare | exterior |
| Revealed Truth | seek | truth | exterior |
| Courageous Action | seek | dare | exterior |

## Integration Points

- **Transformation moves**: Default alignments (Observe → Hide/Truth/Interior, etc.)
- **Quest templates**: Preferred geometry (Reflection Arc → Hide/Truth/Interior)
- **Nations**: Encounter weighting (Argyra → Seek/Truth)
- **Archetypes**: Encounter tendencies (Bold Heart → Seek/Dare/Exterior)

## Generation Flow

```
Narrative parsed
→ transformation lock detected
→ encounter geometry chosen
→ quest template selected
→ moves chosen from registry
→ nation/archetype overlays applied
```

## Dependencies

- [Transformation Move Registry](../transformation-move-registry/spec.md)
- [Nation Move Profiles](../nation-move-profiles/spec.md)
- [Archetype Move Styles](../archetype-move-styles/spec.md)

## Reference

- Architecture: [docs/architecture/transformation-encounter-geometry.md](../../../docs/architecture/transformation-encounter-geometry.md)
