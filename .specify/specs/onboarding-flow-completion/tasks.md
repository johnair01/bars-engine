# Tasks: Onboarding Flow Completion

## Phase 1: Onboarding State API

- [x] Create `getOnboardingState(playerId?)` in src/actions/onboarding.ts
- [x] Implement state derivation from storyProgress, onboardingComplete, thread progress
- [x] Create `advanceOnboardingState(event)` — validate event, map to existing flows
- [x] Create GET /api/onboarding/state route
- [x] Create POST /api/onboarding/advance route
- [x] Document request/response shapes in spec or docs

## Phase 2: Strengthen the Residency — 4 Branches

- [x] Update starter-strengthen-residency Twine: Donate, Invite, Feedback, Share passages
- [x] Add completionType to inputs on completion
- [x] Extend processCompletionEffects to handle completionType
- [x] Wire donate branch → vibeulon mint (and optionally funding)
- [x] Wire invite/feedback/share branches → log or counter

## Phase 3: Visible Effects + Verification

- [x] Ensure at least one visible effect per completion branch
- [x] Add cert-onboarding-flow-completion-v1 to seed-cyoa-certification-quests
- [x] Run npm run build and npm run check
