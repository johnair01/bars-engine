# Campaign Invitation System v0

Invite actors into campaigns with structured messaging and role proposals. Consent-based RACI; integrates with Campaign Playbooks.

## Specs

- [Campaign Invitation System](../../../docs/architecture/campaign-invitation-system.md)
- [Campaign Invitation API](../../../docs/architecture/campaign-invitation-api.md)

## Implementation Status

- [x] CampaignInvitation model (Prisma)
- [x] Types and Server Actions
- [x] RACI integration (send → Informed; confirm → Responsible/Accountable/Consulted)
- [x] Playbook integration (Invitations section)
- [ ] UI (campaign page, invitation forms)
- [ ] Templates (optional)

## Usage

```ts
import {
  createInvitation,
  listInvitations,
  sendInvitation,
  acceptInvitation,
  declineInvitation,
  confirmInvitationRole,
  exportInvitation,
} from '@/actions/invitations'

const { invitationId } = await createInvitation({ instanceId, targetActorId, invitedRole, invitationType, messageText, createdByActorId })
await sendInvitation(invitationId)
const { invitations } = await listInvitations(instanceId)
const { content } = await exportInvitation({ invitationId, format: 'email' })
```
