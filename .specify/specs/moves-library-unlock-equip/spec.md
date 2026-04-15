# Spec: Moves Library — Unlock and Equip v0

## Purpose

Enable players to unlock moves (via quest completion), equip up to 4 from their pool into slots, and expend uses per period—like D&D spell slots. Moves increase throughput toward goals, remove blockers, and can create BARs or quests. Real-world roots: meeting actions, personal practice, relational support, creative craft.

**Problem**: NationMove and PlayerNationMoveUnlock exist, but there is no equip-slots model, no uses-per-period, no archetype contribution to the pool, and no quest-completion unlock flow.

**Practice**: API-first; leverage existing NationMove schema; extend incrementally.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Equip slots | 4 slots; player chooses which 4 from unlocked pool |
| Uses per period | Each move has `usesPerPeriod` (e.g. 2); period = daily (midnight UTC) |
| Unlock path | Quest completion → check `grantsMoveId`; insert PlayerNationMoveUnlock |
| Premium quests | Quest has `vibeulonUnlockCost`; pay → access → complete → unlock move |
| Pool sources | Nation moves (player's nation) + Archetype moves (player's playbook) |
| BAR/Quest creation | Yes — some moves create BARs (Clarity, Prestige, Framework) or quests |

## Conceptual Model

| Concept | Meaning |
|---------|---------|
| **Moves pool** | Union of Nation moves + Archetype moves available to player |
| **Unlocked** | Moves in pool (starting + from PlayerNationMoveUnlock) |
| **Equipped** | Up to 4 moves in slots 1–4 (PlayerMoveEquip) |
| **Use** | Apply move; consumes 1 use for period; recorded in MoveUse |
| **Good move** | Increases throughput, removes blockers, makes progress attractive |

## Data Model

### Schema Additions

```prisma
model PlayerMoveEquip {
  id         String     @id @default(cuid())
  playerId   String
  slotIndex  Int        // 1-4
  moveId     String
  equippedAt DateTime     @default(now())
  move       NationMove @relation(fields: [moveId], references: [id], onDelete: Cascade)
  player     Player     @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([playerId, slotIndex])
  @@unique([playerId, moveId])
  @@index([playerId])
  @@map("player_move_equips")
}

model MoveUse {
  id        String     @id @default(cuid())
  playerId  String
  moveId    String
  periodKey String     // e.g. "2025-03-02" for daily
  usedAt    DateTime   @default(now())
  questId   String?
  move      NationMove @relation(fields: [moveId], references: [id], onDelete: Cascade)
  player    Player     @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([playerId, moveId, periodKey])
  @@map("move_uses")
}

// NationMove: add usesPerPeriod Int @default(2)
// CustomBar: add grantsMoveId String? (optional)
```

### NationMove Extension

- `usesPerPeriod` Int @default(2) — max uses per period; 0 = unlimited

### CustomBar Extension (for unlock)

- `grantsMoveId` String? — when set, completing this quest unlocks this NationMove

## API Contracts

### getPlayerMovePool(playerId: string)

**Output**: `Promise<{ unlocked: MoveSummary[]; equipped: EquippedMove[]; usesRemaining: Record<string, number> } | { error: string }>`

- `unlocked`: All moves in pool (nation + archetype starting + PlayerNationMoveUnlock)
- `equipped`: 4 slots with move or null
- `usesRemaining`: Per moveId, remaining uses for current period

### equipMove(playerId: string, moveId: string, slotIndex: 1 | 2 | 3 | 4)

**Output**: `Promise<{ success: true } | { error: string }>`

- Validates move is unlocked
- Validates slotIndex 1–4
- Upserts PlayerMoveEquip; clears slot if moveId already in another slot

### unequipMove(playerId: string, slotIndex: 1 | 2 | 3 | 4)

**Output**: `Promise<{ success: true } | { error: string }>`

- Deletes PlayerMoveEquip for slot

### useMove(playerId: string, moveId: string, questId: string, inputs?: Record<string, unknown>)

**Output**: `Promise<{ success: true; createdBarId?: string; questStatus?: string } | { error: string }>`

- Validates move is equipped
- Validates uses remaining for period
- Records MoveUse
- Delegates to existing apply logic (create BAR, update quest status)

### getMoveUsesRemaining(playerId: string, moveId: string)

**Output**: `Promise<{ remaining: number; periodKey: string } | { error: string }>`

- Returns uses left for current period

## Move Pool Resolution

1. **Nation moves**: From player's nation; `isStartingUnlocked` OR in PlayerNationMoveUnlock
2. **Archetype moves**: From player's playbook (Phase 5); NationMove with `playbookId` or ArchetypeMove join
3. **Unlocked**: Union of above
4. **Equipped**: PlayerMoveEquip for player; max 4 slots

## Unlock Flow

1. On quest completion (PlayerQuest status → completed):

   - Read CustomBar.completionEffects or CustomBar.grantsMoveId
   - If `grantsMoveId` set: insert PlayerNationMoveUnlock (idempotent)

2. Premium quest:

   - CustomBar has `vibeulonUnlockCost`; player pays → gains access
   - On completion → same unlock as above

## Use Flow (Spell-Slot Style)

1. Player has 4 equipped moves (PlayerMoveEquip)
2. Each NationMove has `usesPerPeriod` (default 2)
3. Period key: `YYYY-MM-DD` (daily, UTC)
4. On use: Check MoveUse count for (playerId, moveId, periodKey); if < usesPerPeriod, allow; insert MoveUse
5. Delegate to existing `applyNationMoveWithState` for BAR creation, quest status updates

## Period Definition

- **Default**: Daily (midnight UTC) — periodKey = `new Date().toISOString().slice(0, 10)`
- **Future**: Configurable per campaign or instance

## Real-Life Translation

| Category | Example moves |
|----------|---------------|
| Meeting/facilitation | Call the Standard, Name the Stakes, Cut the Noise |
| Personal practice | Observe, Name, Feel, Reframe |
| Relational | Nurture, Offer AID, Externalize (dialogue) |
| Creative | Forge Template, Highlight Craft |

## Functional Requirements

- **FR1**: PlayerMoveEquip stores up to 4 equipped moves per player
- **FR2**: MoveUse tracks uses per (player, move, period)
- **FR3**: NationMove.usesPerPeriod (default 2)
- **FR4**: equipMove, unequipMove enforce 4-slot and unlocked validation
- **FR5**: useMove checks period limit before delegating to apply logic
- **FR6**: Quest completion checks grantsMoveId and inserts unlock
- **FR7**: getPlayerMovePool returns unlocked, equipped, usesRemaining

## Dependencies

- [nation-moves.ts](src/actions/nation-moves.ts) — apply logic
- [NationMove](prisma/schema.prisma) — existing model
- [PlayerNationMoveUnlock](prisma/schema.prisma) — existing model

## References

- Plan: [.specify/specs/moves-library-unlock-equip/plan.md](plan.md)
- Tasks: [.specify/specs/moves-library-unlock-equip/tasks.md](tasks.md)
- [transformation-move-library](../transformation-move-library/spec.md)
- [gameboard-deep-engagement](../gameboard-deep-engagement/spec.md)
