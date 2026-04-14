# Spec: World State Provider — Layer-2 Player Session Architecture

## Purpose

Define the **layer between the URL route and the database** where player session state lives during a play session. This is the architectural fix for the bug class where state stored in per-room React components dies on route navigation. It is the prerequisite for the bounded hand model (1.37) and save state ceremony (1.38) to feel continuous to players.

## Problem

The current spatial world architecture treats **each room as a separate page mount**. Walking from a spoke clearing to a nursery is a full Next.js route navigation. Each navigation:
- Unmounts the current `RoomCanvas` and mounts a fresh one
- Loses any state held in component-local React state
- Forces us to thread session state through URL params (`?face=`, `?carrying=`)
- Creates a bug class where any new piece of cross-room state silently dies the first time we forget to URL-thread it

We just shipped a hotfix for the carrying-BAR bug (a face move pick lost its carrying state on navigation to the nursery room). The fix works, but it's a symptom: **player session state was stored in the wrong place.**

The 6-face council convened on this question (2026-04-11) and synthesized:

> Per-room page mounts are not the enemy. Storing player session state inside per-room components is the enemy. The fix is to lift state into a provider that lives above the room boundary.

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| The two layers | **Layer 1** (route): owns *which room* is showing. URL is the address. **Layer 2** (provider): owns *who the player is right now* — carrying BAR, selected face, hand contents, save state, conversation context. |
| Provider scope | One provider per `/world/[instanceSlug]` — instance-scoped. State persists across all room transitions within the same instance. |
| Provider mount point | `src/app/world/[instanceSlug]/layout.tsx` — Next.js layout file that wraps all `[roomSlug]` pages. Mounts once per instance, persists across child route changes. |
| Server-backed state | Anything that must survive logout / tab close lives in Prisma (`HandSlot`, `WorldSaveState` from sibling specs). The provider hydrates from server on first mount, then keeps a client-side mirror for fast reads. |
| Client-only state | Transient UI state (modal open/closed, last move direction, dialogue cursor) lives in the provider but is NOT persisted server-side. |
| Reads | Components anywhere under `/world/[instanceSlug]/[roomSlug]` use a `useWorldState()` hook to read provider state. No prop drilling. |
| Writes | Provider exposes typed actions (`setCarrying`, `setSelectedFace`, etc.) that update both client state AND fire server-action writes when the data is server-backed. |
| Optimistic updates | Writes update client state immediately, then sync to server in background. Failures revert. |
| Race safety | Each write carries a sequence number; the provider rejects out-of-order responses. |
| Migration of existing state | The current URL-param state (`?face=`, `?carrying=`) is migrated *into* the provider. Provider continues to write the URL params for backwards compatibility with bookmarks during the transition window. |
| Scope guard | The provider does NOT own server-source-of-truth data like the player's nation, archetype, or vibeulon balance — that's read directly via server actions. The provider is for player *session* state that changes frequently. |
| Cross-instance behavior | If the player navigates from `/world/bb-bday-001/...` to `/world/mastering-allyship/...`, the provider unmounts and remounts. State that should survive this (last save, hand contents) is server-backed and reloaded. |
| Performance | Hydration on first mount must complete in <150ms (single Prisma query for hand + save state + active session data). |

## Conceptual Model

```
┌──────────────────────────────────────────────────────────────┐
│ /world/[instanceSlug]/layout.tsx                             │
│                                                              │
│   <WorldStateProvider instanceSlug={...}>                    │
│     ┌────────────────────────────────────────────┐           │
│     │ /world/[instanceSlug]/[roomSlug]/page.tsx  │           │
│     │                                            │           │
│     │   <RoomCanvas>                             │           │
│     │     └─ uses useWorldState() to read/write  │           │
│     │        carrying, face, hand, save, etc.    │           │
│     │                                            │           │
│     │   <PlayerHud>                              │           │
│     │     └─ also uses useWorldState()           │           │
│     │                                            │           │
│     │   <HandModal>                              │           │
│     │     └─ also uses useWorldState()           │           │
│     └────────────────────────────────────────────┘           │
│                                                              │
│   On room navigation: page unmounts but provider stays.      │
│   State survives. URL still names the room.                  │
└──────────────────────────────────────────────────────────────┘

Provider hydrates from server on initial mount:
  ├── HandSlot rows → hand contents (1.37)
  ├── WorldSaveState row → save state (1.38)
  └── Player session row → selected face, conversation context

Provider syncs writes back to server in background.
```

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | The player's session state, lifted above the room boundary |
| **WHAT** | A React context provider mounted at the world layout level |
| **WHERE** | One per `/world/[instanceSlug]` |
| **Energy** | Continuity — the player never feels the world forget them |
| **Personal throughput** | Every cross-room interaction now reads from a single source of truth |

