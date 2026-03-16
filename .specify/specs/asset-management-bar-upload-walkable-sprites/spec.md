# Spec: Asset Management, BAR Upload, Walkable Sprites

## Purpose

Enable (1) BAR asset upload — attaching images and files to quests with ritual and curation; (2) walkable sprites — top-down avatar spritesheets for a Gathertown-style spatial experience where players see themselves and others on the map.

**Problem**: BARS has no BAR asset attachments; CustomBar records are text-only. Avatar system uses 64×64 portrait busts for dashboards/modals but has no top-down sprites for spatial maps. The gather-editor provides tile-based rooms; players cannot yet walk them as avatars.

**Practice**: Deftness Development — spec kit first, API-first. Informed by [Six-Face Analysis](./SIX_FACE_ANALYSIS.md).

## Design Decisions (from Six-Face Analysis)

| Topic | Decision |
|-------|----------|
| **Asset model** | Unified `Asset` model for BAR attachments, sprites, tiles; type discriminator |
| **BAR upload** | Attach assets to CustomBar; optional "intention" field (Shaman); admin or instance-owner curation (Challenger) |
| **Roles** | creator, steward, viewer; admin can upload/curate; instance owners can steward instance assets |
| **Walkable sprites** | Extend avatar system: add `walkableSpritesheetUrl` or derive from nation+archetype; top-down 4-direction spritesheet |
| **Spatial presence** | Player position stored; other avatars visible (multiplayer presence); "Enter space" as explicit action (Shaman) |
| **Integration** | Unified metaphor: "Conclave" — space where BARs are offered and avatars walk |
| **Spatial–graph link** | Reuse MapRoom.graphNodeId; teleporter → graph node |

## Conceptual Model

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Admin (upload, curate), Instance owner (steward), Player (view, contribute) |
| **WHAT** | Asset = file + metadata; BAR attachment = Asset linked to CustomBar; Walkable sprite = top-down spritesheet |
| **WHERE** | BAR attachments on quests; walkable sprites on spatial map; Asset registry |
| **Energy** | Vibeulons — not minted by upload; curation may gate visibility |
| **Personal throughput** | Upload → review → published; avatar → map → presence |

## User Stories

### P1: BAR attachment upload

**As a player or admin**, I want to attach an image or file to a BAR (quest), so the quest has a cover, evidence, or supporting artifact.

**Acceptance**: CustomBar can have one or more Asset references; upload flow stores file (Vercel Blob or public/uploads); Asset record links to CustomBar.

### P2: BAR upload with intention (ritual)

**As a player**, I want to optionally name an intention when uploading a BAR attachment, so the upload feels like an offering rather than a chore.

**Acceptance**: Upload form has optional "intention" or "offering" text field; stored in Asset.metadataJson or CustomBar; displayed in BAR detail view.

### P3: Walkable sprite format and derivation

**As the system**, I want to render player avatars as top-down sprites on the spatial map, so players see themselves and others walking the Conclave.

**Acceptance**: Avatar config derives walkable spritesheet path; format: 4 directions (N/S/E/W), idle + walk frames; falls back to generic sprite when missing.

### P4: Enter space (threshold)

**As a player**, I want to explicitly "Enter the space" before loading the spatial map, so entering feels like crossing a threshold.

**Acceptance**: Spatial map route shows "Enter" CTA before map loads; first entry can show brief ritual text; position initialized on spawnpoint.

### P5: Multiplayer presence on map

**As a player**, I want to see other players' avatars on the spatial map, so I feel we are in the space together.

**Acceptance**: Player positions stored; spatial view fetches and renders other players at their positions; avatars use walkable sprites.

## Functional Requirements

### Asset model

- **FR1**: Add `Asset` model: id, type, url, mimeType, metadataJson, ownerId, customBarId?, createdAt. Types: `bar_attachment`, `sprite`, `tile`.
- **FR2**: Add `CustomBar.attachmentIds` (JSON string array of Asset IDs) or relation `CustomBar.assets` for multiple attachments.
- **FR3**: Asset storage: Vercel Blob when BLOB_READ_WRITE_TOKEN set; else `public/uploads/assets/{id}/{filename}`.
- **FR4**: Roles: creator (uploader), steward (can edit/delete if instance-scoped), admin (full access).

### BAR upload

- **FR5**: Upload action: `uploadBarAttachment(customBarId, file, intention?)` — creates Asset, links to CustomBar.
- **FR6**: Optional intention/offering field stored in Asset.metadataJson.
- **FR7**: Curation: draft vs published; admin or instance owner can publish. (Phase 2)

### Walkable sprites

- **FR8**: Walkable spritesheet format: PNG, dimensions TBD (e.g. 64×64 per frame, 4 dirs × 2 states = 8 frames, or 32×32). Document in `docs/WALKABLE_SPRITES.md`.
- **FR9**: Path convention: `public/sprites/walkable/{nationKey}-{archetypeKey}.png` or derive from avatar config. Fallback: `public/sprites/walkable/default.png`.
- **FR10**: Extend avatar config or Player with `walkableSpritesheetUrl` when custom sprites exist; else derive from nation+archetype.

### Spatial presence

- **FR11**: Add `PlayerMapPresence` or store `playerId, mapId, roomIndex, x, y, direction, updatedAt` for position.
- **FR12**: "Enter space" flow: player clicks Enter → position set to spawnpoint → map loads with player at position.
- **FR13**: Spatial view fetches other players in same map/room; renders at their positions with walkable sprites.

## Data Model

### Asset (new)

