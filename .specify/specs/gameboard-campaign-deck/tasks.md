# Tasks: Gameboard and Campaign Deck

## Phase 1: Schema and Campaign Deck

- [x] Define period source: instance.kotterStage vs GlobalState.currentPeriod
- [x] Add GameboardSlot model (or equivalent) to schema: instanceId, campaignRef, period, slotIndex, questId, drawnAt
- [x] Run db:sync after schema change
- [x] Implement campaign deck query: eligible quests for instance/campaign
- [x] Implement drawFromCampaignDeck(instanceId, campaignRef, period, count)
- [x] Exclude already-drawn quests from draw

## Phase 2: Gameboard UI and Completion

- [x] Create gameboard route: /campaign/board or extend /campaign
- [x] Fetch slots for current instance/campaign/period
- [x] Initial draw: if 0 slots, draw 8
- [x] Render 8 slots as cards (quest title, description)
- [x] Complete button → completeQuest with source: 'gameboard'
- [x] On completion success: replaceSlotWithDraw(slotId)
- [x] Ensure /campaign links to gameboard when campaign quest blocked (already done in CT)

## Phase 3: Vibeulon Spend Actions

- [ ] Create convertGameboardCardToSubquest(slotId, playerId) — cost 1 vibeulon
- [ ] Create addCustomSubquestToGameboard(playerId, questInput?) — cost 1 vibeulon
- [ ] Define or create gameboard container quest per campaign
- [ ] Integrate with quest-nesting (parentId, createSubQuest)
- [ ] Add Spend vibeulon UI to gameboard cards

## Phase 4: Period and Draw Lifecycle

- [ ] On period advance (admin): clear slots for period, trigger redraw
- [ ] Idempotent initial draw on first load

## Phase 5: Verification

- [ ] npm run build
- [ ] npm run check
- [ ] Manual: draw 8, complete one, verify replace
- [ ] Manual: spend to convert, spend to add custom
