# Plan: The lantern table, a brass machine you sit at to dissolve a real block

<!-- Architect and Regent sign this plan; the spec is ./spec.md and the stages are in six-faces-council council/pipeline.yaml. -->

primitives: the Between's kit (`public/calrunia/room-kit.js`, `public/between/`); proposed canon mechanic lantern-table; ontology Encounter, Transition, Artifact, Location lantern hall, Character; engine `src/lib/lantern/engine.ts` (#505)
footing: lh-intake-look-1 B, lh-table-look-1 note, lh-hand-basic, lh-hand-share, lh-block-victory, lh-block-size, lh-payout-sliders A, lh-first-block A, lh-hall-company A, lh-intake-order, lh-two-bodies
tier: Convened; the hand and block-cost rulings of 2026-11-02 and the Game frame of 2026-11-03
scout: rung 1, reuse: #505's engine, #513's route, intake, pg-store, model and migration, ad2 dir B's `scene.html` and the Between's kit; no new library
skills: design-ontology, intake_check, six-faces, primitives, scout, ccgs-roles, game_frame_check
skipped: better - his lh-hand and lh-table-look-1 notes already state the ask plainly, so nothing was left to deepen
skipped: brief-master - the callsheet's pipeline brief and handoff of 2026-11-03 already carry the build's shape

## Constitution check

<!-- One row per article of council/constitution.md. An exception names the board row that allows it. -->

| Article | Verdict | Why |
|---|---|---|
| 1 Questions go to the board | pass | Every point stands on a position or ruling (spec.md "Clarify"); nothing asked in chat |
| 2 The player comes first | pass | The callsheet's intake passes intake_check; the first 60 seconds start in the hall in the avatar's body |
| 3 Primitives and footing | pass | primitives, footing and tier lines above |
| 4 Ontology invariants | pass | The Game frame passes game_frame_check; a switched-off reservation is fogged, never deleted; no model call |
| 5 Cheapest proof first | pass | The three engine vitest cases and two stills run before the scene is built further |
| 6 Tool before build | pass | scout line above; #505, #513 and dir B's scene are reused, not redrawn |
| 7 Something to see | pass | Stills from the seat and from above, then the preview at `/lantern` on the look row |
| 8 Reserved items | pass | The payout sum stays his to steer at the look; no real money moves (spec.md "Reserved items") |
| 9 One session, one piece | pass | This thread ends at roles; the build is the next thread's one piece |
| 10 Transcend and include | pass | #513 is kept for its non-UI files and its card form is dropped with his note as the reason |

## Approach

The build starts at the engine, because the hand rulings change what a move costs and pays. `engine.ts` gains a
`basic` move (1 oil, strikes 1, kind ignored), a `buy` move (1 vibeulon, only at 0 oil), a `vibeulons` balance, a
weighted `share` ledger and `payoutShare()`, plus `payout()` from the three sliders. The three cases from `lh-hand` are
written as vitest before the code. Then #513's non-UI files are cherry-picked, and `src/app/lantern/page.tsx` is
pointed at a new three.js scene ported from ad2 dir B's `scene.html` rather than at `LanternIntake.tsx`.

## Files touched

| File | Change |
|---|---|
| src/lib/lantern/engine.ts | `basic`, `buy`, `vibeulons`, weighted `share`, `payoutShare()`, `payout()` |
| src/lib/lantern/__tests__/engine-hand.test.ts (new) | the three `lh-hand` cases and the slider draft |
| src/lib/lantern/intake.ts, `__tests__/intake.test.ts`, pg-store.ts | cherry-picked from f3eb129 |
| prisma/schema.prisma, prisma/migrations/20261102050000_add_lantern_tables/ | cherry-picked from f3eb129 |
| src/app/api/lantern/table/route.ts, src/app/lantern/page.tsx, vitest.config.ts | cherry-picked from f3eb129; page mounts the new scene |
| public/lantern/table/ (new) | the brass machine scene ported from dir B, the hall, stand-ins, sliders |
| scripts/seed-cert-lantern-table.ts (new), package.json | the verification quest |

## Verification Quest

`cert-lantern-table-v1`: a TwineStory with a CustomBar (`isSystem: true`, `visibility: 'public'`), seeded by
`npm run seed:cert:lantern-table`, with the six passages in spec.md.

## Order

1. Engine vitest first (the cheap test), then the engine.
2. Cherry-pick #513's non-UI files; migration checked as additive.
3. Stills from the seat and from above; stop if either shows a panel.
4. The scene: hall, sit, camera, the brass machine, sliders, stand-ins.
5. Impeccable critique; the verification quest seed; the preview and his look row.

## What Wendell does, and when

This plan has no [wendell] task. His part is his look at the preview on the board, where he also steers the payout sum.
