# Plan

## Phase 1: Canonical Graph Split
- Add a pure graph layer under `src/lib/alchemy/` that defines canonical states, Wuxing channel moves, scene-resolution edges, and practice edges separately.
- Derive combination counts from the graph layer.
- Keep graph code independent of Prisma and server actions.

## Phase 2: Practice Route Planner
- Rename/shape the prototype as a practice route planner rather than a generic move planner.
- Add route modes:
  - `growth`: routes toward more regulated or more metabolizable targets without forcing satisfied completion.
  - `mastery`: supports controlled descent only through explicitly named safe practice edges.
- Add target-intent classification:
  - `satisfaction` for satisfied destinations.
  - `stabilization` for neutral destinations, where the emotion is doing its job.
  - `metabolizable_dissatisfaction` for intentionally workable dissatisfied destinations.
- Split `stabilize` from `transcend` with separate practice IDs, names, and prompts.
- Add route metadata: `routeType`, `whyThisRoute`, `risk`, `bestWhen`, `blockerPrompt`.
- Keep it independent of Prisma and server actions.

## Phase 3: Tests
- Add a standalone test file runnable with `npx tsx`.
- Verify counts and the canonical restlessness-to-peace route.
- Add all-pairs tests for both `growth` and `mastery`.
- Assert `stabilize` practice identities are not the same as transcend identities.
- Assert count reports are derived from graph definitions.
- Assert neutral targets can be terminal destinations.
- Assert dissatisfied targets carry metabolizable-dissatisfaction rationale.

## Phase 4: Future Integration
- Daily Check-in can call the planner after current/desired intake exists.
- Emotional First Aid can recommend immediate stabilization moves.
- BAR generation can convert each planned step into a quest/BAR.
- Move recommendation can combine the emotional vector with library-backed allyship axes:
  - superpower: Connector, Strategist, Disruptor, Escape Artist, Catalyst/Coach, Alchemist, Storyteller.
  - domain: Direct Action, Raising Awareness / Impact Storytelling, Skillful Organizing, Gathering Resources / Fundraising.
  - ensemble role: Spark, Anchor, Builder, Scout, Witness.
- Use `source-inventory.md` before generating example move tables, so scenarios, superpowers, domains, and roles are not mixed.
- Start recommendation-table generation from natural superpower-domain fits before expanding to all 28 possible superpower-domain combinations.
- Use `golden-scenarios-and-move-prototypes.md` as the first test bench:
  - same scenario + different superpower = different expression.
  - same vector + different domain = different output.
  - same card + different blocker = different move.
- Treat `hostile-review-golden-prototypes.md` as the historical first pass; it is superseded by the v2 review for remediation.
- Add `orientation` and `subject` before judging Show Up validity:
  - internal/self or internal/collective moves can be valid Show Up when they enact capacity as an inner artifact or commitment.
  - external/other or external/collective moves can be valid Show Up when they enact capacity through relational or campaign contact.
- Use `hostile-review-golden-prototypes-v2.md` as the current review authority.
- Use `move-primitives-and-translation.md` as the next architecture authority.
- Develop move primitives before translated cards:
  - primitive owns the emotional-alchemy mechanic.
  - orientation owns inner vs outer completion.
  - superpower owns style.
  - domain owns output type.
  - blocker owns friction and scale.
  - reflection owns drift detection after completion.
- Prove primitive translations before broadening the prototype set:
  - MP02 internal and external.
  - MP08 internal and external.
  - MP19 internal and external.
  - MP05 external.
  - MP12 external.
- Use `primitive-translation-proofs.md` as the proof that primitive-first generation can replace bespoke card authoring for the first MVP slice.
- Use `primitive-data-schema.md` and `src/lib/alchemy/show-up-primitives.ts` as the implementation schema for MVP primitives.
- Next implementation step: connect emotional vectors to primitive selection before translation.

## File Impact
- `src/lib/alchemy/move-planner.ts`: prototype pure planner; to be reshaped into graph + practice route modules.
- `src/lib/alchemy/__tests__/move-planner.test.ts`: new unit tests.
- `src/lib/alchemy/show-up-primitives.ts`: MVP primitive schema and definitions.
- `src/lib/alchemy/__tests__/show-up-primitives.test.ts`: primitive schema validation tests.
- `.specify/specs/emotional-alchemy-move-combinations/*`: implementation authority.
