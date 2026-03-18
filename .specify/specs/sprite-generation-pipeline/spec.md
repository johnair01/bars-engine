# Spec: Agent-Coordinated Sprite Generation Pipeline

## Purpose

Define the architecture for generating player avatar sprites via AI agents. This is the "Phase 3" of the Avatar System Strategy (AVS) — a deliberate deferral until the generation contract was clear enough to implement without over-engineering.

**Depends on**: AVS Phases 1–2 (complete), walkable-sprites-pixi (Pixi.js integration).

**Does not replace**: The manual upload path remains the first-class delivery mode. This spec adds an agent-driven path alongside it.

## Critical Lifecycle Constraint

**Avatars are generated exactly once.**

- Generation is triggered on player acceptance (character creation / "Build Your Character" quest completion → `deriveAvatarFromExisting` completion effect).
- The result is stored as `Player.avatarConfig` (JSON), a `Player.avatarSpritePath` (portrait) and `Player.walkableSpritePath` (walkable).
- **No per-room generation.** When a player enters a map, `getWalkableSpriteUrl(parseAvatarConfig(avatarConfig))` is called. If the sprite file exists, it renders. If not, `default.png` fallback renders.
- **No regeneration unless the player explicitly requests it** (out of scope for Phase 3).

This eliminates the "presence gap" concern: there is no race condition between room entry and sprite readiness, because generation is asynchronous and decoupled from room events.

## Two Pipelines

### Pipeline 1: Portrait Bust (64×64 PNG, layered)

Used by: dashboard avatar, admin gallery, Build Your Character preview.

Format: Five compositeable layers, all 64×64 transparent PNG:
1. `base` — body silhouette (gender variant: default / male / female / neutral)
2. `nation_body` — nation color/pattern over body
3. `archetype_outfit` — archetype clothing
4. `nation_accent` — nation ornamental details
5. `archetype_accent` — archetype sigil / finishing details

Key at rest: `/sprites/avatar/{nationKey}-{archetypeKey}-{layer}.png`

Composition handled by: `Avatar` component (CSS stacking / Canvas). LibreSprite can flatten for export.

**Generation approach**: AI image API (DALL·E 3 / Stability AI / Replicate) per layer, guided by prompts from `SPRITE_ASSETS.md`. Requires admin review before promotion to `/public/sprites/`.

### Pipeline 2: Walkable Spritesheet (512×64 PNG, 8-frame)

Used by: Pixi.js room renderer (`RoomRenderer`), spatial maps.

Format: Single PNG, 8 frames row-major at 64×64 per frame:
```
[N_idle][N_walk][S_idle][S_walk][E_idle][E_walk][W_idle][W_walk]
```

Key at rest: `/sprites/walkable/{nationKey}-{archetypeKey}.png`

**Generation approach**: **LPC (Liberated Pixel Cup) asset base preferred over AI generation.** LPC provides CC-BY-SA licensed top-down sprites. LibreSprite `--batch` + Lua scripts handle palette swapping and spritesheet assembly. AI generation for walkable sprites only as fallback when no suitable LPC base exists.

## LibreSprite Role

LibreSprite (GPL-2, Aseprite fork) is used as a **post-processing tool**, not a generation tool.

Capabilities used:
- `--batch` headless mode for scripted operations
- Lua scripting API for palette swap, layer merge, frame assembly
- Export to indexed PNG with exact palette

Specific scripts:
| Script | Purpose |
|--------|---------|
| `scripts/sprites/flatten-portrait.lua` | Merge 5 portrait layers into single 64×64 PNG |
| `scripts/sprites/palette-swap.lua` | Apply nation palette to LPC base for walkable |
| `scripts/sprites/assemble-walkable.lua` | Concatenate 8 frames into 512×64 spritesheet |

These scripts are invoked by the backend pipeline service, not the frontend.

## Agent Coordination Model

### Trigger

`deriveAvatarFromExisting` completion effect → enqueue `sprite_generation_job` with:
```json
{
  "playerId": "...",
  "nationKey": "bold-heart",
  "archetypeKey": "the-merchant",
  "genderKey": "female",
  "pipeline": ["portrait", "walkable"]
}
```

### Agent Roles

| Agent | Role |
|-------|------|
| **Architect** | Defines generation contract (prompt templates, format validation, retry policy). Owns the `sprite_generation_job` schema. |
| **Shaman** | One-time threshold gate: "Is this player's character moment ready for materialization?" Runs before generation is enqueued. Blocks enqueue if player hasn't completed Build Your Character. |
| **Challenger** | Validates output against 4 failure modes (see below). Rejects to review queue if any fail. |
| **Regent** | Audit trail: every generation attempt (success or failure) logged to `SpriteAuditLog`. Two threads: portrait and walkable. |
| **Diplomat** | Coordinates handoff between portrait generation (async) and walkable generation (can be parallelized). Each task is atomic; partial success valid. |
| **Sage** | Sequencing: portrait busts ship first (Phase 3a); walkable spritesheets deferred to Phase 3b after portrait pipeline is stable. Restraint: don't over-generate. |

