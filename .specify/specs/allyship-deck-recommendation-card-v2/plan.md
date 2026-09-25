# Plan

## Phase 1 — Presenter Contract

Add `src/lib/allyship-deck/recommendation-card-view-model.ts`.

Responsibilities:

- create `RecommendationCardViewModel`
- translate route-hand role into player-facing kicker
- explain the card linkage using card move/domain/operation
- format emotional vector
- format blocker fallback
- generate 3-5 executable protocol steps from the translated Show Up move
- expose placeholder save targets

## Phase 2 — UI Swap

Update `src/components/deck/WorkThisCardButton.tsx`.

Changes:

- import presenter helper
- build one view model per route-hand recommendation
- update `RecommendationView` to render the v2 fields
- preserve current choose/practice/reflect lifecycle

## Phase 3 — Tests

Add `src/lib/allyship-deck/__tests__/recommendation-card-view-model.test.ts`.

Run:

```bash
node --import tsx src/lib/allyship-deck/__tests__/recommendation-card-view-model.test.ts
NODE_OPTIONS=--max-old-space-size=6144 npm run build:type-check -- --pretty false
```

## File Impacts

- `.specify/specs/allyship-deck-recommendation-card-v2/spec.md`
- `.specify/specs/allyship-deck-recommendation-card-v2/plan.md`
- `.specify/specs/allyship-deck-recommendation-card-v2/tasks.md`
- `src/lib/allyship-deck/recommendation-card-view-model.ts`
- `src/lib/allyship-deck/__tests__/recommendation-card-view-model.test.ts`
- `src/components/deck/WorkThisCardButton.tsx`

## Risk

The main risk is over-copying the recommendation and making the card visually heavy. Keep the presenter output compact and deterministic.
