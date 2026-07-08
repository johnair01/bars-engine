# UX Design Handoff: Intake-Facing Show Up Recommendations

## Decision

Yes, this deserves a Claude/design handoff before UI wiring.

The recommendation engine now has enough structure to produce candidate Show Up moves, but the product risk has moved to placement: where does the player provide the missing context without feeling like they are filling out an emotional algebra worksheet?

This handoff should be tight. It is not a full redesign of BARS, the Allyship Deck, or the Alchemy Engine. It should answer where primitive recommendations live, what the player is asked, and how the translated move is presented.

## Product Thesis

The recommendation surface should be contextual, not standalone.

Primitive recommendations are most valuable when they appear after a player has:

1. A present charge.
2. A desired charge or desired resolution.
3. A blocker or friction.
4. A card, domain, or play context that gives the move a direction.

The core loop is:

```text
draw or check in
-> name present charge
-> choose desired charge
-> identify blocker
-> infer emotional vector
-> select primitive
-> translate by superpower, domain, subject, and internal/external orientation
-> practice move
-> reflect on what actually happened
```

## Candidate Homes

### 1. Allyship Deck Draw / Card Detail

Best first home for the original game loop.

Why it fits:

- The player already draws an allyship card.
- The card can provide domain and symbolic direction.
- The player may naturally discover a blocker after seeing the card.
- The system can translate the same primitive differently depending on the drawn card.

Risk:

- The deck currently has card browsing/drawing affordances, but not a serious charge-to-move intake.
- We must avoid turning the deck into a dense diagnostic form.

Recommended role:

- Primary MVP candidate for player-facing move recommendations.
- Add a "Work this card" or "Find my move" panel after a draw.

### 2. Daily Charge / Check-In

Best repeatable practice home.

Why it fits:

- The player already expects one daily charge.
- The intake can be lightweight and habit-forming.
- It can teach the primitive loop through repetition.

Risk:

- It may lack card/domain context unless paired with a draw or a selected domain.
- It can become too generic if it only asks "how do you feel?"

Recommended role:

- Secondary MVP candidate or testing surface.
- Useful for "I have a charge and want a move" without requiring a full deck ritual.

### 3. Alchemy Engine Intake

Best existing structural match for a guided emotional process.

Why it fits:

- It already has intake/action/reflection phases.
- It already names dissatisfaction and moves toward action.
- It can host emotional vector resolution cleanly.

Risk:

- It may frame the recommendation as part of a larger quest arc instead of the quick pushup loop.
- Existing phase language may compete with the primitive-first model.

Recommended role:

- Strong implementation substrate.
- Do not make this the only UX if the desired behavior is daily practice.

### 4. BAR / Quest Creation

Best downstream artifact home, not the first recommendation surface.

Why it fits:

- Completed moves can become BARs, quests, proof, or practice history.
- It can capture the artifact created by the Show Up move.

Risk:

- If recommendation starts here, the player is pushed into creation before they know the vector.
- This can make Show Up feel like external production only.

Recommended role:

- Save, log, or convert the completed move after the practice.
- Not the first MVP intake surface.

### 5. Superpower / Onboarding

Best source of defaults.

Why it fits:

- Superpower is a translation lens.
- The system can use profile-level superpower as a default when translating a primitive.

Risk:

- Superpower is not the move itself.
- Asking the player to solve superpower/domain/vector all at once will overload the experience.

Recommended role:

- Provide defaults.
- Allow edits at recommendation time.
- Do not make onboarding the active move recommendation experience.

## Recommended MVP Surface

Build a compact "Move Recommendation Panel" that can be invoked from the Allyship Deck draw and later reused in Daily Charge.

The first version should show:

1. One primary recommended move.
2. Two alternate moves, collapsed or secondary.
3. The present-to-desired vector in simple language.
4. The primitive hidden or lightly named.
5. The translated move steps.
6. A completion/reflection prompt to catch drift after the fact.

Do not expose the full theory matrix by default.

## Minimum Intake

