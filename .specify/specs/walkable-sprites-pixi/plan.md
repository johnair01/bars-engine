# Plan: Walkable Sprites in Pixi.js (Lobby/World)

**Methodology**: Game Master faces via Cursor subagents — Architect (implementation plan), Challenger (stress-test), Regent (evaluator).

---

## Summary

Unblock walkable sprites in the BARS Engine by wiring `RoomRenderer` (Pixi.js) to load and display 8-frame spritesheets for the player and intent agents, replacing the current `Graphics.rect().fill()` placeholders. LobbyCanvas and RoomCanvas already have `walkableSpriteUrl` and gate on `avatarConfig`; the gap is RoomRenderer, agent data flow, and direction tracking.

## Reference

| Artifact | Path | Purpose |
|----------|------|---------|
| Conclave HTML implementation | `src/app/conclave/space/[mapId]/ConclaveSpaceClient.tsx` | 8-frame layout, `getFrameOffset(direction)`, `objectPosition` |
| Avatar utils | `src/lib/avatar-utils.ts` | `getWalkableSpriteUrl(config)`, `parseAvatarConfig` |
| RoomRenderer | `src/lib/spatial-world/pixi-room.ts` | Pixi canvas; currently Graphics only |
| Format spec | `docs/WALKABLE_SPRITES.md` | 64×64 per frame, 8 frames row-major, 512×64 total |

## Frame Layout (8 frames, row-major)

```
| N_idle | N_walk | S_idle | S_walk | E_idle | E_walk | W_idle | W_walk |
  0       1       2       3       4       5       6       7
```

Frame index = `directionIndex * 2 + (isWalking ? 1 : 0)`. Direction mapping: north=0, south=1, east=2, west=3.

## Direction → Frame Mapping

| Direction | Idle frame | Walk frame |
|-----------|------------|------------|
| north (dy=-1) | 0 | 1 |
| south (dy=+1) | 2 | 3 |
| east (dx=+1)  | 4 | 5 |
| west (dx=-1)  | 6 | 7 |

Conclave uses `getFrameOffset(direction)` returning 0, 2, 4, 6 for N, S, E, W (idle). Lobby/World infer direction from last WASD move.

---

## Implementation Phases

### Phase 1: RoomRenderer Sprite Support (Player Only)

**Goal**: Replace player Graphics rect with a Pixi Sprite using the walkable spritesheet.

**Dependencies**: None.

**Tasks**:

1. **Extend RoomRenderer constructor and state**
   - File: `src/lib/spatial-world/pixi-room.ts`
   - Add optional `playerSpriteUrl: string | null` to constructor (or a config object).
   - Store `playerSpriteUrl` in instance state.
   - Acceptance: RoomRenderer accepts and stores sprite URL.

2. **Create sprite loading helper**
   - File: `src/lib/spatial-world/pixi-room.ts` (or new `src/lib/spatial-world/walkable-sprite.ts`)
   - Use Pixi v8 `Assets.load(url)` to load the 512×64 texture.
   - Create frame textures via `new Texture({ source: baseTexture, frame: new Rectangle(frameIndex * 64, 0, 64, 64) })`.
   - Cache loaded textures by URL to avoid duplicate loads.
   - Acceptance: Helper returns a `Texture` for a given URL and frame index (0–7).

3. **Implement `renderPlayer()` with Sprite**
   - File: `src/lib/spatial-world/pixi-room.ts`
   - If `playerSpriteUrl` is set: load texture, create frame texture for current direction (default south=2), create `Sprite`, add to `playerContainer`. Scale to fit tile (32×32 or 64×64 depending on desired size).
   - If not set: fall back to existing Graphics rect (backward compatible).
   - Acceptance: Player appears as sprite when URL provided; rect when not.

4. **Add `setPlayerSpriteUrl(url: string | null)`**
   - File: `src/lib/spatial-world/pixi-room.ts`
   - Allow updating sprite URL after construction; re-render player.
   - Acceptance: Changing URL updates displayed sprite.

5. **Add direction state and `setPlayerDirection(direction: 'north'|'south'|'east'|'west')`**
   - File: `src/lib/spatial-world/pixi-room.ts`
   - Store `playerDirection`; use in `renderPlayer()` for frame selection.
   - Default: `'south'`.
   - Acceptance: Direction changes update the displayed frame.

6. **Wire LobbyCanvas and RoomCanvas**
   - Files: `src/app/lobby/LobbyCanvas.tsx`, `src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx`
   - Pass `player.walkableSpriteUrl` to RoomRenderer (constructor or `setPlayerSpriteUrl`).
   - Track `lastMoveDirection` from WASD handler; call `setPlayerDirection` when moving.
   - Delta mapping: `dy=-1`→north, `dy=1`→south, `dx=1`→east, `dx=-1`→west.
   - Acceptance: Player sprite appears in Lobby and World when avatarConfig exists.

