# Backlog Prompt: Transformation Encounter Geometry v0

## Spec

[.specify/specs/transformation-encounter-geometry/spec.md](../specs/transformation-encounter-geometry/spec.md)

## Summary

Encounter geometry determines **how the interaction unfolds**—the 3-axis interaction space (Hide↔Seek, Truth↔Dare, Interior↔Exterior) that structures quests, challenges, and narrative events. The cube provides classification only; it integrates with Transformation Move Registry, quest templates, Nations, and Archetypes.

## Key Deliverables

- **8 encounter types**: Hidden Truth, Hidden Challenge, Revealed Insight, Inner Breakthrough, Protected Truth, Quiet Action, Revealed Truth, Courageous Action
- **Coordinate model**: hide_seek, truth_dare, interior_exterior
- **Move alignment**: Default geometry per transformation move
- **Nation/archetype weighting**: Bias and tendency metadata

## Generation Flow

```
Narrative → Encounter Geometry → Quest Template → Transformation Moves → Nation + Archetype overlays → Quest Seed
```

## Dependencies

- Transformation Move Registry (FK)
- Nation Move Profiles (EF)
- Archetype Move Styles (EG)
