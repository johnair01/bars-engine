# Tasks: Certification Quest — Onboarding Quest Generation Unblock

## Phase 1: Add to CERT_QUEST_IDS

- [x] Add `'cert-onboarding-quest-generation-unblock-v1'` to `CERT_QUEST_IDS` in `scripts/seed-cyoa-certification-quests.ts`

## Phase 2: Create seed block

- [x] Add TwineStory upsert for `cert-onboarding-quest-generation-unblock-v1`
- [x] Add CustomBar upsert with `backlogPromptPath: '.specify/specs/onboarding-quest-generation-unblock/spec.md'`, `reward: 1`, `isSystem: true`, `visibility: 'public'`
- [x] Define passages: START, STEP_1–STEP_6, FEEDBACK, END_SUCCESS
- [x] Use markdown links in passage text (e.g. `[Open admin quest grammar](/admin/quest-grammar)`)
- [x] Report Issue → FEEDBACK on each step; FEEDBACK passage `links: []`, `tags: ['feedback']`

## Phase 3: Verification

- [x] Run `npm run seed:cert:cyoa` when DB is available
- [ ] Confirm quest appears on Adventures page (manual)
- [ ] Manually run through cert quest; confirm each step is achievable