**Pixi.js v8 APIs** (from `pixi.js` package):
- `import { Assets, Sprite, Texture, Rectangle } from 'pixi.js'`
- Load: `const baseTexture = await Assets.load('/sprites/walkable/default.png')` — returns a `Texture`
- Frame texture: `new Texture({ source: baseTexture.source, frame: new Rectangle(frameIndex * 64, 0, 64, 64) })` — `TextureOptions` accepts `source` and `frame`
- Sprite: `new Sprite(frameTexture)` then `sprite.width = 32; sprite.height = 32` (or `scale.set(0.5)`) to fit 32×32 tile

**Risks**: Async load may cause brief flash; consider preloading or placeholder. Texture cache key must include URL to avoid collisions.

---

### Phase 2: Agent Sprites (avatarConfig → walkableSpriteUrl)

**Goal**: Intent agents display walkable sprites instead of gray rects. Agents need `avatarConfig` (or derived `walkableSpriteUrl`) from the database.

**Dependencies**: Phase 1 (RoomRenderer sprite rendering).

**Tasks**:

1. **Extend getIntentAgentsForRoom to fetch avatarConfig**
   - File: `src/actions/intent-agents.ts`
   - Change `include: { player: { select: { id: true, name: true, spriteUrl: true } } }` to also select `avatarConfig`.
   - Map `avatarConfig` to `walkableSpriteUrl` via `getWalkableSpriteUrl(parseAvatarConfig(avatarConfig))` (server-side).
   - Pass `walkableSpriteUrl` in the returned records.
   - Acceptance: Agent records include `walkableSpriteUrl`.

2. **Extend PresenceRecord and AgentData**
   - File: `src/lib/spatial-world/intent-agents.ts` — add `avatarConfig?: string | null` and `walkableSpriteUrl?: string | null` to PresenceRecord input.
   - File: `src/lib/spatial-world/pixi-room.ts` — add `walkableSpriteUrl?: string | null` to `AgentData`.
   - File: `src/lib/spatial-world/intent-agents.ts` — `computeAgentPositions` maps `walkableSpriteUrl` from input to output.
   - Acceptance: AgentData includes walkableSpriteUrl.

3. **Implement `renderAgents()` with Sprites**
   - File: `src/lib/spatial-world/pixi-room.ts`
   - For each agent: if `walkableSpriteUrl` is set, load texture, create Sprite with south idle frame (2), add to agentsContainer. Fall back to Graphics rect when not set.
   - Reuse the same texture-loading helper as player. Batch/cache by URL.
   - Acceptance: Agents with avatarConfig show sprites; others show rects.

4. **Agent direction**
   - Agents are static (positioned by `computeAgentPositions`); use south idle (frame 2) for all agents in Phase 2. Direction can be added later if agents get movement.
   - Acceptance: Agents face south.

**Risks**: Multiple agents may share the same sprite URL; cache must handle this. Server action must import avatar-utils (already used elsewhere).

---

### Phase 3: Walk Animation (Optional)

**Goal**: Animate walk frames when the player is moving.

**Dependencies**: Phase 1.

**Tasks**:

1. **Track moving state**
   - LobbyCanvas/RoomCanvas: set `isMoving=true` when WASD triggers a move; set `false` after a short delay (e.g. 150ms) or on next frame.
   - Pass `isMoving` to RoomRenderer via `setPlayerMoving(isMoving: boolean)`.

2. **Frame selection in renderPlayer**
   - Frame index = `directionIndex * 2 + (isMoving ? 1 : 0)`.
   - Option: Use `Ticker` to cycle walk frames (e.g. 0.1s per frame) for smoother animation.
   - Acceptance: Player shows walk frame while moving, idle when stopped.

**Risks**: Animation timing may feel off; tune delay/frame rate.

---

## File Impact Summary

| File | Changes |
|------|---------|
| `src/lib/spatial-world/pixi-room.ts` | Sprite loading, renderPlayer/Agents with Sprite, direction, setPlayerSpriteUrl, setPlayerDirection |
| `src/app/lobby/LobbyCanvas.tsx` | Pass walkableSpriteUrl, track direction, call setPlayerDirection |
| `src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx` | Same as LobbyCanvas |
| `src/actions/intent-agents.ts` | Include avatarConfig, derive walkableSpriteUrl |
| `src/lib/spatial-world/intent-agents.ts` | PresenceRecord + AgentData walkableSpriteUrl |

---

## Dependencies and Risks

| Item | Description |
|------|-------------|
| Pixi v8 | Use `Assets`, `Texture`, `Sprite`, `Rectangle` from `pixi.js`. No JSON spritesheet needed; manual frame rects. |
| Texture cache | Key by URL. Consider `Assets.cache.get(url)` or custom Map to avoid reloading same sprite for multiple agents. |
| Async load | First render may show rect briefly. Preload default.png on app init if desired. |
| Tile size | Conclave uses 32px tiles; spritesheet frames are 64×64. Scale sprite to 32×32 for consistency. |
| Default sprite | `public/sprites/walkable/default.png` exists; ensure 512×64 format. |

---

## Verification Checklist

