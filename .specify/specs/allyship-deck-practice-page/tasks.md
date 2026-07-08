# Tasks: Allyship Deck Practice Page

## Phase 1: Product Access Resolver

- [ ] Define `ProductAccessState = 'anonymous' | 'deck_owner' | 'bars_player' | 'admin'`.
- [ ] Implement `resolveProductAccess()`.
- [ ] Return `canUseDeck`, `canUseBars`, `isDeckOnly`, `isAdmin`, and `playerId`.
- [ ] Use `deck-digital` as deck access.
- [ ] Use `app-access` as deeper BARS access.
- [ ] Preserve admin bypass.
- [ ] Add tests for anonymous access.
- [ ] Add tests for deck-only access.
- [ ] Add tests for full BARS access.
- [ ] Add tests for admin bypass.

## Phase 2: Deck-Only Shell and Route Boundary

- [ ] Add deck-only shell for users with `deck-digital` and without `app-access`.
- [ ] Hide global BARS nav for deck-only users.
- [ ] Show deck-local nav: Draw, Browse, Find Your Path, Practice, Redeem/Account.
- [ ] Add "BARS integration coming soon" notice in deck-only shell.
- [ ] Define deck-only route allowlist.
- [ ] Allow `/deck`.
- [ ] Allow `/deck/practice/[cardId]`.
- [ ] Allow `/deck/sales`.
- [ ] Allow `/deck/preview`.
- [ ] Allow `/redeem`.
- [ ] Add friendly boundary for deck-only users visiting deeper BARS routes.
- [ ] Verify direct visits to `/vault`, `/bars/capture`, `/campaign`, `/adventures`, and `/admin` do not expose the full app to deck-only users.

## Phase 3: Helper

- [x] Define tool affinity types in `src/lib/allyship-deck/tool-affinities.ts`.
- [x] Implement move-to-tool affinity rules.
- [x] Implement operation-to-tool affinity rules.
- [x] Implement domain-to-tool affinity rules.
- [x] Implement `getDeckCardToolAffinities(card)`.
- [x] Add all-120-card helper coverage test.
- [x] Add targeted tests for one card per WAVE move.
- [x] Add targeted tests for all six operations.
- [x] Add targeted tests for all four domains.

## Phase 4: Recommendation Service

- [x] Define `DeckPracticeMode`.
- [x] Define `DeckPracticeRecommendationInput`.
- [x] Define `DeckPracticeRecommendation`.
- [x] Implement quick-mode tool ranking.
- [x] Implement deep-mode tool ranking.
- [x] Include emotional vector fit when present.
- [x] Include blocker/story fit when present.
- [x] Return selected tool, protocol, expected output kind, and completion criteria.
- [x] Add focused recommendation tests.

## Phase 4A: Hostile Recommendation Quality Pass

- [x] Create recommendation quality review doc.
- [x] Run golden matrix across three cards and five same-channel vectors.
- [x] Run same-vector/different-operation lens review.
- [x] Run same-card/different-blocker review.
- [x] Run quick-vs-deep review.
- [x] Tune worst red failure at scoring/metadata layer.
- [x] Add focused quality regression tests.

## Phase 4B: Move Card Practice Copy Contract

- [x] Define `DeckPracticeCopy` contract.
- [x] Implement satisfaction-spirit inference.
- [x] Implement deterministic practice copy composer.
- [x] Include player situation summary.
- [x] Include emotional vector or honest missing-vector flag.
- [x] Include selected-tool rationale.
- [x] Include protocol intro.
- [x] Include executable step copy with expected outputs.
- [x] Include public-safe save/share summary.
- [x] Add review flags for missing vector, missing blocker context, next-tier tools, and Show Up orientation.
- [x] Add focused copy contract tests.
- [x] Create copy contract spec doc.
- [x] Create hostile copy sample review.
- [x] Fix contract bugs found during sample generation.

## Phase 5: Practice Page

- [ ] Add `/deck/practice/[cardId]` route.
- [ ] Gate the route with deck access, not full app access.
- [ ] Load assembled card by id.
- [ ] Render missing-card state.
- [ ] Render card identity, move, operation, domain, and subject.
- [ ] Implement mode chooser: Help me take action / Go deeper.
- [ ] Implement quick action intake.
- [ ] Implement deep intake.
- [ ] Render selected tool protocol.
- [ ] Capture output/reflection locally.
- [ ] Show completion state without requiring BARS save.

## Phase 6: Deck CTA Reframe

- [ ] Add "Help me take action" CTA on drawn card.
- [ ] Add "Go deeper" CTA on drawn card.
- [ ] Add same CTAs in card detail overlay.
- [ ] Add same CTA from Find Your Path result.
- [ ] Demote or reposition immediate Send to BARS without removing it for full BARS users.
- [ ] Show Save to BARS only after practice output exists.
- [ ] Show Save to BARS as coming soon for deck-only users.
- [ ] Preserve existing Send to BARS behavior until save-after-practice is live.

## Phase 7: Export and Copy

- [ ] Define export variants: card-only, card+prompt, card+summary.
- [ ] Ensure private reflection text is excluded by default.
- [ ] Implement image rendering or prepare export payload.
- [ ] Implement copyable practice result text.
- [ ] Add opt-in toggle if private reflection can ever be included.
- [ ] Add visual/smoke check for one card.

## Phase 8: Save to BARS

- [ ] Define practice result save payload for full BARS users.
- [ ] Map completed practice to BAR reflection where supported.
- [ ] Map completed practice to optional quest seed/action artifact where supported.
- [ ] Snapshot card id, move, operation, domain, tool, mode, and vector if present.
- [ ] Add save confirmation state for full BARS users.
- [ ] Add coming-soon state for deck-only users.

## Phase 9: Validation

- [ ] Run allyship deck tests.
- [ ] Run product access tests.
- [ ] Run new helper tests.
- [ ] Smoke test `/deck` as anonymous user.
- [ ] Smoke test `/deck` as deck-only user.
- [ ] Smoke test `/deck/practice/[cardId]` as deck-only user.
- [ ] Smoke test one quick practice page.
- [ ] Smoke test one deep practice page.
- [ ] Smoke test direct deeper app route as deck-only user.
- [ ] Confirm deck-only practice can complete without BARS persistence.
- [ ] Confirm export/copy works without private reflection leakage.
