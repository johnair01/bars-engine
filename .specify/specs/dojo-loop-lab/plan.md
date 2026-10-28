# Plan: Dojo Loop Lab

## Milestone 0 — Pure contracts

1. Create fixture data for the authored excitement / possibility / hope and wonder / poignance / hope wall.
2. Add an isolated `LoopLabState` reducer with reset, word-read, anchor-decision, action-stack, action-form, and edit events.
3. Extract a pure `resolveDojoActionGrammar` helper and register the four Career + gathering action forms.
4. Test that the triad and action resolver are stable for the same explicit inputs, and that proposed/declined anchors do nothing.

## Milestone 1 — Replayable Lab route

1. Add `/dojo/triangle-workshop/loop-lab` with only local client state.
2. Add a visible entry point from the dojo choice screen and a clean return path.
3. Render the authored player-language wall using shared-word triangle conventions.
4. Render two-axis reads and editable anchor decisions.
5. Render the EA overlay only from `deriveSupportedElementalTriads`.

## Milestone 2 — Action proof

1. Add the explicit action-stack controls.
2. Present the four phase cards, their player-controlled completion conditions, and editable next-step text.
3. Render the BAR preview as a serializable preview object only.
4. Add restart, phase-switch, and handoff-to-live-practice exits with no payload transfer.

## Milestone 3 — Verify before widening scope

1. Add pure unit tests for all four action forms and triad refusal cases.
2. Add a component/integration test that asserts the Lab imports no dojo server action and issues no writes.
3. Phone-test the complete happy path and all exit paths.
4. Run three facilitated playtests; collect comprehension notes, not emotional disclosures.

## Definition of done

The Lab proves one person can see a player-authored thought string, intentionally confirm EA anchors, receive stable canonical movement frames, select an action grammar appropriate to a bounded gathering initiative, and leave with a readable—but unpersisted—BAR preview. It produces no game-world side effects.
