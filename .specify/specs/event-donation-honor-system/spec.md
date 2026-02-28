# Spec: Event Donation Honor System

## Purpose

Refactor the event page for public access, remove Support the cause in favor of Show Up, add a donation page with multi-provider links (Venmo, CashApp, PayPal, Stripe), and implement an honor-system self-report flow that creates BARs (RedemptionPacks) for donors—with login/sign-up prompts for unauthenticated reporters.

## User Stories

### P1: Event page public
**As a visitor**, I want to see the full event page without being redirected to login, so I can learn about the cause and decide to contribute.

**Acceptance**: Unauthenticated visitors see Wake Up, Show Up, and Donate. No auth gate.

### P2: Remove Support the cause
**As a visitor**, I want a single contribute CTA (Show Up) without the legacy "Support the cause" section, so the flow is clear.

**Acceptance**: Support the cause section and ClaimSupportTokenButton removed. Show Up is the single contribute CTA.

### P3: Donation page
**As a donor**, I want a donation page at /event/donate with Venmo, CashApp, PayPal, and Stripe links, so I can donate via my preferred method.

**Acceptance**: Admin configures all provider URLs. Donation page shows links for configured providers.

### P4: Self-report flow
**As a donor**, I want to self-report my donation amount after paying externally. If not logged in, I am redirected to sign-up with return URL; after auth, my donation and packs are created.

**Acceptance**: "I donated" form with amount input. Unauthenticated: store amount in session, redirect to login/sign-up. Post-auth: create Donation + RedemptionPacks, clear session.

### P5: BARs for donors
**As a donor**, I want Donation amountCents to map to RedemptionPacks (configurable rate), and packs to appear in my account so I can redeem for vibeulons.

**Acceptance**: Donation creates RedemptionPacks. Packs visible in Wallet. Redeem action mints vibeulons.

### P6: Verification quest
**As a tester**, I want a certification quest `cert-event-donation-honor-v1` that walks me through the flow so I can validate the feature.

**Acceptance**: Twine story linked to CustomBar with `isSystem: true`. Seed via `npm run seed:cert:donation-honor`.

## Functional Requirements

- **FR1**: Instance has `venmoUrl`, `cashappUrl`, `paypalUrl` (String?). Keep `stripeOneTimeUrl`.
- **FR2**: Event page has no auth gate; remove Support the cause block.
- **FR3**: Donation page shows provider links; "Self-report donation" form with amount input.
- **FR4**: `reportDonation(instanceId, amountCents)` — if not logged in, return `{ requiresAuth: true, redirectTo, amountCents }`; if logged in, create Donation + RedemptionPacks.
- **FR5**: Post-sign-up redirect: check session for pending donation; if present, create Donation + Packs, clear session.
- **FR6**: RedemptionPack model — create when Donation is recorded. Pack config: Instance.donationPackRateCents (default 100 = 1 pack per $1).
- **FR7**: Admin Instances form includes venmoUrl, cashappUrl, paypalUrl.
- **FR8**: `redeemPack(packId)` mints vibeulons and marks pack redeemed.

## Non-functional Requirements

- Session/cookie: Store `pendingDonation: { instanceId, amountCents }` for post-auth completion.
- Pack conversion: Instance.donationPackRateCents (e.g. 100 = 1 pack per $1).

## Reference

- Plan: [.cursor/plans/event_donation_honor_system_b1748ac5.plan.md](../../.cursor/plans/event_donation_honor_system_b1748ac5.plan.md)
- Donation: [src/actions/donate.ts](../../src/actions/donate.ts)
- Instance: [prisma/schema.prisma](../../prisma/schema.prisma)
