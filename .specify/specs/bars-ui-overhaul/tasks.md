# Tasks: BARs UI Overhaul

## Phase 1: Foundation — Schema & Photo Upload

- [x] Create unified BAR module: `src/actions/bars.ts` or `src/lib/bars.ts` for all BAR ops
- [x] Add BarTopic, BarTopicAssignment models to prisma/schema.prisma
- [x] Add archivedAt, mergedIntoId, mergedFromIds to CustomBar
- [x] Add viewedAt DateTime? to BarShare for talisman first-view
- [x] Run `npm run db:sync`
- [x] Create migration for new schema
- [x] Implement photo upload: Asset bar_attachment, store in Vercel Blob or upload path
- [ ] Add "Add photo" to BAR create form (deferred: add on detail after create)
- [x] Add "Add photo" to BAR detail (edit mode)
- [ ] Add "Create BAR from photo" flow: upload → optional title/description → create CustomBar + Asset
- [x] Display primary asset image on BAR card and detail when present

## Phase 2: Talisman Receive UX

- [x] Track first view of BarShare (viewedAt or BarShareView)
- [x] Create TalismanReveal component: ceremonial layout, "A talisman has arrived", sender, timestamp
- [x] When opening received BAR for first time: show TalismanReveal before detail
- [x] Mark as viewed on reveal dismiss
- [x] Inbox: distinguish unviewed vs viewed (visual indicator)

## Phase 3: BAR as Seed (Grow Actions)

- [x] Add "Grow from this BAR" section to BAR detail page
- [x] Create Quest: button → growQuestFromBar action (one-tap, sourceBarId set)
- [x] Wake Daemon: button → growDaemonFromBar (one-tap, creates Daemon with sourceBarId)
- [x] Create Artifact: button → growArtifactFromBar (creates GrowthScene + BAR artifact, redirects to scene)
- [x] Ensure quest creation sets sourceBarId (growQuestFromBar)

## Phase 4: Organize & Compost

- [ ] Create BarTopic CRUD: createTopic, assignBarToTopic, removeBarFromTopic
- [ ] Topics UI: create topic, assign BAR to topic from detail
- [ ] Topics filter/tabs on /bars page
- [ ] mergeBars(barIds, mergedTitle?, mergedDescription?) server action; UI: confirmation + preview before merge
- [ ] archiveBar(barId), deleteBar(barId) server actions (soft)
- [ ] Compost view: list archived BARs, recover option
- [ ] CustomBar queries: exclude archived by default; include in compost view

## Phase 5: Admin Bulk & Polish

- [ ] Admin BAR list: filters (topic, creator, date)
- [ ] Admin: bulk select BARs
- [ ] Admin: bulk assign topic, bulk archive, bulk delete
- [ ] Admin: hard delete option (when archived)
- [ ] Mobile: touch targets, responsive layout
- [ ] Empty states: no BARs, no topics, no archived

## Phase 5.5: API Routes (Architect)

- [ ] Add route handlers for GET /api/bars, GET /api/bars/:id
- [ ] Add route handlers for grow actions, merge, archive, delete, attach-photo
- [ ] Add route handlers for topics CRUD
- [ ] Server actions call shared logic; routes for external consumers

## Phase 5.6: Audit, Face/Back Editor, Quest→BAR Collapse

*Plan: [PLAN_AUDIT_EDITOR_COLLAPSE.md](PLAN_AUDIT_EDITOR_COLLAPSE.md)*

### Workstream 1: Existing BARs Audit
- [x] Create audit script (scripts/audit-bars.ts or SQL)
- [x] Run audit: title ≠ first line, invitation BARs, kernel BARs
- [x] Document AUDIT_RESULTS.md
- [x] Remediate if needed (QuestProposal, invitation display)

### Workstream 2: Face/Back Card Editor
- [x] Decide Face/Back schema (explicit faceContent vs derive)
- [x] Detail: flip or tab UI for Face/Back
- [x] Create: card preview; Edit: edit mode for owner
- [x] ART feel: typography, card styling

### Workstream 3: Quest→BAR Collapse (Share-as-BAR)
- [x] Add collapsedFromQuestId, collapsedFromInstanceId to CustomBar (schema)
- [x] collapseQuestToBar(questId) server action
- [x] Quest detail: "Share as BAR" button + flow
- [x] BAR detail: provenance badges (From quest, From campaign)
- [ ] (Optional) collapseCampaignToBar, Campaign "Share" UI

## Phase 6: Verification

- [ ] Run `npm run build` and `npm run check`
- [ ] Manual: receive BAR → talisman reveal
- [ ] Manual: create quest from BAR
- [ ] Manual: create topic, assign, filter, merge, archive
- [ ] Manual: upload photo, create from photo
