# Tasks: Daemon Seeds, BAR Capture, and Charge Routing

## Phase 1: Schema and Services

- [ ] **T1.1** Add DaemonSeed, BarChargeCapture, BarRoutingEvent, BarAttachment, QuestChargeAllocation models to prisma/schema.prisma
- [ ] **T1.2** Add relations to CustomBar and Player; run `npm run db:sync`
- [ ] **T1.3** Create `src/services/daemon-seed-service.ts` (createFromBar, getById, listByPlayer)
- [ ] **T1.4** Create `src/services/bar-charge-service.ts` (captureFrom321, getByBarId, markRouted)
- [ ] **T1.5** Create `src/services/bar-routing-service.ts` (routeToDaemonSeed, convertToVibeulon, allocateToQuest, attachToQuest, attachToBar)
- [ ] **T1.6** Create `src/services/bar-attachment-service.ts` (attach, listAttachments, listAttachmentsTo)
- [ ] **T1.7** Create `src/services/quest-allocation-service.ts` (allocateFromBar, getAllocationsForQuest)

## Phase 2: Charge Capture Integration

- [ ] **T2.1** Extend createCustomBar: when metadata321 present, create BarChargeCapture (sourceType=THREE_TWO_ONE, sourceSessionId)
- [ ] **T2.2** Extend createChargeBar: create BarChargeCapture (sourceType=CHARGE_CAPTURE or MANUAL)
- [ ] **T2.3** Add server actions: createDaemonSeedFromBar, convertBarChargeToVibeulon, allocateBarChargeToQuest, attachBarToQuest, attachBarToBar

## Phase 3: UI

- [ ] **T3.1** Post-321 routing panel in Shadow321Form or post-BAR-creation flow: Turn into Daemon Seed, Convert to Vibeulon, Allocate to Quest, Attach to Quest, Attach to BAR
- [ ] **T3.2** BAR detail view: show BarChargeCapture, routing history, linked DaemonSeed, attachments
- [ ] **T3.3** Daemon seed detail view: `/daemon-seeds/[id]`
- [ ] **T3.4** Quest detail: show QuestChargeAllocation, BarAttachment; "Allocate from BAR" action

## Phase 4: Lineage and Deftness

- [ ] **T4.1** Create SourceLineageEdge entries for routing events (or use BarRoutingEvent as lineage)
- [ ] **T4.2** Add deftness hooks (stubs): evaluateDaemonIdentification, evaluateBarCapture, evaluateChargeRouting

## Phase 5: Verification

- [ ] **T5.1** Run `npm run build` and `npm run check`
- [ ] **T5.2** Add tests: bar-charge-service, bar-routing-service, daemon-seed-service, bar-attachment-service, quest-allocation-service
