# Smoke Test: Deck Work This Card

## Date

2026-07-01

## Result

Passed with environment caveats.

The full non-persistent Work This Card lifecycle was tested in browser through a temporary dev-only harness because `/deck` is entitlement-gated and this workspace is missing `DATABASE_URL`.

The harness was removed after testing.

## Environment Caveats

- `/deck` rendered the paywall because no authenticated entitled player was available.
- `DATABASE_URL` is missing, so DB-backed player/entitlement/deck-journal paths cannot be fully tested.
- `npx vercel link --yes --scope wendells-projects-9c1b16dc` is blocked by current Vercel config using top-level `buildCommand`, `outputDirectory`, and `framework` alongside `services`.

## Tested Path

Input:

- present charge: `restless`
- desired charge: `peace`
- blocker: `I am scattered and do not know where to aim it`
- orientation: `Within me`

Observed flow:

```text
Work this card
-> Start
-> present charge
-> desired charge
-> blocker
-> orientation
-> recommendation
-> choose
-> practice with trace
-> reflect
-> complete
```

## What Worked

- Modal opens from `Work this card`.
- Present charge input enables `Next`.
- Desired charge input enables `Next`.
- Blocker input enables `Next`.
- Orientation step works.
- Recommendation service resolves `restless` -> `peace` as `joy:dissatisfied -> neutrality:satisfied`.
- Recommendation displays successfully.
- Choose advances to practice state.
- Practice accepts a trace and advances to reflection.
- Reflect accepts reflection text and advances to reflected state.
- Complete advances to completed state.
- Completion copy correctly says the result is not persisted yet.

## Additional Matrix

Passed:

- `anxious` -> `excitement`, external orientation: recommended `Outer Bound The Ask`, advanced to practice, then to reflection.
- `heavy sadness` -> `poignance`, internal orientation: recommended `Inner Clean Exit`, advanced to practice, then to reflection.
- `Anger` -> `triumph`, internal orientation: recommended `Inner Interrupt Pattern`, and the skip path completed cleanly.
- unresolved `purple fog` -> `peace`: recommendation was blocked instead of inventing a move.

## Guided Two-Card Smoke

Date: 2026-07-02

Tested through the same temporary harness after the guided dissatisfaction intake and two-card recommendation model were added.

Inputs tested:

- `Blocked desire` -> `Peace`: displayed two cards; choosing the metabolize card advanced to practice.
- `Loss or distance` -> `Bliss`: displayed two cards; choosing the satisfaction card advanced to practice.
- `Restless possibility` -> `Triumph`: displayed two cards with sequencing guidance.
- `Numb or stuck` -> `Poignance`: displayed two cards with sequencing guidance.
- `Threat scan` -> `Excitement`: displayed two cards; `Skip both for now` advanced to skipped state.

What worked:

- Guided dissatisfaction options resolve into emotional vectors.
- Fixed satisfaction targets resolve the desired side of the vector.
- Optional blocker step can be bypassed.
- Recommendation screen displays `Two cards came forward.`
- Recommendation screen displays Card 1 as metabolize and Card 2 as satisfaction.
- Sequencing copy appears: start with Card 1 if defended; choose Card 2 if workable.
- Both `Choose metabolize card` and `Choose satisfaction card` advance to practice.
- `Skip both for now` advances to skipped state.

Smoke caveat:

- The automation needed stable test ids for shared controls such as `Next`, because the app shell/dev overlay made generic accessible-name targeting ambiguous.
- Browser navigation was intermittently slow because the workspace is still missing `DATABASE_URL`; the route rendered after DB warnings.

## Product Finding

The recommendation title is still too engine-facing:

```text
Inner Identify Signal
```

This is acceptable for a prototype, but player-facing copy should probably translate primitive labels into softer move titles before persistence or wider testing.

Unresolved charge recovery is too opaque. When an input like `purple fog` or the common-language alias `angry` cannot be resolved, the player remains on the orientation step with the error `What charge is alive right now?` instead of being guided back to the charge field or offered canonical charge choices.

The placeholder suggests common words like `heavy` and `angry`, but the current resolver expects more canonical phrases like `heavy sadness` and `Anger`. That mismatch will create false failures for real players.

## Follow-Up Candidates

- Add player-facing title/copy translation for primitive labels.
- Add canonical charge chips for unresolved state inputs.
- Add or intentionally reject common aliases such as `angry` and `heavy`; the UI should not suggest aliases the resolver will reject.
- Test the actual gated `/deck` route after env/entitlement is restored.
- Decide whether completed prototype output should offer "Send result to BARS."
