# Campaign Move Loop — Implementation Summary

**Date**: 2026-03-17  
**Spec**: [CAMPAIGN_MOVE_LOOP_SYNTHESIS.md](./CAMPAIGN_MOVE_LOOP_SYNTHESIS.md)

## Implemented

### 1. Schema
- **Instance.moveIds** — `String @default("[]")` — JSON array of NationMove ids (campaign move pool)

### 2. Admin: Instance move pool
- **upsertInstance** — Parses `formData.getAll('moveIds')`, persists as JSON
- **InstanceEditModal** — Move pool picker (checkboxes) for promoted moves (CANDIDATE/CANONICAL)
- **Admin instances page** — Move pool on create form; `listPromotedMoves()` passed to InstanceListWithEdit

### 3. Move panel filtering
- **getNationMovePanelData** — When active instance (from AppConfig) has non-empty moveIds, filters moves to those in the pool. Intersection: (nation + archetype moves) ∩ instance.moveIds.

### 4. Quest authoring: Grant move
- **upsertQuest** — Accepts `grantsMoveId`; persists to CustomBar
- **Admin quest edit** (`/admin/quests/[id]`) — "Grant move on completion" dropdown; lists all promoted moves

## Flow

1. **Admin curates move pool** — Edit Instance → select moves from promoted list → Save
2. **Admin assigns quests with grantsMoveId** — Edit Quest → pick "Grant move on completion" → Save
3. **Player completes quest** — quest-engine.ts already honors `grantsMoveId` → PlayerNationMoveUnlock
4. **Move panel shows campaign pool** — When active instance has moveIds, only those moves appear (filtered by player nation/archetype)

## Deferred

- **Validation**: Warn when quest.grantsMoveId ∉ Instance.moveIds for campaign quests
- **Instance-scoped nation** — Revisit if campaigns need fully isolated nation identity
