# Plan: The visitor's nook, where the Between walk begins

<!-- Architect and Regent sign this plan; the spec is ./spec.md and the stages are in six-faces-council council/pipeline.yaml. -->

primitives: style the approved nook (as built; ctw-nook-look-1 and 2 A) and the approved lands (ctw-walk-demo-look-1 frames); mechanics the map stand's intake (ctw-in-the-nook); ontology Location homeroom, episode sheet
footing: ctw-in-the-nook, ctw-pilot, ctw-walk-demo-look-1 B, wn1-visitor-nook-first, wn1-their-charge, wn1-back-to-the-nook
tier: Convened; the walk's first stop; basis pass walk-nook-1 and his B on ctw-walk-demo-look-1
scout: rung 1, our own code: garden.js's store-down path and the stand-in room's skip, charge-world.js's unroll, land.js's goHome; nothing to fetch
skills: design-ontology, intake_check, six-faces, primitives, scout, ccgs-roles, impeccable, assets_here
skipped: better - his B named the change exactly; nothing plain was left to deepen
skipped: brief-master - the callsheet brief "the visitor's nook" is written by this thread
skipped: satisfaction-reel - the nook and its stand are built and approved; the change adds no mechanic

## Constitution check

<!-- One row per article of council/constitution.md. An exception names the board row that allows it. -->

| Article | Verdict | Why |
|---|---|---|
| 1 Questions go to the board | pass | One question ran the reach test and stands as wn1-their-charge; nothing asked in chat |
| 2 The player comes first | pass | The first 60 seconds are the visitor's: wake, walk to the stand, unroll, step through |
| 3 Primitives and footing | pass | primitives, footing and tier lines above |
| 4 Ontology invariants | pass | No score, no name, nothing kept; every move a press |
| 5 Cheapest proof first | pass | The spec's cheap test (one local frame, no store call) runs before frames for his look |
| 6 Tool before build | pass | scout line above; every part is the nook as built |
| 7 Something to see | pass | Frames from the served page on the look row |
| 8 Reserved items | pass | None in this feature |
| 9 One session, one piece | pass | One thread builds the nook and posts its look |
| 10 Transcend and include | pass | #602 is carried whole; only its door and its way back change |

## Approach

The visitor's nook is the signed-in nook with its store skipped, the way the stand-in room skips it, chosen by its path.
A separate page was weighed and set aside: it would copy the nook's 4,000 lines or drift from them. The stand learns one
more card for a charge that was left there, and the walk's doors point home to the nook.

## Files touched

| File | Change |
|---|---|
| src/app/between/walk/route.ts (new) | serves the Between page with no sign-in |
| next.config.ts | #602's `/between/walk` redirect removed |
| public/between/garden.js | `VISIT` by path: no store, the visitor's namecard and hint, `visit` on `window.__between`, passed to the stand |
| public/between/charge-world.js | `opts.visit`: the left charge's card, "Unroll their map", no "Change the charge", the doorway into the walk |
| public/between/land/land.js | `WALK_NOOK`: the arch, "Start over" and the last card lead to the nook |

## Verification Quest

None seeded: the walk needs no account and keeps nothing (spec.md, "Verification quest"). The look's frames and his walk
on the hosted link stand in for it.

## Order

1. The cheap test from the spec: `/between/walk` with no cookie, one frame.
2. The stand's card and the doorway; then the walk's way back.
3. The Impeccable read of the new card lines.
4. `scripts/local/check.sh --build`, frames from the served page, the look row.

## What Wendell does, and when

No [wendell] task. His part is the look on the board, after step 4.
