# Tasks: Golden Path Next Action Bridge

## Phase 1: Schema

- [x] Add NextActionBridge model or CustomBar fields (linkedQuestId, nextActionText)
- [x] Run `npm run db:sync`

## Phase 2: Server Action

- [x] Create `linkBarToQuestAsNextAction(barId, questId, nextAction)` server action
- [x] Implement getNextActionForQuest data fetch

## Phase 3: Quest Detail UI

- [x] Display "Your next action: X" when bridge exists
- [x] Add "Set next action" from BAR

## Phase 4: Verification

- [ ] Run `npm run build` and `npm run check`
