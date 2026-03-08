# Plan: CYOA Auth — New vs Existing Players

## Summary

Extend the campaign CYOA to recognize new vs existing players, offer both sign-up and log-in at the auth node, and allow logged-in players to "Continue to campaign" to unlock campaign quests without re-auth.

## Phase 1: Apply Campaign State for Existing Players

### 1.1 New action: applyCampaignStateToExistingPlayer

**File**: `src/app/campaign/actions/campaign.ts` (or new `campaign-apply.ts`)

- Signature: `applyCampaignStateToExistingPlayer(campaignState: Record<string, unknown>)`
- Get player from cookies; validate session.
- Parse campaignState (lens, gm, quadrant, refinedSignal, etc.).
- Update `player.storyProgress` to merge campaign state (JSON).
- Call `assignOrientationThreads(player.id)` — it reads from storyProgress, so ensure state is persisted first.
- Return `{ success: true }` or `{ error }`.

### 1.2 assignOrientationThreads compatibility

- `assignOrientationThreads` already reads from `player.storyProgress` when building params.
- Ensure we write `{ campaignBypass: true, state: { lens, gm, quadrant, ... } }` so existing logic picks it up.
- bruised-banana-orientation-thread is assigned when `state.lens` is present (per quest-thread.ts).

## Phase 2: CampaignAuthForm — Sign Up + Log In

### 2.1 Add login mode

**File**: `src/app/campaign/components/CampaignAuthForm.tsx`

- Add state: `mode: 'signup' | 'login'`.
- When mode is login: use `login` action from conclave-auth (or a wrapper that accepts campaignState).
- Login form: email, password, hidden campaignState.
- On login success: call `applyCampaignStateToExistingPlayer(campaignState)` then redirect to `/conclave/onboarding`.
- Toggle: "Already have an account? Log In" / "New here? Sign Up".

### 2.2 Login with campaign state

- The conclave-auth `login` action returns `redirectTo`. We need to intercept and apply campaign state.
- Option A: Create `loginWithCampaignState(identity, campaignState)` that (1) calls login, (2) on success applies campaign state, (3) redirects to onboarding.
- Option B: Login redirects to `/conclave/onboarding?applyCampaign=1` with campaignState in sessionStorage; onboarding page checks and applies.
- **Recommendation**: Option A — server action that does both.

## Phase 3: CYOA Recognizes Player Status

### 3.1 Pass hasPlayer to BruisedBananaTwinePlayer

**File**: `src/app/campaign/twine/page.tsx`

- Await `getCurrentPlayer()`.
- Pass `hasPlayer={!!player}` to BruisedBananaTwinePlayer.

### 3.2 BruisedBananaTwinePlayer: Continue for logged-in

**File**: `src/components/campaign/BruisedBananaTwinePlayer.tsx`

- Accept prop `hasPlayer: boolean`.
- When `target === 'Signup'` and `hasPlayer`:
  - Don't show CampaignAuthForm.
  - Show "Continue to campaign" button.
  - On click: call `applyCampaignStateToExistingPlayer(campaignState)`, redirect to `/conclave/onboarding` or `/`.
- When `target === 'Signup'` and !hasPlayer: show CampaignAuthForm (unchanged).

## Phase 4: Integration

### 4.1 Login action with campaign apply

- Ensure `loginWithCampaignState` or equivalent exists and is wired.
- CampaignAuthForm in login mode submits to this action.

### 4.2 Redirect targets

- New sign-up: `/conclave/onboarding` (existing).
- Existing login + apply: `/conclave/onboarding`.
- Logged-in continue: `/conclave/onboarding` or `/` (if nation+playbook already set).

## Implementation Order

1. Phase 1: applyCampaignStateToExistingPlayer
2. Phase 2: CampaignAuthForm login mode + loginWithCampaignState
3. Phase 3: Pass hasPlayer, "Continue to campaign" for logged-in
4. Phase 4: Verify redirects and manual flow
