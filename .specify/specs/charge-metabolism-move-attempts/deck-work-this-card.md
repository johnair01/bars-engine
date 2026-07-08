# UX Contract: Allyship Deck "Work This Card"

## Purpose

Define the first player-facing host for charge-metabolism move recommendations.

The Allyship Deck is the MVP host because it matches the intended game loop:

```text
draw card
-> encounter blocker
-> unpack emotional vector
-> receive aligned Show Up move
-> practice/reflection creates metabolized charge
```

This is a service-first, non-persistent prototype. It should use the recommendation service and lifecycle helpers, but it should not add a database `MoveAttempt` model yet.

## Product Position

"Send to BARS" and "Work this card" are different actions.

| Action | Meaning |
|---|---|
| Send to BARS | Turn the card into a private BAR/quest seed |
| Work this card | Use the card to metabolize a present charge into a recommended move |

Do not replace Send to BARS. Add Work this card beside it.

## Entry Points

### 1. Daily Single Draw

Location:

- `src/components/deck/AllyshipDeckReader.tsx`
- drawn card footer

Current footer:

- `SendToBarsButton`

Add:

- primary or sibling CTA: `Work this card`

Recommended footer order:

1. `Work this card`
2. `Send to BARS`

Reason:

- The deck ritual should first help the player practice the card.
- Sending to BARS is still available when they want a longer artifact/quest.

### 2. Card Detail Overlay

Location:

- selected card modal in `AllyshipDeckReader`

Add the same footer affordance:

- `Work this card`
- `Send to BARS`

Reason:

- Browsed and collection cards can still become practice moves.

### 3. Find Your Path Result

Location:

- `src/components/deck/FindYourPath.tsx`
- result phase, "The Move" card

Add:

- `Work this move`

Reason:

- Find Your Path already captures a rough situation reading.
- It should be able to hand the chosen "Move" card into the same Work This Card panel.

## Component Contract

Create a reusable client component:

```text
DeckWorkThisCardPanel
```

Suggested props:

```ts
type DeckWorkThisCardPanelProps = {
  card: MoveCard
  subject: CardSubject
  playerSuperpower?: Superpower | null
  onClose: () => void
}
```

MVP can default superpower to `coach` if profile context is unavailable.

## Flow

### State Machine

```text
intro
-> dissatisfaction
-> channel_confirm
-> desired
-> blocker
-> orientation
-> recommendations
-> chosen_metabolize | chosen_satisfaction
-> practiced
-> reflected
-> completed

recommendations -> skipped
chosen -> abandoned
practiced -> needs_followup
needs_followup -> practiced
```

This mirrors the service lifecycle helpers:

- `recommendChargeMetabolismMove`
- `chooseMoveAttempt`
- `skipMoveAttempt`
- `practiceMoveAttempt`
- `reflectMoveAttempt`
- `completeMoveAttempt`
- `abandonMoveAttempt`
- `markMoveAttemptNeedsFollowup`

## Intake Steps

### Step 0: Intro

Goal:

- Establish that the card will be used as a practice lens.

Copy:

```text
Work this card

Use this card to turn a live charge into one concrete move.
```

CTA:

```text
Start
```

### Step 1: Felt Dissatisfaction

Question:

```text
What kind of stuckness is here?
```

Input type:

- Fixed option buttons.
- Each option maps to a canonical channel + dissatisfied altitude.

Example options:

```text
blocked desire / resentment -> anger:dissatisfied
loss / distance / heaviness -> sadness:dissatisfied
worry / dread / threat scan -> fear:dissatisfied
restlessness / comparison / too much possibility -> joy:dissatisfied
numbness / boredom / stagnation -> neutrality:dissatisfied
```

Service field:

- `present`

If uncertain:

- Ask the player to choose the closest felt pattern.
- Do not require typed emotional vocabulary.

### Step 2: Channel Confirmation

Question:

```text
This looks like the Anger channel. Is that close?
```

Purpose:

- Teach the neutral job of the emotion.
- The dissatisfied state is what the player recognizes.
- The neutral state is the emotion doing its job.

Example copy:

```text
Anger is desire, boundary, agency, and directed force.
The clean version is not attack. It is usable Anger.
```

Actions:

```text
Yes, keep going
Choose another pattern
```

### Step 3: Desired Satisfaction

Question:

```text
What satisfaction are you moving toward?
```

Input type:

- Fixed option buttons across the five satisfaction states.

Service field:

- `desired`

Important:

- Desired state resolves the emotional vector together with the selected dissatisfaction.
- The target must be selected from fixed satisfaction states.
- The system can infer what mood/charge is necessary from the chosen satisfaction target.

Suggested options:

```text
Excitement -> fear:satisfied
Poignance -> sadness:satisfied
Bliss -> joy:satisfied
Triumph -> anger:satisfied
Peace -> neutrality:satisfied
```

### Step 4: Optional Blocker Context

Question:

```text
Where does the work need attention?
```

Input type:

- Optional fixed options plus optional detail.

Service field:

- `blocker`

Important:

- The vector is already resolved by dissatisfaction + satisfaction.
- The blocker points to where the work needs to happen.
- The blocker should modify existing card moves instead of becoming a separate move family.

Blocker kinds:

```text
self-sabotage belief
allyship-domain need
no clear blocker yet
```

Self-sabotage belief examples should reuse the existing unpacking/shadow voice options:

```text
I'm not ready
I'm not worthy
I'm not capable
I'm insignificant
I don't belong
I'm not good enough
```

Allyship-domain needs:

```text
Gather Resources
Skillful Organizing
Direct Action
Raise Awareness
```

If the player selects an allyship-domain need, that domain should guide the move translation because it identifies where the work needs to be done.

