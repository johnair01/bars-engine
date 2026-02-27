# Tasks: Campaign Kotter Structure + Domain × Kotter Matrix

## Phase 1: Instance-Level Kotter

### Schema
- [x] Add `kotterStage Int @default(1)` to Instance in prisma/schema.prisma
- [x] Run `npm run db:sync`

### Admin
- [x] Update `upsertInstance` in src/actions/instance.ts to accept and persist kotterStage
- [x] Add Kotter stage dropdown to Admin Instances form (src/app/admin/instances/page.tsx)
- [x] For edit: prefill kotterStage from existing instance

### Market
- [x] Import getActiveInstance in src/actions/market.ts
- [x] Filter publicQuests by instance.kotterStage when active instance exists
- [x] Preserve existing filters (campaignDomainPreference, nation, playbook, globalState.isPaused)

### Event Page
- [x] Display instance kotterStage on Event page (e.g. "Stage 2: Coalition")
- [x] Use KOTTER_STAGES from @/lib/kotter for stage name

### Lore
- [x] Create .agent/context/kotter-by-domain.md with Domain × Kotter matrix
- [x] Add reference in FOUNDATIONS.md or ARCHITECTURE.md

### Thresholds
- [x] Create .specify/specs/campaign-kotter-domains/THRESHOLDS.md with placeholder table

## Phase 2: Campaign Model + New Player Encounter

### Schema
- [ ] Add Campaign model to prisma/schema.prisma
- [ ] Run `npm run db:sync`

### Admin
- [ ] Create src/actions/campaign.ts (createCampaign, updateCampaign, listCampaignsByInstance)
- [ ] Create Admin campaigns page or section for instances
- [ ] Link from Instance detail to campaigns

### Market
- [ ] Update market.ts to filter by campaign when campaigns exist
- [ ] Fallback to instance kotterStage when no campaigns

### New Player Encounter
- [ ] Add campaign context block to Market or Event page
- [ ] Show campaign name, domain, stage for active instance

## Verification Checklist

- [ ] Admin can set instance kotterStage; persists
- [ ] Market shows only quests matching instance stage when instance active
- [ ] Event page shows current stage
- [ ] kotter-by-domain.md exists
- [ ] THRESHOLDS.md exists
