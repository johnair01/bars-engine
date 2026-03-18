# Tasks: Agent-Coordinated Sprite Generation Pipeline

## Readiness Gate (before Phase 3a starts)

- [ ] R.1 One complete portrait bust set manually uploaded + approved (palette baseline)
- [ ] R.2 STYLE_GUIDE.md palette locked (no open review gates)
- [ ] R.3 LibreSprite `--batch` mode verified on backend host
- [ ] R.4 Image generation API key provisioned
- [ ] R.5 Admin review queue UI wireframed

## Phase 3a: Portrait Busts

### Schema
- [x] 3a.1 Add `SpriteAuditLog` model to `prisma/schema.prisma`
- [x] 3a.2 Add `avatarSpritePath` (String?) to `Player`
- [x] 3a.3 Run `npm run db:sync`

### Backend pipeline
- [x] 3a.4 `backend/app/sprites/` module: job schema, enqueue, status
- [x] 3a.5 `POST /api/sprites/generate` endpoint
- [x] 3a.6 `GET /api/sprites/status` endpoint
- [x] 3a.7 Generation worker: call image API per layer, save to `/sprites/pending/`
- [x] 3a.8 LibreSprite `flatten-portrait.lua` script (merge 5 layers → single 64×64 PNG)

### Validation (Challenger)
- [ ] 3a.9 Dimension check: 64×64 per layer
- [ ] 3a.10 Palette check: against STYLE_GUIDE.md approved palette
- [ ] 3a.11 Transparency check: overlay layers must have alpha channel
- [ ] 3a.12 Attribution check: LPC-derived assets have CC-BY-SA attribution file

### Admin review queue
- [x] 3a.13 `/admin/sprites/review` page: pending list with preview
- [x] 3a.14 `POST /api/admin/sprites/review/:id/approve` → promote to `/public/sprites/`, update `Player.avatarSpritePath`
- [x] 3a.15 `POST /api/admin/sprites/review/:id/reject` → return to queue with note

### Audit trail (Regent)
- [ ] 3a.16 Write `SpriteAuditLog` entry on every status transition (enqueued → generated → review → approved/rejected)

### Trigger wiring
- [x] 3a.17 `deriveAvatarFromExisting` completion effect enqueues `sprite_generation_job`

## Phase 3b: Walkable Spritesheets

- [ ] 3b.1 LPC asset library integrated: attribution tracking per asset
- [ ] 3b.2 LibreSprite `palette-swap.lua` script (apply nation palette to LPC base)
- [ ] 3b.3 LibreSprite `assemble-walkable.lua` script (8 frames → 512×64 spritesheet)
- [ ] 3b.4 Walkable generation worker: LPC base + palette swap; AI fallback when no LPC base
- [ ] 3b.5 Pixi.js `RoomRenderer` wired to use `getWalkableSpriteUrl` (may ship independently)
- [ ] 3b.6 Separate review queue entry for `pipeline = "walkable"`
- [ ] 3b.7 Extend `SpriteAuditLog` with `lpcBaseAsset` field for attribution

## Verification

- [ ] Portrait bust: complete Build Your Character → job enqueued → sprite in pending queue → approve → avatar updates on dashboard
- [ ] Walkable: approved walkable sprite renders in Pixi.js room on spatial map page
- [ ] Rejection flow: rejected sprite stays in pending; re-generation triggered with amended prompt
- [ ] Audit trail: all status transitions present in `SpriteAuditLog`
- [ ] Fallback: player with no generated sprite sees `default.png` on map
