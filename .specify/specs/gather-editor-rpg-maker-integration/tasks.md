# Tasks: Gather Editor + RPG Maker Integration

## Phase 0: GM Analysis (parallel)
- [x] Create scripts/gather-clone-analyze.ts
- [x] Add npm run gather:analyze
- [ ] Run gather:analyze (requires backend); merge output into plan

## Phase 1: Schema + Admin (done)
- [x] Add SpatialMap, MapRoom to Prisma
- [x] Add graphNodeId to MapRoom
- [x] Create src/actions/spatial-maps.ts
- [x] Create /admin/maps, /admin/maps/[id], /admin/maps/[id]/editor
- [x] Add Maps to AdminNav

## Phase 1b: Full Editor Port (done)
- [x] Add pixi.js, @types/pathfinding
- [x] Create SimpleTileEditor (Pixi.js canvas, tile placement, room selector)
- [x] Create MapEditorClient with Save button
- [x] Wire save to saveSpatialMapRealmData
- [ ] (Future) Port full gather-clone EditorApp, spritesheets, toolbars

## Phase 2: RPG Maker Import
- [ ] Create src/lib/spatial-map/rpgmaker-converter.ts
- [ ] Geometry + tilesets + events conversion
- [ ] Admin upload UI for MapXXX.json

## Phase 3: BARS Integration
- [ ] Campaign map spatial layer (optional)
- [ ] Encounter spaces: MapRoom → ThresholdEncounter link
- [ ] Lobby: tile-based lobby route
