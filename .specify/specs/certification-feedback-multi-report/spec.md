# Spec: Certification Feedback Multi-Report (Reset Flow)

## Purpose

Fix the certification quest Report Issue flow so testers can submit **multiple issues** during a single quest run. Currently, after submitting feedback once, returning to the FEEDBACK passage (from any step) shows "Your feedback has been logged" instead of a fresh form—blocking emergent issue reporting.

## Root cause

- `PassageRenderer` uses local state `feedbackSubmitted` to show the thank-you message after submit.
- This state persists across navigation. When the tester goes Back → clicks "Report Issue" from another step → lands on FEEDBACK again, the component instance may be reused and `feedbackSubmitted` remains `true`.
- Result: Testers cannot report additional issues without refreshing or restarting the quest.

## User story

**As a tester**, I want to report as many issues as I discover during a certification quest, so each emergent bug gets logged for triage. When I return to "Report Issue" (from the same or a different step), I must see a fresh feedback form—not a stale "feedback has been logged" message.

**Acceptance**:
1. After submitting feedback, I can click "Report another issue" to get a new form without navigating away.
2. When I navigate Back to a step and click "Report Issue" again (from any step), I see a fresh form—not the thank-you message from a previous submit.

## Functional requirements

- **FR1**: When the FEEDBACK passage is rendered with a **different** `feedbackSourceStep` than the last time feedback was submitted, the form MUST be shown (reset `feedbackSubmitted`). This covers: Back → different step → Report Issue.
- **FR2**: The thank-you state MUST include a "Report another issue" button that resets the form in-place (clears `feedbackSubmitted`, `feedbackText`, `error`) so the tester can submit again without navigating.
- **FR3**: `feedbackSourceStep` is the source step passed from the play page; when it changes, treat the visit as a new feedback opportunity and reset the submitted state.

## Non-functional requirements

- Minimal change: extend PassageRenderer feedback logic.
- No schema changes; no changes to `logCertificationFeedback` or `.feedback/cert_feedback.jsonl`.
- Reuse existing certification quest structure (no seed changes required).

## Reference

- PassageRenderer: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
- Certification Quest UX spec: [.specify/specs/certification-quest-ux/spec.md](../certification-quest-ux/spec.md)
- Feedback location: [docs/CERTIFICATION_FEEDBACK.md](../../docs/CERTIFICATION_FEEDBACK.md)
