# Spec: CYOA Auth — New vs Existing Players

## Purpose

Enable the campaign onboarding CYOA to (1) offer sign-in or log-in upon completion, (2) allow existing players to go through the flow and unlock campaign-specific quests, and (3) recognize new vs existing players so the flow branches appropriately.

## Priority

- **Enhancement** — improves campaign onboarding and reduces friction for returning players

## Context / Goal

- **Current**: Campaign CYOA shows CampaignAuthForm (sign-up only) at the Signup node. If account exists, user gets "Account already exists. Please log in." and must navigate away.
- **Desired**: Onboarding quest completion lets players sign-in OR log-in. Existing players can play through the full CYOA; completing it unlocks campaign-specific quests (e.g. bruised-banana-orientation-thread).
- **Key**: CYOA must recognize new vs existing players and branch accordingly.

## Conceptual Model

- **New player**: Play CYOA → reach Signup node → Sign Up or Log In (if they have an account elsewhere)
- **Existing player (logged in)**: Play CYOA → reach Signup node → "Continue to campaign" (apply state, unlock quests, redirect)
- **Existing player (not logged in)**: Play CYOA → reach Signup node → Log In (then apply campaign state on success)

## User Stories

### P1: Sign-up or Log-in at auth node

**As a new player**, I want to create an account when I reach the auth node, so I can enter the Conclave.

**As an existing player**, I want to log in when I reach the auth node, so I don't have to create a duplicate account.

**Acceptance**: At the Signup node, the form offers both "Sign Up" and "Log In". Choosing Log In uses the login action; success applies campaign state and redirects to onboarding/dashboard.

### P2: Logged-in players continue without re-auth

**As a logged-in player**, I want to play through the campaign CYOA and, when I reach the auth node, continue without re-entering credentials, so the flow feels seamless.

**Acceptance**: When the player is already logged in and reaches the Signup node, show "Continue to campaign" instead of the auth form. Clicking applies campaign state (lens, gm, quadrant, etc.) to their profile, assigns campaign orientation threads, and redirects to dashboard or conclave/onboarding.

### P3: Campaign state unlocks quests for existing players

**As an existing player**, I want completing the campaign CYOA to unlock campaign-specific quests (e.g. bruised-banana-orientation-thread), so I get the same benefits as new sign-ups.

**Acceptance**: When an existing player completes the auth/continue step, `assignOrientationThreads` is called with campaign state (lens, gm, quadrant). The bruised-banana-orientation-thread is assigned when lens is present, per existing logic.

## Functional Requirements

### FR1: CampaignAuthForm supports login

- Add a "Log In" mode or tab alongside Sign Up.
- When user chooses Log In: use the login action (from conclave-auth or similar) with email/password.
- On login success: call `applyCampaignStateToExistingPlayer(playerId, campaignState)` then redirect to `/conclave/onboarding` or `/`.
- Preserve campaignState (lens, gm, quadrant, refinedSignal, etc.) for the apply step.

### FR2: Apply campaign state for existing players

- New action: `applyCampaignStateToExistingPlayer(playerId, campaignState)`.
- Validates player owns the session.
- Merges campaignState into `player.storyProgress` (or dedicated fields).
- Calls `assignOrientationThreads(playerId)` with personalization from campaignState (lens → allyshipDomains, etc.).
- Returns success; caller handles redirect.

### FR3: CYOA receives player status

- Campaign twine page (`/campaign/twine`) fetches `getCurrentPlayer()`.
- Passes `hasPlayer: boolean` (or `player: Player | null`) to `BruisedBananaTwinePlayer`.

### FR4: Signup node branches for logged-in players

- When `hasPlayer` is true and user reaches Signup node: show "Continue to campaign" instead of CampaignAuthForm.
- "Continue to campaign" calls `applyCampaignStateToExistingPlayer` with current campaignState, then redirects.
- When `hasPlayer` is false: show CampaignAuthForm (with Sign Up + Log In).

### FR5: Login with returnTo preserves campaign context

- Login action (or CampaignAuthForm login path) accepts `returnTo` and `campaignState` in URL or form.
- After login, if campaignState present: call apply, then redirect to returnTo or `/conclave/onboarding`.

## Non-functional Requirements

- No breaking changes to existing createCampaignPlayer flow.
- Reuse existing `assignOrientationThreads` and bruised-banana-orientation-thread logic.

## Non-goals (this iteration)

- Email verification flow changes
- Social login
- Password reset from campaign flow

## Dependencies

- [CYOA Onboarding Reveal](../cyoa-onboarding-reveal/spec.md)
- [Bruised Banana Post-Onboarding Short Wins](../bruised-banana-post-onboarding-short-wins/spec.md) — assignOrientationThreads, bruised-banana-orientation-thread
- conclave-auth login action
- CampaignAuthForm, BruisedBananaTwinePlayer

## Reference

- Plan: [plan.md](plan.md)
- Tasks: [tasks.md](tasks.md)
