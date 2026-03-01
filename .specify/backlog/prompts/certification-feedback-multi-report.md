# Prompt: Certification Feedback Multi-Report (Urgent)

**Use this prompt when fixing the Report Issue flow so testers can submit multiple issues.**

## Source

Emergent issue: Players cannot report multiple issues during certification quests. After submitting feedback once, returning to the FEEDBACK passage (via "Report Issue" from any step) shows "Your feedback has been logged" instead of a fresh form.

## Prompt text

> Fix the certification quest Report Issue flow so testers can submit multiple issues. Currently `PassageRenderer` uses `feedbackSubmitted` state that persists across navigation—when a tester goes Back and clicks "Report Issue" from another step, they see the thank-you message instead of a new form. Implement: (1) Reset `feedbackSubmitted` when `feedbackSourceStep` changes (user came from a different step = fresh visit). (2) Add "Report another issue" button in the thank-you state that resets the form in-place so testers can submit again without navigating. See [.specify/specs/certification-feedback-multi-report/spec.md](../../specs/certification-feedback-multi-report/spec.md).

## Acceptance

- [ ] After submit, "Report another issue" shows a fresh form; second submit logs to cert_feedback.jsonl.
- [ ] Back → different step → Report Issue → fresh form (not thank-you from previous submit).
- [ ] No regressions to existing certification quest flow.

## Reference

- Spec: [.specify/specs/certification-feedback-multi-report/spec.md](../../specs/certification-feedback-multi-report/spec.md)
- PassageRenderer: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../../src/app/adventures/[id]/play/PassageRenderer.tsx)
- Certification Quest UX: [.specify/specs/certification-quest-ux/spec.md](../../specs/certification-quest-ux/spec.md)
