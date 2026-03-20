# Tasks: Narrative Transformation Engine v0

**Rule:** Moves and quest-arc assembly = [transformation-move-registry](../transformation-move-registry/spec.md) only. ED adds **text → parsed narrative → registry inputs**.

## Phase 1: Parse + lock

- [x] **T1.1** `types.ts` — narrative types + re-export registry `ParsedNarrative` / `LockType`; slim API types for moves/seed.
- [x] **T1.2** `parse.ts` — heuristic parser.
- [x] **T1.3** `lockDetection.ts` — lock heuristics (registry `*_lock` types).
- [x] **T1.4** `__tests__/parse.test.ts`, `lockDetection.test.ts`.

## Phase 2: Registry glue (quest seed from text)

- [x] **T2.1** `moves.ts` — `selectDefaultMoveIds(parsed: NarrativeParseResult, opts?)` using registry filters (`getMovesByLockType`, etc.); stable defaults when lock missing.
- [x] **T2.2** `seedFromNarrative.ts` — `buildQuestSeedFromText(rawText, opts?)` → parse → lock → `selectDefaultMoveIds` → `assembleQuestSeed`.
- [x] **T2.3** `__tests__/seedFromNarrative.test.ts` — golden assertions on seed shape / move IDs for fixed inputs.
- [x] **T2.4** Export pipeline from `index.ts`; `npm run test:narrative-transformation` runs new tests.

## Phase 3: Optional / future *(not v0 blockers)*

- [x] **T3.1** Alchemy / 321 hints — `alchemyHints.ts`: `inferEmotionChannel`, `buildTransformationHints` (`deriveMovementPerNode` + 321 triad); `assembleQuestSeed` gains optional `renderContext` in registry.
- [x] **T3.2** `POST /api/narrative-transformations/parse` and `/full` (JSON in/out; no auth v0).
- [x] **T3.3** `docs/architecture/narrative-transformation-engine.md`.
- [x] **T3.4** Example section in that doc (no OpenAPI until product needs it).

## Removed / superseded *(do not implement as written)*

- ~~Separate ED move catalog~~ → use **CANONICAL_MOVES** + `assembleQuestSeed`.
- ~~Standalone `questSeed.ts` duplicating registry arc~~ → **`seedFromNarrative.ts`** wraps registry only.
