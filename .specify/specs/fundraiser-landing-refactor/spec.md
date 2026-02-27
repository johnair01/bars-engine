# Spec: Fundraiser Landing Refactor (T Revision)

## Purpose

Refactor the invite/landing flow so the Bruised Banana Residency Fundraiser page (`/event`) is the primary entry for non-players. Remove the 4 moves grid from the home page; present only Wake Up and Show Up on the Event page. Clean Up and Grow Up remain for existing players only and are excluded from the initial invite flow.

## User Flow

1. User hits invite link (`/event?ref=bruised-banana`)
2. **Wake Up**: Learn the story of the Bruised Banana Residency
3. **Show Up**: Contribute to campaign via (a) money donation, or (b) play the game + choose domains
4. After learning, option to sign up and enter regular player flow

## User Stories

### P1: Remove moves from landing page
**As a visitor**, I want a minimal landing page without the 4 moves grid, so I am not overwhelmed before I reach the fundraiser.

**Acceptance**: Home page (logged out) shows hero, CTAs (Support Residency → /event, Sign Up, Log In). No Wake Up, Clean Up, Grow Up, Show Up cards.

### P2: Event page as invite landing
**As a campaign organizer**, I want the Event page to be the primary invite landing, so non-players land directly on the fundraiser with Wake Up and Show Up options.

**Acceptance**: Invite link is `/event?ref=bruised-banana`. Event page displays Wake Up (Learn the story) and Show Up (Contribute OR Play) sections.

### P3: Wake Up — Learn the story
**As a non-player**, I want to learn the story of the Bruised Banana Residency before deciding to contribute or play, so I can raise my awareness.

**Acceptance**: Event page has a "Learn the story" section (Wake Up) with narrative content (instance.theme, targetDescription, or dedicated copy). Expandable or inline.

### P4: Show Up — Contribute or Play
**As a non-player**, I want to show up by either contributing money or by playing the game and choosing domains, so I can support the campaign in the way that fits me.

**Acceptance**: Event page has Show Up section with (a) Contribute money (donate/Sponsor CTAs), (b) Play the game (Sign Up → guided flow with domain selection). Sign up preserves ref attribution.

### P5: Invite link points to Event
**As a campaign organizer**, I want the Invite button to copy the Event page URL with ref, so shared links land visitors on the fundraiser.

**Acceptance**: InviteButton copies `{origin}/event?ref=bruised-banana` to clipboard.

## Functional Requirements

- **FR1**: Landing page (`/`) when logged out MUST NOT display the 4 moves grid. Hero + CTAs only.
- **FR2**: Event page (`/event`) MUST be the primary invite landing. Invite link MUST be `/event?ref=bruised-banana`.
- **FR3**: Event page MUST have Wake Up section ("Learn the story") with narrative content.
- **FR4**: Event page MUST have Show Up section with Contribute (donate) and Play (sign up + domain choice) paths.
- **FR5**: InviteButton MUST copy `/event?ref=bruised-banana` to clipboard.
- **FR6**: Sign up from Event page MUST preserve `campaignRef` in `player.storyProgress`.

## Non-functional Requirements

- No schema changes. Use existing `campaignDomainPreference` for domain selection (Q spec).
- Clean Up and Grow Up remain for existing players; no change in this spec.

## Out of Scope

- Full domain-aligned intention UX (U spec); Show Up "play" path can use simplified domain selection.
- CYOA flow; Begin the Journey remains discoverable for logged-in players.

## Reference

- Landing: [src/app/page.tsx](../../src/app/page.tsx)
- Event page: [src/app/event/page.tsx](../../src/app/event/page.tsx)
- InviteButton: [src/app/event/InviteButton.tsx](../../src/app/event/InviteButton.tsx)
- T spec (superseded): [cyoa-invitation-throughput/spec.md](../cyoa-invitation-throughput/spec.md)
