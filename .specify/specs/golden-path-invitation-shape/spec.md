# Spec: Golden Path Invitation Shape

**Source**: [GAP_ANALYSIS_GM_FACES.md](../golden-path-onboarding-action-loop/GAP_ANALYSIS_GM_FACES.md) — Architect priority 1.

## Purpose

Model the golden path invitation: inviter + campaign + starter quest + optional invitation BAR. Currently `Invite` has `forgerId` but no `campaignId`, `starterQuestId`, or `invitationBarId`. `CampaignInvitation` targets roles, not the golden path signup flow.

**Practice**: Deftness Development — extend existing models, API-first.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Model | Extend `Invite` with optional `instanceId`, `starterQuestId`, `invitationBarId` — backward compatible |
| Campaign | `instanceId` = campaign (Instance). Null = legacy invite (no campaign) |
| Accept flow | `POST /invitations/:id/accept` or server action `acceptGoldenPathInvitation(inviteId)` — returns campaign landing URL |

## API Contracts

### acceptGoldenPathInvitation (Server Action)

**Input**: `inviteId: string`, `playerId?: string` (optional; defaults to current player)  
**Output**: `Promise<{ success: true; redirectTo: string } | { error: string }>`

- Validates invite exists, status active, uses < maxUses
- If invite has instanceId: create InstanceMembership if needed; redirectTo = `/campaigns/{instanceId}/landing`
- If no instanceId: redirectTo = `/` (legacy)
- Increment invite.uses; set usedAt if uses >= maxUses

## Functional Requirements

### FR1: Schema

- Add to Invite: `instanceId String?`, `starterQuestId String?`, `invitationBarId String?`
- Add relations: `instance Instance?`, `starterQuest CustomBar?`, `invitationBar CustomBar?`
- Run `npm run db:sync` after schema change

### FR2: acceptGoldenPathInvitation Server Action

- Create in `src/actions/invitations.ts` or extend existing invite actions
- On success: ensure player has InstanceMembership for instanceId; return redirectTo
- Revalidate path

### FR3: Invite creation (admin/forger)

- When creating golden path invite: set instanceId, starterQuestId, invitationBarId
- Existing invite creation unchanged (backward compatible)

## Out of Scope (v0)

- UI for creating golden path invites (admin can set via seed or future form)
- CampaignInvitation changes (separate system)
