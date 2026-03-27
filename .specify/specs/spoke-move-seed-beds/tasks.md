# Tasks: Spoke move seed beds

## Spec kit

- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [x] Register in `.specify/backlog/BACKLOG.md` (row **SMB**) — run `npm run backlog:seed`
- [x] Cross-link from [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) (References)

## Phase 1 — Data & contracts

- [ ] Decide **persistence**: `SpokeMoveBed` + `SpokeMoveBedKernel` tables vs `Instance` JSON — migration if tables
- [ ] Define **anchor uniqueness**: unique partial index on `(campaignRef, spokeIndex, moveType)` where anchor set
- [ ] Implement `getSpokeMoveBeds` + types (`BedSnapshot`)
- [ ] Implement `plantKernelFromBar` (first-mover, `additional`, BAR ownership)
- [ ] Implement **spoke BAR provenance** query for anchor eligibility
- [ ] **Spoke completion gate**: durable progress only after BAR emit (portal adventure)
- [ ] `adminReassignBedAnchor` + role check (admin; stewards TBD)

## Phase 1 — UI

- [ ] Nursery surface (four beds for one `spokeIndex`)
- [ ] Plant flow: pick BAR → confirm → kernel created
- [ ] Water: link to existing watering UX or embed face progress
- [ ] Copy pass: seed / bed / water (avoid jargon)

## Verification

- [ ] `cert-spoke-move-seed-beds-v1` + seed script hook
- [ ] `npm run check` && `npm run build`

## Phase 2 (defer)

- [ ] All 8 spokes from hub
- [ ] Deep links per bed
- [ ] Lineage / versioning (interpretation C)
