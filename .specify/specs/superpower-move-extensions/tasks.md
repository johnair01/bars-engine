# Tasks: Superpower Move Extensions v0

## Phase 1: Extension Data

- [ ] **T1.1** Define SuperpowerExtension type.
- [ ] **T1.2** Implement getSuperpowerExtension(superpowerId).
- [ ] **T1.3** Implement isSuperpowerCompatible(superpowerId, archetypeKey).
- [ ] **T1.4** Add catalog: connector, storyteller, strategist, alchemist, escape-artist, disruptor.

## Phase 2: Unlock Logic

- [ ] **T2.1** Define hasSuperpowerUnlocked(playerId, superpowerId) stub or accept superpowerId in context.
- [ ] **T2.2** Document unlock requirements per superpower for future implementation.

## Phase 3: Overlay Integration

- [ ] **T3.1** Implement applySuperpowerOverlay(moves, extension, archetypeKey, allyshipDomain).
- [ ] **T3.2** Wire into selectMoves when superpowerId provided and compatible.
- [ ] **T3.3** Quest seeds incorporate superpower modifiers when applicable.

## Phase 4: Tests

- [ ] **T4.1** Add __tests__/superpower-extensions.test.ts.
- [ ] **T4.2** Verify superpower overlays preserve base archetype; allyship quests differ with extensions.
