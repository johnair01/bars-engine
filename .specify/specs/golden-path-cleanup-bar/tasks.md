# Tasks: Golden Path Cleanup → BAR + Next Action

## Phase 1: EFA Extension

- [x] Extend `completeEmotionalFirstAidSession` to create BAR when applyToQuesting
- [x] Add nextAction to BAR metadata (or CustomBar JSON field)
- [x] Return barDraft in response

## Phase 2: 321 Extension

- [x] Extend 321 flow to add nextAction when creating BAR
- [x] Add "next smallest honest action" template/prompt
- [x] Persist in BAR metadata

## Phase 3: UI

- [x] Show "Suggested next action" after EFA/321 when barDraft present
- [x] Link to apply to quest (next-action-bridge)

## Phase 4: Verification

- [x] Run `npm run build` and `npm run check`
