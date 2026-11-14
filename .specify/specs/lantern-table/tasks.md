# Tasks: The lantern table, a brass machine you sit at to dissolve a real block

<!-- Every task is numbered (T001), names the requirement it serves (FR-001), and is tagged [claude] or [wendell]. -->

## Before the build

- [x] T001 [claude] FR-004 FR-005 FR-006 FR-008 Write `engine-hand.test.ts`: a basic move strikes for 1 whatever its kind; a vibeulon buys a basic move only when oil is 0; a BAR refinement weighs 2 in the payout share and a basic refinement weighs 1.
- [x] T002 [claude] FR-014 FR-015 Cherry-pick f3eb129's route, page, intake.ts and its test, pg-store.ts, `LanternTable`, migration `20261102050000_add_lantern_tables` and the vitest.config line; leave out `LanternIntake.tsx` and `lantern.css`; `npm run db:sync`. (Done 2026-11-03: `npm run db:generate` only; no database here, so the migration is not applied.)
- [x] T003 [claude] FR-002 FR-013 Stills from the seat and from above of dir B's machine; stop if either shows a card, chip, tray or panel, or collars that read as buttons. (Done 2026-11-03 on the built scene: `scripts/lantern-table-stills.mjs`, project files `lantern-hall/brass-table-build/seat.png` and `top.png`.)

## Steps only Wendell can take

There are none: his look on the preview is on the board.

## Build

- [x] T004 [claude] FR-004 FR-005 FR-006 FR-007 FR-008 Engine: `basic`, `buy`, `vibeulons`, weighted `share`, `payoutShare()`; T001 passes.
- [x] T016 [claude] FR-017 Engine: the purchase cap of 4 a watch and the spendable BAR mint; vitest from `falsify-sim.ts` runs D, E and C.
- [x] T005 [claude] FR-009 Minor wins on finding and on dissolving a block; the round ends when every emerged block has dissolved.
- [x] T006 [claude] FR-001 The hall, the sit, the 1.2 s camera rise with no cut, reduced motion.
- [x] T007 [claude] FR-002 FR-003 The brass machine: goal plate, well ring, weighted lever, five toggles, pressed cells, three-notch collars; fog as fog.
- [x] T008 [claude] FR-010 FR-011 The director application block as the first table, with the three sliders and `payout()`.
- [x] T009 [claude] FR-012 Marked stand-ins at a few tables.
- [x] T010 [claude] FR-013 The lantern over the board from the seat; collars checked from above.
- [x] T011 [claude] FR-016 `scripts/seed-cert-lantern-table.ts` and `npm run seed:cert:lantern-table`.
- [x] T012 [claude] FR-002 The Impeccable critique of the table; findings fixed. (2026-11-03: critique applied by hand; no P0 or P1, three P2s recorded in council lantern-hall.md.)

preview: the bars-engine Vercel preview of the build branch at /lantern, put on the look row with board/look_preview.py
proof: the two stills from T003, then the preview

## Verify and ship

- [x] T013 [claude] FR-015 GET and POST `/api/lantern/table` checked signed in and signed out. (Done 2026-11-03 by unit test, `src/app/api/lantern/table/__tests__/route.test.ts`, with the sign-in and Prisma stood in for; not yet against a live database.)
- [x] T014 [claude] FR-016 The verification quest played through once on the preview. (2026-11-03: real taps and stills on the #548 preview; stamping the plate by a real tap not checked.)
- [ ] T015 [claude] FR-001 `npm run check`, the lantern vitest and `npm run build` pass; the look row is posted. (2026-11-03, partly: `npm run check` and the lantern vitest pass; `npm run build` compiles and type-checks, then stops prerendering /campaign/the-crossing/begin for want of DATABASE_URL, which this thread has none of. The look row is not posted.)
