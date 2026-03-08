# Tasks: I Ching Unplayed Hexagram Preference

## Phase 1 — Extend Context

- [x] Add `playedHexagramIds: number[]` to `IChingAlignmentContext` type
- [x] In `getAlignmentContext`: query `PlayerBar` where `playerId` and `source='iching'`
- [x] Collect `barId` into `playedHexagramIds` and include in returned context
- [x] When player is null: return `playedHexagramIds: []`

## Phase 2 — Extend Draw Logic

- [x] In `drawAlignedHexagram` (aligned path): split pool into unplayed vs played by `playedHexagramIds`
- [x] If unplayed non-empty: draw from unplayed only (weighted random)
- [x] If unplayed empty: draw from full pool
- [x] In `drawAlignedHexagram` (pure random path): prefer unplayed from 1–64; fall back to all 64
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 3 — Verification

- [ ] Manual test: new player casts; verify no regression
- [ ] Manual test: player with accepted readings; verify preference for unplayed (or inspect logic)
