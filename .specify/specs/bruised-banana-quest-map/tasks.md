# Tasks: Bruised Banana Quest Map (Kotter-Based)

## Instance Configuration

- [x] Verify `upsertInstance` in src/actions/instance.ts accepts startDate, endDate (seed uses db directly; form optional)
- [ ] Add startDate/endDate to Admin Instances form (optional; seed sets them)
- [x] Create data/bruised_banana_quest_map.json with instance config (goalAmountCents: 300000, startDate, endDate for 30 days)

## Quest Map Data

- [x] Add 8 quest definitions to data/bruised_banana_quest_map.json (Q-MAP-1 … Q-MAP-8)
- [x] Each quest: title, description from GATHERING_RESOURCES matrix, kotterStage 1–8, allyshipDomain: GATHERING_RESOURCES (fundraiser)
- [x] Each quest: visibility: public, isSystem: true, reward: 1

## Seed Script

- [x] Create scripts/seed_bruised_banana_quest_map.ts
- [x] Upsert Bruised Banana instance (slug from existing BB instance or bruised-banana)
- [x] Upsert 8 CustomBars with deterministic IDs (Q-MAP-1 … Q-MAP-8)
- [x] Use admin or first player as creatorId
- [x] Add npm script "seed:quest-map" to package.json

## Optional

- [ ] Create QuestThread "Bruised Banana Fundraiser Quest Map" and link 8 quests via ThreadQuest (for grouping)

## Verification Checklist

- [x] npm run seed:quest-map runs successfully
- [x] 8 quests exist with correct kotterStage (1–8)
- [x] Instance has goalAmountCents, startDate, endDate
- [ ] With Bruised Banana active at stage 2, Market shows only Stage 2 quest
- [ ] Player can createSubQuest under Stage 2 container
- [ ] Admin can advance kotterStage; next stage appears in Market
