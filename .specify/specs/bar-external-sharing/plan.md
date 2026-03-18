# Plan: BAR External Sharing

## Overview

Implement full flow for sharing BARs to external recipients: schema, share landing with login/signup, campaign-BAR → onboarding first, and iOS Open Graph preview.

## Phase 1: Schema and Share Creation

### 1.1 BarShareExternal model

- Add to `prisma/schema.prisma`:
  - `BarShareExternal`: id, barId, fromUserId, toEmail?, shareToken (unique), status (pending|claimed|expired|revoked), instanceId?, expiresAt, claimedById?, createdAt
  - Relations: bar, fromUser, claimedBy (Player?)
- Run `npm run db:sync`; create migration for production

### 1.2 sendBarExternal update

- Replace Invite-based flow with BarShareExternal
- Generate shareToken (crypto.randomBytes or nanoid)
- Set expiresAt = now + 72h
- If BAR has collapsedFromInstanceId or linked Instance, set instanceId
- Return URL: `/bar/share/[shareToken]`

### 1.3 Revocation

- Add server action or API: `revokeBarShare(shareId)` — set status = revoked. Sender only.

## Phase 2: Share Landing

### 2.1 Route `/bar/share/[token]`

- Fetch BarShareExternal by shareToken
- Validate: not expired, not revoked, bar exists
- If invalid: show error page
- If valid: render preview (sender name, BAR title, campaign name), "Log in" and "Sign up" / "Continue"

### 2.2 Auth branching

- **Logged in + already claimed**: Redirect to `/bars/[barId]`
- **Logged in + not claimed**: Claim flow (link share to player), redirect to BAR
- **Not logged in + bar-only**: Show sign-up form; on success, claim and redirect
- **Not logged in + campaign-BAR**: Redirect to onboarding (instance onboarding adventure); after completion, sign up and claim

### 2.3 Campaign-BAR detection

- `isCampaignBar(share)`: share.instanceId != null OR bar.collapsedFromInstanceId != null OR (Invite path) invite.instanceId != null
- When true: onboarding-first flow

### 2.4 Onboarding-first flow

- Redirect to `/campaigns/[instanceId]/onboarding` or equivalent with shareToken in state/query
- Onboarding completion: create account (or link to existing), claim share, redirect to BAR

## Phase 3: iOS Preview (Open Graph)

### 3.1 Meta tags on share page

- Add to `/bar/share/[token]` (or use Next.js metadata API):
  - `og:title`: "[Sender name] has shared a reflection with you"
  - `og:description`: "Discover insights and contribute to [Campaign name]." or "View a reflection shared with you."
  - `og:image`: Campaign image or default community image
  - `og:url`: Canonical share URL
  - `twitter:card`: summary_large_image

### 3.2 Dynamic metadata

- Fetch share + bar + sender in server component; pass to `generateMetadata` or equivalent

## Phase 4: Integration and Cleanup

### 4.1 Invite migration

- Decide: keep Invite path for admin-created invites, or migrate all to BarShareExternal
- Update ShareOutsideForm to use new URL shape

### 4.2 Golden path alignment

- When share has instanceId, use starterQuestId from Instance for onboarding
- Ensure acceptGoldenPathInvitation or equivalent is invoked on claim

## File Impacts

| File | Action |
|------|--------|
| prisma/schema.prisma | Add BarShareExternal |
| src/actions/bars.ts | Update sendBarExternal; add revokeBarShare |
| src/app/bar/share/[token]/page.tsx | Create share landing |
| src/app/bar/share/[token]/SharePreview.tsx | Preview + login/signup UI |
| src/app/bars/[id]/ShareOutsideForm.tsx | Use new URL |
| Metadata | Add generateMetadata for og tags |

## Order of Execution

1. Phase 1.1 — Schema
2. Phase 1.2 — sendBarExternal
3. Phase 2.1 — Share landing route
4. Phase 2.2–2.4 — Auth branching, campaign detection, onboarding flow
5. Phase 3 — Open Graph
6. Phase 4 — Integration
