# Spec: Walkable Sprites Implementation

## Purpose

Implement end-to-end walkable sprites for the BARS Engine: (1) wire Pixi RoomRenderer to render 8-frame spritesheets for player and agents in Lobby/World; (2) add Replicate-based asset generation for nation×archetype combos; (3) validate format and manifest.

**Problem**: Lobby/World draw player and agents as colored rectangles. `getWalkableSpriteUrl` returns paths but only `default.png` exists. No pipeline to generate or validate nation×archetype sprites.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Rendering** | Pixi v8 `Assets.load`, `Sprite`, frame rects; fallback to Graphics rect on load failure |
| **Asset source** | Replicate `retro-diffusion/rd-animation` for generation; LPC 4wall.ai as manual fallback |
| **Format** | 512×64 PNG, 8 frames row-major (N/S/E/W × idle/walk); 64×64 per frame per docs/WALKABLE_SPRITES.md |
| **Key derivation** | `{nationKey}-{archetypeKey}` via `getWalkableSpriteUrl(parseAvatarConfig(avatarConfig))` |
| **Agent direction** | Default south (frame 2); RoomPresence has no direction |
| **Texture fallback** | On `Assets.load()` reject: use default.png or colored rect via `getAvatarHue` |

## Conceptual Model

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Player (avatar), Intent agents (offline players), Admin (generate assets) |
| **WHAT** | Walkable sprite = 8-frame top-down spritesheet; nation×archetype → prompt → Replicate → PNG |
| **WHERE** | Lobby, World rooms; `public/sprites/walkable/` |
| **Energy** | Replicate API cost (~$0.02–0.05/run); cached outputs |
| **Personal throughput** | Generate → validate → commit; player enters map → sprite loads |

## API Contracts (API-First)

### generateWalkableSprite (Server Action)

**Input**: `{ nationKey: string; archetypeKey: string }`  
**Output**: `Promise<{ url?: string; error?: string }>`

```ts
// src/actions/generate-walkable-sprite.ts
'use server'
export async function generateWalkableSprite(input: {
  nationKey: string
  archetypeKey: string
}): Promise<{ url?: string; error?: string }>
```

- Calls Replicate `retro-diffusion/rd-animation` with nation+archetype prompt
- Fetches output, optionally scales 48→64 if needed, saves to `public/sprites/walkable/{nationKey}-{archetypeKey}.png`
- Returns URL or error. Requires `REPLICATE_API_TOKEN`.

### buildNationArchetypePrompt (internal)

**Input**: `{ nationKey: string; archetypeKey: string }`  
**Output**: `string`

- Maps nation/archetype keys to descriptive prompt (e.g. "Argyra Bold Heart character, silver metallic collar, crimson vest, heart motif, top-down walking")
- Uses handbook/SPRITE_ASSETS.md descriptions

### RoomRenderer (existing, extended)

- `setPlayerSpriteUrl(url: string | null)`
- `setPlayerDirection(direction: 'north'|'south'|'east'|'west')`
- Constructor or post-construction: accept `playerSpriteUrl`
- `AgentData.walkableSpriteUrl` (new field)

## User Stories

### P1: Player sees walkable sprite in Lobby/World

**As a player** with avatarConfig (nation + archetype), I want to see my character as a top-down sprite when walking the map, so I feel represented in the space.

**Acceptance**: Player sprite appears in Lobby and World when avatarConfig exists; direction updates from WASD; fallback to colored rect when sprite missing or load fails.

### P2: Agents show walkable sprites

**As a player**, I want to see other players (intent agents) as sprites when they have avatarConfig, so the space feels populated with characters.

**Acceptance**: Agents with avatarConfig display sprites (south-facing); others show gray rect.

### P3: Admin can generate missing sprites

**As an admin**, I want to generate walkable sprites for nation×archetype combos via Replicate, so we have grammatical assets that look like what they represent.

**Acceptance**: Server action `generateWalkableSprite`; optional admin UI or batch script; outputs saved to `public/sprites/walkable/`.

### P4: Format validation

