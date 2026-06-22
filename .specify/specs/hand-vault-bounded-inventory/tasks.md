# Tasks: Hand vs Vault — Bounded In-World Inventory

> Implement per [spec.md](./spec.md) and [plan.md](./plan.md). API-first order.

## Phase 1 — Schema + Actions (this commit)

- [x] **T1.1** Add `HandSlot` model to `prisma/schema.prisma` + back-relations on `Player` and `CustomBar`.
- [x] **T1.2** Create migration `prisma/migrations/<ts>_add_hand_slot/migration.sql` (additive CREATE TABLE; generated via `prisma migrate diff`, committed as the contract).
- [x] **T1.3** Apply to local DB (`prisma db execute`) + regenerate client (`prisma generate`).
- [x] **T1.4** Implement `src/actions/hand.ts`: `getPlayerHand`, `addBarToHand`, `resolveOverflow`, `depositHandBarToVault`, `promoteVaultBarToHand`, `setCarryingFromHand`, `reorderHandSlots` + types (`HandContents`, `HandSlotDTO`, `OverflowContext`, `HAND_SIZE`).
- [x] **T1.5** `scripts/backfill-hand-slots.ts` — 6 most-recent active BARs per player; idempotent. Smoke-tested + re-run confirms skip.
- [x] **T1.6** `npm run check` — 0 type errors.

## Phase 2 — Overflow UX

- [ ] **T2.1** `src/components/world/OverflowModal.tsx` — two-column chooser (current 6 hand BARs + incoming); deposit one to vault; cancel → new BAR to vault.
- [ ] **T2.2** Wire `addBarToHand` overflow result into the face-move pickup flow (`FaceNpcModal` / NPC pickup) so a full hand prompts the modal before confirming.

## Phase 3 — HandModal Real Implementation

- [ ] **T3.1** Replace `HandModal` stub: read `getPlayerHand`; render the 6-slot grid (empty slots visible); per-BAR "Send to vault" + "Compost".
- [ ] **T3.2** HUD `Hand` count reads `getPlayerHand().filledCount` (`X / 6`).
- [ ] **T3.3** Carrying indicator reads the carrying slot; planting on a nursery clears it (`setCarryingFromHand(null)` + existing plant flow).
- [ ] **T3.4** Drag-to-reorder via `reorderHandSlots`.
- [ ] **T3.5** Vault page (`/vault`): promote BAR → hand when empty slot exists (`promoteVaultBarToHand`); "Make room first" when full.
- [ ] **T3.6** Compost (vault → discard) mints vibeulons (HV-9/HV-10) with confirmation.
- [ ] **T3.7** Deprecate the heuristic in `src/actions/player-hand.ts` once consumers use `getPlayerHand`.

## Phase 4 — Verify

- [ ] **T4.1** `npm run build` (env permitting) / `npm run check` green.
- [ ] **T4.2** Manual: empty-hand pickup auto-fills; full-hand pickup → overflow; deposit frees a slot; promote requires empty slot; reorder persists.
- [ ] **T4.3** Run `npx tsx scripts/backfill-hand-slots.ts` against target DB on deploy.

## Deploy notes

- Production: `prisma migrate deploy` applies `<ts>_add_hand_slot`; then run the backfill once.
