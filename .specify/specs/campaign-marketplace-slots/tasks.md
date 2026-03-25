# Tasks: Campaign marketplace slots & wilderness IA

## Spec kit & backlog (this delivery)

- [x] Author [spec.md](./spec.md) (wild vs mall, bridge IA, empty mall, API contracts, verification quest).
- [x] Author [plan.md](./plan.md) (phases, file impacts, gameboard reconciliation options).
- [x] Author [tasks.md](./tasks.md) (this file).
- [x] Add [.specify/backlog/prompts/campaign-marketplace-slots.md](../../backlog/prompts/campaign-marketplace-slots.md).
- [x] Add BACKLOG.md row + run `npm run backlog:seed`.
- [x] Add certification quest `cert-campaign-marketplace-slots-v1` + `npm run seed:cert:campaign-marketplace-slots`.

## Phase A — IA & copy (implementation)

- [ ] Audit hub, board, map for **wilderness** vs **marketplace** terminology; align CTAs.
- [ ] Implement **canonical post-discovery CTA** (minimum: Hand eligible row + one CYOA completion hook for BB).
- [ ] Add marketplace route stub or placeholder page linking from CTA (optional if only copy in A).

## Phase B — Data & server actions

- [ ] Prisma: `CampaignMarketplaceSlot` (or agreed model) + migration.
- [ ] `listPlayerCampaignSlots` / `attachArtifactToSlot` / `purchaseAdditionalSlot`.
- [ ] Player campaign shell (reuse or new model per plan).

## Phase C — UI & mitigation

- [ ] `/campaign/marketplace` (or chosen path) — stall grid, empty states, system stalls.
- [ ] Seed **system/instance** stalls for cold start.
- [ ] Slot extension purchase UX + cost disclosure.

## Phase D — Gameboard reconciliation

- [ ] Choose D1 vs D2 in plan; update spec Design Decisions; implement relabel or migration.

## Verification

- [ ] Run `npm run seed:cert:campaign-marketplace-slots` in dev.
- [ ] Complete cert quest steps once UI exists; until then cert documents **intended** acceptance.
