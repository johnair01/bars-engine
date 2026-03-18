# Tasks: Campaign Subcampaigns

## Phase 1: Schema + Domain Rules

- [x] **1.1** Add `Adventure.subcampaignDomain` (String?, nullable) to prisma/schema.prisma
- [x] **1.2** Add `Instance.primaryCampaignDomain` (String?) to prisma/schema.prisma
- [x] **1.3** Run `npm run db:sync` / `npm run db:push`
- [x] **1.4** Create `src/lib/campaign-subcampaigns.ts` with getSubcampaignDomains, getCampaignRef, parseCampaignRef, isValidAllyshipDomain

## Phase 2: Campaign Page Resolution

- [x] **2.1** Update campaign page to parse ref with parseCampaignRef (support bruised-banana:DIRECT_ACTION)
- [x] **2.2** Resolve Adventure by campaignRef + subcampaignDomain (exact match for subcampaigns, null for top-level)
- [x] **2.3** Fallback to slug match when no campaignRef+subcampaignDomain match

## Phase 3: Orientation Wiring

- [x] **3.1** Update assignOrientationThreads to include adventure in orientation thread query
- [x] **3.2** Filter subcampaign threads: only assign when player's allyshipDomains includes thread.adventure.subcampaignDomain

## Phase 4: Template Generation

- [x] **4.1** Extend GenerateOptions with campaignRef, subcampaignDomain
- [x] **4.2** generateFromTemplate sets Adventure.campaignRef and subcampaignDomain when provided
- [x] **4.3** Update generateFromTemplateAction to accept options
- [x] **4.4** Add "Generate for campaign" expandable section in GenerateTemplateButton with campaignRef + subcampaignDomain selector
- [x] **4.5** Templates page passes instance.campaignRef and instance.primaryCampaignDomain to button

## Phase 5: Instance primaryCampaignDomain (Optional)

- [ ] **5.1** Seed or admin UI: set Instance.primaryCampaignDomain = GATHERING_RESOURCES for bruised-banana instance
- [ ] **5.2** Document in ENV_AND_VERCEL or admin docs

## Phase 6: Direct Action Inheritance (Future)

- [ ] **6.1** Campaign deck: when subcampaign is Direct Action, filter quests by parent domain context
- [ ] **6.2** Add parentDomainContext to CustomBar or derive from campaign
