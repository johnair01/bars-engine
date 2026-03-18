# Plan: Walkable Sprites Implementation

**Source**: Spec kit synthesis of [walkable-sprites-pixi](.specify/specs/walkable-sprites-pixi/plan.md), Sage Replicate analysis, asset pipeline requirements.

---

## Summary

Four phases: (1) Pixi RoomRenderer player sprites, (2) agent sprites with avatarConfig, (3) Replicate asset generation, (4) validation script. Phases 1–2 unblock rendering; Phase 3 populates assets; Phase 4 ensures format compliance.

---

## Phase 1: RoomRenderer Player Sprites

**Goal**: Replace player Graphics rect with Pixi Sprite. Wire LobbyCanvas/RoomCanvas.

**Dependencies**: None.

**Key tasks**:
1. Add `setPlayerSpriteUrl`, `setPlayerDirection` to RoomRenderer
2. Sprite loading helper: `Assets.load`, frame rect, cache by URL
3. `renderPlayer()`: Sprite when URL set; fallback Graphics rect; 404 → default.png or colored rect
4. LobbyCanvas/RoomCanvas: pass `walkableSpriteUrl`, track WASD direction

**Files**: `pixi-room.ts`, `LobbyCanvas.tsx`, `RoomCanvas.tsx`

**Reference**: [walkable-sprites-pixi Phase 1](.specify/specs/walkable-sprites-pixi/plan.md#phase-1-roomrenderer-sprite-support-player-only)

---

## Phase 2: Agent Sprites

**Goal**: Intent agents display sprites. Fix data flow: avatarConfig → walkableSpriteUrl.

**Dependencies**: Phase 1.

**Key tasks**:
1. `getIntentAgentsForRoom`: select `avatarConfig`, derive `walkableSpriteUrl`
2. `AgentData.walkableSpriteUrl`; `computeAgentPositions` maps through
3. `renderAgents()`: Sprite when walkableSpriteUrl set (south frame); else rect

**Files**: `intent-agents.ts`, `pixi-room.ts`

**Reference**: [walkable-sprites-pixi Phase 2](.specify/specs/walkable-sprites-pixi/plan.md#phase-2-agent-sprites-avatarconfig--walkablespriteurl)

---

## Phase 3: Replicate Asset Generation

**Goal**: Generate nation×archetype walkable sprites via Replicate API.

**Dependencies**: None (can run in parallel with Phase 1–2).

**Key tasks**:
1. `npm install replicate`
2. Add `REPLICATE_API_TOKEN` to env; document in docs/ENV_AND_VERCEL.md
3. Create `src/lib/walkable-sprite-prompts.ts`: `buildNationArchetypePrompt(nationKey, archetypeKey)`
4. Create `src/actions/generate-walkable-sprite.ts`: `generateWalkableSprite({ nationKey, archetypeKey })`
5. Call `retro-diffusion/rd-animation` with `style: "four_angle_walking"`, `return_spritesheet: true`
6. Post-process: fetch output, scale 48→64 if needed, save to `public/sprites/walkable/{key}.png`
7. Optional: batch script `scripts/generate-walkable-batch.ts` for all nation×archetype combos
8. Optional: admin UI "Generate missing sprites"

**Files**: `src/actions/generate-walkable-sprite.ts`, `src/lib/walkable-sprite-prompts.ts`, `scripts/generate-walkable-batch.ts`

**Note**: Replicate writes to filesystem. Run generation locally or in CI; Vercel serverless has read-only `public/`. Options: (a) generate locally, commit; (b) write to Vercel Blob, copy to public in build; (c) admin-only flow that triggers generation and stores URL.

**Simplest**: Generate locally, commit PNGs. Batch script for one-time 40-combo generation.

---

## Phase 4: Validation Script (Optional)

**Goal**: Validate walkable sprite format; report missing/invalid.

**Dependencies**: None.

**Key tasks**:
1. Create `scripts/validate-walkable-sprites.ts`
2. Check: 512×64 dimensions, 8 frames (or infer from width/64), PNG, transparency
3. Manifest: expected keys from Nation × Archetype; report missing
4. `npm run sprites:validate-walkable`; exit 1 on failure

**Files**: `scripts/validate-walkable-sprites.ts`, `package.json`

---

## File Impact Summary

| File | Changes |
|------|---------|
| `src/lib/spatial-world/pixi-room.ts` | Sprite loading, renderPlayer/Agents, setPlayerSpriteUrl, setPlayerDirection |
| `src/app/lobby/LobbyCanvas.tsx` | Pass walkableSpriteUrl, track direction |
| `src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx` | Same |
| `src/actions/intent-agents.ts` | avatarConfig, walkableSpriteUrl |
| `src/lib/spatial-world/intent-agents.ts` | PresenceRecord, AgentData walkableSpriteUrl |
| `src/actions/generate-walkable-sprite.ts` | New — Replicate generation |
| `src/lib/walkable-sprite-prompts.ts` | New — prompt builder |
| `scripts/validate-walkable-sprites.ts` | New — format validation |
| `docs/ENV_AND_VERCEL.md` | REPLICATE_API_TOKEN |

---

## Implementation Order

1. **Phase 1** — Unblocks player sprites; highest UX impact
2. **Phase 2** — Agent sprites; completes rendering
3. **Phase 3** — Asset generation; can start in parallel, finish after 1–2
4. **Phase 4** — Validation; polish, CI integration

---

## Verification Checklist

- [ ] Player sprite in Lobby when avatarConfig exists
- [ ] Player sprite in World when avatarConfig exists
- [ ] Direction updates from WASD
- [ ] Agent sprites when agents have avatarConfig
- [ ] Fallback: no URL or load fail → Graphics rect
- [ ] `generateWalkableSprite` produces valid PNG
- [ ] `npm run sprites:validate-walkable` passes
- [ ] `npm run build` and `npm run check` pass