## API Contracts

### Provider State Shape

```typescript
type WorldState = {
  // Identity
  playerId: string
  instanceSlug: string

  // Hand (mirrored from HandSlot table — see spec 1.37)
  hand: {
    slots: HandSlot[]
    filledCount: number
    carryingBarId: string | null  // slot 0 contents
  }

  // Face selection
  selectedFace: GameMasterFace | null

  // Save state (mirrored from WorldSaveState table — see spec 1.38)
  save: {
    lastRoomSlug: string | null
    lastTileX: number | null
    lastTileY: number | null
    lastFacing: 'north' | 'south' | 'east' | 'west' | null
    savedAt: string | null
  }

  // Transient session state (not server-backed)
  session: {
    lastDialogueNpcId: string | null
    activeModal: string | null  // optional bookkeeping
  }

  // Hydration status
  hydrated: boolean
  lastSyncAt: string | null
}
```

### Provider Actions

```typescript
type WorldStateActions = {
  // Hand
  setCarrying: (barId: string | null) => Promise<void>
  refreshHand: () => Promise<void>

  // Face
  setSelectedFace: (face: GameMasterFace | null) => Promise<void>

  // Save
  recordPosition: (input: { roomSlug: string; tileX: number; tileY: number; facing?: string }) => Promise<void>

  // Session (transient)
  setLastDialogueNpc: (npcId: string | null) => void
  setActiveModal: (modalId: string | null) => void

  // Manual hydrate / refresh (rarely needed)
  rehydrate: () => Promise<void>
}
```

### Hooks

```typescript
// Read full world state
function useWorldState(): WorldState

// Read just one slice (perf optimization, avoids re-renders)
function useCarryingBarId(): string | null
function useSelectedFace(): GameMasterFace | null
function useHandContents(): WorldState['hand']
function useSaveState(): WorldState['save']

// Get the actions
function useWorldStateActions(): WorldStateActions
```

### Server Hydration Action

```typescript
// Single action that loads everything the provider needs on initial mount.
// One Prisma query (or a small handful) — avoids the N+1 problem.
action hydrateWorldState(input: {
  instanceSlug: string
}): Promise<{
  playerId: string
  hand: HandContents
  save: WorldSaveState | null
  selectedFace: GameMasterFace | null
} | { error: string }>
```

## User Stories

### P0 — Continuity

**WSP-1**: As a player picking up a BAR with Sola in the spoke clearing, walking to a nursery, and entering the nursery, my carrying state survives the route change without me having to think about it.

*Acceptance*: Carrying indicator never blinks. NurseryActivityModal sees the carrying BAR. No URL hacks needed.

**WSP-2**: As a player who selected a face NPC to walk with, the selection persists across all room transitions in the same instance.

**WSP-3**: As a player whose tab is killed mid-walk, my position and hand contents are restored on next page load.

### P1 — Performance

**WSP-4**: As a player navigating between rooms, the transition completes in <100ms felt-time. The provider does not block navigation on server roundtrips.

*Acceptance*: Reads from provider are synchronous (mirrored client state). Server sync is async/background.

**WSP-5**: As a player on a slow connection, optimistic updates make the world feel responsive even when server writes are slow.

### P2 — Developer Experience

**WSP-6**: As a developer adding a new piece of cross-room state, I add it to the provider once and all rooms see it. I never have to thread URL params again.

**WSP-7**: As a developer debugging state issues, I can use the React DevTools to see the entire WorldState in one place at the layout level.

## Functional Requirements

### Phase 1 — Provider Skeleton

