# Tasks: Campaign Ontology Alignment

## Phase 1 — Semantic clarification

- [x] Add glossary (Instance, Campaign, Subcampaign, CampaignSlot, hub/spoke/node) — [`docs/architecture/campaign-ontology-glossary.md`](../../../docs/architecture/campaign-ontology-glossary.md)
- [x] Architecture note: Bruised Banana canonical example + diagram — [`docs/architecture/campaign-ontology-architecture-note.md`](../../../docs/architecture/campaign-ontology-architecture-note.md)
- [x] Audit: enumerate `campaignRef` read/write sites — regen index via `npm run campaignref:inventory`; taxonomy in [.specify/specs/campaignref-inventory-audit/](../campaignref-inventory-audit/) ([issue #40](https://github.com/johnair01/bars-engine/issues/40))
- [x] Publish migration map: subsystems + tier-1 modules in [`docs/CAMPAIGNREF_INVENTORY.md`](../../../docs/CAMPAIGNREF_INVENTORY.md) (refine per-surface as code changes)

## Phase 2 — Campaign hierarchy

- [x] Prisma: `parentCampaignId`, `parentCampaign`, `childCampaigns` on `Campaign` — migration `20260510120000_campaign_parent_hierarchy`
- [x] Commit migration SQL with schema; apply with `npx tsx scripts/with-env.ts "npx prisma migrate deploy"` (local/CI)
- [x] `npm run db:record-schema-hash` after schema change
- [x] Server helpers: [`src/lib/campaign-hierarchy.ts`](../../../src/lib/campaign-hierarchy.ts) (validate parent, depth, cycles); [`createCampaign` / `updateCampaign` / `listChildCampaignsForParent`](../../../src/actions/campaign-crud.ts); `getCampaign` includes parent + children
- [ ] Optional: admin UI to pick parent; bulk ancestry query API if needed beyond `getCampaign`

## Phase 3 — Stewardship

- [ ] Decide: `stewardConfig` JSON vs `CampaignMembership` / roles relation
- [ ] Implement chosen model; admin visibility for stewards per campaign

## Phase 4 — Progression re-anchor

- [ ] Audit models: deck, portal, spoke session, milestones, contributions
- [ ] Add `campaignId` or resolution path per audit; migrate data

## Phase 5 — CampaignSlot clarity

- [ ] Doc pass: ensure UI/docs distinguish slot tree vs initiative tree

## Phase 6 — Provenance

- [ ] Tree-aware lineage on BARs/quests/artifacts; queries + user-visible surfaces where appropriate
