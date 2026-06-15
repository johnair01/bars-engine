# Plan: Hand vs Vault — Bounded In-World Inventory

> Implement per [spec.md](./spec.md). **API-first**: ship the `HandSlot` model + server actions before UI. Replaces the derived-query heuristic in `src/actions/player-hand.ts`.

## Architectural Strategy

The hand becomes **explicit server-side state** (`HandSlot` rows), not a query heuristic. A BAR is in the hand iff a `HandSlot` binds it; the vault is every active owned BAR with no `HandSlot`. Six ordered slots, slot 0 carries.

### Phasing

```
Phase 1  Schema + actions        HandSlot model, migration, backfill, src/actions/hand.ts
Phase 2  Overflow UX             OverflowModal, wire into face-move pickup with full hand
Phase 3  HandModal real impl     6-slot grid, deposit/compost, HUD X/6, carrying from slot 0
```

## Data Model

`HandSlot` (table `hand_slots`):
- `id`, `playerId` (→ Player, cascade), `slotIndex` 0–5, `barId` (→ CustomBar, set null), `isCarrying`, timestamps
- `@@unique([playerId, slotIndex])`, `@@index([barId])`

Migration: `prisma/migrations/<ts>_add_hand_slot/` (additive CREATE TABLE only).
Backfill: `scripts/backfill-hand-slots.ts` — 6 most-recent active BARs per player; idempotent.

## API Contracts (Server Actions — `src/actions/hand.ts`)

All Server Actions (React `useTransition`), result-shaped (`{ success, error?, … }`). No external/webhook consumer → no Route Handler.

| Action | Purpose |
|--------|---------|
| `getPlayerHand()` | Read 6 slots + filledCount + carryingBarId |
| `addBarToHand({ barId })` | Auto-fill lowest empty slot; returns `overflow` when full |
| `resolveOverflow({ newBarId, depositBarId })` | Swap one hand BAR → vault, place new BAR; or decline (new → vault) |
| `depositHandBarToVault({ barId })` | Free a slot (BAR → vault) |
| `promoteVaultBarToHand({ barId, targetSlot? })` | Vault → hand; `hand-full` when no empty slot |
| `setCarryingFromHand({ barId \| null })` | Mark carrying slot (flag); plant/HUD read this |
| `reorderHandSlots({ newOrder })` | Atomic re-arrangement (parks at temp negative indexes to dodge unique constraint) |

## File Impacts

### New
- `prisma/migrations/<ts>_add_hand_slot/migration.sql` — CREATE TABLE hand_slots
- `src/actions/hand.ts` — the 7 actions above + types (`HandContents`, `HandSlotDTO`, `OverflowContext`, `HAND_SIZE`)
- `scripts/backfill-hand-slots.ts` — one-time backfill

### Modified (Phase 2–3)
- `prisma/schema.prisma` — `HandSlot` model + back-relations on `Player` and `CustomBar`
- `src/components/world/HandModal.tsx` — read `getPlayerHand`; render 6 slots; deposit/compost
- `src/components/world/PlayerHud.tsx` — HUD `X / 6` from `filledCount`; carrying from slot 0
- `src/components/world/OverflowModal.tsx` (new) — two-column deposit chooser
- face-move pickup flow (e.g. `FaceNpcModal`) — wire overflow on full hand
- `src/actions/player-hand.ts` — deprecate heuristic once HandModal consumes `getPlayerHand`

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Unique `(playerId, slotIndex)` conflicts on reorder | Park rows at negative indexes inside a transaction, then re-assign |
| BAR deleted while in hand | FK `onDelete: SetNull` — slot keeps its index, `barId` becomes null (empty) |
| DB not baselined locally (P3005) | Migration SQL generated via `migrate diff`; applied with `db execute`; committed as the contract |
| Double-add / idempotency | `addBarToHand` and `promoteVaultBarToHand` no-op when BAR already in hand |

## Verification

- `npm run check` (tsc) green.
- Backfill script runs idempotently (skips players with existing slots).
- Manual: pickup with empty hand auto-fills; pickup with full hand → overflow; deposit frees a slot; promote requires empty slot.
