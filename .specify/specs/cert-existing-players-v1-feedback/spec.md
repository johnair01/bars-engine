# Spec: Cert Existing Players V1 Feedback (Certification Feedback)

## Purpose

Fix two issues reported during cert-existing-players-character-v1 STEP_4: (1) Avatar wasn't built when clicking the create character button; (2) When going to report this issue, user was kicked to the dashboard and had to use the back button to navigate back.

## Root cause

- **Avatar**: `autoCompleteQuestFromTwine` does not call `processCompletionEffects`, so `deriveAvatarFromExisting` never runs when the Build Your Character quest completes via the Twine flow. See [avatar-visibility-and-cert-report-issue](../avatar-visibility-and-cert-report-issue/spec.md).
- **Report Issue redirect**: Possible causes: submit handler redirect, post-submit navigation, or same root cause as cert-feedback-stability (session/auth check, revalidation). To investigate.

## User story

**As a tester**, I want the avatar to build when I click the create character button and to complete the Report Issue flow without being kicked to the dashboard, so I can verify the feature and report any issues without losing context.

## Functional requirements

- **FR1**: Avatar derivation on quest completion — when the Build Your Character quest completes via the Twine player, `processCompletionEffects` MUST run so `deriveAvatarFromExisting` executes and `player.avatarConfig` is set. Align with [avatar-visibility-and-cert-report-issue](../avatar-visibility-and-cert-report-issue/spec.md) (implement AW if not yet done).
- **FR2**: Report Issue flow must not redirect to dashboard — user stays in quest flow when clicking Report Issue, submitting feedback, or returning. If redirect occurs, Back must return to the source step (e.g. STEP_4) without losing context.

## Non-functional requirements

- Minimal change; prefer fixing root cause over workarounds.
- No schema changes.

## Reference

- Feedback source: [.feedback/cert_feedback.jsonl](../../.feedback/cert_feedback.jsonl)
- Quest: cert-existing-players-character-v1, passage: STEP_4
- Related: [avatar-visibility-and-cert-report-issue](../avatar-visibility-and-cert-report-issue/spec.md), [cert-feedback-stability](../cert-feedback-stability/spec.md)
- PassageRenderer: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
- Twine auto-complete: [src/actions/twine.ts](../../src/actions/twine.ts)
