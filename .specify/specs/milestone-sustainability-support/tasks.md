# Tasks: Milestone Sustainability Support

## Phase 1 — Drain Detection

- [ ] **T1.1** Define drain types and indicators in `src/lib/campaign/sustainability/drain-types.ts`
- [ ] **T1.2** Implement keyword-based detection in `src/lib/campaign/sustainability/drain-detection.ts`
- [ ] **T1.3** Implement reasoning string generation per drain type
- [ ] **T1.4** Define drain → support recommendation mapping in `drain-support-mapping.ts`
- [ ] **T1.5** Implement `analyzeMilestoneSustainability` server action
- [ ] **T1.6** Implement `analyzeCampaignSustainability` server action
- [ ] **T1.7** Implement severity calculation (mild/moderate/high based on indicator count)
- [ ] **T1.8** Write tests for detection on each drain type with known examples
- [ ] **T1.9** Write tests for multi-drain milestones (additive)
- [ ] **T1.10** Write tests for severity calculation
- [ ] **T1.11** `npm run build` + `npm run check` pass

## Phase 2 — Support Structure Models

- [ ] **T2.1** Add `SupportStructure` and `MilestoneSupportAttachment` models to `prisma/schema.prisma`
- [ ] **T2.2** Extend `CampaignMilestone` with sustainability fields (`drainTypes`, `flagSeverity`, `flagReasoning`, `declinedSupportTypes`)
- [ ] **T2.3** Create migration: `npx prisma migrate dev --name add_milestone_sustainability_support`
- [ ] **T2.4** Run `npm run db:sync` and `npm run check`
- [ ] **T2.5** Define support type schema with per-type required fields in `src/lib/campaign/sustainability/support-types.ts`
- [ ] **T2.6** Implement type-aware validators
- [ ] **T2.7** Implement `createSupportStructure` server action
- [ ] **T2.8** Implement `attachSupportToMilestone` server action
- [ ] **T2.9** Implement `declineSupportForMilestone` server action
- [ ] **T2.10** Implement `markSupportInPlace` server action
- [ ] **T2.11** Implement `getMilestoneSupports` server action
- [ ] **T2.12** Implement `getPlayerSupportLibrary` server action
- [ ] **T2.13** Verify supports are NOT cascade-deleted when campaign is composted
- [ ] **T2.14** Write tests for CRUD operations
- [ ] **T2.15** Write tests for type-aware validation
- [ ] **T2.16** Write tests for composting persistence
- [ ] **T2.17** `npm run build` + `npm run check` pass

## Phase 3 — Partner Confirmation Flow

- [ ] **T3.1** Implement partner notification on relational support creation (when `partnerId` is set)
- [ ] **T3.2** Implement `confirmPartnerSupport` server action (called by partner)
- [ ] **T3.3** Implement `declinePartnerSupport` server action
- [ ] **T3.4** Wire confirmation to state transition (`pending` → `in-place`)
- [ ] **T3.5** Notify owner on partner decline
- [ ] **T3.6** Allow manual `markSupportInPlace` for external partners (no `partnerId`)
- [ ] **T3.7** Write tests for notification delivery
- [ ] **T3.8** Write tests for confirmation flow
- [ ] **T3.9** Write tests for decline handling
- [ ] **T3.10** `npm run build` + `npm run check` pass

## Phase 4 — Nudge System

- [ ] **T4.1** Implement `checkMilestoneSupportReadiness` server action
- [ ] **T4.2** Build readiness analyzer in `src/lib/campaign/sustainability/readiness-check.ts`
- [ ] **T4.3** Build nudge message generator in `src/lib/campaign/sustainability/nudge-generator.ts`
- [ ] **T4.4** Hook readiness check into BAR planting flow
- [ ] **T4.5** Hook readiness check into milestone work entry points
- [ ] **T4.6** Implement session-scoped dismissal tracking
- [ ] **T4.7** Implement frequency limiting (one nudge per milestone per session)
- [ ] **T4.8** Verify nudges never block UI flow
- [ ] **T4.9** Write tests for readiness check accuracy
- [ ] **T4.10** Write tests for nudge generation
- [ ] **T4.11** Write tests for frequency limiting
- [ ] **T4.12** `npm run build` + `npm run check` pass

## Phase 5 — UI Components

- [ ] **T5.1** Build `SustainabilityFlagBadge` component (drain types, severity, reasoning)
- [ ] **T5.2** Build `SupportCreationForm` component with type-aware fields
- [ ] **T5.3** Build `SupportLibraryBrowser` component with filtering
- [ ] **T5.4** Build `NudgeToast` component (dismissable soft warning)
- [ ] **T5.5** Build `MilestoneSupportsPanel` component (attached/pending/declined view)
- [ ] **T5.6** Wire `SustainabilityFlagBadge` into milestone view
- [ ] **T5.7** Wire `SupportCreationForm` into drain recommendation flow
- [ ] **T5.8** Wire `SupportLibraryBrowser` into player profile
- [ ] **T5.9** Wire `NudgeToast` into milestone work entry points
- [ ] **T5.10** Wire `MilestoneSupportsPanel` into milestone detail view
- [ ] **T5.11** Verify all UI is non-blocking
- [ ] **T5.12** Write component tests
- [ ] **T5.13** `npm run build` + `npm run check` pass
