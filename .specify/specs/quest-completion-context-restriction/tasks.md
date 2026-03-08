# Tasks: Quest Completion Context Restriction

## Phase 1: Campaign Quest Detection

- [x] Create `src/lib/quest-scope.ts` with `isCampaignQuest(questId: string): Promise<boolean>`
- [x] Query: CustomBar → threadQuests → thread → adventure → campaignRef; return true if any thread has adventure with campaignRef
- [x] Handle edge cases: quest not in thread (false), adventure without campaignRef (false)

## Phase 2: Extend QuestCompletionContext

- [x] Add `source?: 'dashboard' | 'quest_wallet' | 'twine_end' | 'adventure_passage' | 'gameboard'` to `QuestCompletionContext` in `src/actions/quest-engine.ts`
- [x] Add campaign-quest guard in `completeQuestForPlayer`: if campaign quest and source !== 'gameboard', return error
- [x] Place guard before reward/transaction logic

## Phase 3: Restrict autoCompleteQuestFromTwine

- [x] In `src/actions/twine.ts` advanceRun: before calling `autoCompleteQuestFromTwine`, check `isCampaignQuest(questId)`
- [x] If campaign quest, skip auto-complete; set `questCompleted = false`
- [x] Verify PassageRenderer and TwineQuestModal handle `questCompleted: false` correctly (refresh, no redirect)

## Phase 4: Update Callers with source

- [x] QuestDetailModal: pass `{ source: 'dashboard', threadId }` to `completeQuest`
- [x] completeStarterQuest / StarterQuestBoard: pass `{ source: 'quest_wallet' }` to `completeQuest`
- [x] PassageRenderer.handleEnd: pass `{ source: 'twine_end', threadId }` to `completeQuest`
- [x] AdventurePlayer: pass `{ source: 'adventure_passage', threadId }` to `completeQuest`
- [x] Audit other callers (OnboardingRecommendation, TwineStoryReader, generate-quest): pass appropriate source

## Phase 5: AdventurePlayer UX for Blocked Campaign Quests

- [x] When `completeQuest` returns error containing "gameboard", show inline message: "This campaign quest must be completed on the gameboard"
- [x] Add link/button to `/campaign` (or future gameboard route)
- [x] Do not redirect away; let player read the message

## Phase 6: Verification

- [x] Run `npm run build`
- [x] Run `npm run check`
- [ ] Manual test: campaign quest + Twine END → no completion
- [ ] Manual test: campaign quest + Adventure completion → error + link
- [ ] Manual test: personal quest + dashboard → completes
- [ ] Manual test: personal quest + Twine END → completes
