# Tasks: Game Loop — Charge → Quest → Campaign

## Phase 1: Diagnose and fix 321→quest

- [x] **1.1** Add logging to `createQuestFrom321Metadata` — log entry, player, nation/archetype check, create result, any error. Verify path when "Turn into Quest" clicked.
- [x] **1.2** Verify nation/archetype gate — `createQuestFrom321Metadata` does not require nation/archetype (quest creation). Check `extractCreationIntent` for moveType. Fix any gate that blocks.
- [x] **1.3** Fix redirect after create — Shadow321Form `handleTurnIntoQuest`: on success, `router.push('/hand?quest=' + questId)` (or `/hand` with quest highlight). Ensure `router.refresh()`.
- [x] **1.4** Hand: read `searchParams.quest` — when present, highlight or scroll to that quest. Optional: show placement modal for orphan quest.
- [ ] **1.5** Manual test: 321 → Turn into Quest → verify quest created, redirect to Hand, quest visible.

## Phase 2: Placement API and Hand integration

- [x] **2.1** Create or extend `src/actions/quest-placement.ts` with `addQuestToThread(questId, threadId, position?)` — Server Action. Appends via ThreadQuest. Player must own quest.
- [x] **2.2** Add `addQuestAsSubquestToGameboard(questId, slotQuestId)` — Sets `parentId`, `campaignRef`. Player must own quest; slot on active gameboard.
- [x] **2.3** Add `getPlacementOptionsForQuest(questId)` — Returns threads and gameboard slots. Limit to 2–3 when possible (reduce overwhelm).
- [x] **2.4** Extend Hand — Fetch personal quests (creatorId=player, type=quest, parentId=null, sourceBarId or source321SessionId). Show "Add to thread" / "Add as subquest to gameboard".
- [x] **2.5** Wire placement actions — Hand and QuestDetailModal: call `addQuestToThread` or `addQuestAsSubquestToGameboard`. Revalidate paths.
- [x] **2.6** Post-321 placement — After create, redirect to Hand with placement modal or inline placement UI. Show 2–3 options.
- [x] **2.7** Extend `createQuestFrom321Metadata` — Optional `target?: { type: 'thread'|'gameboard'; threadId?: string; slotQuestId?: string }`. When provided, call placement after create.

## Phase 3: Dashboard campaign overview

- [x] **3.1** Add `getCampaignsForPlayer(playerId)` — Returns campaigns where player is leader/owner. Query InstanceMember + role or equivalent.
- [x] **3.2** Add `getNextMilestoneForCampaign(campaignId)` — Returns next key quest or Kotter stage. Minimal: next quest to complete, or stage label.
- [x] **3.3** Dashboard section "Campaigns I'm responsible for" — List 2–3 campaigns with next milestone. Progress bar or single next action.
- [x] **3.4** Reduce overwhelm — Prioritize campaigns; limit list. Shaman: "What is the next smallest honest action?"

## Verification

- [ ] **V1** 321 → Turn into Quest → Quest created → Hand shows quest with placement options.
- [ ] **V2** Add as subquest to gameboard → Quest appears under slot.
- [ ] **V3** Add to thread → Quest appears in thread.
- [ ] **V4** Dashboard shows "Campaigns I'm responsible for" (when applicable).
- [ ] **V5** `npm run build` and `npm run check` pass.
