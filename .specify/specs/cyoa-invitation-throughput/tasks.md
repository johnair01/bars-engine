# Tasks: Landing + Invitation Throughput (T)

## Context

**Emergent blocker**: Wendell wants a perfected CYOA flow before sending the CYOA link. A landing with 4 moves + sign-up for interest is safe to go live. CYOA can be dripped to players after they're in the system.

## Phase 1: Landing with 4 moves + sign-up for interest

- [x] Update home page (logged-out): display 4 basic moves (Wake Up, Clean Up, Grow Up, Show Up) with brief definitions
- [x] Primary CTA: Sign Up (or "Join" / "Sign up for your interest") — not "Begin the Journey"
- [x] Move "Begin the Journey" (CYOA) to secondary or remove from logged-out home; ensure logged-in players can access CYOA from dashboard
- [ ] Sign-up flow captures interest: add "What's your interest?" or domain/intention choice (simplified for v1 — deferred to U spec)

## Phase 2: ref param + attribution

- [x] Home page accepts `?ref=` query param (e.g. `/?ref=bruised-banana`)
- [x] Pass ref to sign-up form (hidden field when present in URL)
- [x] Guided sign-up (`/conclave/guided`): read ref from form; store in `player.storyProgress` as `campaignRef`
- [x] Post-sign-up: when ref=bruised-banana, redirect to `/event`

## Phase 3: Event page Invite CTA

- [x] Add "Invite friends" or "Share" button on Event page
- [x] Copies `{origin}/?ref=bruised-banana` to clipboard

## Verification

- Open `/?ref=bruised-banana` → landing shows 4 moves; ref preserved through sign-up
- Sign up → campaignRef stored in storyProgress
- Event page has Invite CTA with correct URL
- CYOA accessible for logged-in players (dashboard "Begin the Journey" link); not primary for new visitors
