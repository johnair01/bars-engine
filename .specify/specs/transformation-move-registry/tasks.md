# Tasks: Transformation Move Registry v0

## Phase 1: Documentation

- [x] **T1.1** Create docs/architecture/transformation-move-registry.md
- [x] **T1.2** Create docs/examples/transformation-move-registry-example.md
- [x] **T1.3** Create docs/examples/transformation-quest-seed-from-registry.md

## Phase 2: Implementation

- [x] **T2.1** Create src/lib/transformation-move-registry/types.ts
- [x] **T2.2** Create src/lib/transformation-move-registry/registry.ts with canonical 8 moves
- [x] **T2.3** Create src/lib/transformation-move-registry/services.ts (filter, render, assembleQuestSeed)
- [x] **T2.4** Create src/lib/transformation-move-registry/index.ts
- [x] **T2.5** Create __tests__/registry.test.ts
- [ ] **T2.6** Add npm script: test:transformation-move-registry

## Phase 3: Integration (Future)

- [ ] **T3.1** Wire Narrative Transformation Engine to getMovesByStageAndLock
- [ ] **T3.2** Wire quest generation to assembleQuestSeed
- [ ] **T3.3** Add nation/archetype compatibility weighting to move selection