The panel needs these fields, ideally with defaults:

- Present charge: what is alive right now?
- Desired charge: what would resolution feel like?
- Blocker: what is making this hard?
- Orientation: within me or in the world?
- Subject: self, another person, group, or system?
- Superpower: default from profile, editable.
- Domain: default from card/context, editable.
- Card context: optional but preferred when launched from the deck.

The UI should not ask all of these as equal-weight fields. Use progressive disclosure:

1. Ask present charge.
2. Ask desired charge.
3. Ask blocker.
4. Offer "within me" vs "in the world."
5. Infer the rest from the card/profile, then let the player adjust.

## Output Shape

A recommendation should read like a practice move, not an explanation of the engine.

Suggested structure:

```text
Move: Restore the flow toward what matters.

Why this move:
Your charge is pointing from sadness toward joy, so the work is not to force cheerfulness. It is to close enough distance from what you care about that aliveness can return.

Do this:
1. Name the care.
2. Name the distance.
3. Choose one way to restore contact or movement.

Done when:
There is a concrete trace: a note, message, boundary, ritual, plan, ask, or repaired thread.

Afterward:
What changed in the charge?
```

## Design Constraints

- Show Up can be internal or external.
- Internal does not mean Clean Up.
- External does not automatically mean Show Up.
- Do not promise that the move prevents defended urgency or drift.
- Drift/fail cases should be captured in reflection after the move.
- Do not generate dissatisfaction-to-dissatisfaction translation as normal practice.
- Do not mix scenarios, superpowers, and domains into one muddled table.
- Do not invent new superpowers for examples; use the sourced set.
- Do not ask the player to understand primitives before practicing them.

## Claude Handoff Prompt

Use this prompt for a design handoff:

```text
We have an Emotional Alchemy recommendation engine that maps:

emotional vector -> Show Up primitive -> translated player move

The engine already exists. The design question is where and how this should appear in the player UX.

Candidate surfaces:
- Allyship Deck draw/card detail
- Daily Charge/check-in
- Alchemy Engine intake/action/reflection
- BAR/Quest creation
- Superpower/onboarding defaults

Design a low-friction MVP experience for an intake-facing "Move Recommendation Panel."

Goals:
- The player can draw a card or check in with a charge.
- The player names present charge, desired charge, blocker, and internal/external orientation.
- The system uses card/domain/profile context to recommend one primary Show Up move and two alternatives.
- The recommendation feels like a practice pushup, not theory exposition.
- The flow preserves that Show Up can be internal or external.
- Reflection catches drift after the move rather than pretending the recommendation can prevent all failure modes.

Please deliver:
1. Recommended first UX home and why.
2. A step-by-step wireflow.
3. Component inventory.
4. Field labels and microcopy.
5. Mobile layout notes.
6. Empty, ambiguous, and error states.
7. What should be MVP vs later.
8. What not to build.

Avoid:
- A standalone emotional algebra calculator as the main product surface.
- Mixing scenarios, superpowers, and domains into one table.
- Making every Show Up move external.
- Exposing the full primitive matrix to players by default.
- Inventing new superpowers.
```

## Implementation Notes

The panel can be powered by the existing primitive layer:

- `planPracticeRoutes(...)` resolves the emotional path.
- `recommendShowUpMovesForEdges(...)` turns route edges into translated Show Up recommendations.
- Card/domain/profile context should be passed into the recommendation context rather than encoded as separate move definitions.

The likely service boundary is:

```text
input: present state, desired state, blocker, orientation, subject, superpower, domain, card context
output: route summary, primary recommendation, alternate recommendations, reflection prompt
```

## Open Product Decision

Choose the first MVP host:

1. Allyship Deck first if we want to prove the intended card-driven game loop.
2. Daily Charge first if we want the fastest repeatable practice loop.
3. Alchemy Engine first if we want to reuse the strongest existing guided-process structure.

Recommendation: Allyship Deck first, with the panel designed as a reusable component that Daily Charge can invoke later.
