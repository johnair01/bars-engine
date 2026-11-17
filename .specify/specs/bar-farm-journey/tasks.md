# Tasks: One BAR, one farm journey

**Input:** [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md). Each task is an independently reviewable piece; no open PR is assumed shipped.

## Proof before build

- [x] T001 [claude] FR-001 FR-003 Trace #732/#823/#802 source and record seed IDs, storage keys, write owners, and overlapping files in `research.md` (2026-11-17). Remaining source details can be added during implementation.
- [ ] T002 [claude] FR-008 Run local-first BAR → farm walkthrough on a temporary integration stack; record first failing transition and persisted objects.

## P1 — BAR reaches a plot

- [ ] T003 [claude] FR-001 FR-002 Join `sendToFarm` to exactly one sealed parcel with `captureId = barId`, atomically with its work seed; preserve agent parcels and reconcile already-sent BARs.
- [ ] T004 [claude] FR-003 Reconcile Seeds panel and parcel/satchel states in `src/app/api/between/farm/route.ts` and `public/between/farm/farm.js`.
- [ ] T005 [claude] FR-004 Verify ownership, idempotency, and concurrent take/plant using route and transition tests; preserve non-BAR parcels.
- [ ] T006 [claude] FR-008 Complete the local end-to-end walkthrough and record BAR ID, visible states, and refusals in `walkthrough.md`.

## P2 — Five moves

- [ ] T007 [claude] FR-005 Integrate the existing `farm-seed-item` pickup/open/stone tasks without altering its ruled order.
- [ ] T008 [claude] FR-005 Verify invalid order and optional block cases; capture what the player sees at each stage.

## P3 — Crop and consequence

- [ ] T009 [claude] FR-006 Carry optional crop family/form from the seed into live farm planting and harvest; keep plain seeds valid.
- [ ] T010 [claude] FR-007 Keep real-act records separate; verify harvest does not write one without a distinct evidenced action.
- [ ] T011 [claude] FR-009 Capture and review parcel, satchel, plot, and next-action states at phone width; send any unresolved look to the Board.

## Release gate

- [ ] T012 [claude] FR-001 FR-009 Run `scripts/local/check.sh --build`, local-first browser walkthrough, and phone look against the final integration stack. Link the proof in the PR before marking it ready.

proof: `walkthrough.md` will contain the local states and IDs; Board stills or a preview link will carry the visual proof.

## Signed

No Council stage is represented as signed yet.