- [ ] Player sprite appears in Lobby when avatarConfig exists
- [ ] Player sprite appears in World when avatarConfig exists
- [ ] Player direction updates from WASD (north/south/east/west)
- [ ] Agent sprites appear when agents have avatarConfig
- [ ] Fallback: no sprite URL → Graphics rect (player and agents)
- [ ] Texture load failure → fallback (default.png or colored rect)
- [ ] `npm run build` and `npm run check` pass

---

## Challenger's Critique (Stress-Test)

### Edge Cases

| Concern | Mitigation |
|---------|------------|
| **404 / missing sprites** | `getWalkableSpriteUrl` returns paths without checking existence. Add Pixi-side fallback: on `Assets.load()` reject, use colored rect (e.g. `getAvatarHue(config)`) or retry with `default.png`. Ensure `default.png` is committed. |
| **Slow texture load** | Many agents → many concurrent loads. Preload `default.png` at init; show loading state until player sprite ready; consider `Assets.load([...urls])` batch. |
| **Many agents (N textures)** | Cap visible agents (e.g. 10–15) or batch preload. Pixi caches by URL; first load is N requests. Consider LOD: rects for distant, sprites for nearby. |

### Risks

| Risk | Mitigation |
|------|------------|
| **Pixi v8 API** | Use `Assets.load()`, `Texture.from()` with frame rect. Confirm v8 docs for spritesheet frame extraction. |
| **Memory leaks** | `Assets.load()` caches; `RoomRenderer.destroy()` does not unload. Document: `Assets.unload(url)` when leaving room if reclaiming memory; for small sprite set, cache is acceptable. |

### Assumptions Challenged

- **8 frames vs 4**: Could use 4 frames (one per direction) and skip walk animation for simpler MVP. Plan keeps 8 for parity with Conclave.
- **Agent direction unknown**: `RoomPresence` has no direction. Default to south (frame 2) for all agents; document explicitly. Add `direction?: 'north'|'south'|'east'|'west'` to `AgentData`, default `'south'`.

### Integration Gaps

- **Data mismatch**: `getIntentAgentsForRoom` returns `spriteUrl`; walkable sprites need `avatarConfig` → `walkableSpriteUrl`. Fix data source first (Phase 2 Task 1).
- **walkableSpriteUrl unused**: Passed to Canvas but not to RoomRenderer. Phase 1 Task 6 wires it.
- **Two presence systems**: RoomPresence (Lobby/World) vs PlayerMapPresence (Conclave). Document: agent direction always south; player direction local-only (WASD-derived).

### Fallback for 404

Conclave uses `img.onError` → initials div. Pixi: `Assets.load()` rejects on failure. Wrap in helper that catches and returns fallback texture or flag to use Graphics rect.

---

## Regent's Assessment (Evaluator)

### Strengths

1. Clear scope: player, agents, direction, 8-frame layout.
2. Conclave already implements the pattern (img + `getWalkableSpriteUrl` + `getFrameOffset`).
3. `avatar-utils.ts` and `docs/WALKABLE_SPRITES.md` provide solid base.
4. `walkableSpriteUrl` already passed to RoomCanvas/LobbyCanvas; only RoomRenderer wiring missing.
5. `AgentData.spriteUrl` exists; extending to `walkableSpriteUrl` is straightforward.

### Gaps Addressed in Plan

| Gap | Resolution |
|-----|------------|
| Texture loading | Phase 1 Task 2: sprite loading helper with `Assets.load`, frame rects, cache by URL |
| Fallback | Phase 1 Task 3: fall back to Graphics rect when URL not set; add 404 handling in helper |
| Direction | Phase 1 Task 5–6: `setPlayerDirection`, WASD-derived; agents default south |
| RoomRenderer API | Phase 1 Task 1, 4, 5: `setPlayerSpriteUrl`, `setPlayerDirection` |
| getIntentAgentsForRoom | Phase 2 Task 1: include avatarConfig, derive walkableSpriteUrl |

### Readiness Checklist (Regent)

| Item | Status |
|------|--------|
| RoomRenderer accepts player walkableSpriteUrl | Phase 1 Task 1, 4 |
| RoomRenderer accepts agent walkableSpriteUrl | Phase 2 Task 2, 3 |
| RoomRenderer uses Sprite + texture | Phase 1 Task 3 |
| Texture load failure fallback | Phase 1 Task 2 (helper catches reject) |
| getIntentAgentsForRoom includes avatarConfig | Phase 2 Task 1 |
| computeAgentPositions returns walkableSpriteUrl | Phase 2 Task 2 |
| Direction tracked (player) | Phase 1 Task 5, 6 |
| Direction for agents (default south) | Phase 2 Task 4 |
| Frame selection (8-frame layout) | Phase 1 Task 2, 3 |
| Conclave vs Lobby/World behavior aligned | Same URL derivation, same fallback semantics |

### Recommended Next Step

Implement Phase 1 first; add texture-load-failure handling in the sprite helper before Phase 2. Phase 3 (walk animation) is optional polish.
