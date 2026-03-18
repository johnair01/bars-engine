# Gather-Clone Analysis — Asset Management, Templates, and BARS Adoption

**Reference repo:** `/tmp/gather-clone` (https://github.com/trevorwrightdev/gather-clone)  
**Purpose:** Assess maturity and reusability for BARS spatial maps; support player-created maps.

---

## 1. Asset Management — How It Works

### Storage Model

| Asset Type | Path | Format |
|------------|------|--------|
| **Tileset spritesheets** | `/sprites/spritesheets/{ground,grasslands,village,city}.png` | PNG, 768×384 to 1024×1536 |
| **Character skins** | `/sprites/characters/Character_{001-083}.png` | 83 player sprites |
| **Editor gizmos** | `/sprites/tile-outline.png`, `erase-tile.png`, `collider-tile.png`, etc. | Editor-only overlays |
| **Play mode** | `/sprites/faded-tile.png` | Private-area fade |

**Note:** The repo does **not** include the PNG files. Paths assume assets exist under `public/`. You must source or create them separately.

### Spritesheet Registry (TypeScript)

Spritesheets are defined in TS modules, not JSON:

| File | Sheet | Size | Tiles |
|------|-------|------|-------|
| `ground.ts` | ground | 768×384 | ~180 (floor + above_floor: grass, dirt, sand, corners, curves) |
| `grasslands.ts` | grasslands | 1024×1024 | ~100+ (flowers, foliage, pebbles, stones, trees, furniture) |
| `village.ts` | village | 1024×1024 | Buildings, furniture, objects |
| `city.ts` | city | 1024×1536 | Urban tiles |

**Structure per tile:**
```typescript
interface SpriteSheetTile {
  name: string
  x: number
  y: number
  width: number
  height: number
  layer?: 'floor' | 'above_floor' | 'object'
  colliders?: { x: number; y: number }[]  // for pathfinding
}
```

### Tile Key Format

Tiles use `{sheetName}-{spriteName}`:

| Example | Sheet | Sprite |
|---------|-------|--------|
| `ground-normal_detailed_grass` | ground | normal_detailed_grass |
| `grasslands-light_basic_tree_bundle` | grasslands | light_basic_tree_bundle |
| `village-lamp_post_right_on` | village | lamp_post_right_on |

**Resolver** (`spritesheet.ts`):
```typescript
const [sheetName, spriteName] = tilename.split('-')
await this.load(sheetName)
return this.getSprite(sheetName, spriteName)
```

### Colliders

Objects can define `colliders: [{ x, y }]` in tile coordinates. Used for pathfinding (BFS blocks those tiles). Example: `stone_1` has `colliders: [{ x: 0, y: 0 }]`; `big_wood_table` (64×64) has 4 colliders.

---

## 2. Templates Available

### Default Map (`defaultmap.json`)

- **Path:** `frontend/utils/defaultmap.json`
- **Size:** ~228KB (single line)
- **Usage:** CreateRealmModal — "Use starter map" checkbox when creating a space
- **Structure:** `RealmData` with `spawnpoint` and `rooms[]`; one room named "Home"
- **Content:** Dense grid of `ground-normal_detailed_grass` with `grasslands-light_basic_tree_bundle` objects scattered
- **Limit:** 10,000 tiles per room (enforced in saveRealm.ts)

### Empty Room Template

New rooms start with `tilemap: {}`. No pre-filled layout.

### Editor Palettes

- **Palettes:** `['ground', 'grasslands', 'village']` — city not exposed in editor
- **Layer filter:** floor / above_floor / object
- **Tile source:** `sprites.spriteSheetDataSet[palette].spritesList` filtered by layer

---

## 3. Maturity Assessment

### Production-Ready

| Area | Notes |
|------|-------|
| Map data model | Zod schemas, RealmData format, Supabase persistence |
| Multiplayer | Socket.io: movePlayer, teleport, playerJoinedRoom, proximityUpdate |
| Pathfinding | BFS in `pathfinding.ts` with blocked tiles |
| Editor | Place/erase, layers, undo/redo, teleporters, spawn, private areas |
| Play mode | Tile movement, collision, multi-room, teleporters |
| Video chat | Agora, proximity-based channels |

### Gaps / Stubs

| Area | Notes |
|------|-------|
| Asset files | No PNGs in repo; must be added |
| City palette | Defined but not in editor |
| Typos | `iight_green_flower_*` (likely "light") in grasslands.ts |
| Tests | No test files |
| Live map edit | Map changes require reload; no real-time sync |

---

## 4. Six Game Master Faces — Adoption Lens

### Architect (Structure)

**Verdict:** Adopt tile key format and layer model.

- **Tile key:** `sheetName-spriteName` is clear and works with BARS `TileData.floor` / `TileData.object`.
- **Layers:** floor, above_floor, object — BARS already has floor and object; add above_floor when needed.
- **Colliders:** Add `colliders` to BARS tile model for pathfinding; optional for MVP.
- **Spritesheet config:** TS modules are verbose. Consider JSON manifest for BARS to allow player-uploaded tilesets later.

### Shaman (Intuitive / Emotional)

**Verdict:** Starter map is valuable; make it optional and themeable.

- **defaultmap.json:** Use as a "starter template" for new campaigns. Optionally trim or create variants (lobby, encounter, etc.).
- **Palette feel:** ground = nature, grasslands = pastoral, village = settlement, city = urban. BARS could add themed palettes (e.g. elemental nations).

### Challenger (Provocative)

**Verdict:** Don't copy everything; BARS has different needs.

- **Video chat:** BARS uses polling, not Socket.io. Defer Agora.
- **83 character skins:** BARS has avatar system; different approach. Don't port.
- **10,000 tile limit:** Reasonable; document for BARS.
- **Real-time map edit:** Not in gather-clone; BARS doesn't need it for MVP.

### Regent (Governance)

**Verdict:** Asset ownership and permissions differ.

- **Gather:** Realms owned by user; map_data in Supabase.
- **BARS:** SpatialMap tied to Instance; campaign owners edit. Need `canEditMap` before opening editor.
- **Asset hosting:** Gather uses static `/sprites/`. BARS may need uploads, CDN, or Asset model.

### Diplomat (Bridging)

**Verdict:** RealmData format is the bridge.

- **BARS `RealmData`** already matches gather-clone. `JsonRealmAdapter` can import defaultmap.json.
- **Tile values:** BARS uses simple keys (grass, tree, rock). To use gather tiles, add spritesheet resolver and adopt `sheet-sprite` keys.
- **Migration path:** Start with BARS simple keys; add gather-style resolver when adding real spritesheets.

### Sage (Wisdom)

**Verdict:** Use what's mature; defer the rest.

- **Adopt now:** Tile key format, layer model, defaultmap as template, collider structure.
- **Adopt later:** Full spritesheet TS modules (or JSON), actual PNG assets, pathfinding.
- **Don't adopt:** Socket.io, Agora, 83 skins, live map sync.

---

## 5. Concrete Recommendations for BARS

### Immediate (MVP)

1. **Reuse RealmData format** — Already done. Ensure JSON import accepts gather-style tile keys.
2. **Add `above_floor` to TileData** — Optional; BARS types support it. Defer rendering until needed.
3. **Use defaultmap.json as starter** — Trim or sample for a "starter lobby" template; offer on map create.
4. **Document tile key convention** — `sheetName-spriteName` for future spritesheet support.

### Short-Term (Player-Created Maps)

1. **Spritesheet registry** — Port ground + grasslands TS (or convert to JSON). Start with 1–2 sheets.
2. **Asset resolution** — `getSpriteForTile(tileKey)` that returns PIXI texture or URL. Fallback to colored rect for unknown keys.
3. **Colliders** — Add `colliders?: { x: number; y: number }[]` to TileData for pathfinding.
4. **Starter templates** — 2–3 templates: empty, lobby, encounter. Store in repo or DB.

### Longer-Term

1. **Player-uploaded tilesets** — Asset model, upload flow, JSON manifest per tileset.
2. **Pathfinding** — Port BFS from gather-clone when adding click-to-move.
3. **above_floor rendering** — When visual polish is needed.

---

## 6. File Reference

| Purpose | Path |
|---------|------|
| Spritesheet registry | `frontend/utils/pixi/spritesheet/spritesheet.ts` |
| Ground tiles | `frontend/utils/pixi/spritesheet/ground.ts` |
| Grasslands (objects) | `frontend/utils/pixi/spritesheet/grasslands.ts` |
| Village | `frontend/utils/pixi/spritesheet/village.ts` |
| City | `frontend/utils/pixi/spritesheet/city.ts` |
| SpriteSheetData class | `frontend/utils/pixi/spritesheet/SpriteSheetData.ts` |
| Default map template | `frontend/utils/defaultmap.json` |
| Create realm (use template) | `frontend/components/Modal/CreateRealmModal.tsx` |
| Tile menu (palettes) | `frontend/app/editor/TileMenu.tsx` |
| Pathfinding | `frontend/utils/pixi/pathfinding.ts` |
