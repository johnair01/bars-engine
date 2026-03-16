# Tasks: Asset Management, BAR Upload, Walkable Sprites

## Phase 1: Asset model + BAR attachment

- [x] Add Asset model to Prisma
- [x] Add CustomBar.assets relation (or attachmentIds)
- [x] Create src/actions/assets.ts: uploadBarAttachment, getBarAssets
- [x] Storage: Vercel Blob or public/uploads/assets
- [x] BAR detail/create UI: attach image, optional intention field
- [x] Run db:sync after schema change

## Phase 2: Walkable sprites

- [x] Create docs/WALKABLE_SPRITES.md (format spec)
- [x] Add getWalkableSpriteUrl(avatarConfig) to avatar-utils or new module
- [x] Add PlayerMapPresence model to Prisma
- [x] Add SpatialMap.presences relation
- [x] Create src/actions/spatial-presence.ts: enterSpatialMap, updateMapPosition, getMapPresences
- [x] Create default walkable sprite (public/sprites/walkable/default.png)
- [x] Run db:sync after schema change

## Phase 3: Spatial player view

- [x] Spatial map route: "Enter space" CTA before load
- [x] enterSpatialMap on click; position to spawnpoint
- [x] Spatial view: fetch getMapPresences; render player + others
- [x] Movement (click or WASD) → updateMapPosition
- [x] Use walkable sprites for avatar rendering on map

## Phase 4: Curation + ritual polish

- [ ] Asset status: draft vs published
- [ ] Admin/instance-owner publish flow
- [ ] "Enter space" ritual copy
- [ ] (Optional) Proximity encounters
