# Tasks: Campaign Domain Decks

## Phase 1: Deck Model and Draw Logic

- [x] Add `allyshipDomain` and `kotterStage` to CustomBar if missing (already present)
- [x] Add cycle tracking: Instance JSON field (domainDeckCycles)
- [x] Implement `getCampaignDomainDeck(instanceId, campaignRef, domain, kotterStage)`
- [x] Implement `drawFromDeck(instanceId, campaignRef, domain, kotterStage, count, excludeQuestIds)`
- [x] Implement `markQuestPlayed(instanceId, domain, questId)`
- [x] Implement `resetDeckCycle(instanceId, domain)`
- [x] Implement `translateQuestForStage(quest, domain, kotterStage)` using getStageAction

## Phase 2: Gameboard Integration

- [x] Extend gameboard draw to use domain deck when instance has domain (or campaignRef bruised-banana)
- [x] Call `markQuestPlayed` on quest completion in replaceSlotWithDraw
- [x] Call `resetDeckCycle` when deck exhausted before draw
- [x] Apply translation when returning slots from getOrCreateGameboardSlots
- [x] Verify Bruised Banana uses GATHERING_RESOURCES deck (fallback when campaignRef bruised-banana)

## Phase 3: Campaign Moves (Stub)

- [x] Add campaign move type/enum (WAKE_UP, CLEAN_UP, GROW_UP, SHOW_UP) in campaign-domain-deck.ts
- [x] Document in spec; no automation

## Phase 4: Verification

- [ ] npm run build
- [ ] npm run check
- [ ] Manual: draw 8, complete one, verify replace
- [ ] Manual: exhaust deck, verify reset

## Phase 5: Admin (Optional)

- [x] Add allyshipDomain to Instance schema
- [x] Add allyshipDomain to Instance edit form (Admin → Instances)
