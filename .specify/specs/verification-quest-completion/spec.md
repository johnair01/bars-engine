# Spec: Verification Quest Completion Display & Backlog Integration

## Purpose
Verification/certification quests played from the Adventures page must show as completed (like other quests) when the player finishes them. A future enhancement will allow completed verification quests to update the codebase backlog that corresponds to the prompt that generated the quest.

## Part 1: Completion Display (Implemented)

### Problem
Adventure quests (Certification: In-App CYOA Editing V1, Certification: CYOA Onboarding V1, Playable verification testing, The Resurrection Loop, etc.) were not showing as completed on the Adventures page after finishing them. The Adventures page checks `PlayerQuest.status === 'completed'` via `quest.assignments`, but certification quests had no `PlayerQuest` record because they are played ad-hoc without a formal assignment flow.

### Root cause
`autoCompleteQuestFromTwine` requires an existing `PlayerQuest` with `status: 'assigned'` to update. When a player starts a certification quest from the Adventures page (click Play with `questId` in URL), no assignment was created. Reaching an END passage triggered `autoCompleteQuestFromTwine`, which found no assignment and returned without marking complete.

### Solution
In `getOrCreateRun`, when a quest-scoped run exists (questId present), upsert a `PlayerQuest` with `status: 'assigned'` if one does not exist. This ensures `autoCompleteQuestFromTwine` can find and update the assignment when the player reaches an END passage.

### Functional requirements (Part 1)

- **FR1**: When a player starts or resumes a quest-scoped Twine run (Adventures play page with `questId`), a `PlayerQuest` with `status: 'assigned'` MUST exist for that player+quest.
- **FR2**: When the player reaches an END passage, `autoCompleteQuestFromTwine` MUST update the assignment to `status: 'completed'` and grant the reward.
- **FR3**: The Adventures page MUST display the "Completed" badge and reduced opacity for quests where `assignment.status === 'completed'`.

### Affected adventures
- Certification: In-App CYOA Editing V1
- Certification: CYOA Onboarding V1
- Playable verification testing
- The Resurrection Loop
- Any other quest-scoped adventure played from `/adventures`

---

## Part 2: Backlog Update on Completion (Implemented)

### Vision
When a tester completes a verification quest, the system records the completion and can sync it to the codebase backlog. Vercel's read-only filesystem requires a DB-first approach: completions are stored in `VerificationCompletionLog`, and a local sync script appends "Verified by {player} on {date}" to the corresponding spec file.

### Implementation

- **FR4**: A verification quest declares `backlogPromptPath` on CustomBar (e.g. `.specify/specs/lore-cyoa-onboarding/spec.md`). Seeded in `scripts/seed-cyoa-certification-quests.ts`.
- **FR5**: On completion, `autoCompleteQuestFromTwine` calls `recordVerificationCompletion`, which inserts into `VerificationCompletionLog`. Run `npm run sync:verification-backlog` locally to append verification lines to spec files.

### Reference

- `recordVerificationCompletion`: `src/actions/verification-backlog.ts`
- `autoCompleteQuestFromTwine`: `src/actions/twine.ts`
- Sync script: `scripts/sync-verification-backlog.ts`

---

## Reference

- `getOrCreateRun`: `src/actions/twine.ts`
- `autoCompleteQuestFromTwine`: `src/actions/twine.ts`
- Adventures page: `src/app/adventures/page.tsx`
- Certification quest seed: `scripts/seed-cyoa-certification-quests.ts`
