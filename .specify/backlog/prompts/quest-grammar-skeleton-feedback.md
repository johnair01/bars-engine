# Quest Grammar Skeleton Feedback

Implement the skeleton feedback spec per [.specify/specs/quest-grammar-skeleton-feedback/spec.md](../specs/quest-grammar-skeleton-feedback/spec.md).

## Summary

1. **Problem**: Feedback in the skeleton box does not create a new skeleton. Regenerate calls `compileQuestSkeletonAction` without passing feedback.
2. **Goal**: Feedback → regenerate skeleton in smart ways; show changes applied OR explain why a change wasn't made.
3. **Approach**: Add `regenerateSkeletonWithFeedback` action; AI interprets feedback and produces modified skeleton; UI shows changesApplied or explanation.

## Key files

- `src/actions/quest-grammar.ts` — Add `regenerateSkeletonWithFeedback`; extend `compileQuestSkeletonAction` input
- `src/app/admin/quest-grammar/GenerationFlow.tsx` — Pass feedback to regeneration; handle result shape
- `src/components/admin/SkeletonReview.tsx` — Display changesApplied, explanation

## Tasks

See [.specify/specs/quest-grammar-skeleton-feedback/tasks.md](../specs/quest-grammar-skeleton-feedback/tasks.md).
