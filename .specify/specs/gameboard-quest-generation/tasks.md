# Tasks: Gameboard Quest Generation

## Phase 1: Deck filtered by period

- [x] Extend `getCampaignDeckQuestIds(campaignRef, period?)` — filter by kotterStage when period provided
- [x] Update `drawFromCampaignDeck` to pass period to deck query
- [x] Update `getOrCreateGameboardSlots` — period already passed; ensure deck uses it

## Phase 2: Starter subquests for Stage 1

- [x] Add Q-MAP-1-WAKE, Q-MAP-1-CLEAN, Q-MAP-1-GROW, Q-MAP-1-SHOW to seed
- [x] Each: parentId Q-MAP-1, kotterStage 1, allyshipDomain GATHERING_RESOURCES, campaignRef bruised-banana
- [x] Run seed; verify 5 quests in deck for period 1 (container + 4 starters)

## Phase 3: Subquest UI on gameboard

- [x] Add "Add subquest" button to gameboard cards (containers)
- [x] Wire to createSubQuest(parentId); handle vibeulon cost
- [ ] Show subquests under parent (optional: expand/collapse)

## Phase 4: Feedback mechanism

- [x] Document feedback path (Report Issue or Admin edit)
- [ ] Optional: Add Report Issue to gameboard

## Phase 5: Verification

- [ ] npm run build and check
- [ ] Manual: Period 1 shows only Stage 1 quests
- [ ] Manual: Add subquest under container

## Phase 6: Verification Quest

- [x] Create cert-gameboard-quest-generation-v1 Twine story (4 steps)
- [x] Add to scripts/seed-cyoa-certification-quests.ts
- [ ] Verify quest appears on Adventures page (manual: run seed:cert)
