# Plan: Emotional Alchemy Scene Library
### Architect-led; Regent reviews scene template quality

See full plan in: [agentic-npc-constitution/plan.md](../agentic-npc-constitution/plan.md) — AES Phase 1 and Phase 2.

## Quick Reference

**Phase 1 (Architect)**: Schema — `AlchemyPlayerState`, `AlchemySceneEvent`; types — `AlchemyAltitude`; actions — `getPlayerAlchemyState`, `setPlayerAlchemyState`, `advancePlayerAltitude`.

**Phase 2 (Architect + Regent)**: Schema — `AlchemySceneTemplate`; seed — 10 vectors × 2 templates; service — `selectScene(playerId, opts)`.

## Key Integration Points

- `src/lib/charge-quest-generator/types.ts` — extend `EmotionChannel`, do not duplicate
- `src/actions/bars.ts` → call `setPlayerAlchemyState` on BAR creation/completion
- `src/app/shadow/321/Shadow321Runner.tsx` → call `setPlayerAlchemyState` on 321 completion
- `src/lib/alchemy/select-scene.ts` → consumed by NPC action layer + scene CYOA generator
