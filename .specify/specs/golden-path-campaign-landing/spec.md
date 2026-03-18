# Spec: Golden Path Campaign Landing

**Source**: [GAP_ANALYSIS_GM_FACES.md](../golden-path-onboarding-action-loop/GAP_ANALYSIS_GM_FACES.md) — Architect + Diplomat priority 2.

## Purpose

One landing card for a campaign: campaign name, domain, why it matters, who invited, first quest CTA. Currently `/campaign/lobby` shows 8 portals; no single "campaign landing" with inviter + first quest.

**Practice**: Deftness Development — extend existing routes, API-first.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Route | `/campaigns/[slug]/landing` — dynamic route (Instance slug) |
| Data | Instance (name, targetDescription, primaryCampaignDomain, allyshipDomain), inviter (from Invite.forgerId or Player.invitedByPlayerId), first quest (from thread or starterQuestId) |
| CTA | Single "Accept your first quest" or "Start" — links to quest accept or thread |

## API Contracts

### getCampaignLandingData (Server Action or data fetch)

**Input**: `slug: string` (Instance slug)  
**Output**: `{ instance, inviter, starterQuest, firstQuestCta } | null`

- Resolve Instance by slug; instance: name, targetDescription, primaryCampaignDomain, allyshipDomain
- inviter: Player name (from membership or invite context)
- starterQuest: CustomBar if starterQuestId on invite, else first quest from orientation thread
- firstQuestCta: { questId, label }

## Functional Requirements

### FR1: Route

- Create `src/app/campaigns/[slug]/landing/page.tsx`
- Fetch campaign landing data
- Render one card: campaign name, domain (friendly label), why it matters (targetDescription), "X invited you" (if inviter), single CTA to accept first quest

### FR2: Inviter display

- When player arrived via invite with forgerId: show "{{ inviterName }} invited you"
- Use Invite.forger or Player.invitedBy for display name

### FR3: First quest CTA

- Link to quest detail or accept flow
- Single primary button: "Accept your first quest" or "Start"

## Out of Scope (v0)

- Hexagram portals on landing
- Multiple CTAs
