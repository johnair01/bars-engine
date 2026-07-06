# Spec: Beginner Route Hand Planner

## Purpose

Implement the beginner Emotional Alchemy routing grammar surfaced in the charge-metabolism gap analysis.

The Allyship Deck "Work this card" loop should stop treating the route as a Wu Xing graph-search problem. For beginner dissatisfaction-to-satisfaction practice, the system should construct a route hand directly:

```text
metabolize -> direct translate -> transcend
```

Each emotional move in the route becomes one recommended Show Up card.

## Source Context

This spec implements:

- `.specify/specs/charge-metabolism-move-attempts/beginner-route-hand-gap-analysis.md`
- `.specify/specs/charge-metabolism-move-attempts/spec.md` FR2a
- `.specify/specs/charge-metabolism-move-attempts/tasks.md` route-hand planner tasks

## Problem

The current planner uses the existing alchemy growth graph:

```text
altitude up in same channel
generate-cycle neighbor
control-cycle neighbor
```

That graph is useful for advanced alchemy exploration, but it creates bad beginner recommendations:

- It routes clean emotions through `neutrality` as if neutrality were a bridge station.
- It forces clean-channel translation through generate/control cycle neighbors.
- It sometimes reaches the target satisfaction sideways from another satisfied channel.
- It only exposes first edge + last edge, which hides the actual emotional route.

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

## Product Decision

For the beginner Allyship Deck MVP, route hands are built directly from altitude and channel difference.

Neutral altitude means "the emotion doing its job." It does not mean the `neutrality` channel.

The `neutrality` channel remains one of the five emotional channels:

```text
anger, sadness, joy, neutrality, fear
```

## Route Grammar

### Metabolize

When the present state is dissatisfied:

```text
current channel:dissatisfied -> current channel:neutral
```

Role:

```text
metabolize
```

Purpose:

```text
Make the charge usable.
```

### Translate

When current neutral channel differs from target channel:

```text
current channel:neutral -> target channel:neutral
```

Role:

```text
translate
```

Purpose:

```text
Move from one clean emotional job to another clean emotional job.
```

This is a direct edge. It does not use generate/control neighbors and does not pass through `neutrality` unless `neutrality` is actually the source or target channel.

### Transcend

When target altitude is satisfied:

```text
target channel:neutral -> target channel:satisfied
```

Role:

```text
transcend
```

Purpose:

```text
Let the target clean emotion complete into its satisfaction state.
```

## Route Length Rules

### Same Channel, Starting Dissatisfied

Example:

```text
sadness:dissatisfied -> sadness:satisfied
```

Route hand:

```text
1. sadness:dissatisfied -> sadness:neutral
2. sadness:neutral -> sadness:satisfied
```

### Different Channel, Starting Dissatisfied

Example:

```text
anger:dissatisfied -> sadness:satisfied
```

Route hand:

```text
1. anger:dissatisfied -> anger:neutral
2. anger:neutral -> sadness:neutral
3. sadness:neutral -> sadness:satisfied
```

### Different Channel, Starting Neutral

Example:

```text
fear:neutral -> sadness:satisfied
```

Route hand:

```text
1. fear:neutral -> sadness:neutral
2. sadness:neutral -> sadness:satisfied
```

### Same Channel, Starting Neutral

Example:

```text
sadness:neutral -> sadness:satisfied
```

Route hand:

```text
1. sadness:neutral -> sadness:satisfied
```

## Functional Requirements

### FR1: Add Beginner Route Planner

The system must expose a deterministic beginner planner:

```ts
planBeginnerRouteHand(input)
```

The planner must construct routes directly from the grammar above. It must not call the Wu Xing graph-search planner for beginner route construction.

### FR2: Preserve Advanced Planner

The current `planPracticeRoutes()` graph-search behavior must remain available for advanced/mastery modes.

This implementation must not delete generate/control routing.

### FR3: Add Direct Translate Operation

