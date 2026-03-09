# Prompt: Archetype Influence Overlay v1

Implement per [.specify/specs/archetype-influence-overlay/spec.md](../specs/archetype-influence-overlay/spec.md).

**Purpose**: Add an agency overlay layer so the 8 canonical trigram archetypes modify transformation quest expression. Archetypes influence experiment objectives, integration prompts, and quest action style—not move selection or WCGS structure.

**Correction**: Do not use Allyship Superpowers as archetypes. Superpowers remain a separate extension layer.

**Canonical mapping**: Heaven→Bold Heart, Water→Danger Walker, Fire→Truth Seer, Mountain→Still Point, Wind→Subtle Influence, Earth→Devoted Guardian, Thunder→Decisive Storm, Lake→Joyful Connector.

**Deliverables**:
- `ArchetypeInfluenceProfile` type and 8 profiles
- `getArchetypeInfluenceProfile(archetypeKey)`
- `applyArchetypeOverlay(questSeed, profile)`
- Integration with quest generation pipeline
- Tests for overlay behavior and nation+archetype distinct outputs

**Verification**: `npm run build` and `npm run check` pass. Archetype overlay modifies quest prompts without changing move registry logic.
