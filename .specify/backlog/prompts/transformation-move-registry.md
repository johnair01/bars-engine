# Backlog Prompt: Transformation Move Registry v0

## Spec

[.specify/specs/transformation-move-registry/spec.md](../specs/transformation-move-registry/spec.md)

## Summary

The Transformation Move Registry is the canonical, machine-readable catalog of the engine's 8 core transformation verbs: Observe, Name, Externalize, Reframe, Invert, Feel, Experiment, Integrate. It provides a single source of truth for moves used by the Narrative Transformation Engine, WCGS loop, Nation Move Profiles, Archetype Move Styles, and quest generation.

## Key Deliverables

- **Registry structure**: move_id, move_name, wcgs_stage, prompt_templates, compatible_lock_types, bar_integration, quest_usage
- **WCGS mapping**: Wake Up (Observe, Name), Clean Up (Externalize, Feel), Grow Up (Reframe, Invert), Show Up (Experiment, Integrate)
- **Services**: filter by stage/lock type, render prompt templates, assemble quest seeds
- **Docs**: architecture, example entries, quest seed example

## Implementation Paths

```
src/lib/transformation-move-registry/
src/lib/transformation-move-registry/registry.ts
src/lib/transformation-move-registry/types.ts
src/lib/transformation-move-registry/services.ts
src/lib/transformation-move-registry/__tests__/
```

## Dependencies

- Narrative Transformation Engine (ED)
- Transformation Move Library (EE)
- Nation Move Profiles (EF)
