# Individuation Engine — Tasks

## Phase 1: Wire Existing Infrastructure (no migrations)

- [ ] IE-1: Create `/src/lib/quest-seed-composer.ts` with `buildQuestSeedInput()` and `QuestSeedContext` interface
- [ ] IE-2: Add `getActiveDaemonState()` to `/src/actions/daemons.ts`
- [ ] IE-3: Wire `buildQuestSeedInput()` + `applyArchetypeOverlay()` into `generateQuestSuggestionsFromCharge()` in `/src/actions/charge-capture.ts`
- [ ] IE-4: Wire `applyArchetypeOverlay()` into quest compilation in `/src/actions/quest-generation.ts`
- [ ] IE-5: Extend `SelectSceneOpts` with `daemonChannel`/`daemonAltitude`; update `scoreCandidate()` in `/src/lib/alchemy/select-scene.ts`
- [ ] IE-6: Pass Daemon state to `selectScene()` at call site in `/src/actions/alchemy.ts`
- [ ] IE-7: `npm run build` + `npm run check` pass

## Phase 2: Schema Migrations + Daemon Codex

- [ ] IE-8: Migration `add_individuation_engine_daemon_codex` — add voice/desire/fear/shadow/evolutionLog to Daemon
- [ ] IE-9: Migration `add_individuation_engine_scene_biases` — add kotterStageBias/campaignFrontBias to AlchemySceneTemplate
- [ ] IE-10: Migration `add_individuation_engine_charge_archetype` — add archetypeKey to CustomBar
- [ ] IE-11: Run `npm run db:sync` after migrations
- [ ] IE-12: Add `updateDaemonCodex()` and `appendDaemonEvolution()` to `/src/actions/daemons.ts`
- [ ] IE-13: Extend `unlockBlessedObject()` to accept + store `daemonId` in metadata
- [ ] IE-14: Call `appendDaemonEvolution()` from quest completion and 321/EFA unlock paths
- [ ] IE-15: Stamp `archetypeKey` on `CustomBar` at charge capture in `/src/actions/charge-capture.ts`
- [ ] IE-16: Extend `scoreCandidate()` to score `kotterStageBias` and `campaignFrontBias`
- [ ] IE-17: Create `/src/app/daemons/[id]/codex/page.tsx` with codex form + evolution log
- [ ] IE-18: Create `<TransitionCeremony />` component in `/src/components/charge-capture/`
- [ ] IE-19: Wire `<TransitionCeremony />` into charge capture flow
- [ ] IE-20: `npm run build` + `npm run check` pass

## Phase 3: NationFaceEra + Full Ecology

- [ ] IE-21: Migration `add_nation_face_era` — new NationFaceEra model
- [ ] IE-22: Run `npm run db:sync`
- [ ] IE-23: Create `/src/actions/nation-face-era.ts` with `getActiveFaceEra`, `openFaceEra`, `closeFaceEra`
- [ ] IE-24: Update `buildQuestSeedInput()` to use real `NationFaceEra` lookup (replace kotterStage proxy)
- [ ] IE-25: Create `/src/app/admin/instances/[id]/face-era/page.tsx` for GM era declaration
- [ ] IE-26: Extend `SelectSceneOpts` with `collectiveDaemonState`; add collective scoring in `scoreCandidate()`
- [ ] IE-27: Query collective Daemons and pass to `selectScene()` in `/src/actions/alchemy.ts`
- [ ] IE-28: `npm run build` + `npm run check` pass
