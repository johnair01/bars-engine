# Tasks: The shared charge engine

## Before the build

- [ ] T001 [claude] FR-010 Write the parity test and the engine together; the scripted charge in spec.md (How we will
  know it failed) lands on sadness, state `neutral`, ember `{from: "metal", to: "water", by: "metal_water"}`.

## Steps only Wendell can take

- [ ] T002 [wendell] FR-009 **Do:** run one charge in the first game, then the same charge in the hollow.
  **Where:** the look row for slice 1 on https://bars-engine.vercel.app/board/council (links to both places).
  **Enter:** the same feeling, intensity and body line in both.
  **Check:** the look shows both body reports side by side; answer which is fuller.
  **Device:** computer · **Safe to stop after:** yes

## Build

- [ ] T003 [claude] FR-001 FR-002 `public/calrunia/charge-engine.js`: reading, `startCharge`, `breathOf`, constants.
- [ ] T004 [claude] FR-003 FR-006 `nextStep`, `stopAtRung`.
- [ ] T005 [claude] FR-004 `openBlock`, `returnFromBlock`, nesting.
- [ ] T006 [claude] FR-005 `exhale`, `scan`.
- [ ] T007 [claude] FR-007 `move`, `public/calrunia/move-table.json`, the extra copy check in `move-table.test.ts`
  and the council's `tests/test_move_table.py`.
- [ ] T008 [claude] FR-008 `emberOf`, `toRecord`; `spirit-care.js` re-exports `WAVE_STEPS`, `feed()` reads `to`.
- [ ] T009 [claude] FR-009 `garden.js` check-in on the engine; block walk return hook in `block-room.js`; old saves load.
- [ ] T010 [claude] `scripts/local/check.sh --build` passes.

proof: stills of the breath ring, the block return and the exhale fork, taken with `scripts/local/dev.sh shot`, in a
look row on the board.

## Later slices (own sessions)

- [ ] T015 [claude] FR-011 `cave.js` reads `BREATH` and the block stack from the engine.
- [ ] T016 [claude] FR-012 `build-ontology-game.mjs` inlines the engine; game.jsx drops its own copies.
- [ ] T017 [claude] FR-013 The gate, belief report and route map read the engine's `route`.

## Verify and ship

- [ ] T011 [claude] `python3 council/tools/contract_check.py` on this folder exits 0.
- [ ] T012 [claude] Definition of done in spec.md, checked.
- [ ] T013 [claude] Board positions `ce-block-opens-the-room` and `ce-exhale-stay-release` posted; they stand unless flipped.
- [ ] T014 [claude] Callsheet `charge-engine.md` status updated; this file ticked.
