# Tasks: Fifth Move — "Open Up"

> Implement per [spec.md](./spec.md) and [plan.md](./plan.md). Type-first; let the compiler drive the worklist.

## Phase 1 — Docs (ontology)
- [x] **T1.1** `.specify/memory/conceptual-model.md`: "4 Moves" → "5 Moves"; add Open Up row; WAVE order Wake → Open → Clean → Grow → Show; note moves independent of elements.
- [x] **T1.2** `FOUNDATIONS.md`: update move list / WAVE references (and `ARCHITECTURE.md` if it enumerates moves).

## Phase 2 — Type unions
- [x] **T2.1** `types.ts`: `WaveStage = 'Wake' | 'Open' | 'Clean' | 'Grow' | 'Show'`.
- [x] **T2.2** `types.ts`: `PersonalMoveType = 'wakeUp' | 'openUp' | 'cleanUp' | 'growUp' | 'showUp'`.

## Phase 3 — Lockstep maps/arrays
- [x] **T3.1** `choice-privileging-context.ts` `WAVE_NAMES`: `openUp: 'Open Up'`.
- [x] **T3.2** `compileQuestCore.ts` `WAVE_LABELS`: `openUp: 'Open Up'`.
- [x] **T3.3** `compileQuestCore.ts` `ALL_WAVE_MOVES`: `['wakeUp','openUp','cleanUp','growUp','showUp']`.
- [x] **T3.4** `archetype-wave.ts` `VALID_STAGES`: insert `'openUp'` (WAVE order).
- [x] **T3.5** `canonical-kernel.ts` `WAVE_TO_DOMAIN`: `openUp: 'Raise Awareness'` (flagged default).
- [~] **T3.6** Parity for non-exhaustive lists — **revised after analysis**: the `z.enum([...])` in `cyoa-intake/spoke-generator.ts` is the **spoke-bed** move set (`SpokeMoveBedMoveType`, 4 members), intentionally kept at 4 (spoke beds deferred). `getSpokeSeeds` now accepts any `PersonalMoveType` and returns `[]` for moves without a bed (e.g. `openUp`), so no parity change is needed/wanted there. Test fixtures (`battery-6face.ts`) left at 4 — adding Open Up coverage deferred to the UI/rollout slice.

## Phase 4 — Verify
- [x] **T4.1** `npm run check` — resolve every exhaustiveness error (`Record<PersonalMoveType>`, switches). 0 type errors.
- [x] **T4.2** Grep for positional indexing on move arrays (`[0]`..`[3]`) that assumes four moves; fix if any.
- [x] **T4.3** Check off tasks; commit (no Prisma change).

## Out of scope (later slices)
- [ ] `Nation.openUp` schema field + migration; Archetype WAVE profiles.
- [ ] move UIs / dashboards / room-stage renderers that hardcode four moves.
- [ ] mapping any of the 15 emotional moves to `openUp` as `primaryWaveStage`.
