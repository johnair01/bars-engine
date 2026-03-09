# Prompt: Nation Move Profiles v0

**Use this prompt when implementing Nation Move Profiles — Emotional Alchemy integration, emotion channel, developmental emphasis, move style per nation.**

## Context

Nation Move Profiles define how each nation influences the transformation move system. Each nation maps to one Emotional Alchemy channel (Argyra→fear, Pyrakanth→anger, Lamenth→sadness, Meridia→neutrality, Virelune→joy). Profiles encode: emotional_channel, developmental_emphasis, move_style. Nations become distinct transformation ecologies.

## Prompt text

> Implement Nation Move Profiles per [.specify/specs/nation-move-profiles/spec.md](../specs/nation-move-profiles/spec.md). Add or extend `src/lib/narrative-transformation/moves/nation-profiles.ts` with NationMoveProfile type (emotionChannel, developmentalEmphasis, moveStyleModifiers, questFlavorModifiers, exampleMoveFlavors). Implement getNationMoveProfile(nationId), applyNationOverlay(coreMoves, profile), applyNationQuestFlavor(questSeed, profile). Wire into Transformation Move Library selectMoves and quest seed generation. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: NationMoveProfile type, getNationMoveProfile, profiles for all 5 nations
- [ ] Phase 2: applyNationOverlay for move weighting/ordering
- [ ] Phase 3: applyNationQuestFlavor for quest seed variation
- [ ] Phase 4: Unit tests, integration with Transformation Move Library

## Reference

- Spec: [.specify/specs/nation-move-profiles/spec.md](../specs/nation-move-profiles/spec.md)
- Plan: [.specify/specs/nation-move-profiles/plan.md](../specs/nation-move-profiles/plan.md)
- Tasks: [.specify/specs/nation-move-profiles/tasks.md](../specs/nation-move-profiles/tasks.md)
- Architecture: [docs/architecture/nation-move-profiles.md](../../docs/architecture/nation-move-profiles.md)
- Transformation Move Library: [.specify/specs/transformation-move-library/spec.md](../specs/transformation-move-library/spec.md)
