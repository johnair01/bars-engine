# Tasks: Allyship Domains (WHERE) + Campaign Path

## Phase 1: Schema
- [x] Add `allyshipDomain` to CustomBar in prisma/schema.prisma
- [x] Add `campaignDomainPreference` to Player in prisma/schema.prisma
- [x] Run `npm run db:sync`

## Phase 2: Quest creation
- [x] Add allyship domain selector to QuestWizard (Step 3: Settings)
- [x] Add allyship domain selector to CreateBarForm
- [x] Update createCustomBar and createQuestFromWizard to persist allyshipDomain

## Phase 3: Player preference
- [x] Create `updateCampaignDomainPreference` server action
- [x] Create CampaignPathForm component (multi-select checkboxes)
- [x] Add "Update campaign path" button and form to Market page

## Phase 4: Market filter
- [x] Update getMarketContent to filter by campaignDomainPreference when non-empty
- [x] Return campaignDomainPreference in market response for form initial state
- [x] Add allyship domain badge to QuestCard

## Phase 5: Seed
- [x] Update seed_party_bb_bday_001.ts with campaign→domain mapping
- [x] Add cert-allyship-domains-v1 to seed-cyoa-certification-quests.ts

## Verification
- Run `npm run seed:party` — Bruised Banana quests get allyshipDomain
- Run `npm run seed:cert:cyoa` — certification quest appears on Adventures
- Market: set domains → filter applies; empty → show all
- "Update campaign path" → change domains anytime
