# Tasks: Certification Feedback Multi-Report

## Phase 1: Reset Logic

- [x] Add `useEffect` in PassageRenderer: when navigating TO FEEDBACK from another passage (prevPassageRef), reset `feedbackSubmitted`, `feedbackText`, `error`.
- [x] Add "Report another issue" button in the thank-you block; onClick resets `feedbackSubmitted`, `feedbackText`, `error`.

## Verification

- [ ] Submit feedback from STEP_1 → see thank-you → click "Report another issue" → see fresh form → submit again → both entries in cert_feedback.jsonl.
- [ ] Submit feedback from STEP_1 → Back to STEP_1 → click Report Issue from STEP_2 → land on FEEDBACK → see fresh form (not thank-you).
- [ ] Run existing certification quest; no regressions.
