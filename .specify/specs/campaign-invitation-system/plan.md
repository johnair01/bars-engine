# Plan: Campaign Invitation System v0

## Strategy

API-first implementation. Start with CampaignInvitation model and types; add core API (create, list, send, accept, decline, confirm-role, export); integrate with RACI (InstanceMembership) and Playbook.

---

## File Impacts

| Path | Change |
|------|--------|
| `prisma/schema.prisma` | Add CampaignInvitation model |
| `src/features/invitations/types/index.ts` | CampaignInvitation, inputs |
| `src/features/invitations/services/raci.ts` | RACI update helpers |
| `src/actions/invitations.ts` | Server Actions |
| `src/features/playbook/services/artifact-collector.ts` | Add invitations to collection |
| `src/features/playbook/services/synthesizer.ts` | Add invitations to Invitations section |

---

## Phases

### Phase 1: Data Model and Types

- Add CampaignInvitation model: instanceId, targetActorId, invitedRole, acceptedRole, invitationType, messageText, status, createdByActorId, sentAt, respondedAt
- Add Instance.invitations relation
- Define TypeScript types
- Run `npm run db:sync`

### Phase 2: Core API

- createInvitation
- listInvitations
- sendInvitation (status → sent; add target to RACI as Informed via InstanceMembership)
- acceptInvitation, declineInvitation
- confirmInvitationRole (update InstanceMembership.roleKey)
- exportInvitation

### Phase 3: RACI Integration

- sendInvitation: ensure target has InstanceMembership with roleKey = 'informed' or equivalent
- confirmInvitationRole: update InstanceMembership.roleKey to accepted_role (responsible, accountable, consulted)

### Phase 4: Playbook Integration

- Artifact collector: include CampaignInvitation for instance
- Synthesizer: populate Invitations section from invitations

### Phase 5: Templates (Optional)

- Invitation template model or config
- Variable substitution (actor_name, campaign_name, role_description, call_to_action)

---

## Initial Use Case

Bruised Banana Residency: Carolyn & Jim (Stewards), Amanda (Event Architect), JJ (Producer), AJ (Origin Witness), Valkyrie (Cultural Catalyst).

---

## Verification

1. Create invitation; draft status
2. Send invitation; target in RACI as Informed
3. Accept invitation; status accepted
4. Confirm role; InstanceMembership updated
5. Playbook Invitations section shows invitations
