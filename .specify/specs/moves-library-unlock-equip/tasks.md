# Tasks: Moves Library — Unlock and Equip v0

## Phase 1: Spec + Types

- [x] Create spec.md with full design
- [x] Define API contracts (getPlayerMovePool, equipMove, unequipMove, useMove, getMoveUsesRemaining)
- [x] Document schema additions in spec

## Phase 2: Schema + Equip

- [x] Add PlayerMoveEquip model to Prisma
- [x] Add MoveUse model to Prisma
- [x] Add usesPerPeriod to NationMove
- [x] Add grantsMoveId to CustomBar
- [x] Add Player relations (moveEquips, moveUses)
- [x] Run db:sync
- [x] Create src/actions/moves-library.ts (or extend nation-moves)
- [x] Implement getPlayerMovePool
- [x] Implement equipMove, unequipMove
- [x] Enforce 4-slot and unlocked validation

## Phase 3: Unlock

- [x] Add completion hook: check CustomBar.grantsMoveId on quest complete
- [x] Insert PlayerNationMoveUnlock when grantsMoveId set
- [x] Idempotent unlock

## Phase 4: Use + Cooldown

- [x] Implement useMove with period limit check
- [x] Record MoveUse on successful use
- [x] Integrate with applyNationMoveWithState
- [x] Implement getMoveUsesRemaining

## Phase 5: Archetype Pool

- [x] Add playbookId to NationMove (nullable) or create ArchetypeMove
- [x] Extend getPlayerMovePool to include archetype moves
- [x] Resolve starting pool from nation + archetype
