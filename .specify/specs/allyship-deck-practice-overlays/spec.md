# Spec: Allyship Deck Practice Overlays

## Purpose

Update the Allyship Deck so cards visibly reflect Emotional Alchemy moves without rewriting the full 120-card deck copy prematurely.

The overlay layer sits between:

- stable card grammar: WAVE move, operation, domain, output BAR, title, questions
- live practice recommendation: emotional vector, blocker/story, mode, selected tool, copy contract

Core rule:

```text
Card canon stays stable.
Practice overlays make each card playable in context.
```

## Problem

The Allyship Deck cards currently function as allyship move prompts, but the emerging Emotional Alchemy system adds a deeper loop:

```text
present charge -> desired satisfaction -> route/vector -> card/tool practice -> inspectable output
```

The deck needs to reflect this loop, but mass-generating new card copy is premature because:

- the recommendation API is MVP-ready, not fully product-proven
- joy-native MVP coverage now exists through Make It A Game, but still needs product validation
- operation lenses influence ranking/reasons but do not yet modify protocols
- full move-card copy could outrun the actual mechanics
- stable card identity should not be overwritten by contextual practice copy

## Thesis

Each Allyship Deck card should gain a **practice overlay**:

```text
This card can become these kinds of Emotional Alchemy reps.
```

An overlay does not replace the card. It summarizes how the card tends to work when a player asks for help, goes deeper, names a blocker, or supplies an emotional vector.

## Scope

### In Scope

- Define a typed `CardPracticeOverlay` contract.
- Generate overlays deterministically from existing card metadata, tool affinity, recommendation, and practice copy services.
- Start with a 10-card pilot set.
- Include quick and deep practice examples per pilot card where useful.
- Include sample vectors and satisfaction spirits.
- Include preferred tools and expected outputs.
- Include review status and review flags.
- Add hostile tests so overlays do not become decorative copy.
- Add spec docs for how overlays should later surface in the deck UI.

### Out of Scope

- Rewriting all 120 card records.
- Replacing authored card titles, questions, flavor, or remediation.
- Creating AI-generated final prose for every card.
- Building the full practice page UI.
- Saving overlays to the database.
- Inferring hidden diagnosis, trauma state, safety state, or player motive.

## Overlay Contract

```ts
type CardPracticeOverlayStatus = 'pilot' | 'reviewed' | 'needs_tuning' | 'blocked'

type CardPracticeOverlay = {
  version: 'card-practice-overlay-v0'
  cardId: string
  cardTitle: string
  stableCardLens: {
    move: BasicMove
    operation: Operation
    domain: AllyshipDomain
    outputBar: OutputBar
  }
  defaultPracticeIntention: string
  preferredTools: Array<{
    toolId: EmotionalAlchemyToolId
    rating: ToolRating
    reasons: string[]
  }>
  sampleVectors: Array<{
    blockerShape: string
    present: AlchemyState
    desired: AlchemyState
    satisfactionSpirit: SatisfactionSpirit
    mode: 'deep'
    expectedFirstToolId: EmotionalAlchemyToolId
    topCandidateToolIds: EmotionalAlchemyToolId[]
  }>
  quickPracticeExample: DeckPracticeCopy | null
  deepPracticeExamples: DeckPracticeCopy[]
  outputPossibilities: ToolOutputKind[]
  reviewFlags: string[]
  reviewStatus: CardPracticeOverlayStatus
}
```

## Pilot Card Set

The pilot should cover:

- all five WAVE moves
- all four allyship domains
- all six operations where possible
- quick and deep modes
- known yellow areas: joy/bliss and next-tier tool reliance

Initial 10-card pilot:

| Card | Why |
|---|---|
| `WAKE-GR-SHAMAN` | cleanest Wake Up / noticing baseline |
| `WAKE-SO-ARCHITECT` | orientation and mapping pressure |
| `OPEN-GR-CHALLENGER` | known quick-action ask case |
| `OPEN-GR-DIPLOMAT` | care/asking/relationship bridge |
| `CLEAN-RA-SAGE` | inquiry and sample-set anchor |
| `CLEAN-DA-CHALLENGER` | truth/action edge |
| `GROW-SO-REGENT` | practice/stewardship capacity |
| `GROW-RA-SAGE` | integration and meaning growth |
| `SHOW-DA-CHALLENGER` | action pressure without raw motion |
| `SHOW-SO-ARCHITECT` | artifact/coordination output |

If a listed card is missing or generated-only in a way that weakens the sample, replace it with the nearest same move/domain/operation card and document the substitution.

## Overlay Generation Rules

### Stable Card Lens

Use the assembled `MoveCard` fields:

- `card.id`
- `card.title`
- `card.move`
- `card.operation`
- `card.domain`
- `card.outputBar`

Do not modify the card.

### Default Practice Intention

Generate a short line from card metadata:

