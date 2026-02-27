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

## Part 2: Backlog Update on Completion (Future)

### Vision
When a tester completes a verification quest, the system could update the codebase backlog (e.g. `.specify/backlog/BACKLOG.md`) to mark the corresponding prompt/spec as verified or to append completion metadata. This creates a feedback loop: verification quests validate features, and completion events drive backlog hygiene.

### Open questions
- How to map a verification quest (CustomBar id or TwineStory id) to a backlog prompt or spec?
- Metadata on CustomBar/TwineStory: `backlogPromptPath`, `specPath`?
- What exactly to write: status change, completion timestamp, tester id?
- Who can trigger this: any completer, or admin-only?

### Placeholder requirements (to be refined)

- **FR4**: A verification quest MAY declare a `backlogPromptPath` or `specPath` (e.g. in completionEffects or a new field).
- **FR5**: On completion, if such a path is set, the system MAY append or update the corresponding backlog entry (format TBD).

---

## Reference

- `getOrCreateRun`: `src/actions/twine.ts`
- `autoCompleteQuestFromTwine`: `src/actions/twine.ts`
- Adventures page: `src/app/adventures/page.tsx`
- Certification quest seed: `scripts/seed-cyoa-certification-quests.ts`
