# Tasks: Campaign Invitation System v0

## Phase 1 — Data Model and Types

- [x] Add CampaignInvitation model to `prisma/schema.prisma`
- [x] Fields: id, instanceId, targetActorId, invitedRole, acceptedRole, invitationType, messageText, status, createdByActorId, sentAt, respondedAt, createdAt, updatedAt
- [x] Relation: Instance has many CampaignInvitations
- [x] Run `npm run db:sync`
- [x] Create `src/features/invitations/types/index.ts`
- [x] Define CampaignInvitation, CreateInvitationInput, ConfirmRoleInput, ExportInvitationInput
- [x] Run `npm run check`

---

## Phase 2 — Core API

- [x] Create `src/actions/invitations.ts` (Server Actions)
- [x] Implement createInvitation
- [x] Implement listInvitations
- [x] Implement sendInvitation
- [x] Implement acceptInvitation
- [x] Implement declineInvitation
- [x] Implement confirmInvitationRole
- [x] Implement exportInvitation
- [x] Run `npm run build` and `npm run check`

---

## Phase 3 — RACI Integration

- [x] sendInvitation: create InstanceMembership for target with roleKey = 'informed' if not exists
- [x] confirmInvitationRole: update InstanceMembership.roleKey to accepted_role (responsible, accountable, consulted)
- [x] Define roleKey → RACI mapping
- [x] Run `npm run check`

---

## Phase 4 — Playbook Integration

- [x] Add CampaignInvitation to artifact-collector
- [x] Add invitations to synthesizer Invitations section
- [x] Format: target name, invited role, status, accepted role
- [x] Run `npm run check`

---

## Phase 5 — Integration and UI (Optional)

- [ ] Add invitation list to campaign page or admin
- [ ] Add create invitation form
- [ ] Add accept/decline UI for target actor
- [ ] Add role confirmation UI
- [ ] Run `npm run build` and `npm run check`

---

## Phase 6 — Templates (Optional)

- [ ] Define invitation template model or config
- [ ] Variable substitution: actor_name, campaign_name, role_description, call_to_action
- [ ] Template types: Steward, Collaborator, Advisor, Event Organizer
- [ ] Run `npm run check`

---

## Verification

- [ ] Tests: createInvitation creates draft
- [ ] Tests: sendInvitation adds to RACI as Informed
- [ ] Tests: acceptInvitation updates status
- [ ] Tests: confirmInvitationRole updates InstanceMembership
- [ ] Manual: Playbook shows invitations
