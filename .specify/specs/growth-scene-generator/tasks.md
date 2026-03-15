# Tasks: Growth Scene Generator v0

## GSG-1: GrowthScene DB Model + Types (Architect)

- [ ] Add `GrowthScene` + `GrowthSceneArtifact` to `prisma/schema.prisma`
- [ ] Add Player relations: `growthScenes GrowthScene[]`
- [ ] Run `npm run db:sync`
- [ ] Create `src/lib/growth-scene/types.ts` with `SceneDsl`, `ArtifactType`, `SceneArtifact`

## GSG-2: Scene Generator Service (Architect)

- [ ] Create `src/lib/growth-scene/generator.ts` with `generateScene(playerId, opts?)`
- [ ] Wire: `getPlayerAlchemyState` → vector → `selectScene` → DSL compile → persist GrowthScene

## GSG-3: Generate API Route (Architect)

- [ ] Create `src/app/api/growth-scenes/generate/route.ts` (POST)
- [ ] Auth via `bars_player_id` cookie
- [ ] Returns `{ scene_id, vector, scene_dsl }`

## GSG-4: Resolve API Route (Architect + Regent)

- [ ] Create `src/app/api/growth-scenes/resolve/route.ts` (POST)
- [ ] Validate choice against template choices
- [ ] If isGrowth: call `advancePlayerAltitude`
- [ ] Emit artifacts to `GrowthSceneArtifact`
- [ ] Regent gate: no vibeulon mint without alchemy legality check
- [ ] Return `{ emotional_state_update, artifacts_emitted, npc_actions }`

## GSG-5: Player UI (Diplomat)

- [ ] Create `src/app/growth-scene/[id]/page.tsx` (auth-gated)
- [ ] Create `src/app/growth-scene/[id]/GrowthSceneRunner.tsx`
  - [ ] Sequential card rendering
  - [ ] Choice button UI (last card)
  - [ ] POST resolve on choice
  - [ ] Artifact feedback display
  - [ ] Altitude progress indicator

## GSG-6: NPC Verb Wiring (Regent + Architect)

- [ ] In resolve handler: check for active NpcConstitution with deepen_scene/affirm_player in can_initiate
- [ ] Create NpcAction record for matched NPC
- [ ] Include in npc_actions response field

## Verification

- [ ] fear:dissatisfied → fear:neutral scene generates and resolves end-to-end
- [ ] isGrowth choice advances altitude
- [ ] Artifact emitted and persisted
- [ ] NPC action created for active NPC
- [ ] Run `npm run build` + `npm run check`