**As a developer**, I want to validate that walkable sprites match the 512×64 8-frame format, so we catch regressions early.

**Acceptance**: Script `npm run sprites:validate-walkable` checks dimensions, frame count, transparency; exits 1 on failure.

## Functional Requirements

### Phase 1: Pixi RoomRenderer (Player)

- **FR1**: RoomRenderer accepts `playerSpriteUrl` (constructor or `setPlayerSpriteUrl`).
- **FR2**: Sprite loading helper: `Assets.load(url)`, frame rect `Rectangle(frameIndex*64, 0, 64, 64)`, cache by URL.
- **FR3**: `renderPlayer()`: if URL set, create Sprite with frame for current direction (default south); else Graphics rect.
- **FR4**: `setPlayerDirection(direction)`; use in frame selection.
- **FR5**: LobbyCanvas/RoomCanvas pass `walkableSpriteUrl`, track WASD direction, call `setPlayerDirection`.
- **FR6**: On texture load failure: fallback to default.png or colored rect.

### Phase 2: Agent Sprites

- **FR7**: `getIntentAgentsForRoom` selects `avatarConfig`; derive `walkableSpriteUrl` via `getWalkableSpriteUrl(parseAvatarConfig(...))`.
- **FR8**: `AgentData.walkableSpriteUrl`; `computeAgentPositions` maps it through.
- **FR9**: `renderAgents()`: Sprite when `walkableSpriteUrl` set (south idle frame); else Graphics rect.

### Phase 3: Replicate Asset Generation

- **FR10**: `generateWalkableSprite({ nationKey, archetypeKey })` server action.
- **FR11**: Prompt builder maps nation+archetype to Replicate prompt; palette optional.
- **FR12**: Call `retro-diffusion/rd-animation` with `style: "four_angle_walking"`, `return_spritesheet: true`.
- **FR13**: Post-process: fetch output, scale 48→64 if needed, save to `public/sprites/walkable/{key}.png`.
- **FR14**: Env: `REPLICATE_API_TOKEN`; document in `docs/ENV_AND_VERCEL.md`.

### Phase 4: Validation (Optional)

- **FR15**: Script `scripts/validate-walkable-sprites.ts` checks 512×64, 8 frames, PNG, transparency.
- **FR16**: Manifest: list expected keys (nation×archetype); report missing/invalid.

## Non-Functional Requirements

- **Scaling**: Replicate calls are async; batch script should rate-limit. Cache generated sprites in repo.
- **Fallback**: default.png must exist; ensure 512×64 format.
- **Backward compatibility**: No sprite URL → existing Graphics rect behavior.

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Replicate API | Cache outputs; batch with delay; feature flag for generation |
| Filesystem | Generation writes to `public/` — run in CI or local only; Vercel serverless has read-only filesystem |
| Env | REPLICATE_API_TOKEN in docs/ENV_AND_VERCEL.md |

## Verification Quest (required for UX features)

- **ID**: `cert-walkable-sprites-v1`
- **Steps**: (1) Enter Lobby with avatarConfig; (2) Confirm player sprite appears (not rect); (3) Move WASD; confirm direction updates; (4) Confirm agents show sprites when present.
- **Narrative**: "Validate the walkable avatar system so guests see themselves in the Conclave space at the Bruised Banana party."
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [walkable-sprites-pixi](.specify/specs/walkable-sprites-pixi/plan.md) — implementation detail
- [asset-management-bar-upload-walkable-sprites](.specify/specs/asset-management-bar-upload-walkable-sprites/spec.md) — format spec, getWalkableSpriteUrl
- [avatar-character-lockstep](.specify/specs/avatar-character-lockstep/) — avatarConfig as gate

## References

- `docs/WALKABLE_SPRITES.md` — format spec
- `src/lib/avatar-utils.ts` — getWalkableSpriteUrl, parseAvatarConfig
- `src/lib/spatial-world/pixi-room.ts` — RoomRenderer
- `src/app/conclave/space/[mapId]/ConclaveSpaceClient.tsx` — reference implementation (img + objectPosition)
- Replicate: https://replicate.com/retro-diffusion/rd-animation
