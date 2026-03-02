# Tasks: Go-Live Integration

## Phase 1: Verify loop:ready
- [x] Confirm loop:ready runs build, db:reset-history, core quest config, test:feedback-cap, db:feedback-cap-history
- [x] Add any missing checks if needed (none; already complete)

## Phase 2: Verification quest
- [x] Add cert-go-live-v1 to CERT_QUEST_IDS in seed-cyoa-certification-quests.ts
- [x] Add Twine passages: run loop:ready, sign in, complete quest + confirm mint, confirm wallet
- [x] Add FEEDBACK and END_SUCCESS passages
- [x] Upsert TwineStory and CustomBar for cert-go-live-v1

## Phase 3: Pre-launch seed documentation
- [x] Add "Pre-Launch Seeds" section to LOOP_READINESS_CHECKLIST.md
- [x] List required seeds: seed:party, seed:quest-map, seed:cert:cyoa, seed:onboarding
- [x] Document order and when to run each

## Phase 4: Checklist alignment
- [x] Ensure LOOP_READINESS_CHECKLIST references loop:ready as automated portion
- [x] Go/No-Go gate lists both automated and manual criteria

## Verification
- [x] npm run seed:cert:cyoa → cert-go-live-v1 appears
- [x] npm run loop:ready → runs and prints summary
- [x] Pre-launch seed doc exists
