# Tasks: Certification Quest — Onboarding Quest Generation Unblock

## Phase 1: Add to CERT_QUEST_IDS

- [ ] Add `'cert-onboarding-quest-generation-unblock-v1'` to `CERT_QUEST_IDS` in `scripts/seed-cyoa-certification-quests.ts`

## Phase 2: Create seed block

- [ ] Add TwineStory upsert for `cert-onboarding-quest-generation-unblock-v1`
- [ ] Add CustomBar upsert with `backlogPromptPath: '.specify/specs/onboarding-quest-generation-unblock/spec.md'`
- [ ] Define passages: START, STEP_1–STEP_6, FEEDBACK, END_SUCCESS
- [ ] Use markdown links in passage text (e.g. `[admin quest grammar](/admin/quest-grammar)`)
- [ ] Add Report Issue link to FEEDBACK on each step

## Phase 3: Verification

- [ ] Run `npm run seed:cert:cyoa`
- [ ] Confirm quest appears on Adventures page
- [ ] Manually run through cert quest; confirm each step is achievable
