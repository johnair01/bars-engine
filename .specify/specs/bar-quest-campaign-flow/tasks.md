# Tasks: BAR → Quest → Campaign Flow

## Phase 1: InsightBAR Type

- [x] Add `'insight'` to `BarType` in `src/lib/bars.ts`
- [x] In `src/actions/create-bar.ts`: when `metadata321` present, set `type: 'insight'` instead of `'vibe'`
- [ ] Verify: create BAR via 321 flow → type is insight (manual)
- [ ] Verify: create BAR without metadata321 → type is vibe (unchanged) (manual)
- [x] npm run build && npm run check

## Phase 2: Campaign Tagging

- [ ] Add `campaignRef String?` to CustomBar in prisma/schema.prisma
- [ ] Add `campaignGoal String?` to CustomBar in prisma/schema.prisma
- [ ] Run npm run db:sync
- [ ] Create `linkQuestToCampaign(questId, campaignRef, campaignGoal, allyshipDomain)` action
- [ ] Add "Link to campaign" form to quest detail or create flow (campaignRef, campaignGoal, allyshipDomain)
- [ ] npm run build && npm run check

## Phase 3: Gameboard Subquest Linkage

- [x] Create `attachQuestToSlot(slotId, existingQuestId)` — cost 1 vibeulon
- [x] When existingQuestId provided: verify quest has campaignRef + campaignGoal, player owns it
- [x] Set `parentId = slotQuestId` for existing quest; deduct 1 vibeulon
- [x] Add "Add your quest" UI on gameboard slot: list campaign-tagged quests, select and attach
- [x] Include `insight` type in campaign deck (gameboard lib)
- [ ] npm run build && npm run check

## Phase 4: Funding-Driven Stage Advance

- [ ] Add `stageGoalsCents String?` to Instance (JSON: stage → cents) or define threshold model
- [ ] In quest completion handler: when source=gameboard and subquest has funds in completionEffects, add to Instance.currentAmountCents
- [ ] Implement `advanceCampaignStageIfFundingMet(instanceId)`: check threshold, advance kotterStage
- [ ] On stage advance: clear slot, draw replacement (integrate with gameboard)
- [ ] Ensure fundraiser/subquest completion flow passes fundsRaisedCents in completionEffects
- [ ] npm run build && npm run check
