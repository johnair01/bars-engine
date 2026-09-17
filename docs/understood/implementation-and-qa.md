# Understood orientation: implementation and verification

## What is built

- `/mastering-allyship` has a compact link to the guided rehearsal.
- `/understood/demo` opens a 21-step Ari and Bea scenario on the real game board. Visitor taps advance the same move functions used in live play; the guide shows spoken bids, a paid question, a public heat signal, a face-down silent second feeling that is later revealed, hearing every layer of a stack, cooling, private resolution, turn handoff, and both readers reaching zero.
- `/understood/play` opens the two-person setup. The demo uses separate in-memory state and never overwrites a saved real session. Leaving the demo returns to the real setup or saved game.
- **Skip tutorial → Play** is available at every rehearsal step, including when a question or release dialog is open. The final step offers **Go to the game** or replay. Exiting loads `/understood/play`, which restores an existing real session or opens the setup screen.
- A stack cannot release any chip until every layer has been spoken and marked heard by its owner. The demo offers a **Not yet heard** choice before that happens.
- A private meter opens covered. The owner hands the device over, then presses and holds to see the value; releasing reseals it.

The Vite game is embedded as a static bundle in bars-engine, matching the existing `mtgoa-game` deployment pattern. `npm run build:understood` generates `public/understood-app`; the normal root build includes this step. The generated files are ignored by Git. For local Next development, build Understood once before starting the server.

## Verification so far

- `npm run build:understood`: passed, including the game's TypeScript check.
- `git diff --check`: passed.
- Next preview: `/understood/demo` and `/understood/play` returned HTML with the correct asset base; browser opened the demo directly into step 1 and showed the home page invitation.
- Guided rehearsal: one complete run through all 21 steps in the standalone build. Red remained in its stack when it was the only heard layer; blue was spoken and marked heard; release cooled heat from 1 to 0, then lowered each private meter from 1 to 0. Leaving the demo restored the prior real session. A 390px viewport was visually checked.
- `npm run validate:routes` exits successfully in permissive mode but reports two existing `EMOTIONALVECTOR` annotation errors in `src/app/practice/diagnose/page.tsx`; no new route annotations are involved in this integration.

## Remaining release evidence

The scripted orientation demonstrates legal transitions but is not evidence that two people can use the game in an unscripted conflict. Before a public claim that it works, run a two-person fictional conflict aloud and observe whether they can understand the chip, stack, heat, and handoff rules without coaching. Also test scarcity and timer-expiry paths on the integrated build, and smoke-test the routes on the deployment URL after publishing.

The current turn ruling is: a player may place one chip per turn and make at most one spoken bid. A silent placement and speaking a previously waiting chip may occur on the same turn. This should be confirmed in the next live playtest.
