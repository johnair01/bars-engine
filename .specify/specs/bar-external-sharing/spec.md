# Spec: BAR External Sharing

## Purpose

When a player sends a BAR to someone **outside the game** (email, SMS, share link), the recipient needs: (1) log in if they have an account, (2) sign up if they don't, (3) onboarding adventure first when the BAR is campaign-associated, and (4) an iOS-friendly preview so the link doesn't look suspicious.

**Practice**: Deftness Development — spec kit first, API-first, deterministic over AI.

**Source**: [GM_CONSULT.md](./GM_CONSULT.md) — Game Master consultation (Architect, Regent, Diplomat, Shaman, Sage).

## Current State

- `sendBarExternal` creates an Invite with `invitationBarId`; share URL is `/invite/[token]`
- Invite landing (`/invite/[token]`) shows sign-up form; no login/signup choice for existing users
- No campaign-BAR detection → onboarding-first flow
- No Open Graph meta tags for iOS preview

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Schema** | Add `BarShareExternal` (toEmail, shareToken, status, barId, fromUserId, instanceId?, expiresAt) — or extend Invite. GM: BarShareExternal preferred for clarity. |
| **URL shape** | `/bar/share/[shareToken]` — compact, encodes bar-only vs campaign-BAR via token lookup |
| **Token** | 72-hour expiry; sender revocation; multi-view by default |
| **Campaign-BAR gate** | When BAR has `collapsedFromInstanceId` or BAR is linked to Instance via Invite.instanceId → onboarding first |
| **Flow** | Campaign-BAR: link → preview → onboarding CYOA → sign up → BAR view. Bar-only: link → login/signup choice → BAR view |
| **iOS preview** | og:title, og:description, og:image, og:url — sender name, BAR title, campaign context |

## User Stories

### P1: Log in (existing account)

**As a** recipient who already has an account, **I want** to log in when I click a BAR share link, **so** I can view the BAR without signing up again.

**Acceptance**: Share landing shows "Log in" and "Sign up" options; logged-in user is redirected to BAR view.

### P2: Sign up (new account)

**As a** recipient without an account, **I want** to sign up when I click a BAR share link, **so** I can create an account and view the BAR.

**Acceptance**: Share landing offers sign-up; after sign-up, user sees BAR. Account creation uses share token to link BarShareExternal → Player.

### P3: Campaign-BAR → onboarding first

**As a** recipient of a campaign-associated BAR, **I want** to complete the onboarding adventure before signing up, **so** I understand the campaign context before committing.

**Acceptance**: When BAR is campaign-linked (instanceId, collapsedFromInstanceId, or Invite.instanceId), flow is: preview → onboarding CYOA → sign up → BAR view. Account created after CYOA completion.

### P4: iOS preview (trust)

**As a** recipient on iOS (Messages, Mail), **I want** the shared link to show a rich preview with sender name and context, **so** it doesn't look like a suspicious link.

**Acceptance**: Share URL has Open Graph meta tags: og:title "[Sender] has shared a reflection with you", og:description, og:image, og:url. Preview renders in iOS link unfurling.

## Functional Requirements

### Phase 1: Schema and share creation

- **FR1**: Add `BarShareExternal` model: barId, fromUserId, toEmail?, shareToken (unique), status (pending|claimed|expired|revoked), instanceId?, expiresAt, claimedById?, createdAt. Or extend Invite with bar-specific fields if BarShareExternal is deferred.
- **FR2**: `sendBarExternal` creates BarShareExternal (or Invite with extended fields); returns `/bar/share/[token]` URL. Token expiry 72h.
- **FR3**: Sender can revoke share (status → revoked).

### Phase 2: Share landing and auth flow

- **FR4**: Add `/bar/share/[token]` route. Resolve token → BarShareExternal/Invite; if invalid/expired/revoked, show error.
- **FR5**: If valid: show preview (sender, BAR title, campaign name if any). Offer "Log in" and "Sign up" (or "Continue" for campaign-BAR).
- **FR6**: Logged-in user with matching email (or claimedById) → redirect to BAR view. Logged-in user without claim → complete claim flow.
- **FR7**: New user + bar-only → sign up form → account create → BAR view.
- **FR8**: New user + campaign-BAR → onboarding CYOA → sign up after completion → BAR view. Session hold 24h if abandoned.

### Phase 3: iOS preview

- **FR9**: `/bar/share/[token]` page (or dedicated meta route) serves Open Graph tags. og:title = "[Sender name] has shared a reflection with you". og:description = "Discover insights and contribute to [Campaign name]." (or generic if bar-only). og:image = campaign/community image or default. og:url = canonical share URL.

### Phase 4: Integration

- **FR10**: Align with [invitation-via-bar-ritual](../invitation-via-bar-ritual/spec.md) and [golden-path-invitation-shape](../golden-path-invitation-shape/spec.md). Campaign-BAR uses instanceId, starterQuestId, invitationBarId where applicable.

## Non-Functional Requirements

- Token entropy sufficient to prevent guessing
- Revocation takes effect immediately
- Preview page must not require auth (for crawlers)

## Out of Scope (v0)

- Email delivery (share link is copied; future: send email with link)
- One-time-view mode (multi-view default)
- Admin dashboard for share analytics

## Dependencies

- Invite, CustomBar, Instance, Player
- [invitation-via-bar-ritual](../invitation-via-bar-ritual/spec.md)
- [golden-path-invitation-shape](../golden-path-invitation-shape/spec.md)

## References

- [GM_CONSULT.md](./GM_CONSULT.md)
- [src/actions/bars.ts](../../src/actions/bars.ts) — sendBarExternal
- [src/app/bars/[id]/ShareOutsideForm.tsx](../../src/app/bars/[id]/ShareOutsideForm.tsx)
