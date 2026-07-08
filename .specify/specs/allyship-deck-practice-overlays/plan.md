# Plan: Allyship Deck Practice Overlays

## Phase 1: Overlay Contract

Define the typed overlay boundary.

Impacted files:

- `src/lib/allyship-deck/practice-overlays.ts` new
- `src/lib/allyship-deck/__tests__/practice-overlays.test.ts` new

Implementation:

1. Define `CardPracticeOverlayStatus`.
2. Define `CardPracticeOverlay`.
3. Define `CardPracticeOverlaySampleVector`.
4. Define `CardPracticeOverlayPreferredTool`.
5. Reuse `DeckPracticeCopy` from `practice-copy.ts`.
6. Reuse `DeckPracticeRecommendationInput` from `practice-recommendations.ts`.

## Phase 2: Pilot Card Selection

Create a deterministic pilot set of 10 cards.

Impacted files:

- `src/lib/allyship-deck/practice-overlays.ts`

Implementation:

1. Add `PILOT_CARD_PRACTICE_OVERLAY_IDS`.
2. Verify each card exists through `getMoveCardById`.
3. Ensure pilot covers all five WAVE moves.
4. Ensure pilot covers all four domains.
5. Ensure pilot includes all six operations where possible.
6. Document substitutions if any pilot card is unavailable.

## Phase 3: Overlay Generator

Build overlays from existing deterministic services.

Impacted files:

- `src/lib/allyship-deck/practice-overlays.ts`

Implementation:

1. Implement `buildCardPracticeOverlay(cardId)`.
2. Load stable card fields from assembled deck.
3. Generate `stableCardLens`.
4. Generate `defaultPracticeIntention`.
5. Pull top preferred tools from `getDeckCardToolAffinities(card)`.
6. Generate sample vector inputs from card move.
7. Call `recommendDeckCardPractice(input)` for practice examples.
8. Call `composeDeckPracticeCopy(input, recommendation)` for copy examples.
9. Aggregate output possibilities.
10. Aggregate review flags.
11. Set review status.

## Phase 4: Pilot Registry

Expose the 10-card overlay pilot.

Impacted files:

- `src/lib/allyship-deck/practice-overlays.ts`

Implementation:

1. Implement `buildPilotCardPracticeOverlays()`.
2. Implement `getCardPracticeOverlay(cardId)`.
3. Keep registry pure and deterministic.
4. Do not persist overlays to DB.

## Phase 5: Tests

Lock the overlay layer before UI consumption.

Impacted files:

- `src/lib/allyship-deck/__tests__/practice-overlays.test.ts`

Test cases:

1. Pilot registry contains 10 overlays.
2. Every pilot card exists.
3. Pilot covers all five WAVE moves.
4. Pilot covers all four domains.
5. Pilot includes all six operations where possible.
6. Every overlay includes stable card lens.
7. Every overlay includes top preferred tools with reasons.
8. Every overlay includes at least one deep practice example.
9. At least four overlays include quick practice examples.
10. Every practice example has steps, expected outputs, and completion criteria.
11. Stable card fields are not mutated.
12. Joy/bliss or next-tier cases are flagged.

## Phase 6: Hostile Pilot Review

Create a review artifact before expanding beyond pilot.

Impacted files:

- `.specify/specs/allyship-deck-practice-overlays/pilot-review.md` new

Review:

1. List each pilot card.
2. Record preferred tools.
3. Record quick/deep examples.
4. Rate green/yellow/red.
5. Identify repeated failure patterns.
6. Recommend tuning before all-120 expansion.

## Phase 7: UI Handoff

Prepare UI consumption without implementing full UI unless explicitly chosen.

Potential impacted files:

- `src/components/deck/AllyshipDeckReader.tsx`
- `src/components/deck/FindYourPath.tsx`
- future `/deck/practice/[cardId]` route

Handoff should define:

1. Player-facing overlay fields.
2. Admin/designer-only review fields.
3. Copy tone for "This card can become..."
4. How quick/deep CTA copy uses overlay data.
5. What not to expose to players.

## Expansion Gate

Do not expand to all 120 cards until:

1. Pilot tests pass.
2. Pilot hostile review exists.
3. Red findings are fixed or accepted.
4. Joy/bliss yellow area has a named strategy.
5. Operation-protocol modifier gap has a named strategy.
