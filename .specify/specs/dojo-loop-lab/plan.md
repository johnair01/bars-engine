# Plan: Dojo Loop Lab

## Milestone 0 — Pure contracts

1. Create fixture data for the authored excitement / possibility / hope and wonder / poignance / hope wall.
2. Add an isolated `LoopLabState` reducer with reset, word-read, anchor-decision, action-stack, action-form, and edit events.
3. Extract a pure `resolveDojoActionGrammar` helper and register the four Career + gathering action forms.
4. Test that the triad and action resolver are stable for the same explicit inputs, and that proposed/declined anchors do nothing.

## Milestone 1 — Replayable Lab route

1. Add `/dojo/triangle-workshop/loop-lab` with only local client state.
2. Add a visible entry point from the dojo choice screen and a clean return path.
3. Establish the practice-bay scene contract: constellation wall, floor triangle, anchor table, action loom, and Nook-return threshold.
4. Integrate a first vertical wall asset, floor projection treatment, and action-table treatment; greybox quality is acceptable, detached dashboard presentation is not.
5. Render the authored player-language wall using shared-word triangle conventions.
6. Render two-axis reads and editable anchor decisions at the anchor table.
7. Render the EA overlay only from `deriveSupportedElementalTriads`.

## Milestone 2 — Action proof

1. Add the explicit action-stack controls.
2. Present the four phase cards, their player-controlled completion conditions, and editable next-step text.
3. Render the BAR preview as a serializable preview object only.
4. Add restart, phase-switch, and handoff-to-live-practice exits with no payload transfer.

## Milestone 3 — Verify before widening scope

1. Add pure unit tests for all four action forms and triad refusal cases.
2. Add a component/integration test that asserts the Lab imports no dojo server action and issues no writes.
3. Phone-test the complete happy path and all exit paths.
4. Verify that the complete loop is spatially legible as wall → floor → table → threshold, including a non-3D accessible path.
5. Run three facilitated playtests; collect comprehension notes, not emotional disclosures.

## Definition of done

The Lab proves one person can see a player-authored thought string, intentionally confirm EA anchors, receive stable canonical movement frames, select an action grammar appropriate to a bounded gathering initiative, and leave with a readable—but unpersisted—BAR preview. It produces no game-world side effects.

## Walkable first slice — player and wall

Build on the early 3D arrival: a visible player enters, walks by tapping a floor target or using a keyboard, and can approach the wall using a clearly labelled equivalent action. Keep the camera and player visible at phone size, constrain movement within the room and around the central furniture, and stop movement when a practice choice is presented. On arrival the player deliberately projects the authored triangle; restart restores the starting state. Keep the demonstration local and non-persistent. Verify the rendered phone-sized scene, touch and keyboard movement, approach, projection, restart, and no unintended writes. This slice does not claim the anchor table or action loom is complete.

## Wall screen and uninterrupted projection

Place a framed constellation screen high on the dojo wall, with a full-screen phone-readable view. At the wall, open the view, select either authored example triangle, and project it onto the floor; the shared hope edge remains player language. Closing the view preserves the character's position. Projection must not trap the player: allow continued movement, reopening the wall, and restart. Show that later stations are unfinished rather than implying a frozen workflow. Keep choices accessible through labelled buttons and all sample state local.