```prisma
model Asset {
  id           String    @id @default(cuid())
  type         String    // bar_attachment | sprite | tile
  url          String    // Vercel Blob URL or /uploads/assets/...
  mimeType     String?   @map("mime_type")
  metadataJson String?   @map("metadata_json") // { intention?, altText?, ... }
  ownerId      String    @map("owner_id")
  customBarId  String?   @map("custom_bar_id")
  createdAt    DateTime  @default(now())
  owner        Player    @relation(fields: [ownerId], references: [id])
  customBar    CustomBar? @relation(fields: [customBarId], references: [id])

  @@index([customBarId])
  @@index([type])
  @@map("assets")
}
```

### CustomBar (extend)

- Add relation `assets Asset[]` (or `attachmentIds String?` as JSON array if minimal change preferred).

### PlayerMapPresence (new)

```prisma
model PlayerMapPresence {
  id         String    @id @default(cuid())
  playerId   String    @map("player_id")
  mapId      String    @map("map_id")
  roomIndex  Int       @map("room_index")
  x          Int
  y          Int
  direction  String    @default("south") // north | south | east | west
  updatedAt  DateTime  @updatedAt
  player     Player    @relation(fields: [playerId], references: [id])
  map        SpatialMap @relation(fields: [mapId], references: [id])

  @@unique([playerId, mapId])
  @@index([mapId])
  @@map("player_map_presences")
}
```

## API Contracts

### uploadBarAttachment(customBarId, formData)

**Input**: `{ customBarId: string; formData: FormData }` (file, intention?)  
**Output**: `{ success: boolean; assetId?: string; error?: string }`

### getBarAssets(customBarId)

**Input**: `{ customBarId: string }`  
**Output**: `Asset[]`

### getWalkableSpriteUrl(avatarConfig)

**Input**: `AvatarConfig`  
**Output**: `string` — URL to spritesheet or fallback

### enterSpatialMap(mapId)

**Input**: `{ mapId: string }`  
**Output**: `{ success: boolean; position?: { roomIndex, x, y }; error?: string }`

### getMapPresences(mapId)

**Input**: `{ mapId: string }`  
**Output**: `{ presences: { playerId, name, roomIndex, x, y, direction, avatarConfig }[] }`

### updateMapPosition(mapId, roomIndex, x, y, direction)

**Input**: `{ mapId, roomIndex, x, y, direction }`  
**Output**: `{ success: boolean }`

## Walkable Sprite Format

| Field | Value |
|-------|-------|
| Dimensions | 64×64 per frame (or 32×32 for smaller footprint) |
| Layout | Row-major: N_idle, N_walk, S_idle, S_walk, E_idle, E_walk, W_idle, W_walk (8 frames) |
| Directions | north, south, east, west |
| Format | PNG, transparent background |
| Path | `public/sprites/walkable/{key}.png` — key from `nationKey-archetypeKey` or `default` |

Document fully in `docs/WALKABLE_SPRITES.md`.

## User Flows

### BAR upload (with ritual)

1. Player opens BAR detail or create form.
2. Clicks "Add attachment" → file picker.
3. Optional: enters "intention" or "offering" text.
4. Submits → `uploadBarAttachment` → Asset created, linked to CustomBar.
5. (Phase 2) Admin reviews → publishes.

### Enter spatial map

1. Player navigates to spatial map route (e.g. `/conclave` or `/maps/[id]`).
2. Sees "Enter the Conclave" CTA (or similar threshold copy).
3. Clicks Enter → `enterSpatialMap` → position set to spawnpoint.
4. Map loads; player sees self at spawnpoint; movement updates position.
5. Other players in same map appear at their positions.

## Phases

### Phase 1: Asset model + BAR attachment (must-have)

- Add Asset model; CustomBar relation.
- `uploadBarAttachment`, `getBarAssets`.
- BAR detail/create UI: attach image, optional intention.
- Storage: Vercel Blob or public/uploads.

### Phase 2: Walkable sprites (must-have)

- Document format in `docs/WALKABLE_SPRITES.md`.
- Add `getWalkableSpriteUrl(avatarConfig)`.
- Create default walkable sprite; derive path from avatar config.
- PlayerMapPresence model; enterSpatialMap, updateMapPosition, getMapPresences.

### Phase 3: Spatial player view (should-have)

- Spatial map route with "Enter space" flow.
- Render player and others with walkable sprites.
- Movement (click or WASD) updates position; real-time or poll.

### Phase 4: Curation + ritual polish (should-have)

- Draft vs published for BAR attachments.
- "Enter space" ritual copy; optional intention on first entry.
- Proximity encounters (could-have).

## Out of Scope (this spec)

- Full real-time sync (WebSocket); polling acceptable for Phase 3.
- Proximity chat or video.
- BAR marketplace or discovery feed.
- User-uploaded custom walkable sprites (admin-only initially).
- RPG Maker import (separate spec).

## Non-functional Requirements

- Asset upload: max file size 5 MB for images; 10 MB for PDFs.
- Walkable sprites: must render at 60fps; optimize sprite sheet size.
- Presence: position updates debounced (e.g. 500ms) to reduce writes.

## Reference

- [Six-Face Analysis](./SIX_FACE_ANALYSIS.md)
- [gather-editor-rpg-maker-integration](../gather-editor-rpg-maker-integration/spec.md)
- [avatar-sprite-assets](../avatar-sprite-assets/spec.md)
- [SPRITE_ASSETS.md](../../../docs/SPRITE_ASSETS.md)
- [.agent/context/game-master-sects.md](../../.agent/context/game-master-sects.md)
