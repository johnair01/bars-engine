# Allyship Campaign Admin — Implementation Plan

**Spec**: [spec.md](spec.md)
**Status**: Ready for Phase 1

---

## Phase 1 — Schema + Instance Creation

### 1.1 Schema changes

Add to `model Instance` in `prisma/schema.prisma`:

```prisma
parentInstanceId  String?   // FK to Instance; when set, this is a sub-campaign
linkedInstanceId  String?   // FK to Instance; when set, this instance links to another (e.g. Fundraising → Bruised Banana)

parentInstance   Instance?  @relation("InstanceChildren", fields: [parentInstanceId], references: [id], onDelete: SetNull)
childInstances   Instance[] @relation("InstanceChildren")
linkedInstance   Instance?  @relation("InstanceLinkedTo", fields: [linkedInstanceId], references: [id], onDelete: SetNull)
instancesLinkedToMe Instance[] @relation("InstanceLinkedTo")
```

Run `npm run db:sync`. Create migration: `npx prisma migrate dev --name add_instance_hierarchy_and_linking`.

### 1.2 Admin instance form

Edit `src/app/admin/instances/page.tsx` and `InstanceListWithEdit` (or equivalent):

- Add `parentInstanceId` select: list instances; "None" for parent
- Add `linkedInstanceId` select: list instances; "None" for no link
- Ensure `sourceInstanceId` is exposed (may already exist in schema; add to form if missing)
- `upsertInstance` action must accept and persist these fields

### 1.3 Instance creation (seed or manual)

Create instances in order:

1. **allyship-nonprofit** — parentInstanceId: null, primaryCampaignDomain: SKILLFUL_ORGANIZING, sourceInstanceId: bruised-banana id
2. **allyship-book** — parentInstanceId: nonprofit id, primaryCampaignDomain: DIRECT_ACTION, sourceInstanceId: bruised-banana id
3. **allyship-card-game** — parentInstanceId: nonprofit id, primaryCampaignDomain: DIRECT_ACTION, sourceInstanceId: bruised-banana id
4. **allyship-fundraising** — parentInstanceId: nonprofit id, primaryCampaignDomain: GATHERING_RESOURCES, linkedInstanceId: bruised-banana id, sourceInstanceId: bruised-banana id

### 1.4 Carolyn as owner

Create InstanceMembership for Carolyn (playerId) with roleKey: 'owner' for each of the four instances.

---

## Phase 2 — Campaign Admin Dashboard

### 2.1 Routes

- **`/admin/campaigns`** — Server component; fetch instances where current user has InstanceMembership with roleKey IN ('owner','steward'); render list (parent at top, children grouped)
- **`/admin/campaigns/[instanceId]`** — Server component; fetch instance; verify user has membership; render Status, Updates for you, Quick actions

### 2.2 Data access

- New action: `listCampaignsForCurrentUser()` — returns instances with membership, ordered (parent first, then children by slug)
- New action: `getUnviewedBarSharesForUser(playerId)` — BarShare where toUserId = playerId and viewedAt IS NULL
- Reuse: `updateInstanceFundraise` from admin-mobile-readiness

### 2.3 UI components

- Campaign list card — name, Kotter stage, last activity, "Needs attention" count, "Linked to X" when linkedInstanceId set
- Instance dashboard — Status section, Updates for you section (list of BarShares with links), Quick actions (Update progress, Advance stage)
- Context switcher — dropdown or button group; on select, update active instance context (cookie or AppConfig); persist hand

### 2.4 AdminNav

- Add "My Campaigns" link when user has at least one InstanceMembership with roleKey IN ('owner','steward')
- Badge: count of unviewed BarShares when > 0

---

## Phase 3 — Admin Orientation Quests

### 3.1 Quest Grammar orientation

Create 5–6 quest nodes using Quest Grammar (not linear Adventure):

1. Welcome — "You're the Accountable for the Mastering the Game of Allyship Non-Profit and its three projects..."
2. RACI — "Every campaign sets RACI: Responsible, Accountable, Informed, Consultant. You're Accountable here. Skilled organizing starts with knowing who does what."
3. View campaigns — "The Non-Profit is at the top. Under it you'll see the Book, Card Game, and Fundraising..."
4. Check updates — "When [Name] sends you an update, it appears here..."
5. Respond to BAR — "Open a BAR, choose Appreciate or Offer Help..."
6. Done — "You're ready. Come back anytime..."

### 3.2 Assignment

- When InstanceMembership created for campaign owner, assign admin orientation thread (or equivalent)
- Show orientation entry on Campaign Admin dashboard until complete
- Completion: set Player flag or InstanceMembership metadata (e.g. `orientedAt`)

### 3.3 Integration

- Reuse orientation thread patterns from dashboard-orientation-flow
- Quest type or tag: `admin_orientation`

---

## Phase 4 — Notification Polish

### 4.1 Badge

- Query unviewed BarShare count for current user
- Display badge (e.g. "3") next to "My Campaigns" in AdminNav when count > 0

### 4.2 Backlog

- Document humane notification patterns (SMS, digest, attention-respecting) for future spec
- SMS delivery for BAR shares — requires Twilio or similar integration

---

## File Impact Summary

| Area | Files |
|------|-------|
| Schema | `prisma/schema.prisma` |
| Instance actions | `src/actions/instance.ts` |
| Admin instances | `src/app/admin/instances/page.tsx`, `InstanceListWithEdit` |
| Campaign Admin | `src/app/admin/campaigns/page.tsx`, `src/app/admin/campaigns/[instanceId]/page.tsx` |
| New actions | `src/actions/campaign-admin.ts` (or extend instance.ts) |
| AdminNav | `src/components/AdminNav.tsx` |
| Orientation | Quest seed script, `assignOrientationThreads` or equivalent |
| Context switcher | Dashboard component, Campaign Admin header |

---

## Verification

- [ ] Parent and sub-campaign instances created; hierarchy visible in admin
- [ ] Fundraising linked to Bruised Banana; link visible in Campaign Admin
- [ ] Carolyn can access /admin/campaigns and see her four instances
- [ ] "Updates for you" shows BARs shared to her
- [ ] Context switcher changes instance context; hand persists
- [ ] Orientation quests assigned and completable
- [ ] Badge shows unviewed count when applicable
- [ ] `npm run build` and `npm run check` pass
