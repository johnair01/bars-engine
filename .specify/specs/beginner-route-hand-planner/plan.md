# Plan: Beginner Route Hand Planner

## Implementation Strategy

Build the new beginner planner alongside the existing graph-search planner.

The existing planner remains the advanced route explorer. The new planner is the default for Allyship Deck dissatisfaction-to-satisfaction recommendations.

## Phase 1: Route Model

Files likely impacted:

- `src/lib/alchemy/alchemy-graph.ts`
- `src/lib/alchemy/move-planner.ts`
- `src/lib/alchemy/__tests__/move-planner.test.ts`

Work:

1. Add `translate` to the alchemy operation type.
2. Add a route-edge role mapping for beginner route hands.
3. Implement `planBeginnerRouteHand()`.
4. Keep `planPracticeRoutes()` unchanged for advanced use.

Design note:

`planBeginnerRouteHand()` should construct the route directly. It should not search the graph.

## Phase 2: Recommendation Service

Files likely impacted:

- `src/lib/charge-metabolism/types.ts`
- `src/lib/charge-metabolism/recommendation-service.ts`
- `src/lib/charge-metabolism/__tests__/recommendation-service.test.ts`

Work:

1. Expand `MoveRecommendationRole` to support `translate` and `transcend`.
2. Add `routeHandRecommendations` and `routeHandAttemptDrafts`.
3. Generate one recommendation per beginner route edge.
4. Keep current compatibility aliases while UI migration completes.

Design note:

Primitive selection can stay simple at first. The priority is correct route shape and role preservation.

## Phase 3: Allyship Deck UI

Files likely impacted:

- `src/components/deck/WorkThisCardButton.tsx`
- `src/components/deck/AllyshipDeckReader.tsx`
- `src/components/deck/FindYourPath.tsx`

Work:

1. Replace fixed two-card rendering with route-hand rendering.
2. Support 1-card, 2-card, and 3-card language.
3. Allow selecting any route-hand card as the chosen move attempt.
4. Replace "Skip both for now" with route-hand-aware copy.

Design note:

The UI should teach the shape without over-explaining:

```text
First, work the charge you have.
Then, translate into the target channel.
Finally, practice the satisfaction.
```

## Phase 4: Validation

Files likely impacted:

- `src/lib/alchemy/__tests__/move-planner.test.ts`
- `src/lib/charge-metabolism/__tests__/recommendation-service.test.ts`
- optional temporary smoke route only during manual testing

Work:

1. Add route-shape tests for the acceptance examples.
2. Add 5 x 5 dissatisfied-to-satisfied matrix tests.
3. Add neutral-to-poignance tests.
4. Smoke Work This Card with representative entries.
5. Remove any temporary smoke route after testing.

## Rollout

Default behavior:

- Allyship Deck uses beginner route-hand planner.

Preserved behavior:

- Advanced alchemy surfaces can still call graph-search route planning.

Future follow-up:

- Improve primitive selection once route shape is stable.
- Tune sadness/neutrality primitive defaults.
- Add BAR Tune and 321 handoff into route-hand recommendations.
