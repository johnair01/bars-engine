# Tasks: Avatar Visibility Fix + Certification Report Issue

## Phase 1: Avatar Preview (Before Completion)

- [x] In Build Your Character play page: when player has nationId+playbookId but no avatarConfig, derive config via `deriveAvatarConfig` from avatar-utils and render Avatar component in passage/layout
- [x] Ensure player data (nationId, playbookId, campaignDomainPreference) is available to play page (e.g. from session or layout)

## Phase 2: Avatar Persistence (Twine Completion Effects)

- [x] Export `runCompletionEffectsForQuest` from quest-engine (or export processCompletionEffects) — takes playerId, questId, inputs; fetches quest, calls processCompletionEffects with db
- [x] In autoCompleteQuestFromTwine, after updating PlayerQuest: if quest.completionEffects, call runCompletionEffectsForQuest
- [x] Add threadId param to advanceRun
- [x] In advanceRun, when questCompleted and threadId: call advanceThreadForPlayer
- [x] In PassageRenderer handleChoice, pass threadId to advanceRun

## Phase 3: Certification Report Issue

- [ ] Audit all cert quests in seed-cyoa-certification-quests.ts for missing Report Issue on any step
- [ ] Add Report Issue to any passage that lacks it
- [x] Add FEEDBACK passage + Report Issue link to Build Your Character in seed-onboarding-thread.ts

## Verification

- [ ] Open Build Your Character as existing player with nation+playbook -> avatar preview visible before completion
- [ ] Complete Build Your Character as existing player -> avatarConfig set, avatar visible on dashboard
- [ ] All cert quests have Report Issue on every step
- [ ] Build Your Character has Report Issue
