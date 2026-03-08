# Plan: I Ching Unplayed Hexagram Preference

## Summary

Extend I Ching alignment so draws prefer hexagrams the player has not yet received. Fetch played hexagram IDs from PlayerBar (source='iching'), add to context, and update draw logic to prefer unplayed before allowing duplicates.

## Prerequisites

- [I Ching Alignment and Game Master Sects](../iching-alignment-game-master-sects/spec.md) — implemented (getAlignmentContext, drawAlignedHexagram)

## Phase 1: Extend getAlignmentContext

### File: `src/lib/iching-alignment.ts`

**Extend IChingAlignmentContext**:
```ts
playedHexagramIds: number[]  // barIds from PlayerBar where source='iching'
```

**Extend getAlignmentContext**:
- Add query: `db.playerBar.findMany({ where: { playerId, source: 'iching' }, select: { barId: true } })`
- Map to `playedHexagramIds = playedBars.map(pb => pb.barId)`
- Include in returned context
- When player is null: return `playedHexagramIds: []`

Run query in parallel with existing player/instance fetch (or after player fetch, since we need playerId).

## Phase 2: Extend drawAlignedHexagram

### File: `src/lib/iching-alignment.ts`

**Aligned path** (context.kotterStage != null):
1. Build scored pool (existing logic)
2. `unplayed = pool.filter(p => !context.playedHexagramIds.includes(p.id))`
3. `drawPool = unplayed.length > 0 ? unplayed : pool`
4. Weighted random from drawPool (existing logic)

**Pure random path** (context.kotterStage == null):
1. `unplayed = [1..64].filter(id => !context.playedHexagramIds.includes(id))`
2. `drawPool = unplayed.length > 0 ? unplayed : [1..64]`
3. Random from drawPool: `drawPool[Math.floor(Math.random() * drawPool.length)]`

## File Impacts

| Action | Path |
|--------|------|
| Modify | src/lib/iching-alignment.ts |

## Implementation Order

1. Extend IChingAlignmentContext with playedHexagramIds
2. Extend getAlignmentContext to fetch and include playedHexagramIds
3. Extend drawAlignedHexagram: split pool, prefer unplayed
4. Run npm run build and npm run check — fail-fix

## Verification

- New player (no PlayerBar iching): behavior unchanged; all 64 unplayed
- Player with 10 accepted readings: next draw prefers remaining 54
- Player with all 64 accepted: draw from full pool (duplicates allowed)
