# Primitive Quality Hostile Review

## Date

2026-07-03

## Scope

Review the route-hand recommendation quality after implementing beginner route grammar.

This review assumes the route shape is correct and attacks the primitive choice inside each edge.

## Findings

### 1. `clean_exit` Was Overpowered

Before tuning, `clean_exit` won too many sadness and fear routes:

- sadness:dissatisfied -> sadness:neutral
- sadness:neutral -> sadness:satisfied
- fear:neutral -> sadness:neutral
- joy:neutral -> sadness:neutral

This was emotionally wrong. A sadness route should close distance to care and restore flow, not primarily create an exit.

Remediation:

- Removed `transcend` from `clean_exit`.
- Removed sadness as a source/target channel for `clean_exit`.
- Kept `clean_exit` available for translate/exit-style fear movements.

### 2. Sadness Needed Care/Flow Mechanics

The desired sadness path is:

```text
dissatisfied sadness -> clean sadness -> poignance
```

The primitive choices should be:

```text
name_care_distance -> restore_flow
```

Remediation:

- Added sadness target fit to `name_care_distance`.
- Added scoring for narrow source-target primitive fit.
- Locked sadness transcend to `restore_flow`.

### 3. Neutrality Stabilization Was Defaulting To Ask Mechanics

Before tuning, neutrality dissatisfaction often became `bound_the_ask`.

That is too fear-coded. Neutrality dissatisfaction is apathy, numbness, flatness, or stuckness. The first move should restore sequence/coherence, not convert vague need into an ask.

Remediation:

- Added a `create_sequence` scoring boost for neutrality -> neutrality.
- Locked neutrality:dissatisfied -> neutrality:neutral to `create_sequence`.

### 4. Translate Into Sadness Needed A Contact/Repair Mechanic

The direct translate edge:

```text
clean anger -> clean sadness
```

should not become a handoff or exit by default.

It should help the player move from desire/boundary/threat/possibility into care/contact without guilt recruitment or performance.

Remediation:

- Added `neutral_translate` support to `repair_without_performance`.
- Added a targeted boost when translating into sadness.
- Removed neutrality target fit from `repair_without_performance` after review showed it became too broad.

## Locked Examples

```text
sadness:dissatisfied -> sadness:neutral = name_care_distance
sadness:neutral -> sadness:satisfied = restore_flow
neutrality:dissatisfied -> neutrality:neutral = create_sequence
anger:neutral -> sadness:neutral = repair_without_performance
fear:neutral -> sadness:neutral = repair_without_performance
joy:neutral -> sadness:neutral = repair_without_performance
```

## Remaining Weak Spots

These are improved enough for this slice but still deserve later move-library work:

- fear:neutral -> fear:satisfied currently uses `create_sequence`; a future `step_through_stakes` primitive would be stronger.
- joy:dissatisfied -> joy:neutral still uses `identify_signal`; a future joy-specific settle/choose-participation primitive would be stronger.
- several cross-channel translations still use `create_handoff` or `clean_exit` because the primitive library is still small.

## Conclusion

The main route-hand primitive failure was not random. It came from broad primitives beating channel-specific mechanics.

The fix was to make primitive scoring care about emotional specificity:

```text
narrow channel fit > broad primitive
sadness completion -> restore flow
neutrality stabilization -> sequence/coherence
translate into sadness -> repair/contact
```
