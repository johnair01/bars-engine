# Spec: World Portal — Save State + Fast Travel

## Purpose

Define the **portal-out ceremony** that lets players leave the spatial world and re-enter where they left off (or fast-travel to any room they've already visited). This is the structural reason "hand vs vault" matters: the player has to actually *leave* the world to access the vault, and the world remembers where they were.

## Problem

Currently:
- A player walks around the spatial world. They navigate to a different page (vault, profile, etc.). When they come back, there's no memory of where they were. They start at the spawn point of whichever room they hit.
- There's no concept of "save state" — the world doesn't remember player position, last room, or visit history.
- There's no fast-travel — players can't jump to a previously-visited room without walking through portals.
- The hand-vault distinction (other spec) only matters if leaving the world is a real ceremony with consequences. Without save state, leaving feels like nothing.

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| What gets saved | The player's last room (instance + room slug), tile position (x, y), facing direction, selected face (if any), and the timestamp of the save. |
| When it saves | On each successful step the player takes (debounced — every ~2 seconds, or on room change, whichever comes first). Also explicitly on portal-out action. |
| Save granularity | One save per player. There is no save-slot system. The world is "where you are right now." |
| Re-entry behavior | When the player navigates back to the spatial world (any path), they are routed to their last saved room and tile position. |
| Re-entry override | URL params override save state. `/world/[slug]/[room]` always wins. The save state is the *default* destination, not a forced one. |
| Visit history | Each room the player enters is added to a `WorldVisitedRoom` set. Used for fast travel. |
| Fast travel | Players can fast-travel to any room in their visited set via a "Travel" UI in the HandModal or HUD menu. |
| Fast travel restrictions | Fast travel is allowed within a campaign instance (BB → BB rooms). Cross-instance travel is allowed if the destination is the player's last saved room of that instance. |
| Portal-out anchor | Each spatial world has at least one explicit "portal out" anchor — the south-rim portal of the octagon hub (currently the Card Club portal in BB, the BB clearing return in MTGOA). Stepping on it triggers a save + departure modal. |
| Departure modal | "Leave the world?" — options: "Visit Vault", "Visit Profile", "Quick Save & Stay", "Cancel". |
| Save state model | Single-row per player. Old saves are overwritten. No history. (Future work: savepoint system if needed.) |
| Save state vs hand | Save state ≠ hand. Hand is what BARs the player is carrying. Save state is where they ARE. Both persist independently. |
| Background tab safety | Save also fires on `visibilitychange` to `hidden` so abandoned tabs don't lose progress. |

## Conceptual Model

```
PLAYER
  ├── HAND (other spec — bounded inventory)
  ├── VAULT (other spec — unbounded storage)
  └── WORLD POSITION (this spec — save state)
        ├── lastInstanceSlug
        ├── lastRoomSlug
        ├── lastTileX, lastTileY
        ├── lastFacing
        ├── selectedFace
        ├── savedAt
        └── visitedRooms: [{instanceSlug, roomSlug, lastVisitedAt}]
```

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player (their position in the world) |
| **WHAT** | Position, room, history |
| **WHERE** | Spatial world (the thing being saved) |
| **Energy** | The ceremony of leaving and returning is energetic — entering the world is a commitment, leaving is a release |
| **Personal throughput** | Save state enables a sustained player relationship with the world over time |

## API Contracts

### Types

```typescript
type WorldSaveState = {
  playerId: string
  lastInstanceSlug: string
  lastRoomSlug: string
  lastTileX: number
  lastTileY: number
  lastFacing: 'north' | 'south' | 'east' | 'west' | null
  selectedFace: string | null
  savedAt: string  // ISO
}

type WorldVisitedRoom = {
  instanceSlug: string
  roomSlug: string
  roomName: string
  lastVisitedAt: string
  visitCount: number
}

type FastTravelDestination = {
  instanceSlug: string
  roomSlug: string
  roomName: string
  available: boolean
  reason?: 'cross-instance-not-last-save'
}
```

### Server Actions

```typescript
// Save the player's current world position. Debounced client-side.
action saveWorldPosition(input: {
  instanceSlug: string
  roomSlug: string
  tileX: number
  tileY: number
  facing?: 'north' | 'south' | 'east' | 'west' | null
  selectedFace?: string | null
}): Promise<{ success: true } | { error: string }>

// Get the player's last save state (for re-entry routing).
action getWorldSaveState(): Promise<WorldSaveState | null>

// Add a visited-room entry. Called on each room mount.
action recordRoomVisit(input: {
  instanceSlug: string
  roomSlug: string
  roomName: string
}): Promise<{ success: true } | { error: string }>

// List rooms the player has visited (for fast-travel UI).
action getVisitedRooms(input?: {
  instanceSlug?: string  // optional filter
}): Promise<WorldVisitedRoom[]>

// Resolve fast-travel destinations for a target context.
action getFastTravelDestinations(): Promise<FastTravelDestination[]>

// Trigger explicit portal-out (called from departure modal).
action portalOut(input: {
  destination: 'vault' | 'profile' | 'home'
}): Promise<{ success: true; redirectPath: string } | { error: string }>
```

### Re-entry Routing

A new server action `resolveWorldEntryPath()` is called when the player tries to enter the world without a specific room URL:

```typescript
action resolveWorldEntryPath(): Promise<{ path: string }>
```

Logic:
1. If `WorldSaveState` exists → return `/world/{lastInstanceSlug}/{lastRoomSlug}?spawnX={x}&spawnY={y}`
2. Else → return default home path (e.g., `/world/bb-bday-001/bb-campaign-clearing`)

The `spawnX` / `spawnY` query params override the room's default spawnpoint.

## User Stories

### P0 — Save State

**WP-1**: As a player walking around a spatial room, my position is saved automatically every few seconds, so when I leave and return I'm back where I was.

**WP-2**: As a player navigating to the vault, then back to the world, I land in my last room at my last tile position, not at the spawn point.

**WP-3**: As a player closing my browser tab mid-walk, my position is saved before I leave (via `visibilitychange`), so I don't lose progress.

### P1 — Departure Modal

**WP-4**: As a player stepping on the south portal of the octagon hub, I see a "Leave the world?" modal with options to visit vault, visit profile, or stay.

**WP-5**: As a player choosing "Visit Vault" from the departure modal, my position is saved and I'm routed to `/vault` (formerly `/hand`).

**WP-6**: As a player choosing "Cancel," the modal closes and I stay where I am — the portal does NOT auto-fire.

### P2 — Visit History

**WP-7**: As a player entering a room for the first time, the room is added to my visited-rooms list.

**WP-8**: As a player who's been to many rooms, I can see my visit history sorted by recency.

### P3 — Fast Travel

**WP-9**: As a player in a spatial room, opening the HUD's travel menu shows me all rooms I've visited in this campaign instance, ordered by recency.

**WP-10**: As a player picking a fast-travel destination, my position is saved at the current location, then I'm routed to the destination at its default spawn point.

**WP-11**: As a player trying to fast-travel cross-instance, I can only go to that instance's last-saved room (not arbitrary rooms in another world).

## Functional Requirements

### Phase 1 — Save State Model + Auto-save

- **FR1**: Add `WorldSaveState` Prisma model: `id`, `playerId (unique)`, `lastInstanceSlug`, `lastRoomSlug`, `lastTileX`, `lastTileY`, `lastFacing`, `selectedFace`, `savedAt`
- **FR2**: Implement `saveWorldPosition`, `getWorldSaveState` server actions
- **FR3**: Wire client-side auto-save into RoomCanvas: debounce 2s on player movement, fire on room change, fire on `visibilitychange` to hidden
- **FR4**: Implement `resolveWorldEntryPath` and use it in `/world/page.tsx` (the world entry redirect)

### Phase 2 — Visit History

- **FR5**: Add `WorldVisitedRoom` Prisma model: `id`, `playerId`, `instanceSlug`, `roomSlug`, `roomName`, `lastVisitedAt`, `visitCount`. Unique on `(playerId, instanceSlug, roomSlug)`.
- **FR6**: Implement `recordRoomVisit` and call from RoomCanvas mount
- **FR7**: Implement `getVisitedRooms` query

### Phase 3 — Departure Modal

- **FR8**: Replace the south-rim portal anchor's auto-fire with a `departure_portal` anchor type that opens a modal instead.
- **FR9**: Build `DepartureModal` component with options: Visit Vault / Visit Profile / Cancel.
- **FR10**: Implement `portalOut` action that saves state then returns the redirect path.

### Phase 4 — Fast Travel UI

- **FR11**: Add a "Travel" button to the HandModal (or HUD).
- **FR12**: Build `FastTravelMenu` component listing visited rooms.
- **FR13**: Wire fast-travel selection to save current position then navigate to destination.

## Non-Functional Requirements

- **NFR1**: Save writes are debounced and rate-limited. No more than one write per 2 seconds per player.
- **NFR2**: Save reads (re-entry) must complete in <100ms (single indexed lookup).
- **NFR3**: Visit history must not grow unbounded — cap at 100 rooms per player, prune oldest.
- **NFR4**: Fast travel cross-instance is restricted to prevent abuse / soft-locks.

## Persisted Data & Prisma

```prisma
model WorldSaveState {
  id               String   @id @default(cuid())
  playerId         String   @unique
  lastInstanceSlug String
  lastRoomSlug     String
  lastTileX        Int
  lastTileY        Int
  lastFacing       String?
  selectedFace     String?
  savedAt          DateTime @default(now())

  player           Player   @relation(fields: [playerId], references: [id])
}

model WorldVisitedRoom {
  id             String   @id @default(cuid())
  playerId       String
  instanceSlug   String
  roomSlug       String
  roomName       String
  lastVisitedAt  DateTime @default(now())
  visitCount     Int      @default(1)

  player         Player   @relation(fields: [playerId], references: [id])

  @@unique([playerId, instanceSlug, roomSlug])
  @@index([playerId, lastVisitedAt])
}
```

When ready to implement:
- [ ] Create migration: `npx prisma migrate dev --name add_world_save_state`
- [ ] Run `npm run db:sync` and `npm run check`

## Dependencies

- [hand-vault-bounded-inventory](../hand-vault-bounded-inventory/spec.md) — sibling spec; the ceremony of leaving the world to access the vault only matters if save state exists
- [hand-vault-rename](../hand-vault-rename/spec.md) — sibling spec; the departure modal will route to `/vault` after the rename

## References

- `src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx` — where auto-save will be wired
- `src/lib/spatial-world/spawn-resolver.ts` — needs extension to honor `?spawnX/?spawnY` URL params
- `src/lib/spatial-world/octagon-campaign-hub.ts` — south rim portal will become a `departure_portal` anchor
