# Plan: Archetype Influence Overlay v1

## Summary

Add an agency overlay layer that applies archetype influence to transformation quest generation. Archetypes (8 canonical trigram-corresponded) modify experiment/integration expression without changing move selection or WCGS structure. Superpowers remain a separate extension layer.

## Phases

### Phase 1: Types and profiles

1. Create `src/lib/archetype-influence-overlay/types.ts` — `ArchetypeInfluenceProfile` interface.
2. Create `src/lib/archetype-influence-overlay/profiles.ts` — all 8 profiles with agency_pattern, action_style, reflection_style, prompt_modifiers, quest_style_modifiers.
3. Create `src/lib/archetype-influence-overlay/index.ts` — export `getArchetypeInfluenceProfile(archetypeKey)`.

### Phase 2: Overlay application

1. Create `applyArchetypeOverlay(questSeed, profile)` — modifies experiment and integration prompts using profile.
2. Integrate with `assembleQuestSeed` or quest generation pipeline — pass archetypeKey, apply overlay before returning.
3. Ensure `renderPromptTemplate` / prompt generation receives archetype context.

### Phase 3: Integration and tests

1. Wire overlay into quest-grammar or transformation pipeline where archetype is available.
2. Add tests: overlay modifies prompts; nation+archetype produces distinct outputs; move registry unchanged.
3. Document that superpowers are out of scope for this overlay.

## Files

| File | Purpose |
|------|---------|
| `src/lib/archetype-influence-overlay/types.ts` | ArchetypeInfluenceProfile interface |
| `src/lib/archetype-influence-overlay/profiles.ts` | 8 canonical profiles |
| `src/lib/archetype-influence-overlay/overlay.ts` | applyArchetypeOverlay |
| `src/lib/archetype-influence-overlay/index.ts` | Public API |
| `src/lib/archetype-influence-overlay/__tests__/` | Tests |

## Compatibility

- Transformation Move Registry: overlay receives QuestSeedArc; does not change move selection.
- Nation Move Profiles: nation lens applied before archetype overlay.
- Quest Templates: template provides structure; overlay flavors expression.
- Superpowers: no references; future spec adds separate layer.
