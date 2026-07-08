# Gap Analysis: Beginner Route Hand Grammar

## Date

2026-07-02

## Prompt

The current recommendation quality failures suggest the routing logic is wrong for the beginner Allyship Deck loop.

The key correction:

```text
Frustration -> Clean Anger
Clean Anger -> Clean Sadness
Clean Sadness -> Poignance
```

Not:

```text
Frustration -> Clean Anger
Clean Anger -> Neutrality
Neutrality -> Clean Sadness
Clean Sadness -> Poignance
```

Neutrality is not a required bridge station between clean emotions. Clean Anger and Clean Sadness are both neutral-altitude emotional states. The translate move is directly:

```text
Clean Anger -> Clean Sadness
```

## Current Logic

The current planner uses the growth graph from `alchemy-graph.ts`:

```text
state -> altitude up in same channel
state -> generate cycle neighbor at same altitude
state -> control cycle neighbor at same altitude
```

Then `move-planner.ts` does breadth-first route search through those graph edges.

This makes sense for Wu Xing / deeper alchemy exploration, but it is not the right default grammar for beginner Show Up route hands.

## Why Current Logic Fails

### 1. Translate Is Constrained By Five-Element Cycles

To move from one clean emotion to another, the planner must follow generate/control neighbors.

Example:

```text
Clean Anger -> Clean Sadness
```

Current planner cannot do this directly. It must route through available cycle edges, often producing:

```text
Anger -> Neutrality -> Sadness
```

or a satisfied-state detour.

That adds extra cards and makes the path feel mechanical instead of emotionally direct.

### 2. Target Satisfaction Is Reached Sideways

For satisfied sadness / poignance, the final move should usually be:

```text
Sadness:neutral -> Sadness:satisfied
```

Current planner often reaches poignance through:

```text
OtherChannel:satisfied -> Sadness:satisfied
```

That treats the target satisfaction as a coordinate in the graph, not as the completion of the target channel.

### 3. Neutrality Is Being Misused As A Bridge

Neutrality is one emotional channel:

```text
Neutral / Peace / Apathy
```

It is not the generic bridge between all clean emotions.

The neutral altitude means:

```text
emotion doing its job
```

So:

```text
Anger:neutral -> Sadness:neutral
```

is already a neutral-to-neutral translate move. It does not require passing through `neutrality:neutral`.

### 4. Two-Card Recommendation Was A Symptom

The two-card model improved visibility, but it still assumed:

```text
Card 1 = first edge
Card 2 = last edge
```

That fails if the route itself is wrong or incomplete.

The correct object is a route hand:

```text
one emotional move = one card
```

For beginner satisfaction routes, this usually means 2 or 3 cards:

- same-channel dissatisfaction -> satisfaction: 2 cards
- cross-channel dissatisfaction -> satisfaction: 3 cards
- neutral current channel -> different satisfied target: 2 cards

## Desired Beginner Grammar

For the beginner Allyship Deck loop, route hands should be built from three direct move families:

### 1. Metabolize

```text
CurrentChannel:dissatisfied -> CurrentChannel:neutral
```

Purpose:

```text
Make the charge usable.
```

### 2. Translate

```text
CurrentChannel:neutral -> TargetChannel:neutral
```

Purpose:

```text
Move from one clean emotional job to another clean emotional job.
```

Important:

- This should be direct.
- It should not be forced through Wu Xing cycle neighbors.
- It should produce one card.

### 3. Transcend

```text
TargetChannel:neutral -> TargetChannel:satisfied
```

Purpose:

```text
Let the target emotion complete into its satisfaction state.
```

## Route Hand Rules

### Same Channel, Starting Dissatisfied

Example:

```text
Loss/distance -> Poignance
```

Route hand:

```text
1. sadness:dissatisfied -> sadness:neutral
2. sadness:neutral -> sadness:satisfied
```

### Different Channel, Starting Dissatisfied

Example:

```text
Blocked desire -> Poignance
```

