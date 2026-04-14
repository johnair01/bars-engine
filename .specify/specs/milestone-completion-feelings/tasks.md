# Tasks: Milestone Completion Feelings

## Phase 1 — Predictions on Milestones

- [ ] **T1.1** Define feeling vocabulary in `src/lib/campaign/feelings/types.ts`
- [ ] **T1.2** Add `predictedFeelings` JSON field to `CampaignMilestone` in `prisma/schema.prisma`
- [ ] **T1.3** Create migration: `npx prisma migrate dev --name add_milestone_predicted_feelings`
- [ ] **T1.4** Run `npm run db:sync` and `npm run check`
- [ ] **T1.5** Implement `setMilestoneFeelings` server action in `src/actions/milestone-feelings.ts`
- [ ] **T1.6** Implement `setCampaignMilestoneFeelings` for bulk updates
- [ ] **T1.7** Implement validation: warn on empty `predictedFeelings`
- [ ] **T1.8** Display predicted feelings in milestone view component
- [ ] **T1.9** Write tests for setting feelings
- [ ] **T1.10** Write tests for validation warnings
- [ ] **T1.11** `npm run build` + `npm run check` pass

## Phase 2 — Player Reports

- [ ] **T2.1** Add `FeelingReport` model to `prisma/schema.prisma`
- [ ] **T2.2** Create migration: `npx prisma migrate dev --name add_feeling_reports`
- [ ] **T2.3** Run `npm run db:sync` and `npm run check`
- [ ] **T2.4** Implement `submitFeelingReport` server action
- [ ] **T2.5** Implement `getPlayerFeelingReports` (private to player)
- [ ] **T2.6** Enforce immutability (no update/delete endpoints)
- [ ] **T2.7** Build `FeelingReportForm` component for milestone completion
- [ ] **T2.8** Wire form into milestone completion flow
- [ ] **T2.9** Write tests for report submission
- [ ] **T2.10** Write tests for privacy enforcement
- [ ] **T2.11** Write tests for immutability
- [ ] **T2.12** `npm run build` + `npm run check` pass

## Phase 3 — Alignment & Profiles

- [ ] **T3.1** Implement alignment scoring algorithm in `src/lib/campaign/feelings/alignment.ts`
- [ ] **T3.2** Implement `computeMilestoneAlignment` server action
- [ ] **T3.3** Implement surprise detection (actual feelings beyond predictions)
- [ ] **T3.4** Implement miss detection (predicted feelings not reported)
- [ ] **T3.5** Implement `computeCampaignFeelingProfile` server action
- [ ] **T3.6** Build profile aggregation logic in `src/lib/campaign/feelings/profile.ts`
- [ ] **T3.7** Build `FeelingAlignmentView` component for milestone detail
- [ ] **T3.8** Build `FeelingProfilePanel` component for campaign dashboard
- [ ] **T3.9** Wire components into existing milestone and dashboard views
- [ ] **T3.10** Ensure aggregation anonymizes player identities
- [ ] **T3.11** Write tests for alignment scoring
- [ ] **T3.12** Write tests for profile aggregation
- [ ] **T3.13** Write tests for surprise/miss detection
- [ ] **T3.14** `npm run build` + `npm run check` pass

## Phase 4 — Q2 Verification

- [ ] **T4.1** Define keyword trigger lists per feeling in `src/lib/campaign/feelings/parser.ts`
- [ ] **T4.2** Implement `parseDesiredFeelings` server action
- [ ] **T4.3** Add `parsedDesiredFeelings` field to `CampaignInstance` in schema
- [ ] **T4.4** Create migration: `npx prisma migrate dev --name add_parsed_desired_feelings`
- [ ] **T4.5** Run `npm run db:sync` and `npm run check`
- [ ] **T4.6** Wire parser into campaign interview flow (parse `desiredFeeling` on save)
- [ ] **T4.7** Implement `verifyDesiredFeelingCoverage` server action
- [ ] **T4.8** Build `DesiredFeelingCoverageWarning` component
- [ ] **T4.9** Wire warning into campaign setup view
- [ ] **T4.10** Implement override: owner can manually adjust parsed feelings
- [ ] **T4.11** Link uncovered feelings to milestone editor
- [ ] **T4.12** Write tests for parser determinism
- [ ] **T4.13** Write tests for coverage verification
- [ ] **T4.14** Write tests for override flow
- [ ] **T4.15** `npm run build` + `npm run check` pass
