# Tasks: Cert Existing Players V1 Feedback

## Phase 1: Avatar Fix

- [x] Verify AW (avatar-visibility-and-cert-report-issue) status; implement if not done.
- [x] Ensure `autoCompleteQuestFromTwine` calls `processCompletionEffects` when quest has completionEffects.
- [x] Verify `deriveAvatarFromExisting` runs on Build Your Character completion.
- [ ] Manual test: existing player with nation/playbook, complete Build Your Character → avatar appears.

**Implemented:** `autoCompleteQuestFromTwine` calls `runCompletionEffectsForQuest` (quest-engine), which runs `processCompletionEffects` including `deriveAvatarFromExisting`. Build Your Character quest has `completionEffects: [{ type: 'deriveAvatarFromExisting' }]`. TwineQuestModal now passes `threadId` to `advanceRun` so thread advances when completing from modal with thread context.

## Phase 2: Report Issue Redirect Fix

- [x] Reproduce: cert-existing-players-character-v1 STEP_4 → Report Issue → observe redirect.
- [x] Trace submit handler, revalidatePath, and post-submit behavior in PassageRenderer.
- [x] Fix any redirect; ensure user stays in quest flow or Back returns to STEP_4.
- [ ] Manual test: Report Issue from STEP_4 → submit feedback → no dashboard redirect; Back returns to STEP_4.

**Implemented (FR2):**
- TwineQuestModal: Added FEEDBACK passage support with feedback form, logCertificationFeedback, and Back that calls revertRun.
- advanceRun: Skip revalidatePath('/') when navigating to FEEDBACK to reduce navigate-away.
- revertRun: Skip revalidatePath('/') when reverting from FEEDBACK.
- TwineQuestModal: Pass threadId to advanceRun for consistency and thread advancement.

## Verification

- [ ] cert-existing-players-character-v1: Avatar builds on create character click.
- [ ] cert-existing-players-character-v1 STEP_4: Report Issue does not kick to dashboard; Back returns to step.
