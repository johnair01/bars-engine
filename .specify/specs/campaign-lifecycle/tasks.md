# Tasks: Campaign Lifecycle

## Phase 1 — Campaign State Machine + Clock Types

- [ ] **T1.1** Add lifecycle fields to campaign instance in `prisma/schema.prisma` (`state`, `clockType`, `clockGated`, `deadline`, `clockStartedAt`, `kotterStage`, `bigVision`, `desiredFeeling`, `compostedAt`, `parentCampaignRef`, `parentSpokeIndex`)
- [ ] **T1.2** Create migration: `npx prisma migrate dev --name add_campaign_lifecycle`
- [ ] **T1.3** Run `npm run db:sync` and `npm run check`
- [ ] **T1.4** Define lifecycle types in `src/lib/campaign/types.ts` (`CampaignState`, `ClockType`, lifecycle-related interfaces)
- [ ] **T1.5** Implement state machine logic in `src/lib/campaign/lifecycle.ts` (valid transitions, guard checks)
- [ ] **T1.6** Implement deterministic Kotter stage calculation for time-bounded campaigns in `src/lib/campaign/lifecycle.ts`
- [ ] **T1.7** Implement threshold-based Kotter advancement for completion-bounded campaigns
- [ ] **T1.8** Implement `createCampaign` server action in `src/actions/campaign-lifecycle.ts`
- [ ] **T1.9** Implement `activateCampaign` server action
- [ ] **T1.10** Implement `getCampaignMaturity` server action
- [ ] **T1.11** Implement `advanceKotterStage` server action (completion-bounded only)
- [ ] **T1.12** Write tests for state machine transitions
- [ ] **T1.13** Write tests for Kotter stage calculations (time-bounded + completion-bounded)
- [ ] **T1.14** `npm run build` + `npm run check` pass

## Phase 2 — Milestone Interview + Generation

- [ ] **T2.1** Add `CampaignMilestone` model to `prisma/schema.prisma`
- [ ] **T2.2** Create migration: `npx prisma migrate dev --name add_campaign_milestones`
- [ ] **T2.3** Run `npm run db:sync` and `npm run check`
- [ ] **T2.4** Implement `setCampaignMilestones` server action (validate spoke binding, sustainability check)
- [ ] **T2.5** Implement sustainability flag detection in `src/lib/campaign/milestone-interview.ts`
- [ ] **T2.6** Implement `emitVisionQuest` server action (emit Wake Up BAR seed for vague vision)
- [ ] **T2.7** Implement `updateMilestoneProgress` in `src/lib/campaign/milestone-progress.ts` (called on BAR plant/maturation)
- [ ] **T2.8** Define milestone-to-Kotter bridge: how milestone completion contributes to Kotter advancement thresholds
- [ ] **T2.9** Write tests for milestone CRUD + sustainability flags
- [ ] **T2.10** Write tests for vision quest emission
- [ ] **T2.11** Write tests for milestone progress updates
- [ ] **T2.12** `npm run build` + `npm run check` pass

## Phase 3 — Composting Protocol

- [ ] **T3.1** Add `LibraryEntry` model to `prisma/schema.prisma`
- [ ] **T3.2** Create migration: `npx prisma migrate dev --name add_library_entry`
- [ ] **T3.3** Run `npm run db:sync` and `npm run check`
- [ ] **T3.4** Implement `compostCampaign` server action (ACTIVE → COMPOSTING transition, auto-trigger for expired clocks)
- [ ] **T3.5** Implement `getCompostingOptions` — analyze campaign state for available choices
- [ ] **T3.6** Implement `resolveComposting` server action — handle reflect, spin-off, publish, walk-away choices
- [ ] **T3.7** Implement spoke spin-off logic — create new ACTIVE campaign from spoke, preserve BAR material
- [ ] **T3.8** Implement `publishToLibrary` — serialize template + learnings into LibraryEntry
- [ ] **T3.9** Implement `browseLibrary` + `instantiateFromTemplate` — browse and create from published templates
- [ ] **T3.10** Implement optional reflection mini-campaign creation
- [ ] **T3.11** Write tests for composting flow end-to-end
- [ ] **T3.12** Write tests for spoke spin-off data preservation
- [ ] **T3.13** Write tests for library publish + instantiate round-trip
- [ ] **T3.14** `npm run build` + `npm run check` pass

## Phase 4 — Clock-Gated Content

- [ ] **T4.1** Implement spoke unlock schedule calculation in `src/lib/campaign/clock-gate.ts`
- [ ] **T4.2** Implement spoke gate check in hub rendering (check unlock time before allowing entry)
- [ ] **T4.3** Implement locked spoke portal UI in `src/components/campaign-hub/LockedSpokePortal.tsx` (visible but inaccessible, shows countdown)
- [ ] **T4.4** Implement unlock indicator/notification when spoke becomes accessible
- [ ] **T4.5** Write tests for unlock schedule calculation
- [ ] **T4.6** Write tests for gate check logic
- [ ] **T4.7** `npm run build` + `npm run check` pass
