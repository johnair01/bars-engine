# Tasks: The lantern table, a brass machine you sit at to dissolve a real block

<!-- Every task is numbered (T001), names the requirement it serves (FR-001), and is tagged [claude] or [wendell]. -->

## Before the build

- [ ] T001 [claude] FR-004 FR-005 FR-006 FR-008 Write `engine-hand.test.ts`: a basic move strikes for 1 whatever its kind; a vibeulon buys a basic move only when oil is 0; a BAR refinement weighs 2 in the payout share and a basic refinement weighs 1.
- [ ] T002 [claude] FR-014 FR-015 Cherry-pick f3eb129's route, page, intake.ts and its test, pg-store.ts, `LanternTable`, migration `20261102050000_add_lantern_tables` and the vitest.config line; leave out `LanternIntake.tsx` and `lantern.css`; `npm run db:sync`.
- [ ] T003 [claude] FR-002 FR-013 Stills from the seat and from above of dir B's machine; stop if either shows a card, chip, tray or panel, or collars that read as buttons.

## Steps only Wendell can take

There are none: his look on the preview is on the board.

## Build

- [ ] T004 [claude] FR-004 FR-005 FR-006 FR-007 FR-008 Engine: `basic`, `buy`, `vibeulons`, weighted `share`, `payoutShare()`; T001 passes.
- [ ] T005 [claude] FR-009 Minor wins on finding and on dissolving a block; the round ends when every emerged block has dissolved.
- [ ] T006 [claude] FR-001 The hall, the sit, the 1.2 s camera rise with no cut, reduced motion.
- [ ] T007 [claude] FR-002 FR-003 The brass machine: goal plate, well ring, weighted lever, five toggles, pressed cells, three-notch collars; fog as fog.
- [ ] T008 [claude] FR-010 FR-011 The director application block as the first table, with the three sliders and `payout()`.
- [ ] T009 [claude] FR-012 Marked stand-ins at a few tables.
- [ ] T010 [claude] FR-013 The lantern over the board from the seat; collars checked from above.
- [ ] T011 [claude] FR-016 `scripts/seed-cert-lantern-table.ts` and `npm run seed:cert:lantern-table`.
- [ ] T012 [claude] FR-002 The Impeccable critique of the table; findings fixed.

preview: the bars-engine Vercel preview of the build branch at /lantern, put on the look row with board/look_preview.py
proof: the two stills from T003, then the preview

## Verify and ship

- [ ] T013 [claude] FR-015 GET and POST `/api/lantern/table` checked signed in and signed out.
- [ ] T014 [claude] FR-016 The verification quest played through once on the preview.
- [ ] T015 [claude] FR-001 `npm run check`, the lantern vitest and `npm run build` pass; the look row is posted.
