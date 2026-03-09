# Tasks: Nation Move Profiles v0

## Phase 1: Profile Data

- [ ] **T1.1** Define NationMoveProfile type with emotionChannel, developmentalEmphasis, moveStyleModifiers, questFlavorModifiers.
- [ ] **T1.2** Implement getNationMoveProfile(nationId) returning full profile.
- [ ] **T1.3** Add profiles for Argyra, Pyrakanth, Lamenth, Meridia, Virelune.

## Phase 2: Selection Overlay

- [ ] **T2.1** Implement applyNationOverlay(coreMoves, profile) for move weighting/ordering.
- [ ] **T2.2** Wire applyNationOverlay into selectMoves when nationId provided.
- [ ] **T2.3** Use moveStyleModifiers and exampleMoveFlavors for prompt phrasing.

## Phase 3: Quest Flavor

- [ ] **T3.1** Implement applyNationQuestFlavor(questSeed, profile).
- [ ] **T3.2** Ensure quest seeds incorporate questFlavorModifiers by nation.

## Phase 4: Tests

- [ ] **T4.1** Add __tests__/nation-profiles.test.ts.
- [ ] **T4.2** Verify nation profiles influence move selection and quest output.
