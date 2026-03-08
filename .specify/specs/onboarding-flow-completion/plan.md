# Plan: Onboarding Flow Completion

## Summary

Add onboarding state API (GET/POST), extend Strengthen the Residency with 4 completion branches, wire visible effects. No new tables. API-first.

## Phases

### Phase 1: Onboarding State API (Contract First)

1. Create `getOnboardingState(playerId?)` Server Action — derives onboardingState from storyProgress, onboardingComplete, thread progress.
2. Create `advanceOnboardingState(event)` Server Action — validates event, maps to existing flows (nation_selected → update nationId; etc.).
3. Create `GET /api/onboarding/state` route — wraps getOnboardingState.
4. Create `POST /api/onboarding/advance` route — wraps advanceOnboardingState.

**State derivation logic**:
- `new_player`: !onboardingComplete && !storyProgress?.state
- `campaign_intro`: storyProgress?.state without nation/playbook
- `identity_setup`: nationId or playbookId set, not both
- `vector_declaration`: lens or campaignDomainPreference in state
- `onboarding_complete`: onboardingComplete true
- `starter_quests_generated`: onboardingComplete && has progress on bruised-banana-orientation-thread

### Phase 2: Strengthen the Residency — 4 Branches

1. Update starter-strengthen-residency Twine: add passages for Donate, Invite, Feedback, Share.
2. Each branch ends with completion; inputs include `completionType: 'donate' | 'invite' | 'feedback' | 'share'`.
3. Extend processCompletionEffects (or quest-specific handler) to branch on completionType:
   - donate → mint vibeulon, optionally increment Instance funding
   - invite → log invite_sent (or increment counter if we add it)
   - feedback → log feedback_submitted
   - share → log campaign_shared

### Phase 3: Visible Effects

1. Ensure vibeulon mint on Strengthen completion (any branch).
2. If Instance has funding: donation branch increments currentAmountCents (or spawn donation flow).
3. Add cert-onboarding-flow-completion-v1 verification quest.

## File Impacts

| File | Action |
|------|--------|
| `src/actions/onboarding.ts` | Add getOnboardingState, advanceOnboardingState |
| `src/app/api/onboarding/state/route.ts` | Create |
| `src/app/api/onboarding/advance/route.ts` | Create |
| `scripts/seed-onboarding-thread.ts` | Update Strengthen Twine passages |
| `src/actions/quest-engine.ts` | Extend processCompletionEffects for completionType |
| `scripts/seed-cyoa-certification-quests.ts` | Add cert-onboarding-flow-completion-v1 |

## Dependencies

- starter-quest-generator (done)
- campaign-onboarding-twine-v2 (lens in storyProgress)
- bruised-banana-orientation-thread
