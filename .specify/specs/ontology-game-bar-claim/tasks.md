# Tasks: Ontology game BAR claim

Build after Wendell answers look `bcn-card-look-1`. Sonnet. One PR. Each task names how it is checked.

- [x] **T1 Naming card.** `content/ontology-game/game.jsx`: `namedClaims` state (reset in `handleNewCycle` and Demo
  Mode), phase `phase5-name-claim` entered from `handlePhase5StateConfirm` when `state === "satisfied"` and no block is
  open; card per spec "The naming card" with the wording his look picks. Styles in `game.css`.
  *Check:* `content/ontology-game/browser-test.mjs` gains cases for FR-001 to FR-004 and FR-010.
- [x] **T2 OAG2 encoder and carry button.** `encodeClaimCode(summary, namedClaims)` beside `encodePortableCoachCode`;
  site-only button on `phase6-done`. *Check:* browser test reads the opened URL's fragment and decodes it.
- [x] **T3 Decoder.** `src/lib/ontology-game/claim-code.ts` with the stems' satisfied sentences and names copied as a
  frozen table. *Check:* vitest over fixed good and bad codes (each refusal reason once); OAG1 untouched.
- [x] **T4 Carry page and action.** `src/app/claim/page.tsx`, `src/actions/ontology-claim.ts`, writes per the spec's
  column table, idempotent. *Check:* vitest on the action with the local database; carrying twice writes once.
- [x] **T5 Measure.** `src/lib/ontology-game/claim-measure.ts` and an admin read under `src/app/admin/`. *Check:*
  vitest with fixed claims gives fixed rates.
- [x] **T6 Rebuild and look.** `node scripts/build-ontology-game.mjs`; `scripts/local/check.sh --build`; stills of the
  card, carry page and admin read to `/mnt/project-files/looks/ontology-game-bar-claim/`; mark ready and add `ship-next`.
