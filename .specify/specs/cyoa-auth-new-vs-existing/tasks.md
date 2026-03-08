# Tasks: CYOA Auth — New vs Existing Players

## Phase 1: Apply Campaign State

- [ ] Create `applyCampaignStateToExistingPlayer(campaignState)` in campaign actions
- [ ] Validate player from session
- [ ] Merge campaignState into player.storyProgress
- [ ] Call assignOrientationThreads(player.id)
- [ ] Return { success: true }

## Phase 2: CampaignAuthForm — Login Mode

- [ ] Add mode state: 'signup' | 'login'
- [ ] Create `loginWithCampaignState(identity, campaignState)` — login then apply
- [ ] When mode=login: render login form, submit to loginWithCampaignState
- [ ] Toggle link: "Already have account? Log In" / "New here? Sign Up"
- [ ] On login success: apply campaign state, redirect to /conclave/onboarding

## Phase 3: CYOA Player Recognition

- [ ] Campaign twine page: fetch getCurrentPlayer(), pass hasPlayer={!!player}
- [ ] BruisedBananaTwinePlayer: accept hasPlayer prop
- [ ] When Signup node + hasPlayer: show "Continue to campaign" instead of auth form
- [ ] "Continue to campaign" calls applyCampaignStateToExistingPlayer, redirects

## Phase 4: Verification

- [ ] npm run build && npm run check
- [ ] Manual: new player → Signup → sign up → onboarding
- [ ] Manual: existing player → Signup → log in → campaign state applied, onboarding
- [ ] Manual: logged-in player → Signup → Continue to campaign → quests unlocked
