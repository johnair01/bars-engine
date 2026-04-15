# Spec: Custom Portal Onboarding Flow v0

## Purpose

Extend the Bruised Banana onboarding with invite-token-based portal entry points. Custom invite links generate personalized onboarding paths via a short questionnaire (5 scenes, 60–90 seconds). The flow outputs `campaignState`-compatible data and feeds into existing `createCampaignPlayer` and `assignOrientationThreads`—no divergence from the core flow.

**Core principle**: Portal is an alternative entry that produces the same downstream state as the full CYOA. Activation over explanation.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Flow length | 5 scenes, 60–90 seconds total; one action per scene |
| Integration | Output campaignState; reuse createCampaignPlayer, assignOrientationThreads |
| Invite model | New PortalInvite model; token encodes campaign, inviter, variant |
| Archetype mapping | Map agency-style options to 8 canonical Playbook names |
| Interest domains | Map to allyship domains (GATHERING_RESOURCES, etc.) |
| Shadow agent | Optional, future phase; surfaces suggestions only |

## Conceptual Model

| Dimension | Meaning | Schema |
|-----------|---------|--------|
| **WHO** | Archetype (Playbook) inferred from agency style | playbookId via archetype_signal mapping |
| **WHERE** | Interest domains → allyship domains | campaignDomainPreference |
| **Throughput** | preferred_move_state (Wake/Clean/Grow/Show) | storyProgress.state.preferredMove |
| **Impact** | impact_stage (agency distance) | storyProgress.state.impactStage |

## Flow Overview

```
/portal/{token}
  → Scene 1: Invitation (Begin)
  → Scene 2: Agency style (archetype_signal)
  → Scene 3: Issue attention (interest_domains)
  → Scene 4: Current energy (preferred_move_state)
  → Scene 5: Impact distance (impact_stage)
  → Auth form (contact, password)
  → createActorFromPortal (campaignState) → createCampaignPlayer → assignOrientationThreads
  → Dashboard
```

## API Contracts

### validateInviteToken

**Input**: `token: string`  
**Output**: `{ valid: true; invite: PortalInvite } | { valid: false; error: string }`

### beginPortalOnboarding

**Input**: `token: string`  
**Output**: `{ success: true; sessionId: string } | { error: string }`

### submitPortalResponses

**Input**: `token: string`, `responses: Partial<PortalResponses>`  
**Output**: `{ success: true } | { error: string }`

### createActorFromPortal

**Input**: `token: string`, `identity: { contact: string; password: string }`  
**Output**: `{ success: true; playerId: string; redirectUrl: string } | { error: string }`

- Maps portal responses to campaignState
- Calls createCampaignPlayer (or equivalent) with derived state
- Calls assignOrientationThreads

## User Stories

### P1: Invite Link Entry

**As a new player**, I want to land on a portal via a custom invite link, so I experience a tailored onboarding path.

**Acceptance**: `/portal/{token}` validates token; shows Scene 1 when valid; 404 or error when expired/invalid.

### P2: Five-Scene Questionnaire

**As a new player**, I want to answer 5 short questions (one per scene), so the system infers my archetype, interests, and energy state.

**Acceptance**: Each scene requires one action; total time 60–90 seconds; responses stored in session.

### P3: Actor Creation from Portal

**As a new player**, I want to sign up after the questionnaire and land on the dashboard with personalized quests, so I feel recognized and have a meaningful place to begin.

**Acceptance**: createActorFromPortal produces campaignState; createCampaignPlayer uses it; assignOrientationThreads assigns orientation; redirect to dashboard.

### P4: Campaign Attribution

**As a campaign organizer**, I want invite links to track who invited each player and which campaign they entered, so I can measure invitation effectiveness.

**Acceptance**: PortalInvite stores inviterId, campaignId; storyProgress includes campaignRef and invitedBy.

## Functional Requirements

### Phase 1: Portal Invite + Schema

- **FR1.1**: Add PortalInvite model: id, token, campaignId, inviterId, portalVariant, defaultPath, expiresAt, createdAt
- **FR1.2**: Seed or admin flow to create portal invites (token generation)
- **FR1.3**: validateInviteToken(token) implemented

### Phase 2: Five-Scene Flow

- **FR2.1**: Route `/portal/[token]/page.tsx` — validate token; render Scene 1 when valid
- **FR2.2**: Scene 1: Invitation (Begin)
- **FR2.3**: Scene 2: Agency style (archetype_signal) — options map to Playbook names
- **FR2.4**: Scene 3: Issue attention (interest_domains) — multi-select; map to allyship domains
- **FR2.5**: Scene 4: Current energy (preferred_move_state) — Wake/Clean/Grow/Show
- **FR2.6**: Scene 5: Impact distance (impact_stage)
- **FR2.7**: Session storage for responses (cookie or server session)

### Phase 3: Actor Creation

- **FR3.1**: createActorFromPortal maps responses to campaignState
- **FR3.2**: campaignState includes: playbookId (from archetype_signal), campaignDomainPreference (from interest_domains), state.preferredMove, state.impactStage
- **FR3.3**: Reuse createCampaignPlayer logic; pass derived campaignState
- **FR3.4**: Redirect to dashboard after signup

### Phase 4: Dashboard Integration

- **FR4.1**: Dashboard shows orientation quests (existing assignOrientationThreads)
- **FR4.2**: Recent charge capture prompt visible (existing)
- **FR4.3**: Campaign signals from campaignRef (existing)

## Archetype Signal Mapping

| Option | Playbook Name |
|--------|---------------|
| Bring people together | Joyful Connector |
| Investigate deeper truth | Truth Seer |
| Take decisive action | Decisive Storm |
| Hold steady when chaotic | Still Point |
| Support others doing work | Devoted Guardian |
| Subtly influence outcomes | Subtle Influence |
| Take courageous risks | Bold Heart |
| Move through uncertainty | Danger Walker |

## Interest Domain Mapping

| Portal Category | Allyship Domain |
|-----------------|-----------------|
| Community building | SKILLFUL_ORGANIZING |
| Housing / economic justice | GATHERING_RESOURCES |
| Environment | GATHERING_RESOURCES |
| Creative culture | GATHERING_RESOURCES |
| Mutual aid | GATHERING_RESOURCES |
| Education | RAISE_AWARENESS |
| Political change | DIRECT_ACTION |
| Personal transformation | RAISE_AWARENESS |
| Friendship and relationships | SKILLFUL_ORGANIZING |

## Non-Functional Requirements

- Complete in under 2 minutes
- Minimal typing (selects, not long-form)
- No divergence from Bruised Banana actor/quest flow
- Expired invites return clear error

## Out of Scope (v0)

- Shadow impact agent (future)
- Quest path generation beyond assignOrientationThreads (future)
- Multiple campaign invites handling (single campaign per token)

## Dependencies

- [Charge Capture](.specify/specs/charge-capture-ux-micro-interaction/spec.md)
- [Dashboard Orientation Flow](.specify/specs/dashboard-orientation-flow/spec.md)
- [Actor Capability + Quest Eligibility Engine](.specify/specs/actor-capability-quest-eligibility-engine/spec.md) — future
- createCampaignPlayer, assignOrientationThreads (existing)

## References

- [Custom Portal Onboarding API](../../docs/architecture/custom-portal-onboarding-api.md)
- [campaign.ts](src/app/campaign/actions/campaign.ts) — createCampaignPlayer
- [quest-thread.ts](src/actions/quest-thread.ts) — assignOrientationThreads