```text
Practice {Move} through {Operation} in {Domain} by producing a {OutputBar}-shaped artifact.
```

This line is not final public copy. It is an inspectable summary for review and UI iteration.

### Preferred Tools

Use `getDeckCardToolAffinities(card)`.

Rules:

- include top 3 by default
- include reasons
- do not use player vector here
- do not claim these are always the right tools

### Sample Vectors

Each overlay should include at least one deep-mode sample vector. Wake Up and Clean Up overlays must include diagnostic blocker-shape samples, not only emotional-channel samples.

Default vector selection:

- Wake Up: use fear -> wonder or neutrality -> peace
- Open Up: use sadness -> poignance
- Clean Up: use anger -> triumph or fear -> wonder
- Grow Up: use neutrality -> peace or sadness -> poignance
- Show Up: use anger -> triumph

Add joy -> bliss samples only when the card/tool pairing is intentionally under review, because joy-native MVP coverage is still yellow.

Diagnostic blocker shapes:

| Shape | Purpose |
|---|---|
| `body_unclear_signal` | Tests Felt Thread / body-signal handling. |
| `field_confusion` | Tests Put It On The Board / field mapping. |
| `belief_story` | Tests Story Turnaround. |
| `part_projection` | Tests 321 Charge Dialogue. |
| `capture_artifact` | Tests BAR Capture / reflective artifact handling. |
| `care_distance` | Tests sadness as care plus distance. |
| `commitment_practice` | Tests Grow Up capacity commitments. |
| `action_pressure` | Tests Show Up under defended urgency. |
| `joy_trust` | Tests joy/bliss next-tier coverage. |

Review should inspect both selected first tool and top candidate tools. This prevents a thin sample set from making existing moves look absent.

### Quick Practice Example

Generate only when the card can plausibly produce a quick action/commitment artifact.

Quick practice should:

- use mode `quick`
- omit vector unless explicitly supplied
- include a practical blocker prompt
- produce a `DeckPracticeCopy`
- honestly flag `missing_vector`

### Deep Practice Examples

Generate with:

- mode `deep`
- explicit present and desired states
- blocker/story text
- recommendation from `recommendDeckCardPractice(...)`
- copy from `composeDeckPracticeCopy(...)`

### Review Flags

Overlay-level flags should aggregate:

- copy review flags
- next-tier tool usage
- missing vector
- missing blocker context
- same-tool collapse across deep examples
- no quick example
- joy/bliss sample
- operation only changes reasons, not protocol

## User Stories

### P1: Designer Reviews Card Practice Potential

As a designer, I want to see how a card becomes a practice rep, so I can update the deck toward real moves without rewriting the whole card.

Acceptance:

- Given a pilot card id, the overlay shows card lens, preferred tools, sample vectors, example practice copy, outputs, and review flags.
- The overlay distinguishes stable card identity from contextual practice copy.

### P2: Deck UI Shows "This Card Can Become..."

As a player, I want the card to show what kind of practice it can become, so I understand what the deck is asking me to do.

Acceptance:

- The UI can read overlay data and show a short practice intention.
- The UI can show likely outputs such as clean line, felt handle, map, belief reframe, or action.
- The UI does not show internal review flags to players unless explicitly in a designer/admin view.

### P3: Hostile Review Prevents Decorative Overlays

As a steward, I want overlays tested against real recommendations, so the deck does not become prettier but still inert.

Acceptance:

- Pilot overlays must include sample generated copy.
- Every sample copy must include executable steps and inspectable outputs.
- Yellow cases are flagged instead of hidden.

### P4: Expansion to All 120 Cards

As a future implementer, I want a proven pilot path before scaling to the full deck.

Acceptance:

- All 10 pilot overlays pass structural tests.
- At least one hostile review doc captures green/yellow/red findings.
- Expansion is blocked until pilot findings are resolved or explicitly accepted.

## Acceptance Criteria

- A typed overlay registry exists for the 10-card pilot.
- Overlay generation uses existing deterministic services.
- Each pilot overlay includes at least one deep practice example.
- At least four pilot overlays include quick practice examples.
- Each overlay has preferred tools from card-only affinity.
- Each overlay has output possibilities.
- Review flags are generated.
- Tests verify pilot coverage across WAVE moves, domains, and operations.
- Tests verify every generated practice example has steps, expected outputs, and completion criteria.
- Tests verify stable card fields are not mutated.

## Six Game Master Quality Bar

- Shaman: Does the overlay reveal the felt charge this card can metabolize?
- Regent: Does the overlay protect card canon from contextual copy?
- Challenger: Can the sample practice be done and inspected in under 10 minutes?
- Architect: Is the overlay typed and deterministic?
- Diplomat: Can this be explained to players without system jargon?
- Sage: Does this bridge deck, recommendation service, tool registry, and copy contract without merging them into one blob?
