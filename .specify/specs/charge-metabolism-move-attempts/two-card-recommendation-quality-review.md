# Two-Card Recommendation Quality Review

## Date

2026-07-02

## Purpose

Review whether the two-card recommendation model feels emotionally sane across the full beginner matrix:

```text
current dissatisfaction x desired satisfaction = 25 recommendation pairs
```

This review judges product quality, not just route validity.

## Verdict

The two-card model is the right product shape, but the primitive selection is not good enough yet.

The route planner consistently produces paths. The UI now surfaces both:

- Card 1: metabolize the charge you have
- Card 2: work the satisfaction you chose

The failure is subtler: several channels repeatedly receive generic or semantically wrong primitives because primitive scoring is still too coarse.

## Rating Key

- Green: feels emotionally right enough for MVP
- Yellow: mechanically valid but weak or too generic
- Red: emotionally wrong or teaches the wrong move

## Matrix Review

| Current Dissatisfaction | Desired Satisfaction | Card 1 | Card 2 | Rating | Notes |
|---|---|---|---|---|---|
| Blocked desire | Excitement | Interrupt Pattern | Clean Exit | Yellow | Card 1 is strong. Card 2 weak: fear -> excitement should feel like stepping through risk, not exiting. |
| Blocked desire | Poignance | Interrupt Pattern | Create Handoff | Yellow | Card 1 good. Card 2 is plausible only if poignance requires shared structure; otherwise too organizational. |
| Blocked desire | Bliss | Interrupt Pattern | Clean Exit | Yellow/Red | Card 1 good. Card 2 feels wrong for bliss; clean exit does not communicate participation/aliveness. |
| Blocked desire | Triumph | Interrupt Pattern | Interrupt Pattern | Green/Yellow | Same primitive twice is acceptable here because anger stabilization and anger satisfaction are adjacent, but copy must distinguish the two roles. |
| Blocked desire | Peace | Interrupt Pattern | Create Sequence | Green | This is one of the clearest pairs: clean force, then coherence/sequence. |
| Loss or distance | Excitement | Clean Exit | Create Handoff | Red | Sadness should not default to exit. Excitement path also feels indirect. |
| Loss or distance | Poignance | Clean Exit | Clean Exit | Red | This is the clearest bad result. Sadness -> poignance should be care/distance, restore flow, receive meaning. |
| Loss or distance | Bliss | Clean Exit | Make Meaning Actionable | Yellow | Card 2 is good. Card 1 should not be clean exit by default. |
| Loss or distance | Triumph | Clean Exit | Interrupt Pattern | Yellow | Card 2 plausible. Card 1 still wrong/overdefensive for sadness. |
| Loss or distance | Peace | Clean Exit | Create Handoff | Red/Yellow | Card 1 wrong. Card 2 may be valid for overheld care, but not general peace. |
| Threat scan | Excitement | Bound The Ask | Clean Exit | Yellow/Red | Card 1 okay for fear/resource context. Card 2 wrong: excitement should be step-through/opportunity. |
| Threat scan | Poignance | Bound The Ask | Clean Exit | Yellow | Card 1 okay. Card 2 too exit-oriented for sadness satisfaction. |
| Threat scan | Bliss | Bound The Ask | Make Meaning Actionable | Yellow/Green | Not bad: bound risk, then story/action toward participation. |
| Threat scan | Triumph | Bound The Ask | Clean Exit | Yellow/Red | Fear into triumph via clean exit feels evasive. Needs courage/agency bridge. |
| Threat scan | Peace | Bound The Ask | Create Handoff | Yellow | Mechanically plausible, but peace needs more coherence language. |
| Restless possibility | Excitement | Identify Signal | Create Handoff | Yellow | Card 1 okay. Card 2 weak for excitement. |
| Restless possibility | Poignance | Identify Signal | Create Handoff | Yellow | Card 1 okay. Card 2 too structural for poignance. |
| Restless possibility | Bliss | Identify Signal | Make Meaning Actionable | Green/Yellow | Stronger than most. Needs more joy-specific participation language. |
| Restless possibility | Triumph | Identify Signal | Interrupt Pattern | Green/Yellow | Signal -> force can work. Needs copy that connects aliveness to desire. |
| Restless possibility | Peace | Identify Signal | Create Sequence | Green | Good: settle the signal, then create coherence. |
| Numb or stuck | Excitement | Bound The Ask | Clean Exit | Red | Neutrality dissatisfaction should not default to ask constraint. |
| Numb or stuck | Poignance | Bound The Ask | Clean Exit | Red | Bad: numbness into poignance should re-sensitize and restore care, not ask/exit. |
| Numb or stuck | Bliss | Bound The Ask | Clean Exit | Red | Bad: numbness into bliss needs aliveness/participation, not ask/exit. |
| Numb or stuck | Triumph | Bound The Ask | Clean Exit | Red | Bad: this teaches avoidance/constraint instead of coherence into agency. |
| Numb or stuck | Peace | Bound The Ask | Create Sequence | Yellow/Green | Card 2 is good. Card 1 should be Restore Neutrality/Create Sequence, not Bound The Ask. |

