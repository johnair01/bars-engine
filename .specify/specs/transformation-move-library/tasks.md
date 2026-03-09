# Tasks: Transformation Move Library v1

## Phase 1: Core Moves

- [ ] **T1.1** Create `src/lib/narrative-transformation/moves/core-moves.ts` with WCGS move catalog.
- [ ] **T1.2** Define prompt templates: wake_observe_pattern, cleanup_shadow_dialogue, grow_reframe, show_small_action.
- [ ] **T1.3** Implement template substitution for {actor}, {state}, {object}.

## Phase 2: Nation Move Profiles

- [ ] **T2.1** Create `src/lib/narrative-transformation/moves/nation-profiles.ts`.
- [ ] **T2.2** Define NationMoveProfile for all 5 nations (Argyra, Pyrakanth, Lamenth, Virelune, Meridia).
- [ ] **T2.3** Add move_modifiers and preferred_move_types per nation.

## Phase 3: Archetype Move Style

- [ ] **T3.1** Create `src/lib/narrative-transformation/moves/archetype-profiles.ts`.
- [ ] **T3.2** Define ArchetypeMoveProfile for archetypes (move_style, preferred_core_moves).

## Phase 4: Selection Logic

- [ ] **T4.1** Create `src/lib/narrative-transformation/moves/selectMoves.ts`.
- [ ] **T4.2** Implement selectMoves(parsed, nationId?, archetypeKey?).
- [ ] **T4.3** Implement generateQuestSeed(parsed, selectedMoves, nationId?, archetypeKey?).
- [ ] **T4.4** Add `__tests__/selectMoves.test.ts`.

## Phase 5: Integration

- [ ] **T5.1** Update Narrative Transformation Engine spec (TransformationMove, QuestSeed types).
- [ ] **T5.2** Wire move library into move generation and quest seed generation.
- [ ] **T5.3** Update API contracts and docs.
