# Prompt: Archetype Move Styles v0

**Use this prompt when implementing Archetype Move Styles — 8 trigram-linked Playbooks, agency style, prompt modifiers, quest style.**

## Context

Archetype Move Styles define how the 8 core Playbooks (The Bold Heart, The Devoted Guardian, etc.) modify transformation move expression. Archetype key = playbook slug (bold-heart, devoted-guardian, etc.). Archetypes shape baseline agency; Superpowers are a separate extension layer.

## Prompt text

> Implement Archetype Move Styles per [.specify/specs/archetype-move-styles/spec.md](../specs/archetype-move-styles/spec.md). Add `src/lib/narrative-transformation/moves/archetype-profiles.ts` with ArchetypeMoveStyle type and profiles for all 8 archetypes (bold-heart, devoted-guardian, decisive-storm, danger-walker, still-point, subtle-influence, truth-seer, joyful-connector). Implement getArchetypeMoveStyle(archetypeKey), applyArchetypeOverlay(moves, profile), applyArchetypeQuestFlavor(questSeed, profile). Wire into Transformation Move Library selectMoves. Add archetype_style to QuestSeed. Use playbook slug for archetypeKey. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: ArchetypeMoveStyle type, getArchetypeMoveStyle, 8 profiles
- [ ] Phase 2: applyArchetypeOverlay, wire into selectMoves
- [ ] Phase 3: archetype_style in QuestSeed, applyArchetypeQuestFlavor
- [ ] Phase 4: Unit tests, integration with TML

## Reference

- Spec: [.specify/specs/archetype-move-styles/spec.md](../specs/archetype-move-styles/spec.md)
- Plan: [.specify/specs/archetype-move-styles/plan.md](../specs/archetype-move-styles/plan.md)
- Tasks: [.specify/specs/archetype-move-styles/tasks.md](../specs/archetype-move-styles/tasks.md)
- Archetype key reconciliation: [docs/architecture/archetype-key-reconciliation.md](../../docs/architecture/archetype-key-reconciliation.md)
- Transformation Move Library: [.specify/specs/transformation-move-library/spec.md](../specs/transformation-move-library/spec.md)
