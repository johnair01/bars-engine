# Individuation Engine — Tasks

## Phase 1: Wire Existing Infrastructure (no migrations)

- [x] IE-1: Create `/src/lib/quest-seed-composer.ts` with `buildQuestSeedInput()` and `QuestSeedContext` interface
- [x] IE-2: Add `getActiveDaemonState()` to `/src/actions/daemons.ts` (uses `queryActiveDaemonChannelAltitude` in `/src/lib/daemon-active-state.ts` for lib-safe reads)
- [x] IE-3: Wire `buildQuestSeedInput()` + `applyArchetypeOverlay()` into `generateQuestSuggestionsFromCharge()` (`/src/lib/charge-suggestion-archetype-overlay.ts` + `/src/actions/charge-capture.ts`)
- [x] IE-4: Wire `applyArchetypeOverlay()` into quest compilation via `archetypeInfluenceProfile` on `BuildQuestPromptContextInput` (`buildQuestPromptContext.ts`) + `quest-generation.ts` → `compileQuestWithAI`
- [x] IE-5: Extend `SelectSceneOpts` with `daemonChannel`/`daemonAltitude`; update `scoreCandidate()` in `/src/lib/alchemy/select-scene.ts`
- [x] IE-6: Pass Daemon state to `selectScene()` at `growArtifactFromBar` (`bars.ts`), `generateScene` API (`/api/growth-scenes/generate`), and growth-scene generator opts (spec referenced `alchemy.ts`; call sites consolidated here)
- [x] IE-7: `npm run build` + `npm run check` pass

## Phase 2: Schema Migrations + Daemon Codex

- [x] IE-8: Migration `add_individuation_engine_daemon_codex` — add voice/desire/fear/shadow/evolutionLog to Daemon
- [x] IE-9: Migration `add_individuation_engine_scene_biases` — add kotterStageBias/campaignFrontBias to AlchemySceneTemplate
- [x] IE-10: Migration `add_individuation_engine_charge_archetype` — add archetypeKey to CustomBar
- [x] IE-11: Apply migration `20260422120000_add_individuation_engine_phase2` (`npm run db:sync` / `prisma migrate deploy`)
- [x] IE-12: `updateDaemonCodex()` + `getDaemonCodexForPlayer()` in `daemons.ts`; append via `appendDaemonEvolutionLog()` in `/src/lib/daemon-evolution.ts`
- [x] IE-13: `UnlockMetadata.daemonId` + callers pass metadata into `unlockBlessedObject` / EFA blessed creates
- [x] IE-14: `appendDaemonEvolutionLog` from `quest-engine`, `persist321Session`, `emotional-first-aid` completion
- [x] IE-15: Stamp `archetypeKey` on charge `createChargeBar`; `buildQuestSeedInput` prefers bar stamp over player archetype
- [x] IE-16: `selectScene` / `scoreCandidate` scores `kotterStage` + `activeFaceKey` against template biases; `generateScene` passes Kotter stage from instance
- [x] IE-17: `/daemons/[id]/codex` page + `DaemonCodexForm`; list links to Codex
- [x] IE-18: `TransitionCeremony.tsx`
- [x] IE-19: Wired in `ChargeCaptureForm` + `ChargeExploreFlow`; `generateQuestSuggestionsFromCharge` returns `ceremony`
- [x] IE-20: `npm run build` + `npm run check` pass

## Phase 3: NationFaceEra + Full Ecology

- [ ] IE-21: Migration `add_nation_face_era` — new NationFaceEra model
- [ ] IE-22: Run `npm run db:sync`
- [ ] IE-23: Create `/src/actions/nation-face-era.ts` with `getActiveFaceEra`, `openFaceEra`, `closeFaceEra`
- [ ] IE-24: Update `buildQuestSeedInput()` to use real `NationFaceEra` lookup (replace kotterStage proxy)
- [ ] IE-25: Create `/src/app/admin/instances/[id]/face-era/page.tsx` for GM era declaration
- [ ] IE-26: Extend `SelectSceneOpts` with `collectiveDaemonState`; add collective scoring in `scoreCandidate()`
- [ ] IE-27: Query collective Daemons and pass to `selectScene()` in `/src/actions/alchemy.ts`
- [ ] IE-28: `npm run build` + `npm run check` pass
