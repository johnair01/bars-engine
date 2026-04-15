# Plan: Quest Grammar Skeleton Feedback

## Overview

Wire the skeleton feedback box to skeleton regeneration. When an admin enters feedback and clicks Regenerate Skeleton, the system uses that feedback to produce a new skeleton—or explains why a change could not be made. Show changes applied or explanations in the UI.

## Implementation Order

### 1. Wire feedback into regeneration (Phase 1)

- In `GenerationFlow.tsx`, pass `feedback` from `onRegenerate(feedback)` into the regeneration action.
- Extend `compileQuestSkeletonAction` input to accept optional `adminFeedback: string`.
- When `adminFeedback` is non-empty, branch to a feedback-aware path instead of rules-only compile.

### 2. Feedback-aware skeleton regeneration (Phase 2)

- Create `regenerateSkeletonWithFeedback` server action in `quest-grammar.ts`.
- Input: `currentSkeleton`, `feedback`, `unpackingContext` (answers, alignedAction, segment, etc.).
- Use AI to interpret feedback and produce modified skeleton. Schema: `{ packet, changesApplied, explanation? }`.
- Validate output against quest grammar schema; on invalid, return error with explanation.
- When AI cannot apply feedback, return `{ success: false, explanation }`.

### 3. UI changes (Phase 3)

- `SkeletonReview`: after Regenerate, show `changesApplied` summary when present.
- Show `explanation` when regeneration fails or returns partial.
- Regenerate button passes feedback; loading state during regeneration.

### 4. Edge cases (Phase 4)

- Empty feedback: rules-only compile (current behavior).
- Feedback that contradicts grammar: return explanation, no invalid skeleton.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/actions/quest-grammar.ts` | Add `regenerateSkeletonWithFeedback`; extend `compileQuestSkeletonAction` input |
| `src/app/admin/quest-grammar/GenerationFlow.tsx` | Pass feedback to regeneration; handle new result shape |
| `src/components/admin/SkeletonReview.tsx` | Display changesApplied, explanation |

## Verification

1. Enter feedback → Regenerate → new skeleton when applicable.
2. See "Changes applied" summary after successful regeneration.
3. See explanation when feedback cannot be applied.
4. Empty feedback → same as current (rules-only) behavior.
