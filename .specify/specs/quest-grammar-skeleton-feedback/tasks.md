# Tasks: Quest Grammar Skeleton Feedback

## Phase 1: Wire feedback to regeneration

- [ ] Extend `compileQuestSkeletonAction` input with optional `adminFeedback: string`
- [ ] In `GenerationFlow.tsx`, pass `feedback` from `onRegenerate(feedback)` to `compileQuestSkeletonAction`
- [ ] When `adminFeedback` is non-empty, call feedback-aware path (Phase 2 action)

## Phase 2: Feedback-aware skeleton regeneration

- [ ] Create `regenerateSkeletonWithFeedback` server action
- [ ] Implement AI interpretation of feedback → modified skeleton
- [ ] Use `generateObjectWithCache` with schema: `{ packet, changesApplied, explanation? }`
- [ ] Validate output against quest grammar schema
- [ ] Return `{ success: false, explanation }` when feedback cannot be applied

## Phase 3: UI changes

- [ ] SkeletonReview: accept `changesApplied?: string`, `explanation?: string` props
- [ ] Display changesApplied summary after successful Regenerate
- [ ] Display explanation when regeneration fails or partial
- [ ] GenerationFlow: pass result shape to SkeletonReview; handle new response

## Phase 4: Edge cases

- [ ] Empty feedback: use rules-only compile (current behavior)
- [ ] Grammar-contradicting feedback: return explanation, no invalid skeleton

## Verification

- [ ] Manual: feedback → Regenerate → new skeleton
- [ ] Manual: changesApplied visible after success
- [ ] Manual: explanation visible on failure
- [ ] `npm run build` passes
