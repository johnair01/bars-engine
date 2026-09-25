# Tasks: Emotional Alchemy Compound Emotions

Implement per [spec.md](./spec.md) and [plan.md](./plan.md). Keep the first pass deterministic, read-only, and backward compatible.

## Phase 1 — Lattice Data

- [x] **T1**: Create `src/lib/alchemy/compound-emotions.ts`.
- [x] **T2**: Add types for compound edge kind, name status, slots, resolver input, and resolver output.
- [x] **T3**: Encode all 20 directional slots from the vault research note.
- [x] **T4**: Mark Dread, Disappointment, and Disgust/Contempt as `named`; mark the remaining labels as `candidate`.
- [x] **T5**: Export `listCompoundEmotionSlots`, `getCompoundEmotionSlot`, `findCompoundSlotsForChannel`, and `findCompoundSlotsForPair`.

## Phase 2 — Resolver + Tests

- [x] **T6**: Add `resolveCompoundEmotion` with explicit `dominantChannel`; do not infer dominance in v1.
- [x] **T7**: Include component-treatment guidance that points back to existing channel/vector move families.
- [x] **T8**: Add `src/lib/alchemy/__tests__/compound-emotions.test.ts`.
- [x] **T9**: Test lattice invariants: 20 slots, 10 pairs, 2 directions per pair, 4 edges / 8 directional slots per channel.
- [x] **T10**: Test named slots and candidate status.
- [x] **T11**: Test Dread resolution and Fear-Joy direction distinction.
- [x] **T12**: Test that resolver output does not recommend direct compound-specific moves.

## Phase 3 — Wiki / Documentation

- [x] **T13**: Update `/wiki/emotional-alchemy` with a compact "Compound Emotions" section.
- [x] **T14**: Include the doctrine line: 15 primary states plus 20 compound diagnostic slots.
- [x] **T15**: Include the cure/treatment rule: refine component channels; compounds transmute indirectly.
- [x] **T16**: Mark candidate names as provisional in the wiki table.

## Phase 4 — Optional Context Wiring

- [x] **T17**: Evaluate whether quest-generation prompt context should include compound diagnosis. Decision: defer; deterministic wiki/data layer first, no prompt-context wiring in this pass.
- [ ] **T18**: If yes, add compound diagnosis as optional context only; do not alter primary state routing.
- [ ] **T19**: Add tests or prompt snapshots for any context wiring.

## Verification

- [x] **T20**: Run focused tests for `compound-emotions`.
- [x] **T21**: Run the repo's type/check command.
- [x] **T22**: Confirm no Prisma/schema changes were introduced.
- [ ] **T23**: Add a follow-up parity note for `packages/bars-core` if the module becomes runtime-critical.

## Later / Out of Scope

- [ ] Red-pen candidate labels with Wendell before client-facing product copy.
- [ ] Decide whether Dread should remain a fear alias or move exclusively to compound diagnosis.
- [ ] Consider `packages/bars-core` parity after app-layer usage stabilizes.
- [ ] Consider persisted compound-state history only with a separate Prisma spec.
