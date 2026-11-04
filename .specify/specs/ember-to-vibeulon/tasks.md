# Tasks: Ember to vibeulon

proof: the Verification Quest on the bars-engine preview at `/ontology-game/between?nook=1&skipHome=1`, and the stills look on the board before T008
preview: a one-click Vercel preview of the build PR, opened in the Nook

## Phase 0: falsify

- [x] T001 [claude] Write `scripts/ember-economy-replay.ts` and run it on a copy of the ledger; record the result in this folder (FR-001, FR-002, FR-003)

## Phase 1: the mint and the stake

- [x] T002 [claude] `src/lib/economy/bar-mint.ts`: mintBarVibulon, stakeBarVibulon, releaseBarStake, spendableBalance, with unit tests (FR-001, FR-002, FR-003)
- [x] T003 [claude] `create-bar.ts`: remove both `quest_creation_stake` burns; mint on make in both actions; stake on public; no private fallback for balance (FR-001, FR-002)
- [x] T004 [claude] Release the stake on take-back, compost and archive; switch every balance reader to spendable (FR-003)

## Phase 2: embers, qi and the lantern

- [ ] T005 [claude] Qi from kept embers: a pure `qiFromEmbers(count)` beside `sky-qi.js`, tests that glow never changes it and it never falls (FR-007)
- [ ] T006 [claude] Hollow light from both members' counts summed, with no shared row holding either count (FR-008)
- [ ] T007 [claude] Stills: the Nook before and after the first ember (the blank strips appear on the shelf, light steps up), the BAR written with the ember in that ember's ink, and the written BAR offered on a lantern in the Hollow; `assets_here.py` first; post the look on the board (FR-004, FR-005, FR-007, FR-008)
- [ ] T008 [claude] After his yes: the `/bar` route and the writing at the hearth in `garden.js`; write, offer, take back (FR-004, FR-005, FR-006)
- [ ] T009 [wendell] Walk the Verification Quest on the preview from the board look (FR-004, FR-005, FR-006, FR-007)
