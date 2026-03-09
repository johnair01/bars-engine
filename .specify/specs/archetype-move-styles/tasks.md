# Tasks: Archetype Move Styles v0

## Phase 1: Profile Data

- [ ] **T1.1** Define ArchetypeMoveStyle type.
- [ ] **T1.2** Implement getArchetypeMoveStyle(archetypeKey).
- [ ] **T1.3** Add profiles for bold-heart, devoted-guardian, decisive-storm, danger-walker, still-point, subtle-influence, truth-seer, joyful-connector.

## Phase 2: Selection Overlay

- [ ] **T2.1** Implement applyArchetypeOverlay(moves, profile).
- [ ] **T2.2** Wire applyArchetypeOverlay into selectMoves when archetypeKey provided.
- [ ] **T2.3** Resolve archetypeKey from playbookId when needed (playbook name → slug).

## Phase 3: Quest Flavor

- [ ] **T3.1** Add archetype_style to QuestSeed type.
- [ ] **T3.2** Implement applyArchetypeQuestFlavor(questSeed, profile).

## Phase 4: Tests

- [ ] **T4.1** Add __tests__/archetype-profiles.test.ts.
- [ ] **T4.2** Verify archetype profiles influence move selection and quest output.
