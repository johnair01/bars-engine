# Spec: Hand vs Vault — Bounded In-World Inventory

## Purpose

Define the hand as a **bounded in-world inventory** (Pokemon team / Harvest Moon early-game) and the vault as **unbounded out-of-world storage** (Bill's PC). The hand is what the player can play with in the spatial rooms. The vault is the deep storage they access by leaving the play space.

This makes the choice of "what BARs to bring into play" a meaningful tactical decision and creates ceremony around composting old work to make room for new.

## Problem

Currently:
- "Hand" is conceptually the same thing as "vault" — both are queries against `CustomBar` filtered by `creatorId` and status. There's no bounded set the player carries into play.
- A player picks up a face move BAR with an NPC and... nothing prevents them from picking up infinite BARs. There's no scarcity, no choice, no tactical investment in *which* BARs they're working with.
- The new HUD shows a `Hand` count that's actually drafts + unplaced quests — a heuristic, not a real bounded set.
- Players can't experience the cycle of "bring a powerful well-specced BAR into the spatial room, use it skillfully, leave with new BARs to be processed."

The architectural intent (from product conversation 2026-04-11):

> The hand is limited and players can only access their vault by leaving the play space. The BARs that they collect in the spatial rooms either need to be planted or they can only take up to their hand size "out" of the game and put it in their vault. The vault is essentially acting as Bill's computer in Pokemon for pokemon that don't fit in the players team.

> The goal is that through composting mechanics and collaborative play players increasingly bring with them powerful and well specced BARs with them into the spatial room game and there's enough going on in those spaces that they can contribute and leave with new BARs to be processed and use the ones they came in with skillfully.

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Hand size | **6 slots**, hardcoded for v1. Future: tunable per player level / archetype. |
| What goes in the hand | Any BAR the player wants to *play with* in the spatial rooms. Includes: face-move BARs picked up at NPCs, charge captures, drafts the player wants to develop, BARs being carried for planting. |
| Hand membership | Explicit. A BAR is in the hand if it has a `HandSlot` row binding it to the player. Not a derived query. |
| Vault | The set of all the player's active BARs that are NOT in the hand. Unbounded. |
| Slot ordering | Slots 1–6, ordered. Player can rearrange. Slot 0 is reserved for the BAR currently being carried (the "active BAR"). |
| Pickup with empty slot | Slot fills automatically; no friction. |
| Pickup with full hand | Player is shown an **overflow modal**: "Your hand is full. Choose what to deposit to your vault, or send this new BAR to your vault." Two columns: current hand (6 BARs) + the incoming BAR. Player picks ONE BAR to send to vault. The other 6 remain in the hand. |
| Overflow cancel | Player can dismiss the overflow modal — the new BAR goes to the vault by default. Nothing is lost; nothing is forced. |
| Hand-to-vault deposit | Free action via the HandModal. Click any BAR → "Send to vault." Removes it from hand, marks it as vault-only. |
| Vault-to-hand promotion | Only available when leaving the play space and entering the vault page. Promoting a BAR from vault → hand requires an empty slot. |
| Carrying | "Carrying" a BAR (the green indicator at bottom of screen) is now equivalent to "BAR is in slot 0 of the hand AND not yet planted." Walking to a nursery and planting clears slot 0. |
| Plant on nursery | Same as today: the carried BAR is planted on the spoke move bed. The slot becomes empty after planting. |
| Hand persistence | Hand membership is server-side state. Survives logout, room navigation, page refresh. URL params are no longer needed for carrying. |
| Composting bonus | When a player composts a BAR (vault → discard), they earn vibeulons. Encourages flow rather than hoarding. |
| Discoverability | The HUD always shows hand count `X / 6`. The HandModal shows the 6 slots visually. Empty slots are visible. |

## Conceptual Model

```
PLAYER
  ├── HAND (6 slots)
  │     ├── slot 0: [optionally: currently carrying BAR]
  │     ├── slot 1: BAR
  │     ├── slot 2: BAR
  │     ├── slot 3: BAR
  │     ├── slot 4: empty
  │     └── slot 5: empty
  │
  └── VAULT (unbounded)
        ├── BAR
        ├── BAR
        ├── BAR
        ...

Spatial world only sees the HAND.
Vault is accessed by LEAVING the world (see world-portal-save-state spec).
```

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player |
| **WHAT** | The player's bounded set of playable BARs (hand) + unbounded storage (vault) |
| **WHERE** | Hand is in the spatial world; vault is outside |
| **Energy** | Hand is the working set; vault is the reservoir |
| **Personal throughput** | Players develop a tactical relationship with their hand contents; the WAVE moves are what they DO with their hand |

## API Contracts

### Types

```typescript
type HandSlot = {
  slotIndex: 0 | 1 | 2 | 3 | 4 | 5
  barId: string | null
  isCarrying: boolean   // true only for slot 0 when player is mid-walk-with-bar
}

type HandContents = {
  slots: HandSlot[]
  filledCount: number
  size: 6
  carryingBarId: string | null
}

type OverflowContext = {
  newBarId: string
  newBarTitle: string
  currentHand: Array<{ slotIndex: number; barId: string; title: string; type: string }>
}
```

### Server Actions

```typescript
// Get the player's current hand (slots, filled count)
action getPlayerHand(): Promise<HandContents | { error: string }>

// Add a BAR to the hand. Auto-fills empty slot. Returns OverflowContext if full.
action addBarToHand(input: {
  barId: string
}): Promise<
  | { success: true; slot: HandSlot }
  | { success: false; overflow: OverflowContext }
  | { error: string }
>

// Resolve overflow: player chose what to deposit to vault.
// `depositBarId` can be the new BAR (player declined to swap) or one of the current 6.
action resolveOverflow(input: {
  newBarId: string
  depositBarId: string  // which BAR goes to vault
}): Promise<{ success: true; hand: HandContents } | { error: string }>

// Move a hand BAR to the vault (free action).
action depositHandBarToVault(input: {
  barId: string
}): Promise<{ success: true; hand: HandContents } | { error: string }>

// Promote a vault BAR to the hand. Only allowed when an empty slot exists.
action promoteVaultBarToHand(input: {
  barId: string
  targetSlot?: 0 | 1 | 2 | 3 | 4 | 5
}): Promise<{ success: true; hand: HandContents } | { success: false; reason: 'hand-full' } | { error: string }>

// Set carrying state — moves a hand BAR into slot 0 (or unsets carrying).
action setCarryingFromHand(input: {
  barId: string | null
}): Promise<{ success: true } | { error: string }>

// Reorder slots
action reorderHandSlots(input: {
  newOrder: Array<{ slotIndex: number; barId: string | null }>
}): Promise<{ success: true; hand: HandContents } | { error: string }>
```

### Migration: existing players

For each existing player:
- Pick the 6 most-recently-active BARs as their initial hand
- Everything else goes to the vault
- One-time migration script

## User Stories

### P0 — Core Hand

**HV-1**: As a player picking up a face move BAR with an NPC, the BAR auto-fills my next empty hand slot, so I don't have to manage anything for the common case.

**HV-2**: As a player with a full hand picking up another BAR, I see an overflow modal showing my current 6 hand BARs + the incoming one, and I choose which BAR goes to the vault.

**HV-3**: As a player, the HUD shows my hand size as `X / 6` so I always know how full I am.

**HV-4**: As a player, opening the HandModal shows my 6 slots visually with each BAR's title, type, and a "Send to vault" action.

### P1 — Vault Promotion

**HV-5**: As a player visiting the vault page (outside the play space), I can promote BARs from the vault back into my hand if I have empty slots, so I can prepare for a play session.

**HV-6**: As a player with a full hand visiting the vault, I cannot promote — I'm shown a message "Make room in your hand first."

### P2 — Carrying Equivalence

**HV-7**: When I pick up a BAR via NPC, slot 0 (the active slot) becomes my "carrying" slot. The carrying indicator at the bottom of the screen reflects slot 0's contents.

**HV-8**: Walking to a nursery and planting clears slot 0, removes the BAR from the hand, and the bed receives it.

### P3 — Compost Loop

**HV-9**: When I deposit a hand BAR to the vault, I have the option to "compost" it instead — destroying it for vibeulons.

**HV-10**: A composted BAR is gone forever. The system asks for confirmation.

## Functional Requirements

### Phase 1 — Hand Model + Migration

- **FR1**: Add `HandSlot` Prisma model: `id`, `playerId`, `slotIndex (0-5)`, `barId (nullable)`, `isCarrying (bool)`, `createdAt`, `updatedAt`. Unique constraint `(playerId, slotIndex)`.
- **FR2**: Migration: for each player, populate 6 hand slots from their 6 most-recent active BARs. Mark all other BARs as vault-only via a `inHand: false` derived flag (or rely on the absence of a HandSlot).
- **FR3**: Server actions: `getPlayerHand`, `addBarToHand`, `resolveOverflow`, `depositHandBarToVault`, `promoteVaultBarToHand`, `setCarryingFromHand`, `reorderHandSlots`

### Phase 2 — Overflow UX

- **FR4**: Build `OverflowModal` component — two-column comparison view with the 6 current hand BARs and the incoming BAR. Player picks one to deposit.
- **FR5**: Wire `addBarToHand` overflow result into `FaceNpcModal` flow. When picking a face move with a full hand, show the OverflowModal before confirming the BAR.

### Phase 3 — HandModal Real Implementation

- **FR6**: Replace HandModal stub with the real bounded view: 6 slot grid, drag-to-reorder, send-to-vault action, compost action.
- **FR7**: HUD `Hand` count reads from `getPlayerHand().filledCount`.
- **FR8**: Carrying indicator reads from `slot 0`'s contents.

### Phase 4 — Vault Page Promotion

- **FR9**: On the vault page (still `/hand` until rename ships), each BAR card has a "Promote to hand" button if there's an empty slot.
- **FR10**: Block promotion when hand is full with helpful message.

### Phase 5 — Compost Bonus

- **FR11**: Add a `compostBar` action that destroys a BAR and awards vibeulons.
- **FR12**: HandModal "Send to vault" action opens a confirmation: "Move to vault" or "Compost (+N vibeulons)".

## Persisted Data & Prisma

```prisma
model HandSlot {
  id          String   @id @default(cuid())
  playerId    String
  slotIndex   Int      // 0-5
  barId       String?
  isCarrying  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  player      Player   @relation(fields: [playerId], references: [id])
  bar         CustomBar? @relation("HandSlotBar", fields: [barId], references: [id])

  @@unique([playerId, slotIndex])
  @@index([playerId])
  @@index([barId])
}
```

When ready to implement:
- [ ] Create migration: `npx prisma migrate dev --name add_hand_slots`
- [ ] Run `npm run db:sync` and `npm run check`
- [ ] Run hand-population migration for existing players

## Dependencies

- [hand-vault-rename](../hand-vault-rename/spec.md) — sibling spec; the legacy `/hand` route should be renamed `/vault` so the new HandModal can own the "hand" name
- [world-portal-save-state](../world-portal-save-state/spec.md) — sibling spec; the ceremony of leaving the play space to access the vault is the structural reason hand bounding matters
- Backlog 1.34 PDH — long-term convergence; hand slots may eventually be powered by `ActorDeckState`

## References

- `src/components/world/HandModal.tsx` — current stub to replace
- `src/actions/player-hand.ts` — current heuristic loader
- `src/actions/plant-bar-on-spoke.ts` — existing plant flow (slot 0 → bed)
- `src/lib/vault-queries.ts` — existing vault query layer
