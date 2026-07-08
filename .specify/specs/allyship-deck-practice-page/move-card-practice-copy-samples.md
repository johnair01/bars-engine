# Move Card Practice Copy Samples

Date: 2026-07-05

Purpose: hostile sample set for the copy contract. These are not final card copy. They are examples generated from the live recommendation service plus `composeDeckPracticeCopy(...)` to test whether the contract creates playable recommendations.

## Sample 1: Quick Ask

Input:

- Card: `OPEN-GR-CHALLENGER`
- Mode: quick
- Orientation: external
- Subject: other
- Blocker: "I need to ask for help without overexplaining."

Recommendation:

- Selected tool: Clean Line
- Top candidates: Clean Line, One True Next Move, Put It On The Board
- Vector: absent
- Satisfaction spirit: absent

Generated copy shape:

- Situation: The Ask You're Avoiding asks for Open Up through Challenger in Gather Resources.
- Why this tool: Clean Line produces a clean ask, boundary, offer, repair line, or internal line.
- Protocol intro: use this as a Show Up rep; create the output, then stop.
- Expected output: clean ask/boundary/offer/repair/internal line.
- Review flags: `missing_vector`, `external_show_up`

Rating: Green.

Why:

- This is the deck-only quick-action use case.
- It does not pretend to know the emotional vector.
- It produces a shareable or usable artifact.

Watch:

- UI copy should make clear that quick mode is a useful rep, not the full emotional route.

## Sample 2: Sadness to Poignance

Input:

- Card: `OPEN-GR-CHALLENGER`
- Mode: deep
- Orientation: internal
- Subject: self
- Vector: sadness:dissatisfied -> sadness:satisfied
- Blocker: "I feel the distance from what I care about."

Recommendation:

- Selected tool: Find the Felt Thread
- Top candidates: Find the Felt Thread, 321 Charge Dialogue, Make It Real
- Satisfaction spirit: poignance

Generated copy shape:

- Situation: The Ask You're Avoiding asks for Open Up through Challenger in Gather Resources.
- Why this tool: Find the Felt Thread produces a felt handle that fits the charge.
- Protocol intro: first Clean Up rep in the spirit of poignance.
- Expected output: felt handle.
- Review flags: none.

Rating: Green.

Why:

- This honors sadness as care/distance without forcing confrontation.
- The output has teeth: body location, somatic description, handle candidates, fit signal.
- It can hand off into 321, ritual, Clean Line, or another card after the felt handle appears.

Watch:

- The copy must not imply that felt-sense work alone closes the full allyship move. It closes this rep.

## Sample 3: Anger to Triumph

Input:

- Card: `SHOW-DA-CHALLENGER`
- Mode: deep
- Orientation: external
- Subject: collective
- Vector: anger:dissatisfied -> anger:satisfied
- Blocker: "I want to act, but the story is that nobody will listen unless I make it forceful."

Recommendation:

- Selected tool: Story Turnaround
- Top candidates: Story Turnaround, 321 Charge Dialogue, Clean Line
- Satisfaction spirit: triumph

Generated copy shape:

- Situation: Make the Move asks for Show Up through Challenger in Direct Action.
- Why this tool: Story Turnaround produces a blocker belief, its cost, and one testable replacement.
- Protocol intro: first Clean Up rep in the spirit of triumph.
- Expected output: belief reframe.
- Review flags: none.

Rating: Green.

Why:

- This prevents "Show Up" from becoming raw external motion.
- Anger is not suppressed; it is cleaned enough to produce a testable action.
- The card still has action pressure, but the tool metabolizes the defended story first.

Watch:

- Some players may expect a Direct Action card to immediately produce an external act. UI should say "first rep" clearly.

## Sample 4: Fear to Wonder

Input:

- Card: `CLEAN-RA-SAGE`
- Mode: deep
- Orientation: internal
- Subject: self
- Vector: fear:dissatisfied -> fear:satisfied
- Blocker: "I am treating the unknown as proof that the move is unsafe."

Recommendation:

- Selected tool: Story Turnaround
- Top candidates: Story Turnaround, 321 Charge Dialogue, Find the Felt Thread
- Satisfaction spirit: wonder

Generated copy shape:

- Situation: What the Truth Taught asks for Clean Up through Sage in Raise Awareness.
- Why this tool: Story Turnaround produces a blocker belief, its cost, and one testable replacement.
- Protocol intro: first Clean Up rep in the spirit of wonder.
- Expected output: belief reframe.
- Review flags: none.

Rating: Green.

Why:

- The tool matches fear that has become certainty about threat.
- The Sage/Clean/Raise Awareness card lens fits inquiry.
- The output is inspectable.

Watch:

- Fear should not always route to belief inquiry. Body/felt-sense blockers and projection/part blockers need to keep pulling Felt Thread or 321.

## Sample 5: Joy to Bliss

Input:

- Card: `CLEAN-RA-SAGE`
- Mode: deep
- Orientation: internal
- Subject: self
- Vector: joy:dissatisfied -> joy:satisfied
- Blocker: "The joy feels hard to trust."

Recommendation:

- Selected tool: Make It A Game
- Top candidates: Make It A Game, Make It Real, Happy Apples
- Satisfaction spirit: bliss

Generated copy shape:

- Situation: What the Truth Taught asks for Clean Up through Sage in Raise Awareness.
- Why this tool: Make It A Game produces a tiny playable challenge with a round, rule, win condition, and feedback signal.
- Protocol intro: first Clean Up rep in the spirit of bliss.
- Expected output: tiny game card with a next action, quest seed, internal commitment, and BAR-ready reflection.
- Review flags: none.

Rating: Green.

Why:

- The output is real and inspectable.
- The recommendation makes sense for joy that needs a playable participation round.
- The contract no longer depends on a next-tier tool.

Concern:

- The remaining gap is operation-aware protocol variation.
- Make It Real can still work as a supporting ritual/artifact candidate.

Likely remediation:

- Add operation-aware protocol modifiers so Make It A Game shifts under Sage, Challenger, Regent, Architect, Diplomat, and Shaman.

## Contract Bugs Found and Fixed

The sample pass exposed two issues:

1. Story Turnaround copy summarized the output as "next action" because output selection prioritized `next_action` over `belief_reframe`.
   - Fixed by prioritizing more specific tool outputs before generic action outputs.

2. Next-tier tool penalty could appear as the strongest reason.
   - Fixed by filtering next-tier penalty out of `whyThisTool` strongest-reason selection.

## Current Judgment

The copy contract is usable for small hostile sample generation.

It is not yet a mass-copy generator. The next copy-specific work should be:

1. Add operation-aware protocol modifiers.
2. Add satisfaction-spirit modifiers to step language.
3. Expand joy-native MVP tool coverage.
4. Generate another sample set after the practice page consumes the contract.
