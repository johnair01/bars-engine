# Plan: Quest Completion Context Restriction

## Summary

Add quest-type awareness and completion-context checks so that campaign quests can only be completed on the gameboard, personal/public quests remain completable from dashboard and quest wallet, and CYOA map nodes never trigger quest completion. No schema changes; use existing ThreadQuest → QuestThread → Adventure → campaignRef relations.

## Phase 1: Campaign Quest Detection

### 1.1 Add isCampaignQuest helper

**File**: `src/lib/quest-scope.ts` (new) or `src/actions/quest-engine.ts`

- Query: CustomBar (questId) → threadQuests (ThreadQuest) → thread (QuestThread) → adventure (Adventure) → campaignRef
- Return true if any thread has adventureId and that adventure has campaignRef set
- Export `isCampaignQuest(questId: string): Promise<boolean>`

### 1.2 Edge cases

- Quest not in any thread → false (personal/public)
- Thread has adventureId but adventure has no campaignRef → false (e.g. initiation flow)
- Multiple threads: if any qualifies, return true

## Phase 2: Extend QuestCompletionContext

### 2.1 Add source to context

**File**: `src/actions/quest-engine.ts`

```ts
type QuestCompletionContext = {
  packId?: string
  threadId?: string
  source?: 'dashboard' | 'quest_wallet' | 'twine_end' | 'adventure_passage' | 'gameboard'
}
```

### 2.2 Add campaign-quest guard in completeQuestForPlayer

- After fetching quest, call `isCampaignQuest(questId)`
- If true and `context?.source !== 'gameboard'`, return `{ error: 'Campaign quests can only be completed on the gameboard.' }`
- Place guard before reward/transaction logic

## Phase 3: Restrict autoCompleteQuestFromTwine

### 3.1 Guard in advanceRun

**File**: `src/actions/twine.ts`

- Before `if (questId && isEndPassage)`, add: `if (questId && isEndPassage && !(await isCampaignQuest(questId)))`
- Or: call `isCampaignQuest` inside the block; if true, skip `autoCompleteQuestFromTwine` and set `questCompleted = false`

### 3.2 No changes to PassageRenderer / TwineQuestModal

- They already handle `questCompleted: false` (refresh, no redirect)
- Campaign quest: player reaches END, gets refresh, sees "Complete on gameboard" messaging (Phase 4)

## Phase 4: Update Callers with source

### 4.1 QuestDetailModal

**File**: `src/components/QuestDetailModal.tsx`

- Pass `{ source: 'dashboard', threadId }` (or equivalent) when calling `completeQuest`

### 4.2 completeStarterQuest / StarterQuestBoard

**File**: `src/actions/starter-quests.ts` (or wherever completeStarterQuest lives)

- Pass `{ source: 'quest_wallet' }` when calling `completeQuest`

### 4.3 PassageRenderer.handleEnd

**File**: `src/app/adventures/[id]/play/PassageRenderer.tsx`

- Pass `{ source: 'twine_end', threadId }` when calling `completeQuest`

### 4.4 AdventurePlayer

**File**: `src/app/adventure/[id]/play/AdventurePlayer.tsx`

- Pass `{ source: 'adventure_passage', threadId }` when calling `completeQuest`
- When result has `error` and message indicates campaign quest: show "This campaign quest must be completed on the gameboard" and link to `/campaign`

### 4.5 Other callers

- `OnboardingRecommendation`, `TwineStoryReader`, `generate-quest`, etc.: pass appropriate source or omit (treated as allowed for non-campaign)
- For script/admin flows: pass `source: 'gameboard'` if completing campaign quests, or handle error

## Phase 5: AdventurePlayer UX for Blocked Campaign Quests

### 5.1 Error handling

- When `completeQuest` returns `error` containing "gameboard", show inline message
- Add button/link: "Complete on gameboard" → `/campaign` (or future `/campaign/board`)
- Do not redirect away; let player read the message

### 5.2 Optional: isCampaignQuest from API

- If AdventurePlayer needs to know ahead of time (e.g. to show different CTA), add `GET /api/quests/[id]/scope` or include in quest fetch
- Not required for Phase 1; can add if UX needs it

## Phase 6: Verification

### 6.1 Build and check

- `npm run build`
- `npm run check`

### 6.2 Manual test cases

- Campaign quest + Twine END → no completion, refresh
- Campaign quest + Adventure completion passage → error, link to gameboard
- Personal quest + dashboard → completes
- Personal quest + Twine END → completes
- Quest not in thread + any source → completes

## Deferred: Gameboard Completion Flow

- When gameboard UI exists, add completion action that passes `source: 'gameboard'`
- Route: `/campaign`, `/campaign/board`, or equivalent
- Out of scope for this iteration
