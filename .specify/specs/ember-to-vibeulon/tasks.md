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

## Phase 3: the mint's face

- [x] T010 [claude] Stills of the coin turn from round 2's renderer, look `ee2-vibeulon-choose-look-1` posted (FR-010, FR-011, FR-012)
- [x] T011 [claude] `coin-face.ts`: `coinFace(move, seal, style)` for all fifteen moves, transcend moves twice one element, no ember gives the blank; unit tests (FR-009)
- [x] T012 [claude] Migration `Vibulon.face Json?`; `mintBarVibulon` writes the face in its transaction; the coin style in the pouch (FR-009, FR-011) (the mint writes the face; the `/bar` route that answers `face` and `choose` waits T008)
- [x] T013 [claude] `PUT .../coin`: finish a bare coin once, change the style for the next; refuse a set face (FR-010, FR-012, FR-013)
- [~] T014 [claude] After his yes on the look: `public/between/coin.js` and the coin turn at the hearth in `garden.js` (FR-010, FR-011, FR-012)
- [ ] T015 [wendell] Walk the Phase 3 Verification Quest from the board look (FR-009 to FR-013)
