# Spec: Campaign Invitation System v0

## Purpose

Implement a Campaign Invitation System that allows campaign owners and collaborators to invite actors into a campaign with structured messaging and role proposals. Invitations are first-class campaign artifacts integrating with Campaign Playbooks, Actor Model, RACI, and Campaign Onboarding.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI).

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| Scope | Invitations at Instance (campaign) level |
| Model name | CampaignInvitation (Invite reserved for sign-up tokens) |
| RACI | Sent → Informed; accepted + role confirmed → Responsible/Accountable/Consulted |
| Consent | RACI responsibility roles require explicit acceptance |
| Playbook | Invitations populate playbook Invitations section |

---

## Conceptual Model

| Dimension | Invitation System |
|-----------|-------------------|
| **WHO** | targetActorId (Player/Agent), createdByActorId |
| **WHAT** | Invitation artifact with invited_role, message_text |
| **WHERE** | Instance-scoped |
| **Energy** | status: draft → sent → accepted/declined/expired |
| **Personal throughput** | accept, decline, confirm-role |

---

## API Contracts (API-First)

See [docs/architecture/campaign-invitation-api.md](../../../docs/architecture/campaign-invitation-api.md).

### Core

- `createInvitation(input) => Promise<{ success; invitationId } | { error }>`
- `listInvitations(instanceId, filters?) => Promise<{ success; invitations } | { error }>`
- `sendInvitation(invitationId) => Promise<{ success } | { error }>`
- `acceptInvitation(invitationId, actorId) => Promise<{ success; requiresRoleConfirmation } | { error }>`
- `declineInvitation(invitationId, actorId) => Promise<{ success } | { error }>`
- `confirmInvitationRole(input) => Promise<{ success } | { error }>`
- `exportInvitation(input) => Promise<{ success; content; format } | { error }>`

---

## User Stories

### P1: Create Invitation

**As a** campaign owner or collaborator, **I want** to create an invitation with role and message, **so** I can recruit collaborators.

**Acceptance**: `createInvitation` creates draft invitation.

### P2: Send Invitation

**As a** campaign owner, **I want** to send an invitation, **so** the target actor appears in RACI as Informed.

**Acceptance**: `sendInvitation` sets status to sent; target added to RACI as Informed.

### P3: Accept / Decline

**As a** target actor, **I want** to accept or decline an invitation, **so** I can participate or opt out.

**Acceptance**: `acceptInvitation` and `declineInvitation` update status; respondedAt set.

### P4: Confirm Role

**As a** target actor who accepted, **I want** to confirm my role, **so** my RACI assignment is updated.

**Acceptance**: `confirmInvitationRole` updates accepted_role; InstanceMembership created/updated.

### P5: Playbook Integration

**As a** campaign steward, **I want** invitations to appear in the playbook, **so** outreach is documented.

**Acceptance**: Playbook Invitations section includes invitation entries.

---

## Functional Requirements

### Phase 1: Data Model and Types

- **FR1**: CampaignInvitation model (Prisma)
- **FR2**: CampaignInvitation type; CreateInvitationInput, ConfirmRoleInput, ExportInvitationInput

### Phase 2: Core API

- **FR3**: createInvitation, listInvitations
- **FR4**: sendInvitation (add to RACI as Informed)
- **FR5**: acceptInvitation, declineInvitation
- **FR6**: confirmInvitationRole (update InstanceMembership)
- **FR7**: exportInvitation (plain, email, sms)

### Phase 3: Integration

- **FR8**: RACI: sent → Informed; confirm-role → Responsible/Accountable/Consulted
- **FR9**: Playbook: invitations section populated from CampaignInvitation

### Phase 4: Templates (Optional)

- **FR10**: Invitation templates with variables

---

## Non-Functional Requirements

- Consent required for RACI responsibility roles
- Invitations traceable (createdBy, sentAt, respondedAt)

---

## Dependencies

- [campaign-playbook-system](../campaign-playbook-system/spec.md) — playbook integration
- Instance, InstanceMembership, Player (Prisma)

---

## References

- [campaign-invitation-system.md](../../../docs/architecture/campaign-invitation-system.md)
- [campaign-invitation-api.md](../../../docs/architecture/campaign-invitation-api.md)
- [campaign-invitation-example.md](../../../docs/examples/campaign-invitation-example.md)
