# Tasks: Archetype Move Styles v0

## Phase 1: Profile Data

- [x] **T1.1** Define ArchetypeMoveStyle type.
- [x] **T1.2** Implement getArchetypeMoveStyle(archetypeKey).
- [x] **T1.3** Add profiles for bold-heart, devoted-guardian, decisive-storm, danger-walker, still-point, subtle-influence, truth-seer, joyful-connector.

## Phase 2: Selection Overlay

- [x] **T2.1** Implement applyArchetypeOverlay(moves, profile).
- [x] **T2.2** Wire applyArchetypeOverlay into selectMoves when archetypeKey provided.
- [x] **T2.3** Resolve archetypeKey from playbookId when needed (playbook name → slug).

## Phase 3: Quest Flavor

- [x] **T3.1** Add archetype_style to QuestSeed type.
- [x] **T3.2** Implement applyArchetypeQuestFlavor(questSeed, profile).

## Phase 4: Tests

- [x] **T4.1** Add `moves/__tests__/archetype-move-styles.test.ts`.
- [x] **T4.2** Verify archetype profiles influence move selection and quest output.
