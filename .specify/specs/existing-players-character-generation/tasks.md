# Tasks: Existing Players Character Generation (Orientation Quest)

## Phase 1: Completion Effect

- [x] Add import `deriveAvatarConfig` from `@/lib/avatar-utils` in quest-engine.ts
- [x] Add case `deriveAvatarFromExisting` in `processCompletionEffects`:
  - [x] Fetch player (nationId, playbookId, campaignDomainPreference, pronouns)
  - [x] Fetch Nation and Playbook for names
  - [x] Call deriveAvatarConfig, update player.avatarConfig if non-null

## Phase 2: Quest and Thread

- [x] Create Twine story "Build Your Character" (START + END_SUCCESS passages)
- [x] Create quest `build-character-quest` with completionEffects
- [x] Create orientation thread `build-character-thread` with threadType: orientation
- [x] Link quest to thread

## Phase 3: Seed Script

- [x] Extend seed-onboarding-thread.ts with Build Your Character story, quest, thread
- [x] Run `npm run seed:onboarding` and verify no errors

## Phase 4: Verification Quest

- [x] Add `cert-existing-players-character-v1` to seed-cyoa-certification-quests.ts
- [x] Add to CERT_QUEST_IDS array for reset on reseed
- [x] Run `npm run seed:cert:cyoa` and verify quest appears

## Verification

- [ ] Player with nationId + playbookId + no avatarConfig: visit dashboard, see Build Your Character thread
- [ ] Complete quest: avatarConfig stored, avatar renders in header
- [ ] cert-existing-players-character-v1 completes successfully
