# Tasks: The Friends' Fire, where you play the unfinished bar and a friend plays it home

<!-- Every task is numbered (T001), names the requirement it serves (FR-001), and is tagged [claude] or [wendell];
     [P] marks a task that can run beside the one before it. -->

## Before the build

- [x] T001 [claude] FR-003 FR-004 Run reel round 1 from plan.md (a Sonnet thread): engine, script, check and frames in the council's `council/callsheets/stills/2026-11-02-ctw-friends-fire-reel-1/`; `make/check.js` passes; the look row posted.
- [x] T002 [claude] FR-004 (rounds 1 and 2; his A on ctw-fire-reel-look-2, 2026-11-03 15:15Z) Record his score on the reel in `round-1.md`; stop and open round 2 if the hand-over moment is not gold.
- [x] T003 [claude] FR-006 Art direction: stills from the keep list (approach, seated framing, hand-over), with `existing:`, `proof:` and `skills:` lines; `assets_here.py --check` passes.

## Steps only Wendell can take

There are none: his reel score and his look on the preview are on the board.

## Build

- [x] T004 [claude] FR-004 `public/between/land/fire-song.js` ported from the reel's engine; `src/lib/between/__tests__/fire-song.test.ts` from its script.
- [x] T005 [claude] FR-001 FR-002 FR-003 FR-005 The crate card: "Open the toolbag and play", the five seals with the stump's notes lit, "Hand it to Oriel", the tag step and "Put it in Oriel's hand", "Just listen tonight", "Stand up".
- [x] T006 [claude] FR-004 Oriel's ending played from `ending()` at `tempo()`, one beat after the hand-over.
- [x] T007 [claude] FR-006 The seated camera framing, eased in, no cut.
- [x] T008 [claude] FR-007 FR-008 The tuning from the far bank, the home-note tuning, the ducked fire, the friends' silence, the 1.5 s silence before laughter; a CC0 laughter recording only with its source and licence, else the caption.
- [x] T009 [claude] FR-009 The last card: offer, key, the garage key secret, Oriel's drafted recording line, two buttons; no name asked.
- [x] T010 [claude] FR-011 `?at=crate` and `?song=` on preview hosts.
- [x] T011 [claude] FR-010 `scripts/seed-cert-ctw-friends-fire.ts` and `npm run seed:cert:ctw-friends-fire`.
- [x] T012 [claude] FR-008 The Impeccable critique of the crate and last cards; findings fixed.
- [ ] T013 [claude] FR-001 `npm run check`, the land tests and `npm run build` pass; the Vercel preview builds.

preview: the bars-engine Vercel preview of the build branch at /between/land.html?place=friends-fire&at=crate, put on the look row with board/look_preview.py
proof: the reel round's frames in council/callsheets/stills/2026-11-02-ctw-friends-fire-reel-1/frames/ for his first look

## Verify and ship

- [x] T014 [claude] FR-004 `python3 council/tools/contract_check.py` on this folder exits 0 (2026-11-02: holds through analyze).
- [ ] T015 [claude] FR-010 The verification quest played through once on the preview.
- [ ] T016 [claude] FR-009 Definition of done in spec.md checked; the look row supersedes `ctw-fire-look-1`.
- [ ] T017 [claude] FR-002 Ledger record written; this file ticked.
