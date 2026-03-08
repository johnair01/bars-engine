# Prompt: I Ching Unplayed Hexagram Preference

**Use this prompt when implementing unplayed hexagram preference for I Ching draws.**

## Context

Extend the I Ching alignment draw to prefer hexagrams the player has not yet received. Maximize unique draws before allowing duplicates. Throughput: the more that can be done with unique I Ching draws, the more effective the system.

## Prompt text

> Implement the I Ching Unplayed Hexagram Preference per [.specify/specs/iching-unplayed-preference/spec.md](../specs/iching-unplayed-preference/spec.md). Extend `IChingAlignmentContext` with `playedHexagramIds: number[]`. In `getAlignmentContext`: query `PlayerBar` where `playerId` and `source='iching'`, collect `barId` into `playedHexagramIds`. In `drawAlignedHexagram`: split scored pool into unplayed vs played; prefer unplayed (draw from unplayed only when non-empty); fall back to full pool when all qualifying hexagrams played. For pure random path (no instance): prefer unplayed from 1–64, fall back to all 64. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: Extend IChingAlignmentContext and getAlignmentContext with playedHexagramIds
- [ ] Phase 2: Extend drawAlignedHexagram to prefer unplayed
- [ ] Phase 3: Verification (new player, player with readings)

## Reference

- Spec: [.specify/specs/iching-unplayed-preference/spec.md](../specs/iching-unplayed-preference/spec.md)
- Plan: [.specify/specs/iching-unplayed-preference/plan.md](../specs/iching-unplayed-preference/plan.md)
- Tasks: [.specify/specs/iching-unplayed-preference/tasks.md](../specs/iching-unplayed-preference/tasks.md)
- Depends on: [iching-alignment-game-master-sects](../specs/iching-alignment-game-master-sects/spec.md)