- **FR1**: Create `src/app/world/[instanceSlug]/layout.tsx` (or update existing) with `<WorldStateProvider>` wrapper
- **FR2**: Create `src/lib/world-state/WorldStateProvider.tsx` with React context, state shape, and provider component
- **FR3**: Create `src/lib/world-state/hooks.ts` with `useWorldState`, slice hooks, and actions hook
- **FR4**: Implement `hydrateWorldState` server action that returns all needed state in one call

### Phase 2 — Migrate Existing State

- **FR5**: Move `carryingBarId` from `RoomCanvas` component state into provider
- **FR6**: Move `selectedFace` from `RoomCanvas` component state into provider
- **FR7**: Update `RoomCanvas` to use `useWorldState()` and `useWorldStateActions()` instead of local state
- **FR8**: Update `PlayerHud` to read from provider instead of its own server query (already uses `getPlayerHudData` — can keep that for the hand counts but read carrying from provider)
- **FR9**: Update `HandModal` to read from provider
- **FR10**: Update `FaceNpcModal` and `AnchorModal` to use `useWorldStateActions().setCarrying()` instead of prop callbacks
- **FR11**: Keep URL param fallback for `?face=` and `?carrying=` for backwards compat — provider rehydrates from URL if no server state exists

### Phase 3 — Server Sync

- **FR12**: Wire `setCarrying` to write to `HandSlot` table (slot 0) via server action — this requires spec 1.37 to be partially implemented or stubbed
- **FR13**: Wire `recordPosition` to write to `WorldSaveState` table via server action — requires spec 1.38 to be partially implemented or stubbed
- **FR14**: Implement debounced position auto-save (every 2 seconds, on visibilitychange to hidden, on room change)

### Phase 4 — Verification Quest (Sola's test)

- **FR15**: Add a manual verification quest: walk through 5 room transitions while carrying a BAR. Carrying indicator must never blink. HUD must never reset. Selected face must persist.
- **FR16**: Add an automated test that mounts the provider, simulates a navigation, and asserts state survives.

## Non-Functional Requirements

- **NFR1**: Provider mounts once per instance, persists across all child route changes
- **NFR2**: Initial hydration completes in <150ms
- **NFR3**: Reads from provider are synchronous (no server roundtrip)
- **NFR4**: Writes are optimistic — client state updates immediately, server sync happens async
- **NFR5**: Failed server writes revert client state and surface a toast (non-blocking)
- **NFR6**: Provider does NOT re-hydrate on every room navigation — only on initial mount or explicit `rehydrate()`
- **NFR7**: The provider does not own data that already has a clean server-action API (player profile, vibeulons, etc.) — those continue to be fetched directly

## Persisted Data & Prisma

This spec does NOT add new tables. It depends on tables added by sibling specs:
- `HandSlot` (from spec 1.37 hand-vault-bounded-inventory)
- `WorldSaveState` (from spec 1.38 world-portal-save-state)

If those specs aren't shipped yet, this spec can ship with provider state initially backed by `localStorage` and server sync stubbed — then upgraded to real server state when the sibling specs land.

## Dependencies

- [hand-vault-bounded-inventory](../hand-vault-bounded-inventory/spec.md) — sibling; provider's hand state is backed by the hand spec's HandSlot table
- [world-portal-save-state](../world-portal-save-state/spec.md) — sibling; provider's save state is backed by the save state spec's WorldSaveState table
- [hand-vault-rename](../hand-vault-rename/spec.md) — unrelated mechanically but in the same design thread

## Migration Path

1. Ship provider with localStorage backing (no schema changes needed)
2. Migrate existing carrying / face state into provider
3. When 1.37 (HandSlot) ships, swap localStorage backing for HandSlot reads
4. When 1.38 (WorldSaveState) ships, swap localStorage save backing for WorldSaveState reads
5. Remove URL param fallback once enough time has passed for cached bookmarks to update

## References

- `src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx` — current home of misplaced state
- `src/components/world/PlayerHud.tsx` — currently does its own server fetch
- `src/components/world/HandModal.tsx` — currently does its own server fetch
- `src/components/world/FaceNpcModal.tsx` — currently passes carrying via prop callback
- 6-face council session (2026-04-11) — design conversation that produced this spec
