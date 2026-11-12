# Plan: The shared charge engine

<!-- Architect and Regent. Spec: ./spec.md. Stages: council/pipeline.yaml. -->

primitives: mechanics (WAVE, sheng and ke, block return); ontology Charge, Block, Spirit, Rule; style the hollow as built
footing: cut50-charge-engine
tier: Footed; one shared charge module, starting with the hollow's WAVE; basis cut50-charge-engine A
scout: rung 1, reuse in repo: game.jsx's WAVE rules, cave.js breath, spirit-care.js module shape, move-table.json
skills: design-ontology, six-faces, intake_check, primitives, scout
skipped: better - no screen or copy is drawn in this spec; the slice-1 build runs it on the hollow's cards
skipped: brief-master - the brief is the callsheet's next brief, already written
skipped: art-direction - the engine draws nothing; the hollow's look is kept as built
skipped: concept - no new place or asset
skipped: asset_callsheet - no asset; the engine is code with no drawing
skipped: assets_here - no asset is made or changed

## Constitution check

| Article | Verdict | Why |
|---|---|---|
| 1 Questions go to the board | pass | No open question; two positions from the record (spec, Whose decision) |
| 2 The player comes first | pass | The body report in the player's words leads the design |
| 3 Primitives and footing | pass | Lines above |
| 4 Ontology invariants | pass | Channels and moves come from the one move table |
| 5 Cheapest proof first | pass | Parity test on the engine alone before any screen |
| 6 Tool before build | pass | Every rule is lifted from built code; nothing new is invented |
| 7 Something to see | pass | Slice 1 ends with stills of the hollow's WAVE as a look |
| 8 Reserved items | pass | None; nothing leaves the device |
| 9 One session, one piece | pass | This session writes the spec; slice 1 is the next session |
| 10 Transcend and include | pass | Old hollow saves keep loading; `feel` stays on the ember |

## Approach

Lift the first game's rules into a pure module, prove them with a parity test, then point the hollow at it. The engine
holds no screen and reads no clock, so the same file runs in a test, the hollow, the cave and the first game's build.

## Files touched

- new `public/calrunia/charge-engine.js`, new `public/calrunia/move-table.json` (copy)
- new `src/lib/quest-grammar/__tests__/charge-engine.test.ts` (parity test)
- `src/lib/quest-grammar/__tests__/move-table.test.ts` (one more copy checked)
- `public/calrunia/spirit-care.js` (re-export `WAVE_STEPS`; `feed()` reads `to`)
- `public/between/garden.js` (`checkinSheet`, `finishWave`), `public/between/block-room.js` (return hook)
- council: `council/callsheets/charge-engine.md`, and the move-table copy list in `tests/test_move_table.py`

## Order

1. Engine and parity test (the cheap test). Stop if parity fails on the routing table or the step order.
2. The hollow's check-in on the engine: reading, breath ring, block walk and return, exhale fork, ember.
3. Stills of the three moments; look on the board.
4. Phase 2 in its own session: cave.js, then the game.jsx build inline.

## What Wendell does, and when

After slice 1 is on the board as a look: run one charge in the first game and one in the hollow, and say which body
report came back fuller. That is the proof the spec names.
