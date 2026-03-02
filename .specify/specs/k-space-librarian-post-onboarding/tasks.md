# Tasks: K-Space Librarian Post-Onboarding (Basic Quest)

## Phase 1: Auto-Assign Spawned DocQuest

- [x] In `submitLibraryRequest` (library.ts), after creating DocQuest and updating LibraryRequest with status 'spawned':
  - [x] Create PlayerQuest with playerId: requestor, questId: docQuest.id, status: 'assigned'
  - [x] Revalidate path '/'

## Phase 2: Orientation Quest and Thread

- [x] Create Twine story "Help the Knowledge Base" (slug: k-space-librarian-basic) with passages:
  - [x] START, STEP_1, STEP_2, STEP_3, FEEDBACK, END_SUCCESS
- [x] Create quest `k-space-librarian-quest` (CustomBar)
- [x] Create orientation thread `k-space-librarian-thread` (QuestThread)
- [x] Link quest to thread at position 1

## Phase 3: Seed Script

- [x] Extend seed-onboarding-thread.ts with K-Space Librarian story, quest, thread
- [x] Run `npm run seed:onboarding` and verify no errors

## Phase 4: LibraryRequestModal

- [x] Update spawned result link to `/` (dashboard) with copy "Your DocQuest has been added to Active Quests."

## Verification

- [ ] New player: see "Help the Knowledge Base" in Journeys after onboarding
- [ ] Complete quest: submit Library Request; get resolved or spawned result
- [ ] If spawned: DocQuest appears in Active Quests
- [ ] cert-k-space-librarian-v1 still works for admins
