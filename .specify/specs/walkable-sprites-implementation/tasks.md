# Tasks: Walkable Sprites Implementation

Implement per [spec.md](./spec.md) and [plan.md](./plan.md). API-first: define contracts before UI.

---

## Phase 1: RoomRenderer Player Sprites

- [x] Add `setPlayerSpriteUrl(url: string | null)` to RoomRenderer
- [x] Add `setPlayerDirection(direction: 'north'|'south'|'east'|'west')` to RoomRenderer
- [x] Create sprite loading helper: `Assets.load(url)`, frame rect `Rectangle(frameIndex*64, 0, 64, 64)`, cache by URL
- [x] On load reject: fallback to default.png or colored rect via `getAvatarHue`
- [x] Update `renderPlayer()`: if playerSpriteUrl set, create Sprite with frame for current direction; else Graphics rect
- [x] LobbyCanvas: pass `player.walkableSpriteUrl` to RoomRenderer; track `lastMoveDirection` from WASD; call `setPlayerDirection`
- [x] RoomCanvas: same as LobbyCanvas
- [x] Delta mapping: dy=-1→north, dy=1→south, dx=1→east, dx=-1→west
- [x] Run `npm run build` and `npm run build:type-check` — pass

---

## Phase 2: Agent Sprites

- [ ] `getIntentAgentsForRoom`: change player select to include `avatarConfig`
- [ ] Derive `walkableSpriteUrl` via `getWalkableSpriteUrl(parseAvatarConfig(avatarConfig))` in intent-agents
- [ ] Add `walkableSpriteUrl` to PresenceRecord and AgentData types
- [ ] `computeAgentPositions`: map walkableSpriteUrl from input to output
- [ ] Update `renderAgents()`: if walkableSpriteUrl set, create Sprite (south idle frame 2); else Graphics rect
- [ ] Reuse sprite loading helper; cache by URL for multiple agents
- [ ] Run `npm run build` and `npm run build:type-check` — pass

---

## Phase 3: Replicate Asset Generation

- [ ] `npm install replicate`
- [ ] Add `REPLICATE_API_TOKEN` to docs/ENV_AND_VERCEL.md
- [ ] Create `src/lib/walkable-sprite-prompts.ts`: `buildNationArchetypePrompt(nationKey, archetypeKey)` — map nation+archetype to Replicate prompt
- [ ] Create `src/actions/generate-walkable-sprite.ts`: `generateWalkableSprite({ nationKey, archetypeKey })`
- [ ] Call `retro-diffusion/rd-animation` with `style: "four_angle_walking"`, `return_spritesheet: true`, prompt from builder
- [ ] Fetch output URL; download; scale 48→64 if needed (sharp nearest-neighbor); save to `public/sprites/walkable/{nationKey}-{archetypeKey}.png`
- [ ] Return `{ url }` or `{ error }`
- [ ] Optional: Create `scripts/generate-walkable-batch.ts` — loop nation×archetype, call action, rate-limit
- [ ] Optional: Admin UI "Generate missing sprites" button
- [ ] Run `npm run build` — pass

---

## Phase 4: Validation Script (Optional)

- [ ] Create `scripts/validate-walkable-sprites.ts`
- [ ] Check each file in `public/sprites/walkable/`: 512×64, PNG, 8 frames (width/64)
- [ ] Optional: manifest of expected keys (nation×archetype); report missing
- [ ] Add `npm run sprites:validate-walkable` to package.json
- [ ] Exit 1 on failure; 0 on success

---

## Verification Quest

- [ ] Create Twine story `cert-walkable-sprites-v1`: steps to enter Lobby, confirm sprite, move WASD, confirm direction
- [ ] Add CustomBar with `isSystem: true`, `visibility: 'public'`, deterministic id
- [ ] Seed script entry in `scripts/seed-cyoa-certification-quests.ts` or equivalent
- [ ] Narrative: "Validate the walkable avatar system so guests see themselves in the Conclave space at the Bruised Banana party."

---

## Final Verification

- [ ] Player sprite appears in Lobby when avatarConfig exists
- [ ] Player sprite appears in World when avatarConfig exists
- [ ] Agent sprites appear when agents have avatarConfig
- [ ] `npm run build` and `npm run build:type-check` pass
- [ ] Verification quest completable end-to-end
