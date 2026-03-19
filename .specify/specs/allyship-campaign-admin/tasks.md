# Tasks: Allyship Campaign Admin

## Phase 1: Schema + Instance Creation

- [x] **1.1** Add `parentInstanceId` and `linkedInstanceId` to Instance model in prisma/schema.prisma
  - Both String? nullable
  - Add self-relations: parentInstance, childInstances, linkedInstance, instancesLinkedToMe
  - Use relation names to avoid Prisma conflicts (InstanceChildren, InstanceLinkedTo)
- [x] **1.2** Run `npm run db:sync`
- [x] **1.3** Create migration: `npx prisma migrate dev --name add_instance_hierarchy_and_linking`
- [x] **1.4** Add parentInstanceId, linkedInstanceId, sourceInstanceId to admin instance form
  - Instance create/edit in src/app/admin/instances/ or InstanceListWithEdit
  - Select dropdowns for parent and linked instance (list existing instances)
- [x] **1.5** Update upsertInstance action to accept and persist parentInstanceId, linkedInstanceId
- [x] **1.6** Create parent instance allyship-nonprofit (manual or seed script)
  - primaryCampaignDomain: SKILLFUL_ORGANIZING, parentInstanceId: null
  - sourceInstanceId: bruised-banana instance id
- [x] **1.7** Create sub-campaign instances: allyship-book, allyship-card-game, allyship-fundraising
  - parentInstanceId: nonprofit instance id
  - primaryCampaignDomain per spec (DIRECT_ACTION for book/card-game, GATHERING_RESOURCES for fundraising)
  - allyship-fundraising.linkedInstanceId: bruised-banana instance id
- [x] **1.8** Add Carolyn as InstanceMembership (roleKey: 'owner') for all four instances

## Phase 2: Campaign Admin Dashboard

- [ ] **2.1** Create `listCampaignsForCurrentUser()` action
  - Returns instances where current user has InstanceMembership with roleKey IN ('owner','steward')
  - Order: parent first, then children (by parentInstanceId, then slug)
- [ ] **2.2** Create `getUnviewedBarSharesForUser(playerId)` action
  - BarShare where toUserId = playerId and viewedAt IS NULL (or no BarResponse)
  - Include bar, fromUser for display
- [ ] **2.3** Create route `/admin/campaigns`
  - List campaigns for current user; parent at top, sub-campaigns beneath
  - Each card: name, Kotter stage, last activity, "Needs attention" count
  - Show "Linked to [name]" when linkedInstanceId set
- [ ] **2.4** Create route `/admin/campaigns/[instanceId]`
  - Verify user has membership; 403 if not
  - Status section: Kotter stage, progress (if fundraiser), goal
  - "Updates for you" section: list BarShares with links to /bars/[id]
  - Quick actions: Update progress (updateInstanceFundraise), Advance Kotter stage
- [ ] **2.5** Add "My Campaigns" to AdminNav
  - Link to /admin/campaigns
  - Show only when user has campaign membership
- [ ] **2.6** Implement context switcher
  - Button/dropdown in dashboard and/or Campaign Admin header
  - On select: update active instance context (cookie or AppConfig)
  - Hand (BARs, quests) persists across switch

## Phase 3: Admin Orientation Quests

- [ ] **3.1** Define admin orientation quest structure (5–6 nodes, Quest Grammar)
  - Steps: Welcome, RACI, View campaigns, Check updates, Respond to BAR, Done
- [ ] **3.2** Seed admin orientation quest/thread
  - threadType or tag: admin_orientation
  - Campaign ref: allyship-nonprofit or generic
- [ ] **3.3** Assign orientation when InstanceMembership created for campaign owner
  - Hook in membership creation flow or seed script for Carolyn
- [ ] **3.4** Show orientation entry on Campaign Admin dashboard until complete
- [ ] **3.5** Completion marks oriented (Player flag or InstanceMembership metadata)

## Phase 4: Notification Polish

- [ ] **4.1** Add unviewed BarShare count to Campaign Admin / AdminNav
  - Badge next to "My Campaigns" when count > 0
- [ ] **4.2** Document humane notification patterns in spec or backlog
  - SMS for BAR delivery, digest options, attention-respecting defaults

## Verification

- [ ] Parent and sub-campaign instances exist; hierarchy correct
- [ ] Fundraising linked to Bruised Banana
- [ ] Carolyn can access /admin/campaigns
- [ ] "Updates for you" displays correctly
- [ ] Context switcher works; hand persists
- [ ] Orientation quests assignable and completable
- [ ] `npm run build` and `npm run check` pass
