# Spec: Allyship Campaign Admin

**Slug**: `allyship-campaign-admin`
**Status**: Ready for implementation
**Source**: Cursor plan (allyship_campaign_setup_da40d27d)

---

## Purpose

Create the Mastering the Game of Allyship Non-Profit (parent campaign) with Book, Card Game, and Fundraising as sub-campaigns; link Fundraising to Bruised Banana Residency to draft cross-instance linking; provide a simplified Campaign Admin dashboard for Carolyn Manson; and deliver admin orientation quests using Quest Grammar.

**Problem**: Full Admin has 25+ nav items and is overwhelming for non-technical campaign owners. Carolyn (Boomer-aged, former engineer, Red Cross disaster relief) needs a top-down dashboard, minimal choices, and orientation to feel comfortable collaborating. She is also a player (has her hand) and needs context switching without losing her hand.

**Practice**: Spec kit first. Schema + hierarchy + Campaign Admin UI + orientation.

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Parent + sub-campaigns** | Non-Profit = parent (SKILLFUL_ORGANIZING); Book, Card Game, Fundraising = sub-campaigns with parentInstanceId |
| **Sub-campaign domains** | Book + Card Game = DIRECT_ACTION; Fundraising = GATHERING_RESOURCES. Same-domain instances distinguished by slug. |
| **Cross-instance linking** | v1: linkedInstanceId (Fundraising → Bruised Banana). Backlog: multi-instance (many-to-many). |
| **Campaign Admin** | Instance-scoped dashboard for owners/stewards. No global Players/Quests/Config. |
| **Context switcher** | Button in dashboard and/or Campaign Admin header. Player keeps hand; switcher changes instance context only. |
| **Notifications** | BARs delivered via text (SMS). Humane notification patterns (badges, digest, attention-respecting) in backlog. |
| **RACI** | v1: owner = Accountable. RACI taught in orientation as fundamental of skilled organizing. |
| **Orientation format** | Quest Grammar (not linear Adventure). |

---

## Conceptual Model

### Instance Hierarchy

| Node | Slug | Domain | Role |
|------|------|--------|------|
| Non-Profit | allyship-nonprofit | SKILLFUL_ORGANIZING | Parent |
| Book | allyship-book | DIRECT_ACTION | Sub-campaign |
| Card Game | allyship-card-game | DIRECT_ACTION | Sub-campaign |
| Fundraising | allyship-fundraising | GATHERING_RESOURCES | Sub-campaign |

Fundraising links to bruised-banana instance (linkedInstanceId).

### Campaign Admin User

- **Carolyn Manson**: Receives invitation BARs via Campaign Admin "Invite to role"; accepts to become owner. Invite parent once → owner of parent + steward on sub-campaigns; invite sub-campaigns separately to become owner of each.
- Access: `/admin/campaigns` lists instances where user has roleKey IN ('owner','steward')
- She is also a player; context switcher does not affect her hand

---

## User Stories

### P1: Instance hierarchy

**As an** admin, **I want** to create a parent campaign and sub-campaigns with parentInstanceId, **so that** the Mastering the Game of Allyship structure (Non-Profit + Book, Card Game, Fundraising) is represented.

**Acceptance**: Instance schema has parentInstanceId; admin form supports it; parent created first, then sub-campaigns.

### P2: Cross-instance linking

**As an** admin, **I want** to link the Fundraising sub-campaign to Bruised Banana Residency, **so that** we can draft the cross-instance linking feature (donation flow, instance switcher, admin view).

**Acceptance**: Instance schema has linkedInstanceId; admin form supports it; allyship-fundraising.linkedInstanceId = bruised-banana id.

### P3: Campaign Admin dashboard

**As a** campaign owner (Carolyn), **I want** a simplified dashboard that shows only my campaigns (parent + sub-campaigns) with status, updates, and quick actions, **so that** I can manage without the full Admin complexity.

**Acceptance**: `/admin/campaigns` and `/admin/campaigns/[instanceId]` exist; list filtered by InstanceMembership; parent at top, sub-campaigns beneath; "Updates for you" section; quick actions (update progress, advance stage).

### P4: Context switcher

**As a** player who is also a campaign owner, **I want** a button to switch instance context (Non-Profit, Book, Card Game, Fundraising), **so that** I can change context without losing my hand.

**Acceptance**: Context switcher in dashboard and/or Campaign Admin header; switching updates active instance context; hand (BARs, quests) persists.

### P5: Updates for you

