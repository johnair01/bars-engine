# Campaign Invitation API — Service Contracts v0

## Overview

The Campaign Invitation System exposes service-layer contracts for invitation CRUD, send, accept, decline, role confirmation, and export. Implementation may use Server Actions or HTTP endpoints.

**Reference**: [campaign-invitation-system.md](campaign-invitation-system.md)

---

## Invitation Management

### 1. Create Invitation

**Contract**: `createInvitation(input: CreateInvitationInput) => Promise<{ success: true; invitationId: string } | { error: string }>`

**Input**:
```ts
interface CreateInvitationInput {
  instanceId: string
  targetActorId: string
  invitedRole: string
  invitationType: 'guiding_coalition' | 'campaign_collaborator' | 'domain_contributor' | 'event_participant' | 'observer'
  messageText: string
  createdByActorId: string
}
```

**Behavior**: Creates invitation in `draft` status.

**Route**: Server Action `createInvitation` or `POST /api/campaign/:instanceId/invitation/create`

---

### 2. List Invitations

**Contract**: `listInvitations(instanceId: string, filters?: ListInvitationsFilters) => Promise<{ success: true; invitations: CampaignInvitation[] } | { error: string }>`

**Filters**:
```ts
interface ListInvitationsFilters {
  status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
  targetActorId?: string
}
```

**Behavior**: Returns invitations for the campaign.

**Route**: Server Action `listInvitations` or `GET /api/campaign/:instanceId/invitations`

---

### 3. Send Invitation

**Contract**: `sendInvitation(invitationId: string) => Promise<{ success: true } | { error: string }>`

**Behavior**: Sets status to `sent`; adds target actor to RACI as **Informed**; sets `sentAt`.

**Route**: Server Action `sendInvitation` or `POST /api/invitation/:id/send`

---

### 4. Accept Invitation

**Contract**: `acceptInvitation(invitationId: string, actorId: string) => Promise<{ success: true; requiresRoleConfirmation: boolean } | { error: string }>`

**Behavior**: Sets status to `accepted`; sets `respondedAt`. If `invitedRole` implies RACI responsibility, returns `requiresRoleConfirmation: true` and prompts for role confirmation.

**Route**: Server Action `acceptInvitation` or `POST /api/invitation/:id/accept`

---

### 5. Decline Invitation

**Contract**: `declineInvitation(invitationId: string, actorId: string) => Promise<{ success: true } | { error: string }>`

**Behavior**: Sets status to `declined`; sets `respondedAt`.

**Route**: Server Action `declineInvitation` or `POST /api/invitation/:id/decline`

---

### 6. Confirm Role

**Contract**: `confirmInvitationRole(input: ConfirmRoleInput) => Promise<{ success: true } | { error: string }>`

**Input**:
```ts
interface ConfirmRoleInput {
  invitationId: string
  actorId: string
  acceptedRole: string  // RACI: responsible | accountable | consulted | informed
}
```

**Behavior**: Updates `accepted_role`; creates or updates InstanceMembership with `roleKey`; updates RACI.

**Route**: Server Action `confirmInvitationRole` or `POST /api/invitation/:id/confirm-role`

---

### 7. Export Invitation

**Contract**: `exportInvitation(input: ExportInvitationInput) => Promise<{ success: true; content: string; format: string } | { error: string }>`

**Input**:
```ts
interface ExportInvitationInput {
  invitationId: string
  format: 'plain' | 'email' | 'sms' | 'copy'
}
```

**Behavior**: Returns invitation message in requested format.

**Route**: Server Action `exportInvitation` or `GET /api/invitation/:id/export?format=email`

---

## Data Types

### CampaignInvitation

```ts
interface CampaignInvitation {
  id: string
  instanceId: string
  targetActorId: string
  invitedRole: string
  acceptedRole: string | null
  invitationType: string
  messageText: string
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
  createdByActorId: string
  createdAt: Date
  updatedAt: Date
  sentAt: Date | null
  respondedAt: Date | null
}
```

---

## Route vs Action Decision

| Surface | Use |
|---------|-----|
| Campaign UI, invitation forms | Server Action |
| Webhooks, external consumers | Route Handler |

---

## References

- [campaign-invitation-system.md](campaign-invitation-system.md)
- [campaign-playbook-system.md](campaign-playbook-system.md)
