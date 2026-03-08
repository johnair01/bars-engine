# Tasks: I Ching Alignment and Game Master Sects

## Phase 1 — Game Master Sect Lore

- [x] Create `.agent/context/game-master-sects.md` with 6 faces as sect heads
- [x] Define FACE_TRIGRAM_PREFERENCE (shaman→Earth, challenger→Fire, etc.)
- [x] Document "serving a Game Master" and alignment implications

## Phase 2 — Alignment Module

- [x] Create `src/lib/iching-alignment.ts`
- [x] Implement `getAlignmentContext(playerId)`: fetch player, instance, storyProgress; derive nationName, playbookTrigram, activeFace
- [x] Add PLAYBOOK_TRIGRAM config (playbook name → trigram) from player_archetypes
- [x] Implement `scoreHexagramAlignment(hexagramId, context)` with kotter, nation, archetype, sect breakdown
- [x] Implement `drawAlignedHexagram(context)`: weighted random from scored pool
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 3 — Constrain castIChing

- [x] In `castIChing`: call `getAlignmentContext(playerId)` after playerId check
- [x] Replace random draw with `drawAlignedHexagram(context)`
- [x] When no instance: use pure random (current behavior)
- [x] Optional: log alignment score in NODE_ENV !== 'production'
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 4 — Enrich generateQuestCore

- [x] In `generateQuestCore`: fetch alignment context (getAlignmentContext or inline)
- [x] Extend system prompt with kotterStage, nationName, activeFace
- [x] Extend cache inputKey to include kotterStage, nationName, activeFace
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 5 — Verification

- [ ] Manual test: cast with instance at stage 1; verify hexagram includes Thunder
- [ ] Manual test: cast with different nations; verify alignment tendency
- [ ] Verify generateQuestCore prompt includes campaign context
