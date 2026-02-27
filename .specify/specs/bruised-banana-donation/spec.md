# Spec: Bruised Banana Donation Link + Vibeulon Mint

## Purpose
Unblock the $3000 Bruised Banana Residency campaign by surfacing a donation link and enabling Energy (vibeulons) to flow when players support the cause. The `/event` page already exists; it must be configured, surfaced, and optionally mint vibeulons on donation.

## User stories

### P1: Surface the donation link
**As a visitor**, I want to see "Support the Residency" or "Donate" from the landing page and campaign, so I can contribute to the Bruised Banana cause.

**Acceptance**: Landing ([src/app/page.tsx](src/app/page.tsx)) and campaign have a visible link to `/event`. Nav or footer may also link.

### P2: Configure the fundraiser instance
**As an admin**, I want the Bruised Banana instance configured with goal ($3000), Stripe URL, and event mode, so the `/event` page shows progress and donation buttons.

**Acceptance**: Instance exists with `goalAmountCents: 300000`, `stripeOneTimeUrl` (Stripe payment link), `isEventMode: true`. Admin can create/update via [src/app/admin/instances/page.tsx](src/app/admin/instances/page.tsx).

### P3: Vibeulon mint on donation
**As a donor**, I want to receive vibeulons (Energy) when I support the cause, so my contribution is acknowledged in the game.

**Acceptance**: Option A — Stripe webhook mints vibeulons when payment succeeds. Option B — Admin manually mints after verifying donation. Option C — "Claim support token" (logged-in user clicks, mints 1 vibeulon) as lightweight thank-you.

## Functional requirements

- **FR1**: Landing and campaign MUST link to `/event` (or `/donate` redirect).
- **FR2**: Instance MUST support `stripeOneTimeUrl`, `patreonUrl`, `goalAmountCents`, `currentAmountCents`. Admin configures these.
- **FR3**: Donation flow MUST either mint vibeulons (webhook or manual) or provide "Claim support token" for logged-in users.
- **FR4**: Donation model ([prisma/schema.prisma](prisma/schema.prisma)) records donations; no schema change required for basic flow.

## Conceptual model (game language)

- **Energy** (vibeulons) flows when players support the cause. Donation → mint is Energy responding to contribution.
- **WHO** (Nation/Archetype) is unchanged; donation is available to all.
- **WHERE**: The fundraiser is the Bruised Banana Residency instance.

## Reference

- Cursor plan: [.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md](.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md)
- Event page: [src/app/event/page.tsx](src/app/event/page.tsx)
- Instance model: [prisma/schema.prisma](prisma/schema.prisma)
