# Task Breakdown: Twine Completion Hardening

## Phase 1: Robust Input Rendering
- [x] In `src/app/adventures/[id]/play/PassageRenderer.tsx`, parse `quest.inputs`.
- [x] Determine `hasActualInputs` by checking if the parsed array has length > 0.
- [x] Update `showInputs` logic to rely on `hasActualInputs`.

## Phase 2: Resolving the Double-Completion Deadlock
- [x] In `src/app/adventures/[id]/play/PassageRenderer.tsx`, update `handleEnd`.
- [x] If `!hasActualInputs` (meaning it was auto-completed by traversing to the end node), skip calling `completeQuest`.
- [x] Set `isSuccess = true` directly and trigger the redirect logic.

## Phase 3: Verification
- [x] Test the "The Labyrinth" quest to verify the empty inputs UI box is gone.
- [x] Test completion of "The Labyrinth" to ensure no Prisma timeout occurs.
