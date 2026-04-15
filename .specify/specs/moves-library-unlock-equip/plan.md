# Plan: Moves Library — Unlock and Equip v0

## Phases

### Phase 1: Spec + Types (Done)

- Create spec.md with full design
- Define API contracts
- Document schema additions

### Phase 2: Schema + Equip

- Add PlayerMoveEquip, MoveUse to Prisma
- Add usesPerPeriod to NationMove
- Add grantsMoveId to CustomBar (optional)
- Add Player relations for new models
- Run db:sync
- Implement getPlayerMovePool, equipMove, unequipMove in moves-library.ts (or extend nation-moves)

### Phase 3: Unlock

- On PlayerQuest completion (or quest completion flow), check CustomBar.grantsMoveId
- Insert PlayerNationMoveUnlock when grantsMoveId set
- Idempotent (ignore if already unlocked)

### Phase 4: Use + Cooldown

- Add useMove action with period limit check
- Integrate with applyNationMoveWithState (or equivalent)
- Record MoveUse on successful use

### Phase 5: Archetype Pool

- Archetype contributes to starting pool
- Option A: NationMove.playbookId (nullable) — move available when player's playbook matches
- Option B: ArchetypeMove table — separate archetype-scoped moves
- Resolve in getPlayerMovePool

## Dependencies

- Prisma, existing NationMove/Nation/Playbook
- nation-moves.ts apply logic

## Risks

- Quest completion hook: Need to find where completion is recorded (PlayerQuest, executeBindingsForPassage, etc.)
- Period timezone: UTC daily is simple; local time may be preferred later
