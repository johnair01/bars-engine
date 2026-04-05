# Campaign Invitation System v0

## Purpose

A Campaign Invitation System allows campaign owners and collaborators to invite actors into a campaign with structured messaging and role proposals. Invitations are first-class campaign artifacts that integrate with Campaign Playbooks, Actor Model, RACI, and Campaign Onboarding.

**Design goals**:
- Make coalition building visible
- Document campaign outreach
- Enable structured onboarding
- Preserve consent-based responsibility
- Integrate with campaign playbooks
- Support strategic collaboration

**Practice**: Deftness Development — spec kit first, API-first (contract before UI).

---

## Core Concept

An **Invitation** is a request for a specific actor to participate in a campaign. It serves to:
- Recruit collaborators
- Document outreach
- Define proposed roles
- Contribute to playbook narrative
- Enable structured onboarding

Invitations may target human actors or AI agents. **Consent required**: RACI assignments requiring responsibility are never automatic; actors must explicitly accept roles.

---

## Scope

Invitations exist at the **Instance** (campaign) level.

```
Instance (campaign)
  ├ Playbook
  ├ Quests
  ├ Events
  └ Invitations
```

Example: Bruised Banana Residency Campaign → Invitations (Carolyn & Jim, Amanda, JJ, etc.)

---

## Invitation Artifact Schema

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| instanceId | string | Campaign (Instance) |
| targetActorId | string | Actor receiving invitation (Player or Agent) |
| invitedRole | string | Suggested campaign role (e.g. Steward, Event Architect) |
| acceptedRole | string? | Role confirmed by actor after acceptance |
| invitationType | string | guiding_coalition \| campaign_collaborator \| domain_contributor \| event_participant \| observer |
| messageText | string | Human-readable invitation message |
| status | string | draft \| sent \| accepted \| declined \| expired |
| createdByActorId | string | Actor who created the invitation |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| sentAt | DateTime? | When invitation was sent |
| respondedAt | DateTime? | When actor accepted/declined |

---

## RACI Integration

| Role | Rule |
|------|------|
| Responsible | Requires explicit acceptance |
| Accountable | Requires explicit acceptance |
| Consulted | Requires explicit acceptance |
| Informed | Default when invitation sent |

**Automatic behavior**: When invitation is sent, actor is added to RACI as **Informed** (aware of campaign, no commitment yet).

**Allowed transitions** (all require explicit confirmation):
- Informed → Consulted
- Informed → Responsible
- Informed → Accountable

---

## Invitation Lifecycle

```
draft → sent → accepted | declined | expired
```

| Status | Meaning |
|--------|---------|
| draft | Message being composed; not yet sent |
| sent | Sent to actor; actor appears as Informed |
| accepted | Actor accepted; role confirmation pending or completed |
| declined | Actor declined |
| expired | Invitation expired (e.g. TTL) |

**Acceptance flow**:
1. Actor accepts invitation → `accepted_role` prompt or confirmation
2. Actor confirms role → `accepted_role` updated; RACI updated
3. Actor declines role → remains Informed

---

## Invitation Types

| Type | Use |
|------|-----|
| guiding_coalition | Core coalition members |
| campaign_collaborator | General collaborators |
| domain_contributor | Domain-specific contributors |
| event_participant | Event-focused participation |
| observer | Observers / informed only |

---

## Campaign Playbook Integration

Invitations automatically populate the Playbook **Invitations** section. Each entry shows:
- invited role
- message text (or summary)
- status
- date sent
- accepted role (if confirmed)

Playbook synthesis includes invitations in the `invitations` section.

---

## Invitation Messaging

Messages may originate from:
- Manual authoring
- AI-generated outreach
- Playbook exports
- Invitation templates

Messages are editable and reusable. Supports: email invitation, SMS, campaign outreach.

---

## Invitation Templates

Reusable templates with variables:
- `actor_name`
- `campaign_name`
- `role_description`
- `call_to_action`

Examples: Steward Invitation, Campaign Collaborator, Advisor Invitation, Event Organizer Invitation.

---

## Export Support

| Format | Use |
|--------|-----|
| plain | Plain text |
| email | Email format |
| sms | SMS format |
| copy | Copy message to clipboard |

---

## Integration Points

| System | Integration |
|--------|-------------|
| Instance | Invitations scoped to instanceId |
| CampaignPlaybook | Invitations section populated from invitations |
| InstanceMembership | Created/updated on acceptance; roleKey from accepted_role |
| Actor Model | targetActorId, createdByActorId |

---

## Implementation Artifacts (Target Paths)

```
src/features/invitations/
src/features/invitations/types/
src/features/invitations/services/
src/features/invitations/api/
src/features/invitations/__tests__/
```

---

## References

- [campaign-invitation-api.md](campaign-invitation-api.md)
- [campaign-playbook-system.md](campaign-playbook-system.md)
- [actor-model.md](actor-model.md)
