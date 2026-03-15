# Tasks: Agentic NPC Constitution System + Emotional Alchemy Scene Library

## AES-1: Alchemy State Model (Architect)

- [x] Add `AlchemyPlayerState` + `AlchemySceneEvent` to prisma/schema.prisma
- [x] Add `AlchemyAltitude` type to `src/lib/alchemy/types.ts` (extend charge-quest-generator/types.ts)
- [x] Implement `getPlayerAlchemyState`, `setPlayerAlchemyState`, `advancePlayerAltitude` in `src/actions/alchemy.ts`
- [ ] Wire: BAR creation → set channel; 321 completion → set channel; scene resolution → advance altitude
- [x] Run `npm run db:sync`

## AES-2: Scene Template Seed + Selection (Architect + Regent)

- [x] Add `AlchemySceneTemplate` to schema
- [x] Create `seed-alchemy-scenes.json` with all 10 vectors × 2 templates from canonical library
- [x] Implement `selectScene(playerId, opts)` in `src/lib/alchemy/select-scene.ts`
- [ ] Write unit tests for selectScene weighting logic
- [x] Run `npm run db:sync` + seed

## ANC-1: NPC Schema + CRUD (Architect)

- [x] Add all NPC models to schema: `npc_constitutions`, `npc_constitution_versions`, `npc_memories`, `npc_reflections`, `npc_actions`, `npc_relationship_states`
- [x] Run `npm run db:sync`
- [x] Implement `createNpcConstitution`, `getNpcConstitution`, `listNpcConstitutions`, `requestConstitutionUpdate` in `src/actions/npc-constitution.ts`

## ANC-2: Regent Governance Service (Regent)

- [x] Implement `validateNpcConstitution`, `activateNpcConstitution`, `suspendNpcConstitution`, `checkRegentPriority` in `src/lib/regent-gm.ts`
- [x] Add API routes: `/api/npc-constitutions/` (CRUD + validate + activate + suspend)
- [x] Enforce: governed_by = regent_game_master; cannot_do never bypasses world laws

## ANC-3: NPC Memory Layer (Architect + Regent)

- [x] Implement `addNpcMemory`, `getNpcMemories`, `pruneNpcMemories`, `markMemoryCanon` in `src/actions/npc-memory.ts`
- [x] Apply retention_rules caps (10 scene, 5 relationship, 3 campaign per NPC per player)

## ANC-4: Reflection Layer (Regent)

- [x] Implement `generateNpcReflection`, `reviewNpcReflection`, `getApprovedReflections` in `src/actions/npc-reflection.ts`
- [x] Ensure no reflection is active until approved
- [x] Add `/api/npc-reflections/` routes

## ANC-5: Action Verb Layer (Architect + Regent)

- [x] Implement `validateNpcAction` in `src/lib/npc-action-validator.ts`
- [x] Implement `executeNpcAction` in `src/actions/npc-actions.ts`
- [x] Wire `offer_quest_seed` → quest seed payload; `reflect_bar` → BAR surface; `reveal_lore` → passage inject
- [x] Add `/api/npc-actions/execute` route

## ANC-6: Admin UI (Regent oversight)

- [x] `/admin/npcs` — constitution list with tier/status filters
- [x] `/admin/npcs/[id]` — constitution viewer + validate/activate/suspend controls
- [x] `/admin/npcs/[id]/reflections` — pending reflection review queue
- [x] `/admin/npcs/[id]/memories` — memory viewer + prune + mark canon

## Verification

- [ ] One Tier-1 static NPC created and active end-to-end
- [ ] One Tier-4 NPC (Giacomo) with full constitution + memory
- [ ] Regent blocks unauthorized activation attempts
- [ ] Scene selection returns relevant template for known player state
- [ ] Run `npm run build` + `npm run check`
