# Prompt: Transformation Move Library v1

**Use this prompt when implementing the Transformation Move Library — WCGS move catalog, Nation Move Profiles, Archetype move style, selection logic.**

## Context

The Transformation Move Library defines the catalog of transformation moves used by the Narrative Transformation Engine. Three layers: Core WCGS (Wake Up, Clean Up, Grow Up, Show Up), Nation Move Overlay, Archetype Move Style. Nation and Archetype layers flavor prompts so quests feel distinct per nation (Argyra vs Pyrakanth vs Lamenth). Quest seed shape: wake_prompt, cleanup_prompt, grow_prompt, show_objective, bar_prompt.

## Prompt text

> Implement the Transformation Move Library per [.specify/specs/transformation-move-library/spec.md](../specs/transformation-move-library/spec.md). Add `src/lib/narrative-transformation/moves/` with: core-moves.ts (WCGS prompt templates), nation-profiles.ts (Nation Move Profiles for all 5 nations), archetype-profiles.ts (archetype move styles), selectMoves.ts (selection logic: lock → core → nation → archetype). Update types: TransformationMove.moveType = wake_up|clean_up|grow_up|show_up; QuestSeed = wake_prompt, cleanup_prompt, grow_prompt, show_objective, bar_prompt. Wire into Narrative Transformation Engine move generation and quest seed generation. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: core-moves.ts (WCGS catalog, template substitution)
- [ ] Phase 2: nation-profiles.ts (Argyra, Pyrakanth, Lamenth, Virelune, Meridia)
- [ ] Phase 3: archetype-profiles.ts
- [ ] Phase 4: selectMoves.ts (selection logic, generateQuestSeed)
- [ ] Phase 5: Integration with Narrative Transformation Engine, unit tests

## Reference

- Spec: [.specify/specs/transformation-move-library/spec.md](../specs/transformation-move-library/spec.md)
- Plan: [.specify/specs/transformation-move-library/plan.md](../specs/transformation-move-library/plan.md)
- Tasks: [.specify/specs/transformation-move-library/tasks.md](../specs/transformation-move-library/tasks.md)
- Nation Move Profiles: [docs/architecture/nation-move-profiles.md](../../docs/architecture/nation-move-profiles.md)
- Narrative Transformation Engine: [.specify/specs/narrative-transformation-engine/spec.md](../specs/narrative-transformation-engine/spec.md)