### Step 5: Orientation

Question:

```text
Where does the move need to happen first?
```

Choices:

```text
Within me
In the world
```

Mapping:

- Within me -> `orientation: internal`, `subject: self`
- In the world -> `orientation: external`, `subject` from deck subject toggle:
  - subject `self` -> `other`
  - subject `campaign` -> `collective`

## Card-Derived Context

Use the card to populate recommendation context:

| Recommendation Input | Source |
|---|---|
| `domain` | `card.domain` |
| `cardContext.deckCardId` | `card.id` |
| `cardContext.cardFamily` | `card.move` |
| `cardContext.operation` | `card.operation` |
| `superpower` | player profile if available; default `coach` |
| `mode` | default `growth` |

The card's own move (`wake_up`, `open_up`, `clean_up`, `grow_up`, `show_up`) is context, not the primitive.

## Recommendation Display

Show two recommended cards for beginner dissatisfaction-to-satisfaction intake.

### Card 1: Metabolize Current Dissatisfaction

Purpose:

```text
Work the charge you actually have.
```

This card should be based on the immediate metabolizing edge in the route, usually the first edge from dissatisfied toward a cleaner or more workable state.

### Card 2: Move Toward Desired Satisfaction

Purpose:

```text
Work the satisfaction you chose.
```

This card should be based on the satisfaction-facing edge in the route, usually the final edge or the edge most directly connected to the desired satisfied state.

### Recommendation Fields

Each recommended card should include:

- title
- why this move
- instruction
- completion condition
- reflection prompt
- role: metabolize or satisfaction

Suggested UI copy:

```text
Two cards came forward.
```

Vector summary:

```text
From {present} toward {desired}
```

Reason:

Use route and primitive language lightly:

```text
The first card works the charge you have. The second card works the satisfaction you chose.
```

Do not expose:

- full graph
- all possible combinations
- "primitive" as a required player-facing term

## Lifecycle UI

### Recommendation State

Buttons:

- `Choose metabolize card`
- `Choose satisfaction card`
- `Skip for now`

Behavior:

- Choosing either card -> `chooseMoveAttempt` for that card's move attempt draft
- Skip -> `skipMoveAttempt`

Open decision:

- Whether the satisfaction card should be visible but locked until the metabolize card is practiced, or both should be chooseable immediately.

### Chosen State

Prompt:

```text
Do the move in a form that leaves a trace.
```

Inputs:

- optional artifact text
- optional outcome text

Buttons:

- `I practiced this`
- `Not this move today`

Behavior:

- Practiced -> `practiceMoveAttempt`
- Not this move today -> `abandonMoveAttempt`

### Practiced State

Prompt:

```text
What changed in the charge?
```

Input:

- reflection text

Buttons:

- `Reflect`
- `Complete with this trace`
- `This revealed another blocker`

Behavior:

- Reflect -> `reflectMoveAttempt`
- Complete with this trace -> `completeMoveAttempt`
- This revealed another blocker -> `markMoveAttemptNeedsFollowup`

### Reflected State

Buttons:

- `Complete`
- `Needs follow-up`

Behavior:

- Complete -> `completeMoveAttempt`
- Needs follow-up -> `markMoveAttemptNeedsFollowup`

### Completed State

Message:

```text
Move completed.
```

Offer:

- `Send result to BARS`
- `Close`

MVP:

- Close only is acceptable.

Later:

- Convert result to BAR.
- Attach attempt to DeckJournalEntry.
- Persist as `MoveAttempt`.

## Partial Vector Handling

The recommendation service returns:

- `vectorStatus`
- `missingFields`
- `nextQuestion`

UX rule:

- If vector is partial, ask the next missing question.
- Do not show a recommendation until present and desired states resolve.
- Ask blocker before recommendation even though the service can provide a default.

## Error / Empty States

### Unresolved Present Charge

Message:

```text
I could not map that charge yet. Choose the closest one.
```

Future:

- show canonical chips grouped by channel/altitude.

MVP:

- ask player to try a simpler word.

### No Route Found

Message:

```text
This path needs a different route. Try choosing a closer desired state.
```

Future:

- retry in mastery mode.

### No Recommendation Found

Message:

```text
The card is clear, but the move is not. Try naming the blocker more plainly.
```

## Persistence Boundary

MVP:

- Non-persistent panel state.
- No Prisma migration.
- No `MoveAttempt` table.
- No DeckJournalEntry schema change.

Allowed:

- Store panel state in React state.
- Optionally store in `sessionStorage` for accidental close/reopen during one browser session.

Not allowed in MVP:

- Count recommendation as completion.
- Award currency for recommendation.
- Persist attempt as proof of metabolized charge.

## Completion Boundary

Completion means:

- artifact exists, or
- reflection exists, or
- outcome trace exists.

Completion does not require:

- external action
- public share
- BAR creation
- quest creation

This preserves that Show Up can be internal or external.

## Implementation Steps

1. Add `DeckWorkThisCardPanel`.
2. Add a lightweight `WorkThisCardButton`.
3. Add button to daily draw footer.
4. Add button to card detail overlay footer.
5. Add button to Find Your Path result for the Move card.
6. Use `recommendChargeMetabolismMove` for recommendation.
7. Use lifecycle helpers for state changes.
8. Add component-level tests or focused service integration tests if UI tests are impractical.

## Open Questions

- Should `Work this card` appear above or below `Send to BARS` in the final visual hierarchy?
- Should completion offer "Send result to BARS" in the MVP, or wait until persistence is designed?
- Should advanced direct-state entry appear in the MVP, or wait until guided dissatisfaction intake is proven?
- Should the Deck subject toggle affect orientation defaults, or only external subject mapping?