The alchemy edge model must support a direct `translate` operation for clean-channel-to-clean-channel moves.

`generate` and `control` remain separate operations for advanced modes.

### FR4: Return Route Hand Recommendations

The charge-metabolism recommendation service must return a route-hand array:

```ts
routeHandRecommendations: ShowUpRecommendation[]
routeHandAttemptDrafts: MoveAttemptDraft[]
```

Each item must preserve:

- route edge
- role: `metabolize`, `translate`, `transcend`, or `single`
- primitive id
- translated move copy
- reason
- vector snapshot

Temporary compatibility aliases may remain:

- `metabolizeRecommendation`
- `satisfactionRecommendation`
- `metabolizeAttemptDraft`
- `satisfactionAttemptDraft`

But new code should prefer the route-hand arrays.

### FR5: Render Variable Route Hands

The Allyship Deck "Work this card" UI must render the full route hand.

It must no longer assume exactly two recommended cards.

Player-facing copy should support:

```text
1 card came forward.
2 cards came forward.
3 cards came forward.
```

Each card should be selectable as its own move attempt.

### FR6: Keep Blockers As Modifiers

Blocker context must continue to modify the move recommendation. It must not be required to resolve the emotional vector.

The vector is still resolved by:

```text
present dissatisfaction or current charge -> desired satisfaction
```

### FR7: Beginner Deck Defaults To Route Hand Mode

For `sourceSurface: allyship_deck`, dissatisfaction-to-satisfaction intake must use the beginner route-hand planner by default.

Advanced/Wu Xing route planning can remain available to future surfaces or explicit modes.

## Non-Goals

- Do not create a database-backed `MoveAttempt` model in this spec.
- Do not redesign the full move library browser.
- Do not solve primitive quality for every channel pair before route correctness is implemented.
- Do not remove advanced alchemy graph routing.
- Do not introduce typed freeform emotional-state intake as the beginner default.

## Acceptance Criteria

### Route Shape

Given `anger:dissatisfied -> sadness:satisfied`, the planner returns exactly:

```text
anger:dissatisfied -> anger:neutral
anger:neutral -> sadness:neutral
sadness:neutral -> sadness:satisfied
```

Given `sadness:dissatisfied -> sadness:satisfied`, the planner returns exactly:

```text
sadness:dissatisfied -> sadness:neutral
sadness:neutral -> sadness:satisfied
```

Given `fear:neutral -> sadness:satisfied`, the planner returns exactly:

```text
fear:neutral -> sadness:neutral
sadness:neutral -> sadness:satisfied
```

Given `sadness:neutral -> sadness:satisfied`, the planner returns exactly:

```text
sadness:neutral -> sadness:satisfied
```

### No False Neutrality Bridge

For `anger:neutral -> sadness:neutral`, the planner must return one direct translate edge:

```text
anger:neutral -> sadness:neutral
```

It must not route through:

```text
neutrality:neutral
```

unless the source or target channel is actually `neutrality`.

### Recommendation Shape

For a three-edge route, the recommendation service returns three recommendation cards and three attempt drafts with matching roles:

```text
metabolize, translate, transcend
```

For a two-edge route, it returns two cards.

For a one-edge route, it returns one card.

### UI Smoke

The deck UI can complete the flow for:

- Blocked desire -> Poignance
- Loss or distance -> Poignance
- Threat scan -> Poignance
- Numb or stuck -> Poignance
- Restless possibility -> Poignance

The number of rendered cards matches the route hand.

## Test Matrix

Minimum automated tests:

- all five dissatisfied channels to all five satisfied targets produce route hands
- all five neutral channels to satisfied sadness produce route hands
- direct translate does not use Wu Xing intermediate channels
- route-hand recommendation arrays preserve edge order and roles
- compatibility aliases still exist until consumers are migrated

Minimum product smoke:

- run the five dissatisfaction entries into `Poignance`
- verify route hand length and role labels
- choose each role at least once across smoke runs
- complete one selected move attempt
- skip the full route hand once
