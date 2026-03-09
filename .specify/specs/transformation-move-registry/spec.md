# Spec: Transformation Move Registry v0

## Purpose

Define the canonical registry of transformation moves used by the Narrative Transformation Engine, WCGS developmental loop, Nation Move Profiles, Archetype Move Styles, and quest generation systems. The registry provides a **stable, machine-readable catalog** of the engine's core transformation verbs.

## Design Rule

Transformation moves are **registry objects**, not one-off prompts embedded in quests. A quest references or composes moves from the registry.

## Canonical Move Set

| # | Move | WCGS Stage |
|---|------|------------|
| 1 | Observe | wake_up |
| 2 | Name | wake_up |
| 3 | Externalize | clean_up |
| 4 | Feel | clean_up |
| 5 | Reframe | grow_up |
| 6 | Invert | grow_up |
| 7 | Experiment | show_up |
| 8 | Integrate | show_up |

## Registry Capabilities

- Selection by WCGS stage
- Filtering by lock type
- Filtering by nation compatibility
- Filtering by archetype compatibility
- Prompt generation from templates
- Quest seed assembly

## Implementation Paths

```
src/lib/transformation-move-registry/
src/lib/transformation-move-registry/registry/
src/lib/transformation-move-registry/types/
src/lib/transformation-move-registry/services/
src/lib/transformation-move-registry/__tests__/
```

## Dependencies

- [Narrative Transformation Engine](../narrative-transformation-engine/spec.md)
- [Transformation Move Library](../transformation-move-library/spec.md)
- [Nation Move Profiles](../nation-move-profiles/spec.md)
- [Archetype Move Styles](../archetype-move-styles/spec.md)

## Reference

- Architecture: [docs/architecture/transformation-move-registry.md](../../../docs/architecture/transformation-move-registry.md)
- Example registry: [docs/examples/transformation-move-registry-example.md](../../../docs/examples/transformation-move-registry-example.md)
- Quest seed example: [docs/examples/transformation-quest-seed-from-registry.md](../../../docs/examples/transformation-quest-seed-from-registry.md)
