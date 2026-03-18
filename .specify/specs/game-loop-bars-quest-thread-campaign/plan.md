# Plan: Game Loop BARS↔Quest↔Thread↔Campaign

## Overview

Wire the main game loop so players have a place for personal quests and can complete the flow BAR → Quest → Subquest on gameboard. Phase 1 adds a Personal Quest Hub and the placement API. Phase 2 (deferred) covers Campaign → Quest → BAR.

## Phases

### Phase 1: Extend Hand + Placement API + Charge Flow Integration

**Goal**: Extend the existing Hand (`/hand`) so players can add quests (created from BARs) to threads or as subquests on the gameboard.

1. **Extend Hand** — Add to `src/app/hand/page.tsx`: charge captures in BARs section, personal quests (from BARs, unplaced), "Turn BAR into quest" (Explore), "Add as subquest to gameboard" / "Add to thread".
2. **API layer** — Add `addQuestToThread`, `addQuestAsSubquestToGameboard`, `getPlacementOptionsForQuest` in `src/actions/quest-placement.ts`.
3. **Charge flow** — After `createQuestFromSuggestion` succeeds, show placement options (Add to thread, Add as subquest to gameboard). Extend ChargeExploreFlow and ChargeCaptureForm.
4. **Hand + quest detail** — For orphan quests: show "Add to thread" / "Add as subquest to gameboard".

**File impacts**:
- `src/app/hand/page.tsx` — extend with charge captures, personal quests, placement actions (existing: Private Drafts, CreateBarForm, FaceMovesSection)
- `src/actions/quest-placement.ts` (new) — addQuestToThread, addQuestAsSubquestToGameboard, getPlacementOptionsForQuest
- `src/actions/charge-capture.ts` — optional `target` param on createQuestFromSuggestion
- `src/components/charge-capture/ChargeExploreFlow.tsx` — placement UI after create (Add to thread, Add as subquest to gameboard)
- `src/components/charge-capture/ChargeCaptureForm.tsx` — placement UI after create
- `src/components/QuestDetailModal.tsx` or wallet/hub quest detail — placement actions for orphan quests

### Phase 2: Reverse Flow (deferred)

- Campaign → generate grammatical quests (gameboard slot generation)
- Quests attract BARs (BAR response, subquest attachment)
- Spec when ready.

## Dependencies

- QuestThread, ThreadQuest schema (existing)
- Quest nesting (parentId, appendExistingQuest)
- Campaign gameboard slots (campaignRef, slotQuestId)
- Charge capture flow (unchanged except for post-create UX)

## Verification

- Create BAR → Explore → Create quest → Add as subquest to gameboard → Quest appears under slot
- Capture charge → Explore → Create quest → Add to thread → Quest appears in thread
- Hand shows charge captures, personal quests, and placement actions
- Verification quest: cert-game-loop-placement-v1
