# Plan: Asset Management, BAR Upload, Walkable Sprites

## Six-Face Synthesis

| Face | Key decision |
|------|--------------|
| Shaman | Optional intention on upload; "Enter space" as threshold |
| Challenger | Curation (draft → published); movement as intentional action |
| Regent | Roles: creator, steward, viewer; spatial rules |
| Architect | Unified Asset model; spatial–graph link; sprite format spec |
| Diplomat | Attribution; multiplayer presence; shared visibility |
| Sage | Unified metaphor: Conclave; structure enables emergence |

## Phases

### Phase 1: Asset model + BAR attachment

- Add Asset model; CustomBar relation
- uploadBarAttachment, getBarAssets actions
- BAR detail/create UI: attach image, optional intention
- Storage: Vercel Blob or public/uploads

### Phase 2: Walkable sprites

- docs/WALKABLE_SPRITES.md format spec
- getWalkableSpriteUrl(avatarConfig)
- PlayerMapPresence model
- enterSpatialMap, updateMapPosition, getMapPresences

### Phase 3: Spatial player view

- "Enter space" flow on spatial route
- Render player + others with walkable sprites
- Movement updates position

### Phase 4: Curation + ritual polish

- Draft vs published for attachments
- Ritual copy; proximity encounters (optional)

## Key Files

- `prisma/schema.prisma` — Asset, PlayerMapPresence
- `src/actions/assets.ts` — uploadBarAttachment, getBarAssets
- `src/actions/spatial-presence.ts` — enterSpatialMap, updateMapPosition, getMapPresences
- `src/lib/avatar-utils.ts` — getWalkableSpriteUrl
- `docs/WALKABLE_SPRITES.md`
