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

## Follow-on slices

### Slice A — Nation/Archetype data layer ✅ (done)
- [x] **A.1** Add `Nation.openUp` + `Archetype.openUp` `String?` fields; additive migration `…_add_open_up_move_fields` (applied + client regenerated). `Archetype.primaryWaveStage` already `String?` — accepts `'openUp'` with no schema change.
- [x] **A.2** Write path: `admin.ts` `updateNation`/`updateArchetype` accept + persist `openUp`; admin edit forms (`/admin/world/nation/[id]`, `/admin/world/archetype/[id]`) gain an Open Up textarea.
- [x] **A.3** Display path: `ArchetypeHandbookContent`, `OnboardingRecommendation`, `wiki/nations`, `wiki/archetypes` render Open Up; feeding selects (`guided-onboarding.ts`, wiki pages) add `openUp: true`.
- [x] **A.4** Content: authored Open Up text for all 5 nations + 8 archetypes (element/voice-matched, in the `Name: description` pattern) directly in the canonical seed (`src/lib/seed-utils.ts` `runSeed`, which upserts) + the typed reference (`src/lib/nation/nations.ts`). Applied to the live DB (13/13 populated). Composted the throwaway standalone backfill script per generative-dependencies.

### Slice C — Spoke seed-bed 5th "Open Up" bed ✅ (done)
- [x] **C.1** `SPOKE_MOVE_BED_MOVE_TYPES` +`'openUp'` (WAVE order); `parsePortalMoveFromBlueprintKey` handles `_move_openUp`. `SpokeMoveBed.moveType` is `String` — no schema change.
- [x] **C.2** Exhaustive `MOVE_LABEL` (`SpokeNurseryBeds`) +`openUp`; iterating consumers (bed snapshots, focus buttons, anchor records) auto-extend to 5. `compile-spoke-quest` `moveTypes` +`openUp` (→ node_2 seeds).
- [x] **C.3** Test: `spoke-move-beds.test.ts` asserts `openUp` parse; passes. `npm run check` 0 errors.
- [x] **C.4** Updated `.specify/specs/spoke-move-seed-beds/spec.md` (4→5 fixed beds).

## Still out of scope (later slices)
- [ ] move UIs / dashboards / room-stage renderers that hardcode four moves (slice B).
- [ ] mapping any of the 15 emotional moves to `openUp` as `primaryWaveStage` (slice D).