## Main Failure Patterns

### 1. Sadness Is Being Treated Like Obligation/Exit

All sadness dissatisfaction entries currently start with:

```text
Clean Exit
```

This is too defensive as the default sadness move. Sadness dissatisfaction is about care + distance, collapse, loss, blocked flow, and meaning. The first card should more often be:

- `Name Care And Distance`
- `Restore Flow`
- possibly `Make Meaning Actionable` when moving toward action/joy

### 2. Neutrality Is Being Treated Like Fear/Need

All neutrality dissatisfaction entries currently start with:

```text
Bound The Ask
```

This happens because `Bound The Ask` and `Create Sequence` tie on neutrality stabilization, and definition order chooses `Bound The Ask`.

For numbness/stuckness, the default metabolize card should usually be:

- `Create Sequence`
- `Identify Signal`
- a future `Reveal Stakes` / `Restore Coherence` primitive

### 3. Fear Satisfaction Is Being Treated Like Exit

Fear -> excitement currently lands on:

```text
Clean Exit
```

That is not the emotional flavor of excitement. Excitement is risk metabolized into opportunity, courage, curiosity, and step-through energy. The system needs either:

- a dedicated `Step Through` Show Up primitive, or
- a stronger fear-transcend scoring rule that does not default to `Clean Exit`.

### 4. Same Primitive Twice Needs Role-Specific Copy

`Blocked desire -> Triumph` returns:

```text
Card 1: Interrupt Pattern
Card 2: Interrupt Pattern
```

This can be okay, but only if the copy distinguishes:

- Card 1: interrupt resentment/attack pattern so anger becomes clean
- Card 2: use clean anger to honor boundary / embody agency

Without role-specific copy, it looks like a duplicate recommendation.

## Scoring Diagnosis

The current primitive scoring rewards:

- vector type
- operation
- source channel
- target channel

But it does not reward semantic specificity enough.

Examples:

- `Clean Exit` ties or beats sadness-specific moves because it supports sadness/fear and comes earlier.
- `Bound The Ask` ties `Create Sequence` for neutrality stabilization and wins by order.
- Fear transcend lacks a better primitive, so `Clean Exit` wins.

## Remediation Plan

### Phase 1: Fix Scoring Ties And Channel Specificity

Add a specificity bonus:

```text
primitive with narrower source/target channel fit beats broad primitive on ties
```

Then add channel-priority overrides for the worst cases:

- sadness:dissatisfied -> sadness:neutral should prefer `name_care_distance`
- sadness:neutral -> sadness:satisfied should prefer `restore_flow`
- neutrality:dissatisfied -> neutrality:neutral should prefer `create_sequence`
- neutrality:neutral -> neutrality:satisfied should prefer `create_sequence`

### Phase 2: Add Missing Primitive Semantics

Add or refine primitives for:

- Fear -> excitement: `Step Through`
- Neutrality dissatisfaction: `Reveal Stakes` or `Restore Coherence`
- Joy -> bliss: `Commit Participation` or stronger joy-specific transcend copy

### Phase 3: Add Role-Specific Translation Copy

The same primitive may be valid for both cards, but copy must change by role:

- metabolize copy: "work the charge you have"
- satisfaction copy: "practice the satisfaction you chose"

This is especially important for same-channel paths like anger -> triumph, sadness -> poignance, fear -> excitement, joy -> bliss, and neutrality -> peace.

## MVP Fix Recommendation

Do not tune all 25 cases at once.

Fix the three most visible bad cases first:

1. `Loss or distance -> Poignance`
   - Card 1 should not be `Clean Exit`.
   - Card 2 should not be `Clean Exit`.
2. `Numb or stuck -> Poignance`
   - Card 1 should not be `Bound The Ask`.
   - Card 2 should not be `Clean Exit`.
3. `Threat scan -> Excitement`
   - Card 2 should not be `Clean Exit`.

Add focused tests for those cases before broad matrix tuning.
