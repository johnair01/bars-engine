# Spec: Gather Editor + RPG Maker Integration

## Purpose

Integrate the gather-clone tile editor into BARS Engine, add RPG Maker map import/export, and support spatial maps for campaign navigation, encounter spaces, and lobby exploration. Spatial rooms link to graph nodes (quest flow).

**Problem**: BARS lacks a spatial map editor. The gather-clone editor is ergonomic for tile-based spaces; RPG Maker maps are a common format for user content. Campaign map, encounter spaces, and lobby navigation need spatial representation.

**Practice**: Deftness Development — spec kit first, API-first, deterministic over AI.

## Design Decisions (from Ouroboros Interview)

| Topic | Decision |
|-------|----------|
| Map types | Two separate concepts: graph map (quests) vs spatial map (navigation/rooms) |
| Graph–spatial link | Spatial rooms link to graph nodes (e.g. `MapRoom.graphNodeId`) |
| Encounter spaces | Spatial rooms host transformation encounters |
| Lobby navigation | Separate tile-based lobby coexists with existing game-map-lobbies |
| RPG Maker import | Geometry + tilesets + events (doors, NPCs, triggers) |
| Phase 0 vs 1 | Parallel — Phase 1 can start; Phase 0 (GM analysis) output merged later |

## Conceptual Model

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Admin (editor), Player (exploration) |
| **WHAT** | SpatialMap = tile-based rooms; MapRoom = one room with tilemap; links to graph nodes |
| **WHERE** | Campaign map, encounter spaces, lobby |
| **Energy** | Vibeulons — not minted by map editing; exploration may trigger encounters |
| **Personal throughput** | Admin creates maps; players navigate; encounters occur in spatial rooms |

## API Contracts

### getSpatialMap(id)

**Input**: `{ id: string }`  
**Output**: `SpatialMap | null`

### saveSpatialMap(id, realmData)

**Input**: `{ id: string; realmData: RealmData }`  
**Output**: `{ success: boolean; error?: string }`

### rpgMakerMapToRealmData(mapJson, tilesetRefs)

**Input**: RPG Maker MapXXX.json + tileset references  
**Output**: `RealmData` (gather-clone format)

## User Stories

### P1: Admin map editor

**As an admin**, I want to create and edit tile-based spatial maps, so I can define campaign regions, encounter rooms, and lobby layouts.

**Acceptance**: `/admin/maps` lists maps; `/admin/maps/[id]/editor` opens the tile editor; changes persist to Prisma.

### P2: Spatial room → graph node link

**As an admin**, I want to link a spatial room to a graph node, so players navigating that room can enter the quest flow at that node.

**Acceptance**: MapRoom has `graphNodeId`; admin can set it in the editor; runtime resolves room → node for navigation.

### P3: RPG Maker import

**As an admin**, I want to import RPG Maker MV/MZ maps (geometry, tilesets, events), so I can reuse existing game content.

**Acceptance**: Upload MapXXX.json + tilesets; converter produces RealmData; events map to teleporters/triggers.

## Functional Requirements

- **FR1**: SpatialMap, MapRoom models in Prisma; RealmData JSON structure
- **FR2**: Admin routes `/admin/maps`, `/admin/maps/[id]/editor`
- **FR3**: gather-clone editor components ported; Pixi.js canvas; persistence via Prisma
- **FR4**: MapRoom.graphNodeId links to graph node (Twine passage ID or campaign map node ID)
- **FR5**: RPG Maker converter: geometry + tilesets + events
- **FR6**: Phase 0 script: GM agents analyze gather-clone; output to `.specify/plans/`

## Dependencies

- gather-clone (https://github.com/trevorwrightdev/gather-clone)
- pixi.js
- Prisma (existing)
