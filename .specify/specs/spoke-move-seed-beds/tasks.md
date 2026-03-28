# Tasks: Spoke move seed beds

## Spec kit

- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [x] Register in `.specify/backlog/BACKLOG.md` (row **SMB**) — run `npm run backlog:seed`
- [x] Cross-link from [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) (References)

## Phase 1 — Data & contracts

- [x] Decide **persistence**: `SpokeMoveBed` + `SpokeMoveBedKernel` tables vs `Instance` JSON — migration if tables
- [x] Define **anchor uniqueness**: `@@unique([campaignRef, spokeIndex, moveType])` + `@unique` on `anchorBarId`
- [x] Implement `getSpokeMoveBeds` + types (`BedSnapshot`)
- [x] Implement `plantKernelFromBar` (first-mover, `additional`, BAR ownership)
- [x] Implement **spoke BAR provenance** — `emitBarFromPassage` stamps `agentMetadata.spokePortal`; `isBarEligibleSpokeAnchor`
- [ ] **Spoke completion gate**: durable progress only after BAR emit (portal adventure) — deferred; see spec FR2 / CHS alignment
- [x] `adminReassignBedAnchor` + role check (admin + instance **owner/steward**)

## Phase 1 — UI

- [x] Nursery surface (four beds for one `spokeIndex`) — `/campaign/[ref]/spoke/[n]/seeds`
- [x] Plant flow: pick BAR → confirm → kernel created
- [x] Water: link to vault (`/hand`) + face progress summary on list
- [x] Copy pass: seed / bed / water (player-facing; “flagship” for anchor)

## Verification

- [x] `cert-spoke-move-seed-beds-v1` + seed script hook
- [x] `npm run check` && `npm run build` (plus `npx tsx src/lib/__tests__/spoke-move-beds.test.ts`)

## Phase 2 (defer)

- [ ] All 8 spokes from hub
- [ ] Deep links per bed
- [ ] Lineage / versioning (interpretation C)
