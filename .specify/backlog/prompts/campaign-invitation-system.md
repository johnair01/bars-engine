# Spec Kit Prompt: Campaign Invitation System v0

## Role

You are a Spec Kit agent responsible for implementing the Campaign Invitation System.

## Objective

Implement a Campaign Invitation System that allows campaign owners and collaborators to invite actors into a campaign with structured messaging and role proposals. Invitations are first-class campaign artifacts integrating with Campaign Playbooks, Actor Model, RACI, and Campaign Onboarding.

## Prompt (API-First)

> Implement Campaign Invitation System per [.specify/specs/campaign-invitation-system/spec.md](../specs/campaign-invitation-system/spec.md). **API-first**: define service/action signatures and data shapes before UI. Spec: [campaign-invitation-system](../specs/campaign-invitation-system/spec.md). API contracts: [docs/architecture/campaign-invitation-api.md](../../docs/architecture/campaign-invitation-api.md).

## Requirements

- **Scope**: Invitations at Instance (campaign) level
- **Model**: CampaignInvitation (invite tokens use existing Invite model)
- **RACI**: Sent → Informed; accepted + role confirmed → Responsible/Accountable/Consulted
- **Consent**: RACI responsibility roles require explicit acceptance
- **Playbook**: Invitations populate playbook Invitations section
- **API**: createInvitation, listInvitations, sendInvitation, acceptInvitation, declineInvitation, confirmInvitationRole, exportInvitation

## Checklist (API-First Order)

- [ ] CampaignInvitation model in Prisma; run db:sync
- [ ] Types (CampaignInvitation, CreateInvitationInput, etc.)
- [ ] createInvitation, listInvitations implemented
- [ ] sendInvitation (add to RACI as Informed)
- [ ] acceptInvitation, declineInvitation implemented
- [ ] confirmInvitationRole (update InstanceMembership)
- [ ] exportInvitation implemented
- [ ] Playbook: invitations in artifact collection and synthesis
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] .specify/specs/campaign-invitation-system/spec.md (done)
- [ ] .specify/specs/campaign-invitation-system/plan.md (done)
- [ ] .specify/specs/campaign-invitation-system/tasks.md (done)
- [ ] src/features/invitations/ (or src/actions/invitations.ts)
- [ ] CampaignInvitation model in Prisma
- [ ] Playbook integration (invitations section)

## Initial Use Case

Bruised Banana Residency: Carolyn & Jim (Stewards), Amanda (Event Architect), JJ (Producer), AJ (Origin Witness), Valkyrie (Cultural Catalyst).

## References

- [campaign-invitation-system.md](../../docs/architecture/campaign-invitation-system.md)
- [campaign-invitation-api.md](../../docs/architecture/campaign-invitation-api.md)
- [campaign-invitation-example.md](../../docs/examples/campaign-invitation-example.md)
- [campaign-playbook-system.md](../../docs/architecture/campaign-playbook-system.md)
