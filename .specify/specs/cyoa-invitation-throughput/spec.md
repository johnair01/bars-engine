# Spec: Landing + Invitation Throughput (T)

## Purpose

Make it safe to send invitations to the Bruised Banana Campaign **before** the CYOA flow is perfected. A landing page with the 4 basic moves and sign-up for interest is safe to go live. The CYOA can be dripped to players after they are already in the system.

## Emergent Blocker (Context)

Wendell wants a perfected CYOA flow before sending people the CYOA link. A landing page with all the basic moves (asking people to sign up for what their interest is) is safe to go live without the CYOA version. The CYOA can be dripped to players after they are already in the system.

## Two Paths

| Path | Safe to go live? | When |
|------|------------------|------|
| **Landing + moves + sign-up for interest** | Yes | Now — can share link immediately |
| **CYOA (Wake-Up campaign)** | No (until perfected) | Drip to existing players in-app |

## User Stories

### P1: Landing with 4 moves + sign-up for interest
**As a campaign organizer**, I want a landing page that shows the 4 basic moves (Wake Up, Clean Up, Grow Up, Show Up) and asks visitors to sign up for their interest (domain/intention), so I can share a link that's safe to go live before the CYOA is perfected.

**Acceptance**: A landing route (e.g. `/` or `/join`) displays the 4 moves and a sign-up flow that captures interest (domain or intention choice). No CYOA required.

### P2: Shareable landing link with ref
**As a campaign organizer**, I want a shareable link (e.g. `https://app?ref=bruised-banana` or `https://app/join?ref=bruised-banana`) that I can send to potential players, so they land on the landing with attribution preserved.

**Acceptance**: Landing accepts `ref` query param; `ref` is preserved through the session and passed to sign-up.

### P3: Post-sign-up attribution
**As a campaign organizer**, I want new sign-ups who arrived via my link to have their origin recorded, so I can measure invitation effectiveness.

**Acceptance**: When a player signs up with `ref` in URL or form, `campaignRef` is stored (e.g. in `player.storyProgress`).

### P4: Invite CTA on Event page
**As a campaign organizer**, I want an "Invite friends" or "Share" button on the Event page that copies the landing link, so I can easily share invitations.

**Acceptance**: Event page has a CTA that copies `{origin}/?ref=bruised-banana` (or `/join?ref=bruised-banana`) to clipboard or displays it for copy.

### P5: CYOA dripped to existing players
**As a product owner**, I want the CYOA to be discoverable by players who are already in the system, so they can experience it without it being the first touch for new sign-ups.

**Acceptance**: CYOA (e.g. "Begin the Journey") is accessible from the dashboard or a secondary entry point for logged-in players. Primary invitation link points to landing + sign-up, not CYOA.

## Functional Requirements

- **FR1**: Landing page (or home when logged out) MUST display the 4 moves and a sign-up flow that captures interest (domain or intention).
- **FR2**: Landing MUST accept `ref` query param; pass to sign-up form (hidden field when present).
- **FR3**: Sign-up (guided or landing flow) MUST store `campaignRef` in `player.storyProgress` when `ref` is provided.
- **FR4**: Event page MUST have "Invite" or "Share" CTA that copies `{origin}/?ref=bruised-banana` (or equivalent).
- **FR5**: Primary CTA for new visitors: sign-up for interest (not necessarily "Begin the Journey" / CYOA). CYOA remains discoverable for logged-in players.
- **FR6**: Post-sign-up redirect: when `ref=bruised-banana`, redirect to `/event` or onboarding.

## Non-functional Requirements

- No schema changes required for Phase 1 (use storyProgress JSON).
- ref param is optional; no breaking changes when absent.
- Landing + sign-up flow must work without CYOA being "perfect."

## Out of Scope (This Spec)

- Perfecting the CYOA flow (separate effort).
- Full domain-aligned intention UX (U spec); landing can use a simplified "what's your interest?" for v1.

## Reference

- Landing/home: [src/app/page.tsx](../../src/app/page.tsx)
- Campaign page: [src/app/campaign/page.tsx](../../src/app/campaign/page.tsx)
- createCampaignPlayer / guided sign-up: [src/app/campaign/actions/campaign.ts](../../src/app/campaign/actions/campaign.ts), [src/app/conclave/guided/page.tsx](../../src/app/conclave/guided/page.tsx)
- Event page: [src/app/event/page.tsx](../../src/app/event/page.tsx)
- Analysis: [.specify/specs/bruised-banana-house-integration/ANALYSIS.md](../bruised-banana-house-integration/ANALYSIS.md)
