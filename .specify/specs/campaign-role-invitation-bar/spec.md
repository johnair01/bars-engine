# Spec: Campaign Role Invitation via BAR

**Slug**: `campaign-role-invitation-bar`
**Status**: Ready for implementation
**Source**: Allyship campaign admin discussion; Carolyn Manson onboarding

---

## Purpose

Enable campaign owners to send an **invitation BAR** that invites an existing player to take on a role (owner, steward, contributor) in a campaign instance. When the recipient accepts, InstanceMembership is created. This is a move many players will use — not just for Carolyn.

**Problem**: Today, adding someone as campaign owner requires seed scripts or manual DB edits. There is no in-game flow for "invite this person to be owner/steward of this campaign."

**Practice**: Extend CampaignInvitation with barId; wire BAR acceptance to InstanceMembership creation. Entry point: Campaign Admin "Invite to role."

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Schema** | Extend CampaignInvitation with `barId`; wire acceptance to BAR flow |
| **Multi-instance** | One invitation per BAR — one BAR = one CampaignInvitation = one instance |
| **Entry point** | Campaign Admin "Invite to role" |
| **Parent acceptance** | Accept parent → Owner of parent + **read-only membership** (steward) on all child instances (sub-campaigns) |
| **Sub-campaign acceptance** | Accept sub-campaign → Owner of that sub-campaign only |
| **Sub-campaign ownership** | Owner of a sub-campaign only if they **consciously accept** a separate invitation for that instance |

---

## Conceptual Model

### Invitation Flow

1. **Sender** (campaign owner/steward) uses Campaign Admin → "Invite to role"
2. **Selects**: instance, role (owner | steward | contributor), recipient (existing player)
3. **System** creates BAR (or uses existing) + CampaignInvitation with barId, instanceId, invitedRole, targetActorId (= playerId)
4. **BAR** is shared via BarShare (in-app) or BarShareExternal (link)
5. **Recipient** sees BAR with "Accept role" / "Decline"
6. **Accept** → InstanceMembership created; CampaignInvitation.status = accepted

### Parent vs Sub-Campaign

| Invited to | Accept → |
|------------|----------|
| **Parent instance** | Owner of parent. **Read-only membership** (roleKey: steward) on all child instances (parentInstanceId = parent.id). Can view and take limited actions on sub-campaigns; not full owner. |
| **Sub-campaign** | Owner of that sub-campaign only. No automatic membership on parent or siblings. |

To be owner of multiple sub-campaigns: separate invitations, each consciously accepted.

### Role Mapping

- **invitedRole** (CampaignInvitation) maps to **roleKey** (InstanceMembership): owner, steward, contributor
- v1: invitedRole values = owner | steward | contributor (align with InstanceMembership.roleKey)

---

## User Stories

### P1: Invite to role (Campaign Admin)

**As a** campaign owner, **I want** to send an invitation BAR to an existing player to take on a role (owner, steward, contributor) in an instance, **so that** they can accept and get InstanceMembership without seed scripts.

**Acceptance**: Campaign Admin has "Invite to role" action; creates BAR + CampaignInvitation; shares BAR to recipient.

### P2: Accept invitation (recipient)

**As a** player who received an invitation BAR, **I want** to see "Accept role" and "Decline" on the BAR, **so that** I can consciously accept and become a member of the campaign.

**Acceptance**: BAR detail shows invitation context; Accept creates InstanceMembership; Decline updates CampaignInvitation.status = declined.

### P3: Parent acceptance grants read-only on children

**As a** player who accepted an invitation to a parent campaign, **I want** to see and access sub-campaigns (read-only), **so that** I understand the full structure without being owner of each sub-campaign until I accept separate invitations.

**Acceptance**: Accept parent → InstanceMembership owner on parent; InstanceMembership steward on each child instance (parentInstanceId = parent.id).

### P4: Sub-campaign acceptance is scoped

**As a** player who accepted an invitation to a sub-campaign, **I want** to be owner of that sub-campaign only, **so that** my ownership is explicit and scoped.

**Acceptance**: Accept sub-campaign → InstanceMembership owner on that instance only; no automatic membership on parent or siblings.

---

## Functional Requirements

### Phase 1: Schema + Core Flow

- **FR1**: Add `barId` (String?, FK to CustomBar) to CampaignInvitation; add relation to CustomBar
- **FR2**: Ensure CampaignInvitation.targetActorId and createdByActorId reference Player (actor = player in this codebase)
- **FR3**: Run `npm run db:sync`; create migration
- **FR4**: Server action `createCampaignRoleInvitation({ instanceId, roleKey, targetPlayerId, messageText?, barId? })` — creates BAR (if not barId), CampaignInvitation with barId, shares BAR via BarShare to targetPlayerId
- **FR5**: Server action `acceptCampaignRoleInvitation(invitationId)` — validates invitation, creates InstanceMembership(s), updates status
  - If instance has no parent: create InstanceMembership with roleKey = invitedRole
  - If instance is parent (has children): create InstanceMembership owner on parent; create InstanceMembership steward on each child
  - If instance is sub-campaign: create InstanceMembership owner on that instance only
- **FR6**: Server action `declineCampaignRoleInvitation(invitationId)` — updates status = declined

### Phase 2: Campaign Admin UI

- **FR7**: Campaign Admin "Invite to role" — form/modal: select instance, role (owner/steward/contributor), recipient (player search/select), optional message
- **FR8**: On submit: call createCampaignRoleInvitation; show success with "BAR shared to [name]"
- **FR9**: Recipient sees BAR at /bars/[id] with invitation context and Accept/Decline buttons when CampaignInvitation exists for this BAR and current user = targetActorId

### Phase 3: BAR Detail Integration

- **FR10**: BAR detail page: when BAR has linked CampaignInvitation and current user is target, show "You're invited to be [role] in [instance name]" with Accept/Decline
- **FR11**: Accept calls acceptCampaignRoleInvitation; redirect to Campaign Admin or dashboard
- **FR12**: Decline calls declineCampaignRoleInvitation; update UI

---

## Non-Functional Requirements

- **One invitation per BAR**: Each BAR carries at most one CampaignInvitation
- **Idempotent accept**: If InstanceMembership already exists, accept is a no-op for that membership (or update role if different)
- **Backward compatibility**: Existing CampaignInvitations without barId continue to work; barId nullable

---

## Dependencies

- [allyship-campaign-admin](.specify/specs/allyship-campaign-admin/spec.md) — Campaign Admin dashboard (entry point for "Invite to role")
- [bar-external-sharing](.specify/specs/bar-external-sharing/spec.md) — BarShareExternal for link sharing
- Instance hierarchy (parentInstanceId) — for parent/child logic

---

## References

- CampaignInvitation: `prisma/schema.prisma` (lines 1328–1349)
- InstanceMembership: `prisma/schema.prisma` (lines 1590–1603)
- BarShare: `prisma/schema.prisma` (lines 521–537)
- Instance: `prisma/schema.prisma` (parentInstanceId, childInstances)
