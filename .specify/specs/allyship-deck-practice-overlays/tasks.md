# Tasks: Allyship Deck Practice Overlays

## Phase 1: Overlay Contract

- [x] Create `src/lib/allyship-deck/practice-overlays.ts`.
- [x] Define `CardPracticeOverlayStatus`.
- [x] Define `CardPracticeOverlayPreferredTool`.
- [x] Define `CardPracticeOverlaySampleVector`.
- [x] Define `CardPracticeOverlay`.
- [x] Reuse `DeckPracticeCopy`.
- [x] Reuse `DeckPracticeRecommendationInput`.
- [x] Keep the overlay contract separate from `MoveCard`.

## Phase 2: Pilot Card Selection

- [x] Add `PILOT_CARD_PRACTICE_OVERLAY_IDS`.
- [x] Include `WAKE-GR-SHAMAN`.
- [x] Include `WAKE-SO-ARCHITECT`.
- [x] Include `OPEN-GR-CHALLENGER`.
- [x] Include `OPEN-GR-DIPLOMAT`.
- [x] Include `CLEAN-RA-SAGE`.
- [x] Include `CLEAN-DA-CHALLENGER`.
- [x] Include `GROW-SO-REGENT`.
- [x] Include `GROW-RA-SAGE`.
- [x] Include `SHOW-DA-CHALLENGER`.
- [x] Include `SHOW-SO-ARCHITECT`.
- [x] Verify all pilot card ids exist.
- [x] Document any substitutions.

## Phase 3: Overlay Generator

- [x] Implement `buildCardPracticeOverlay(cardId)`.
- [x] Load card from `getMoveCardById`.
- [x] Return `null` or throw a clear error for missing card.
- [x] Populate `stableCardLens`.
- [x] Populate `defaultPracticeIntention`.
- [x] Pull preferred tools from `getDeckCardToolAffinities(card)`.
- [x] Generate sample vectors from card move.
- [x] Add diagnostic blocker-shape samples for Wake Up and Clean Up.
- [x] Add top candidate tool ids to sample vectors.
- [x] Generate quick practice example when card can plausibly produce action/commitment output.
- [x] Generate at least one deep practice example for every pilot overlay.
- [x] Use `recommendDeckCardPractice(input)`.
- [x] Use `composeDeckPracticeCopy(input, recommendation)`.
- [x] Aggregate output possibilities.
- [x] Aggregate review flags from practice copy.
- [x] Add overlay-specific flags for no quick example, same-tool collapse, joy/bliss sample, and next-tier tool usage.
- [x] Assign review status.

## Phase 4: Pilot Registry

- [x] Implement `buildPilotCardPracticeOverlays()`.
- [x] Implement `getCardPracticeOverlay(cardId)`.
- [x] Ensure registry is deterministic.
- [x] Ensure registry does not write to DB.
- [x] Ensure registry does not mutate assembled card data.

## Phase 5: Tests

- [x] Create `src/lib/allyship-deck/__tests__/practice-overlays.test.ts`.
- [x] Test pilot registry contains 10 overlays.
- [x] Test every pilot card exists.
- [x] Test pilot covers all five WAVE moves.
- [x] Test pilot covers all four domains.
- [x] Test pilot includes all six operations where possible.
- [x] Test every overlay has stable card lens.
- [x] Test every overlay has preferred tools with reasons.
- [x] Test every overlay has at least one deep practice example.
- [x] Test Wake diagnostic coverage includes body, field, part, and capture shapes.
- [x] Test Wake diagnostic candidates include Felt Thread, Put It On The Board, 321, and BAR Capture.
- [x] Test Clean diagnostic coverage includes belief, field, part, body, and capture shapes.
- [x] Test Clean diagnostic candidates include Story Turnaround, 321, Put It On The Board, Felt Thread, and BAR Capture.
- [x] Test at least four overlays have quick practice examples.
- [x] Test every practice example has step copy.
- [x] Test every practice example has expected outputs.
- [x] Test every practice example has completion criteria.
- [x] Test joy/bliss or next-tier cases are flagged.
- [x] Test stable card fields are not mutated.

## Phase 6: Hostile Pilot Review

- [x] Create `.specify/specs/allyship-deck-practice-overlays/pilot-review.md`.
- [x] List all pilot overlays.
- [x] Record preferred tools.
- [x] Record sample vectors.
- [x] Record quick/deep example outputs.
- [x] Rate each overlay green/yellow/red.
- [x] Identify repeated failure patterns.
- [x] Recommend tuning before all-120 expansion.

## Phase 7: UI Handoff

- [ ] Define player-facing overlay fields.
- [ ] Define admin/designer-only overlay fields.
- [ ] Draft "This card can become..." copy.
- [ ] Define how quick/deep CTAs use overlay data.
- [ ] Define what not to expose to players.
- [ ] Link handoff back to Allyship Deck Practice Page spec.

## Expansion Gate

- [x] Pilot tests pass.
- [x] Pilot hostile review exists.
- [x] Red findings are fixed or explicitly accepted.
- [x] Joy/bliss strategy is named.
- [x] Operation-aware protocol modifier strategy is named.
- [ ] All-120 expansion plan is written separately.
