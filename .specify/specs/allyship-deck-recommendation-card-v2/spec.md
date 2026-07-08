# Allyship Deck Recommendation Card v2

## Problem

The Allyship Deck "Work this card" flow can resolve an emotional vector and produce route-hand recommendations, but the recommendation screen still reads like raw engine output. Players can see a title, instruction, and completion prompt, yet they must infer:

- why the drawn card matters
- how the emotional vector shaped the route
- where their blocker is being metabolized
- what to do immediately
- what trace proves the move happened

This makes a correct recommendation feel less playable than the grammar underneath it.

## Goal

Turn each route-hand recommendation into a compact, executable recommendation card that explains:

1. why this deck card is shaping the move
2. the emotional vector being worked
3. the blocker/context being metabolized
4. 3-5 concrete protocol steps
5. the trace required to complete the move
6. future save/share affordances

## Non-Goals

- Do not replace `recommendChargeMetabolismMove()`.
- Do not alter vector routing, primitive scoring, or route-hand planning.
- Do not add persistence in this slice.
- Do not add AI generation.
- Do not redesign the entire deck reader.

## Six Game Master Requirements

- **Shaman:** The card must feel emotionally alive. Each view model includes a felt `whyThisMove` and a concrete protocol.
- **Challenger:** Completion cannot be fake. The card must include a trace prompt and the existing lifecycle must still require an artifact, reflection, or outcome.
- **Regent:** The UI must render a typed contract, not one-off copy.
- **Architect:** Use a presenter/helper layer over the existing recommendation engine.
- **Diplomat:** Copy must be compact, human, and player-facing.
- **Sage:** The contract must include future hooks for BAR reflection, move-attempt persistence, and shareable artifacts.

## Data Contract

Add a pure presenter model:

```ts
export interface RecommendationCardViewModel {
  id: string
  kicker: string
  title: string
  whyThisCard: string
  vectorLabel: string
  blockerLabel: string
  protocolSteps: string[]
  tracePrompt: string
  completionLabel: string
  saveTargets: RecommendationSaveTarget[]
}
```

`RecommendationSaveTarget` should include placeholder targets for:

- `move_attempt`
- `bar_reflection`
- `share_card`

The presenter should accept:

- `MoveCard`
- `CardSubject`
- route-hand role
- `ShowUpRecommendation`
- optional `MoveAttemptDraft`

## UX Requirements

On the recommendation step, each route-hand card must display:

- role/kicker, e.g. "Card 1 · metabolize"
- recommendation title
- "Why this card"
- "Your vector"
- "Where the work is"
- "Do this now" with 3-5 numbered steps
- "Leave this trace"
- choose button
- disabled or placeholder save/share affordances

## Acceptance Criteria

1. Route-hand recommendations render through `RecommendationCardViewModel`.
2. Same route-hand count behavior is preserved: 1-3 cards can render.
3. `WorkThisCardButton` still typechecks against the existing recommendation engine.
4. Completion still requires a trace through existing move-attempt lifecycle rules.
5. Unit tests cover:
   - vector label creation
   - blocker fallback
   - protocol step shape
   - save target placeholders
   - route-hand role labeling

## Future Hooks

This slice intentionally stops at local prototype state, but the view model must make the next persistence slice obvious:

- save selected move attempt
- save completion as BAR reflection
- render/share a compact image card