Route hand:

```text
1. anger:dissatisfied -> anger:neutral
2. anger:neutral -> sadness:neutral
3. sadness:neutral -> sadness:satisfied
```

### Different Channel, Already Neutral

Example:

```text
Clean Anger -> Poignance
```

Route hand:

```text
1. anger:neutral -> sadness:neutral
2. sadness:neutral -> sadness:satisfied
```

### Same Channel, Already Neutral

Example:

```text
Clean Sadness -> Poignance
```

Route hand:

```text
1. sadness:neutral -> sadness:satisfied
```

## What Needs To Change

### Product Contract

Replace fixed two-card language with route hand language:

```text
recommended cards = route hand
one card per emotional move
```

The route hand can contain 1-3 cards in beginner mode.

### Planner Contract

Add a beginner route planner separate from the current Wu Xing graph planner:

```ts
planBeginnerRouteHand(from, to)
```

This planner should not perform graph search. It should construct the hand directly from the beginner grammar.

### Edge Model

The current `AlchemyPracticeOperation` does not have a generic direct translate operation.

Add:

```ts
type AlchemyPracticeOperation =
  | 'stabilize'
  | 'translate'
  | 'transcend'
  | 'generate'
  | 'control'
  | 'controlled_descent'
```

`generate` and `control` remain available for deeper alchemy / Wu Xing modes, but beginner Show Up route hands should use `translate` for clean-channel-to-clean-channel moves.

### Recommendation Service

The service should stop selecting:

```text
first edge + last edge
```

Instead it should return:

```text
routeHandRecommendations: ShowUpRecommendation[]
routeHandAttemptDrafts: MoveAttemptDraft[]
```

Each draft needs a role:

```text
metabolize | translate | transcend | single
```

The existing `metabolizeRecommendation` / `satisfactionRecommendation` fields can remain as compatibility aliases temporarily, but they should no longer be the primary mental model.

### UI

Work This Card should render:

```text
{n} cards came forward.
```

Where `n` is the route hand length.

Cards should be labeled by role:

```text
Card 1 · metabolize
Card 2 · translate
Card 3 · transcend
```

## Tests Needed

Add route-hand tests:

```text
anger:dissatisfied -> sadness:satisfied
= anger:dissatisfied -> anger:neutral
  anger:neutral -> sadness:neutral
  sadness:neutral -> sadness:satisfied
```

```text
sadness:dissatisfied -> sadness:satisfied
= sadness:dissatisfied -> sadness:neutral
  sadness:neutral -> sadness:satisfied
```

```text
fear:neutral -> sadness:satisfied
= fear:neutral -> sadness:neutral
  sadness:neutral -> sadness:satisfied
```

```text
sadness:neutral -> sadness:satisfied
= sadness:neutral -> sadness:satisfied
```

## Migration Strategy

### Step 1: Add Beginner Planner

Create `planBeginnerRouteHand()` without removing `planPracticeRoutes()`.

### Step 2: Route Deck Recommendations Through Beginner Planner

For `sourceSurface: allyship_deck`, use beginner route hand mode by default.

### Step 3: Keep Wu Xing Planner For Advanced Modes

Keep current graph search for:

- mastery mode
- advanced alchemy engine
- future Wu Xing practice views

### Step 4: Replace Two-Card UI With Route-Hand UI

Render all route hand recommendations, not only first/last.

### Step 5: Re-run 25 Matrix

Expected improvement:

- all satisfied sadness targets should end with `sadness:neutral -> sadness:satisfied`
- all cross-channel satisfied targets should include a direct neutral translate edge into the target channel
- route hand length should be 2 or 3 for beginner dissatisfaction-to-satisfaction vectors

## Key Conclusion

The current system is not "bad at choosing primitives" first.

It is using the wrong route grammar for the beginner deck loop.

The fix is:

```text
Beginner route hand = metabolize -> direct translate -> transcend
```

Not:

```text
Wu Xing graph search -> first edge + last edge
```
