# Plan: Gather Editor + RPG Maker Integration

## Interview Decisions Summary

| # | Question | Answer |
|---|----------|--------|
| 1 | Map types | B — Two separate: graph map (quests), spatial map (navigation/rooms) |
| 1b | Relationship | Spatial rooms link to graph nodes |
| 2 | Encounter spaces | C — Both: spatial rooms host transformation encounters |
| 3 | Lobby | B — Separate tile-based lobby coexists with game-map-lobbies |
| 4 | RPG Maker scope | C — Geometry + tilesets + events |
| 5 | Phase 0 | C — Parallel; Phase 1 can start; Phase 0 merged later |

## Phases

### Phase 0: GM Agent Codebase Analysis (parallel)

- Create `scripts/gather-clone-analyze.ts`
- Fetch/clone gather-clone; read editor + pixi + session files
- Call Sage: "Analyze [summary]. Recommend integration for BARS."
- Write to `.specify/plans/gather-clone-gm-analysis-{date}.md`
- Add `npm run gather:analyze`

### Phase 1: Editor Extraction and Schema

- Add Prisma models: SpatialMap, MapRoom (with graphNodeId)
- Add pixi.js, @types/pathfinding
- Port editor UI: Editor.tsx, PixiEditor, RoomItem, TileMenuGrid, Toolbars
- Port EditorApp.ts, types, spritesheet loader
- Replace Supabase with Prisma; replace signal with React state
- Admin routes: `/admin/maps`, `/admin/maps/[id]/editor`

### Phase 2: RPG Maker Import

- Create `src/lib/spatial-map/rpgmaker-converter.ts`
- Map layers 0/1/2 → floor/above_floor/object
- Tileset image handling
- Events → teleporters, triggers

### Phase 3: BARS Integration

- Campaign map: optional spatial layer; link rooms to graph nodes
- Encounter spaces: MapRoom hosts ThresholdEncounter
- Lobby: tile-based lobby route; coexists with existing lobbies

### Phase 4: Ergonomic Improvements

- Defer until Phase 0 output; keyboard shortcuts, undo/redo, etc.

## Key Files

- `scripts/gather-clone-analyze.ts`
- `prisma/schema.prisma` — SpatialMap, MapRoom
- `src/app/admin/maps/page.tsx`
- `src/app/admin/maps/[id]/editor/page.tsx`
- `src/lib/spatial-map/` — types, converter, persistence
