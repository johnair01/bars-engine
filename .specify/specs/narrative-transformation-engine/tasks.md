# Tasks: Narrative Transformation Engine v0

## Phase 1: Foundation

- [ ] **T1.1** Create `src/lib/narrative-transformation/types.ts` with `ParsedNarrative`, `LockType`, `TransformationMove`, `QuestSeed`.
- [ ] **T1.2** Implement `parse.ts` heuristic parser (actor, state, object).
- [ ] **T1.3** Implement `lockDetection.ts` (identity, emotional, action, possibility).
- [ ] **T1.4** Add `__tests__/parse.test.ts` and `__tests__/lockDetection.test.ts`.

## Phase 2: Transformation Moves

- [ ] **T2.1** Implement `moves.ts` with move catalog (Perspective Shift, Boundary Disruption, Energy Reallocation).
- [ ] **T2.2** Implement move generator: `generateMoves(parsed, moveTypes?)`.
- [ ] **T2.3** Add `__tests__/moves.test.ts`.

## Phase 3: Emotional Alchemy + 3-2-1

- [ ] **T3.1** Implement `alchemyLink.ts`: state → channel, alchemy prompts.
- [ ] **T3.2** Implement `quest321.ts`: 3rd/2nd/1st person prompts.
- [ ] **T3.3** Ensure compatibility with `emotional-alchemy.ts` and 321 tool.

## Phase 4: Quest Seed

- [ ] **T4.1** Implement `questSeed.ts`: reflection, alchemy, action experiment, BAR prompt.
- [ ] **T4.2** Add `__tests__/questSeed.test.ts`.

## Phase 5: API + Docs

- [ ] **T5.1** Add server actions in `src/actions/narrative-transformation.ts` (or API routes).
- [ ] **T5.2** Create `docs/architecture/narrative-transformation-engine.md`.
- [ ] **T5.3** Create `docs/architecture/narrative-transformation-api.md`.
- [ ] **T5.4** Create `docs/examples/narrative-transformation-example.md` and `transformation-quest-example.md`.
- [ ] **T5.5** Optional: wire into Emotional First Aid intake for transformation pathway suggestion.
