# Guided Intake Matrix Review

## Date

2026-07-02

## Purpose

Review the 5 x 5 beginner intake matrix:

```text
current dissatisfaction -> desired satisfaction
```

The goal was to see whether the new guided intake produces recommendations that feel sane before browser-smoking every click path.

## Inputs Tested

Current dissatisfaction:

- Blocked desire -> anger:dissatisfied
- Loss or distance -> sadness:dissatisfied
- Threat scan -> fear:dissatisfied
- Restless possibility -> joy:dissatisfied
- Numb or stuck -> neutrality:dissatisfied

Desired satisfaction:

- Excitement -> fear:satisfied
- Poignance -> sadness:satisfied
- Bliss -> joy:satisfied
- Triumph -> anger:satisfied
- Peace -> neutrality:satisfied

## Result

All 25 combinations resolve into full emotional vectors and route-backed recommendations.

The route planner does respond to the desired satisfaction target. The visible primary recommendation does not respond enough because the recommendation service currently chooses the first route edge.

## Matrix Findings

### Blocked Desire

Primary move shown for all targets:

```text
Inner Interrupt Pattern
```

Read:

- Sane as the first move from anger dissatisfaction.
- Not sufficient as the only visible recommendation when the player chose Excitement, Poignance, Bliss, or Peace.
- The desired satisfaction target is present in the route, but hidden from the player.

### Loss Or Distance

Primary move shown for all targets:

```text
Inner Clean Exit
```

Read:

- Weak for sadness. Sadness dissatisfaction should often begin with naming care/distance or restoring flow, not clean exit.
- This suggests primitive scoring is over-weighting generic source-channel matches for sadness/fear.

### Threat Scan

Primary move shown for all targets:

```text
Inner Bound The Ask
```

Read:

- Sane for Gather Resources and fear dissatisfaction.
- Too repetitive across all target satisfactions.
- Excitement should probably surface a more direct "step through / orient risk into opportunity" move.

### Restless Possibility

Primary move shown for all targets:

```text
Inner Identify Signal
```

Read:

- Sane as a stabilizing first step.
- Too generic as the main move for Bliss, Triumph, Peace, Poignance, or Excitement.
- Joy needs stronger satisfaction-target moves for commitment, participation, and contained aliveness.

### Numb Or Stuck

Primary move shown for all targets:

```text
Inner Bound The Ask
```

Read:

- Weak. Neutrality dissatisfaction should more often ask for restoring coherence, revealing stakes, sequencing, or re-sensitizing.
- Bound The Ask is doing too much work because neutrality shares primitive affinity with fear.

## Core Product Finding

The current recommendation behavior is first-step biased:

```text
route[0] -> primary recommendation
```

That makes the current dissatisfaction dominate the move. The desired satisfaction target becomes mostly invisible.

For beginner guided intake, that is not enough. If the player chooses a satisfaction target, the recommendation needs to show how the move serves that target.

## Remediation Strategies

### Option A: Show Route As Practice Path

Keep the first edge as the immediate move, but show the path:

```text
First move: Interrupt Pattern
Path toward: Peace
Next emotional work: Restore Neutrality -> Stabilize Coherence
```

Pros:

- Honest to the route planner.
- Preserves "do the next rep" simplicity.

Cons:

- More UI complexity.
- The move title may still feel disconnected from the target.

### Option B: Choose Goal-Relevant Edge

Select the route edge closest to the desired satisfaction as the primary recommendation.

Pros:

- Desired target becomes visible immediately.
- Better matches the player's intention.

Cons:

- May skip necessary stabilization work.
- Could recommend moves that are too advanced for the current charge.

### Option C: Two Card Recommendations

Return two cards:

```text
metabolize card = first stabilizing / metabolizing edge
satisfaction card = desired-satisfaction-facing edge
```

Display them as separate recommendations:

```text
Card 1: Work the charge you have.
Card 2: Work the satisfaction you chose.
```

Pros:

- Keeps beginner safety.
- Makes the desired satisfaction matter.
- Preserves the idea that dissatisfaction usually needs to become metabolizable before target work.
- Avoids pretending one card does the whole transformation.

Cons:

- Requires a slightly richer recommendation object.
- Requires lifecycle clarity: choosing/completing one card should not automatically complete the other.

## Recommendation

Use Option C.

The immediate move can remain the first stabilizing edge, but the recommendation must also return a separate satisfaction-facing card.

The next implementation target should be:

```text
metabolize recommendation = immediate move
satisfaction recommendation = desired-satisfaction edge
player copy = two cards came forward
```

## Primitive Gaps Surfaced

- Sadness dissatisfaction needs `name_care_distance` and `restore_flow` to beat `clean_exit` more often.
- Neutrality dissatisfaction needs stronger coherence/sequence/reveal-stakes primitives so it does not default to `bound_the_ask`.
- Fear -> Excitement needs a more direct satisfaction primitive than `clean_exit`.
- Joy -> Bliss needs a more specific participation/commitment primitive than `identify_signal`.
- Target satisfaction needs to influence translation copy, even when it does not change the immediate primitive.
