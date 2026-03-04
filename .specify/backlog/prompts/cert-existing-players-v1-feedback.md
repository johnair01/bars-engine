# Prompt: Cert Existing Players V1 Feedback

**Use when fixing the cert-existing-players-character-v1 feedback issues.**

## Source

Certification feedback (cert-existing-players-character-v1 STEP_4):

> Avatar wasn't built when I clicked the create character button. Also when I went to report this issue I was kicked to the dashboard and had to use the back button to navigate back here to report the issue

## Prompt text

> Fix the two issues reported in cert-existing-players-character-v1: (1) Avatar not built when clicking create character — ensure `autoCompleteQuestFromTwine` calls `processCompletionEffects` so `deriveAvatarFromExisting` runs (align with [avatar-visibility-and-cert-report-issue](.specify/specs/avatar-visibility-and-cert-report-issue/spec.md)); (2) Report Issue kicks to dashboard — trace and fix the redirect so user stays in quest flow. See [.specify/specs/cert-existing-players-v1-feedback/spec.md](../../specs/cert-existing-players-v1-feedback/spec.md).

## Reference

- Spec: [.specify/specs/cert-existing-players-v1-feedback/spec.md](../../specs/cert-existing-players-v1-feedback/spec.md)
- Plan: [.specify/specs/cert-existing-players-v1-feedback/plan.md](../../specs/cert-existing-players-v1-feedback/plan.md)
- Tasks: [.specify/specs/cert-existing-players-v1-feedback/tasks.md](../../specs/cert-existing-players-v1-feedback/tasks.md)