**As a** campaign owner, **I want** to see BARs shared to me that need a response, **so that** I can respond without hunting through /bars.

**Acceptance**: "Updates for you" section shows BarShare where toUserId = me and (viewedAt IS NULL or no BarResponse); count badge on "My Campaigns" nav when unviewed > 0.

### P6: Admin orientation quests

**As a** new campaign owner (Carolyn), **I want** orientation quests that teach RACI, how to view campaigns, check updates, and respond to BARs, **so that** I feel comfortable collaborating.

**Acceptance**: Quest Grammar orientation (5–6 nodes); includes RACI step; assigned when InstanceMembership created; shown on Campaign Admin until complete.

---

## Functional Requirements

### Phase 1: Schema + Instance Creation

- **FR1**: Add `parentInstanceId` (String?, FK to Instance) and `linkedInstanceId` (String?, FK to Instance) to Instance schema
- **FR2**: Add self-relations: `parentInstance`, `childInstances`, `linkedInstance`, `instancesLinkedToMe`
- **FR3**: Run `npm run db:sync`; create migration for production
- **FR4**: Add sourceInstanceId, parentInstanceId, linkedInstanceId to admin instance create/edit form
- **FR5**: Create parent allyship-nonprofit; create allyship-book, allyship-card-game, allyship-fundraising with parentInstanceId
- **FR6**: Set allyship-fundraising.linkedInstanceId = bruised-banana instance id
- **FR7**: Add Carolyn as owner via [campaign-role-invitation-bar](.specify/specs/campaign-role-invitation-bar/spec.md) — send invitation BAR from Campaign Admin; she accepts. Seed script (ALLYSHIP_OWNER_EMAIL) is fallback for setup.

### Phase 2: Campaign Admin

- **FR8**: New route `/admin/campaigns` — list instances where current user has roleKey IN ('owner','steward')
- **FR9**: New route `/admin/campaigns/[instanceId]` — instance-scoped dashboard: Status, Updates for you, Quick actions
- **FR10**: "Updates for you" — query BarShare where toUserId = currentUser and viewedAt IS NULL (or no BarResponse); link to /bars/[id]
- **FR11**: Quick actions: updateInstanceFundraise (from admin-mobile-readiness), advance Kotter stage (if exposed)
- **FR12**: AdminNav — add "My Campaigns" link to /admin/campaigns; show only when user has campaign membership
- **FR13**: Context switcher — button in dashboard and/or Campaign Admin header; switch instance context; hand persists

### Phase 3: Orientation

- **FR14**: Seed 5–6 quest nodes for "Carolyn Admin Orientation" using Quest Grammar
- **FR15**: Steps: Welcome, RACI, View campaigns, Check updates, Respond to BAR, Done
- **FR16**: Assign orientation when InstanceMembership created; show on Campaign Admin until complete
- **FR17**: Completion marks oriented (Player flag or InstanceMembership metadata)

### Phase 4: Notification polish

- **FR18**: Badge on "My Campaigns" nav — count of unviewed BarShares when > 0
- **FR19**: (Backlog) Humane notification patterns — SMS for BAR delivery, digest options, attention-respecting defaults

---

## Non-Functional Requirements

- **Touch targets**: 44px minimum for Campaign Admin buttons (admin-mobile-readiness)
- **Plain language**: "Update progress" not "Kotter stage"; "What's new" not "BAR shares"
- **Progressive disclosure**: Summary first; expand for details
- **Backward compatibility**: Existing instances (bruised-banana, etc.) continue to work; parentInstanceId and linkedInstanceId nullable

---

## Dependencies

- [campaign-role-invitation-bar](.specify/specs/campaign-role-invitation-bar/spec.md) — invite existing players to campaign roles via BAR; Carolyn gets owner via this flow, not seed script
- [campaign-subcampaigns](.specify/specs/campaign-subcampaigns/spec.md) — parent/child hierarchy concept
- [admin-mobile-readiness](.specify/specs/admin-mobile-readiness/spec.md) — updateInstanceFundraise, touch targets
- [dashboard-orientation-flow](.specify/specs/dashboard-orientation-flow/spec.md) — orientation patterns

---

## References

- Cursor plan: `/Users/test/.cursor/plans/allyship_campaign_setup_da40d27d.plan.md`
- Instance schema: `prisma/schema.prisma` (lines 1173–1236)
- Admin layout: `src/app/admin/layout.tsx`, `src/components/AdminNav.tsx`
- Instance actions: `src/actions/instance.ts`
- BarShare: `prisma/schema.prisma` (lines 521–537)
