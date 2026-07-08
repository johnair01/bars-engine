# Tasks

## Spec Setup

- [x] Create spec kit for beginner route-hand planner.
- [x] Convert route-hand gap analysis into implementation requirements.

## Route Planner

- [x] Add `translate` to the alchemy practice operation model.
- [x] Implement `planBeginnerRouteHand()` as a direct constructor, not graph search.
- [x] Map beginner route edges to roles: `metabolize`, `translate`, `transcend`, `single`.
- [x] Preserve existing `planPracticeRoutes()` behavior for advanced/Wu Xing routing.
- [x] Add route-shape tests for the four canonical acceptance examples.
- [x] Add tests proving direct clean-channel translate does not pass through `neutrality` unless `neutrality` is the source or target.

## Recommendation Service

- [x] Expand move-attempt recommendation roles to include `translate` and `transcend`.
- [x] Return `routeHandRecommendations`.
- [x] Return `routeHandAttemptDrafts`.
- [x] Preserve temporary compatibility aliases for metabolize/satisfaction recommendation consumers.
- [x] Add recommendation-service tests for 1-card, 2-card, and 3-card route hands.
- [x] Add all-five dissatisfied channels to all-five satisfied targets matrix coverage.

## Allyship Deck UI

- [x] Replace fixed two-card recommendation rendering with variable route-hand rendering.
- [x] Update heading/copy for 1, 2, or 3 cards.
- [x] Let the player choose any route-hand card as the move attempt.
- [x] Replace "Skip both for now" with route-hand-aware skip copy.
- [x] Keep completion/reflection behavior working for selected route-hand cards.

## Smoke Testing

- [x] Smoke Blocked desire -> Poignance.
- [x] Smoke Loss or distance -> Poignance.
- [x] Smoke Threat scan -> Poignance.
- [x] Smoke Numb or stuck -> Poignance.
- [x] Smoke Restless possibility -> Poignance.
- [x] Choose a metabolize card in one smoke run.
- [x] Choose a translate card in one smoke run.
- [x] Choose a transcend card in one smoke run.
- [x] Skip a full route hand in one smoke run.
- [x] Remove any temporary smoke-test routes before finishing.

## Parent Spec Sync

- [x] Mark charge-metabolism task "Add beginner route-hand planner" complete after implementation.
- [x] Mark charge-metabolism task "Add direct neutral-channel translate edges" complete after implementation.
- [x] Mark charge-metabolism task "Update recommendation service from fixed two-card output to route-hand output" complete after implementation.

## Primitive Quality

- [x] Hostile review route-hand primitive choices after route grammar fix.
- [x] Identify bad primitive matches caused by over-broad `clean_exit` and `bound_the_ask`.
- [x] Tune primitive scoring/metadata for sadness, neutrality, and translate-into-sadness routes.
- [x] Add tests locking the tuned primitive matches.

## Vector Move Inventory

- [x] Check the library for existing emotional alchemy move inventories before inventing a new one.
- [x] Create consolidated emotional vector move inventory artifact.
- [x] Separate existing channel-level moves from missing vector-specific move families.
- [x] Implement typed vector move family registry for the 30 beginner vector families.
- [x] Wire recommendation service to prefer vector move families before generic primitive fallback.
- [x] Add coverage tests proving all 30 beginner vector families resolve to at least one move candidate.
- [x] Add mechanic tags and five-lens mechanic operations for 8 high-risk translate families.
- [x] Create translate vector gap analysis from hostile review.
- [x] Surface mechanic operations in recommendation payloads.
- [x] Add practice-lens selection from blocker context.
- [x] Add golden story fixtures for 8 authored translate operations and 5 lens variants.
- [x] Memorialize composited move strategy: abstract move + submove + tool + satisfaction spirit.
- [ ] Add canonical tool registry with 321 as first tool.
- [ ] Add tool capability matching by submove and move role.
- [ ] Compose 321 tool protocol into recommendation payloads.
- [ ] Snapshot selected tool/protocol in move attempts.
- [ ] Author mechanic operations for the remaining 12 translate families.
- [ ] Recalibrate vector family coverage flags with explicit criteria.
- [ ] Prototype operation-to-card translation for the first 4 mechanic operations.
