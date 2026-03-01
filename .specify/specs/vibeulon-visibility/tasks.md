# Tasks: Vibeulon Visibility (Movement Feed)

## Phase 1: Data + Component

- [x] **1.1** Add `getMovementFeed(limit?: number)` in `src/actions/economy.ts` (or new `src/lib/movement-feed.ts`). Query VibulonEvent where amount > 0, include player, order by createdAt desc, take limit (default 20).
- [x] **1.2** Resolve "for what": use questId to fetch CustomBar.title when source is 'quest' or 'completion_effect'; for p2p_transfer use notes. Batch fetch quests by questId to avoid N+1.
- [x] **1.3** Create `src/components/MovementFeed.tsx`: render list of events with player name, amount, source/quest label. Compact design.

## Phase 2: Surface

- [x] **2.1** Add MovementFeed to dashboard (`/`) — e.g. collapsible "Recent Vibeulon Activity" or inline section.
- [x] **2.2** Or add MovementFeed to wallet (`/wallet`) — "Movement Feed" section above or below Token Inventory.

## Verification

- [x] **V1** Complete a quest; confirm feed shows the earning event.
- [x] **V2** Manual: Feed displays on dashboard or wallet.
- [ ] **V3** Add cert quest step if needed (cert-two-minute-ride or new cert) — deferred.
