# Technical Implementation Plan: Twine Completion Hardening

## Architecture Strategy
We will enhance the client-side `PassageRenderer` to correctly parse `quest.inputs` and evaluate whether any inputs are genuinely required. We will also update the server actions and client logic to avoid double-processing completions.

## Component Design

### 1. `PassageRenderer.tsx` Updates
- **Input Parsing Safety:** When checking `quest?.inputs`, safely parse it. If it evaluates to an empty array `[]` (or equivalent), `showInputs` should functionally be false.
- **Completion Tracking:** Introduce a state `isAutoCompleted` or use existing logic to detect if the end passage already triggered an auto-complete.
- **`handleEnd` Logic Adjustments:** 
  - If inputs are required, `handleEnd` will submit them to `completeQuest` as normal. (In this scenario, `advanceRun` shouldn't have auto-completed it, but we'll safeguard this).
  - If NO inputs are required (meaning `autoCompleteQuestFromTwine` already fired when we loaded the end passage), `handleEnd` should skip calling `completeQuest(questId)` and simply perform the routing (`router.push`) and display the success state or proceed.

### 2. `twine.ts` Interactions
- `advanceRun` currently blindly triggers `autoCompleteQuestFromTwine` if it's the end passage. If the quest *has* inputs, we might want to defer completion to the UI. Conversely, if it auto-completes, the UI needs to know.
- Note: `autoCompleteQuestFromTwine` currently returns `boolean` indicating if it did work. In `advanceRun`, we return `questCompleted`. 
- `PassageRenderer` receives `isEnd` but doesn't explicitly receive `questCompleted` from the initial page load if it was the last passage. However, if it's the last passage and there are no inputs, we can assume it's completed. If there are inputs, we shouldn't have auto-completed.

### 3. Resolving the Deadlock
The deadlock happens because `advanceRun` fires to reach the last passage, completing the quest. Then the user clicks "Continue Journey" which fires `completeQuest`. 
**Fix:** In `PassageRenderer.tsx`, if we are at `isEnd` and there are no required inputs, the "Continue Journey" button should *only* navigate away. It should not call `completeQuest`.

## Database Impacts
Prevents simultaneous `playerQuest` updates, resolving Prisma `Transaction already closed` errors.
