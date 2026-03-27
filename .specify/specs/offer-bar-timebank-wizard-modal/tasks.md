# Tasks: Offer BAR (timebank) + DSW modal

## Spec kit

- [x] `spec.md`, `plan.md`, `tasks.md`
- [x] Backlog row + cross-link from [donation-self-service-wizard](../donation-self-service-wizard/spec.md)

## Phase 1 — Metadata + server action

- [x] **T1** Define `OfferBarMetadata` + validator (protocol v1).
- [x] **T2** `createOfferBarFromDsw` — create `CustomBar` with `campaignRef`, metadata JSON, visibility defaults for later listing.
- [x] **T3** Tests: validation + `docQuest` round-trip (`npm run test:offer-bar`). DB happy-path covered by manual / future integration test.

## Phase 2 — Modal + wizard

- [x] **T4** `OfferBarModal` UI — fields per spec; **UI_COVENANT** + `cultivation-cards` / card tokens.
- [x] **T5** `DonationSelfServiceWizard` — **Time** / **Space** primary CTA opens modal; logged-out branches to login + `returnTo`.
- [x] **T6** Secondary link **“Advanced / full BAR forge”** → `/bars/create?ref=…` for power users.

## Phase 3 — Marketplace

- [x] **T7** Post-create: **Next steps** strip — marketplace + Hand links per `campaignRef`.
- [x] **T8** Optional: wire **stall list** when profile + slot available (follow [campaign-marketplace-slots](../campaign-marketplace-slots/spec.md)) — **deep link** `?attach=<barId>` to `/campaign/marketplace` so `MarketplaceAttachBarPanel` runs (empty-stall / unlock messaging on that page).

## Verification

- [ ] **V1** `npm run check` after each phase.
- [ ] **V2** Manual: wizard → modal → BAR created → metadata visible in Prisma Studio or admin.
