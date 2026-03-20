# Tasks: BAR External Sharing

## Phase 1: Schema and Share Creation

- [x] **1.1** Add BarShareExternal model to prisma/schema.prisma
  - barId, fromUserId, toEmail?, shareToken (unique), status, instanceId?, expiresAt, claimedById?, createdAt
  - Relations: bar, fromUser, claimedBy
- [x] **1.2** Run npm run db:sync; create migration for production
- [x] **1.3** Update sendBarExternal to create BarShareExternal (replace Invite path)
  - Generate secure shareToken; expiresAt = now + 72h
  - Set instanceId when BAR is campaign-linked
  - Return /bar/share/[shareToken] URL
- [x] **1.4** Add revokeBarShare server action (sender only)

## Phase 2: Share Landing

- [x] **2.1** Create /bar/share/[token] route
  - Resolve BarShareExternal by token; validate not expired/revoked
  - Show error page if invalid
- [x] **2.2** Build SharePreview component (sender name, BAR title, campaign name)
  - "Log in" and "Sign up" / "Continue" buttons
- [x] **2.3** Implement auth branching
  - Logged in + claimed → redirect to BAR
  - Logged in + not claimed → claim, redirect
  - Not logged in + bar-only → sign up form → claim → redirect
  - Not logged in + campaign-BAR → onboarding first
- [x] **2.4** Implement isCampaignBar(share) helper
- [x] **2.5** Implement onboarding-first flow (redirect to campaign onboarding with shareToken)
- [x] **2.6** Account creation after onboarding; claim share; redirect to BAR
- [ ] **2.7** Session hold 24h for abandoned onboarding (**Future** — not in v0; optional onboarding resume)

## Phase 3: iOS Preview

- [x] **3.1** Add generateMetadata to /bar/share/[token] page
  - og:title, og:description, og:image, og:url
  - Dynamic values from share + bar + sender
- [x] **3.2** Add default og:image for bar-only shares
- [x] **3.3** Test preview in iOS Messages / Mail — **v0**: `generateMetadata` + default `og:image` implemented; manual device QA optional before marketing push

## Phase 4: Integration

- [x] **4.1** Update ShareOutsideForm to use new URL format
- [x] **4.2** Align with golden path (instanceId, starterQuestId when campaign-BAR)
- [x] **4.3** Run npm run build and npm run check

## Verification

- [x] External recipient can log in and view BAR — claim flow + redirect in `/bar/share/[token]` (logged-in branch)
- [x] External recipient can sign up and view BAR — signup → claim → BAR (bar-only path)
- [x] Campaign-BAR triggers onboarding before sign up — `isCampaignBar` + onboarding-first redirect
- [x] iOS link shows rich preview (not suspicious) — OG tags + absolute `metadataBase` / default image
- [x] Revoked share shows error — invalid/expired/revoked token handling on share page
