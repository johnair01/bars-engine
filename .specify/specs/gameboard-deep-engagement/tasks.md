# Tasks: Gameboard Deep Engagement

## Phase 1: 3-step completion flow

- [x] Add GameboardSlotProgress model (wakeUpAt, cleanUpAt, cleanUpReflection on GameboardSlot)
- [x] recordWakeUp(slotId) action
- [x] recordCleanUp(slotId, reflection) action
- [x] completeGameboardQuest: require wakeUp + cleanUp before allowing completion
- [x] Gameboard card UI: Read (Wake Up) step — expand/view, acknowledge
- [x] Gameboard card UI: Reflect (Clean Up) step — reflection input
- [x] Gameboard card UI: Complete (Show Up) — only enabled after 1+2; de-emphasize visually

## Phase 2: Steward model

- [x] Add stewardId to GameboardSlot (or GameboardSteward join)
- [x] takeSlotQuest(slotId) — player becomes steward
- [x] releaseSlotQuest(slotId) — steward releases
- [x] Slot UI: show steward name when present
- [x] Slot UI: show progress (wake/clean/show)

## Phase 3: Bidding, AID, Fork

- [x] GameboardBid model
- [x] placeBid(slotId, amount) action
- [x] Bid logic: highest bidder, time window, steward release
- [x] offerAid(slotId, message, type?) — type: direct (EFA) or quest (create quest to unblock)
- [x] For quest-type AID: create quest (quick form or link existing) and link to steward
- [x] forkQuestPrivately(questId) action
- [x] UI: Bid, Offer AID (direct + create quest), Fork buttons

## Phase 4: Hexagram + campaign goal quest generation

- [x] generateCampaignThroughputQuest via previewGameboardAlignedQuest + publish (hexagram, campaignRef, period)
- [x] Prompt: How does [stage action] tie to people showing up in [campaign goal]?
- [x] No Kotter stage names in generated titles (buildQuestPromptContext)
- [x] Wire to gameboard Add quest modal (admin Generate grammatical quest)

## Phase 5: Verification

- [x] npm run build and check
- [ ] Manual: 3-step flow, steward, hexagram generation
