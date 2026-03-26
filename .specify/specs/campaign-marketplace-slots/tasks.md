# Tasks: Campaign marketplace slots & wilderness IA

## Spec kit & backlog (this delivery)

- [x] Author [spec.md](./spec.md) (wild vs mall, bridge IA, empty mall, API contracts, verification quest).
- [x] Author [plan.md](./plan.md) (phases, file impacts, gameboard reconciliation options).
- [x] Author [tasks.md](./tasks.md) (this file).
- [x] Add [.specify/backlog/prompts/campaign-marketplace-slots.md](../../backlog/prompts/campaign-marketplace-slots.md).
- [x] Add BACKLOG.md row + run `npm run backlog:seed`.
- [x] Add certification quest `cert-campaign-marketplace-slots-v1` + `npm run seed:cert:campaign-marketplace-slots`.

## Phase A — IA & copy (implementation)

- [x] Audit hub, board, map for **wilderness** vs **marketplace** terminology; align CTAs.
- [x] Implement **canonical post-discovery CTA** (hub recent capture → **Add to your campaign stall**; Vault copy + Stalls button).
- [x] Marketplace route `/campaign/marketplace` (full UI, not stub).

## Phase B — Data & server actions

- [x] Prisma: `PlayerMarketplaceProfile` + `MarketplaceStallSlot` + migration `20260326150000_add_marketplace_stall_slots`.
- [x] `listPlayerMarketplaceSlotsForPlayer` / `attachArtifactToMarketplaceSlot` / `purchaseAdditionalMarketplaceSlot` / `clearMarketplaceSlot` (+ `src/lib/campaign-marketplace-queries.ts` for RSC reads).
- [x] Player stall grouping = `PlayerMarketplaceProfile` per `(playerId, campaignRef)` (no separate EventCampaign).

## Phase C — UI & mitigation

- [x] `/campaign/marketplace` — stall grid, explainer, system showcase from public `isSystem` campaign BARs.
- [x] System listings: query-time (no new seed required when BB quests exist).
- [x] Slot extension purchase UX + cost disclosure (`MarketplacePurchaseSlot`).

## Phase D — Gameboard reconciliation

- [x] **D1**: Board relabeled **Featured campaign field**; nav **Stalls** → marketplace; spec Design Decisions updated.

## Verification

- [ ] Run `npm run seed:cert:campaign-marketplace-slots` in dev (optional refresh).
- [ ] Complete cert quest steps in-app when verifying UX.
