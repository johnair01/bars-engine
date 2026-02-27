# Plan: Bruised Banana Donation Link + Vibeulon Mint

## Summary
Surface `/event` from landing and campaign; configure Bruised Banana instance; add vibeulon mint on donation so Energy flows when players support the cause.

## Implementation (done)

### 1. Surface the link
- **File**: `src/app/page.tsx` — Added "Support the Residency →" link to `/event` (logged-out landing)
- **File**: `src/app/campaign/page.tsx` — Added "Support the Residency →" link in header

### 2. Configure instance
- Admin → Instances: Create or update Bruised Banana instance with:
  - `goalAmountCents: 300000` ($3000)
  - `stripeOneTimeUrl` (Stripe payment link)
  - `isEventMode: true`
- Optional: Seed script to ensure instance exists

### 3. Vibeulon mint on donation
- **Implemented Option C**: "Claim support token" — logged-in user clicks, mints 1 vibeulon
- **File**: `src/actions/donate.ts` — `claimSupportToken(instanceId)`, `hasClaimedSupportToken(instanceId)`
- **File**: `src/app/event/ClaimSupportTokenButton.tsx` — Client component for claim flow
- **File**: `src/app/event/page.tsx` — "Support the cause" section with ClaimSupportTokenButton
- One claim per player per instance (tracked via Donation with provider: 'support_token')

## Verification

- Landing shows Donate link → `/event`
- Campaign shows Donate CTA → `/event`
- `/event` shows fundraiser progress and Stripe/Patreon buttons when configured
- Donation (or support token) mints vibeulons

## Reference

- Spec: [.specify/specs/bruised-banana-donation/spec.md](spec.md)
- Cursor plan: Blocker 1