### Challenger Failure Modes

The Challenger enforces rejection-to-review for:
1. **Wrong dimensions** — portrait not 64×64, walkable not 512×64
2. **Palette violation** — colors outside approved STYLE_GUIDE.md palette
3. **Opaque background on overlay layers** — nation_body / archetype layers must be transparent PNG
4. **Attribution missing** — LPC-derived assets require CC-BY-SA attribution file

### Admin Review Queue

Generated sprites land in `/sprites/pending/` before promotion. Admin sees:
- Player name + avatarConfig
- Preview of generated sprite(s)
- Approve → move to `/public/sprites/` + update `Player.avatarSpritePath`
- Reject → return to queue with note; re-trigger generation with amended prompt

Route: `/admin/sprites/review`

## Audit Trail

`SpriteAuditLog` model (new):
```prisma
model SpriteAuditLog {
  id          String   @id @default(cuid())
  playerId    String
  pipeline    String   // "portrait" | "walkable"
  nationKey   String
  archetypeKey String
  status      String   // "enqueued" | "generated" | "review" | "approved" | "rejected"
  attempt     Int      @default(1)
  promptUsed  String?
  sourceModel String?  // "dalle3" | "stability" | "lpc" | "manual"
  reviewNote  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Contracts

### Enqueue (internal)

```
POST /api/sprites/generate
Body: { playerId, nationKey, archetypeKey, genderKey, pipeline[] }
Response: { jobId, status: "enqueued" }
```

### Status check

```
GET /api/sprites/status?playerId=...
Response: { portrait: "approved" | "pending" | "none", walkable: "approved" | "pending" | "none" }
```

### Admin review

```
GET  /api/admin/sprites/review          → pending sprite list
POST /api/admin/sprites/review/:id/approve
POST /api/admin/sprites/review/:id/reject  Body: { note }
```

## Phased Delivery

### Phase 3a: Portrait busts (prerequisite for Phase 3b)

1. Schema: `SpriteAuditLog`, add `avatarSpritePath` to `Player`
2. Backend job queue (Python / FastAPI): enqueue on `deriveAvatarFromExisting`
3. Prompt templates: one per layer, sourced from `SPRITE_ASSETS.md`
4. LibreSprite flatten script: `flatten-portrait.lua`
5. Challenger validation: dimensions + palette + transparency
6. Admin review queue: `/admin/sprites/review`
7. Regent audit trail: write on every status transition

### Phase 3b: Walkable spritesheets

1. LPC asset library integrated (CC-BY-SA attribution tracked)
2. LibreSprite palette-swap + assemble scripts
3. Pixi.js renderer wired (`RoomRenderer`) — may ship independently before Phase 3b
4. AI fallback: only when no LPC base available for nation+archetype combo
5. Separate review queue entry (pipeline = "walkable")

## Non-Goals

- Per-room or per-session generation
- Regeneration without explicit player request
- Animated sprites (beyond the 8-frame walkable)
- Realtime generation (async pipeline only)
- Changing the layering model defined in `avatar-parts.ts`

## Phase 3 Readiness Criteria

Before starting Phase 3a:

- [ ] At least one complete portrait bust sprite set manually uploaded and approved (establishes palette + quality baseline)
- [ ] `STYLE_GUIDE.md` palette locked (no open review gates)
- [ ] LibreSprite installed on backend host and `--batch` mode verified
- [ ] Image generation API key provisioned (DALL·E 3 or equivalent)
- [ ] Admin review queue UI wireframed (can be basic table for Phase 3a)

## References

- [SPRITE_ASSETS.md](../../docs/SPRITE_ASSETS.md) — prompt table, LPC workflow, attribution
- [STYLE_GUIDE.md](../avatar-sprite-quality-process/STYLE_GUIDE.md) — palette, review gates, per-nation motifs
- [avatar-parts.ts](../../src/lib/avatar-parts.ts) — layer definitions
- [avatar-utils.ts](../../src/lib/avatar-utils.ts) — config derivation, `getWalkableSpriteUrl`
- [AVS tasks.md](../avatar-system-strategy/tasks.md) — Phase 3 placeholder
- LibreSprite: https://github.com/LibreSprite/LibreSprite (GPL-2, Aseprite fork)
- LPC: https://lpc.opengameart.org (CC-BY-SA 3.0)
