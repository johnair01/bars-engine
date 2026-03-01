# Prompt: Certification Feedback Per-Step

**Use this prompt when fixing or extending certification quest feedback so each Report Issue submission is associated with the step it came from.**

## Context

When testers click "Report Issue" during a certification quest, feedback was previously logged with `passageName: "FEEDBACK"` because the form renders on the shared FEEDBACK passage. This made it impossible to tell which step (STEP_1, STEP_2, etc.) had the issue, and testers could not effectively submit feedback for multiple steps.

## Prompt text

> Implement step-specific certification feedback per [.specify/specs/certification-quest-ux/spec.md](../specs/certification-quest-ux/spec.md) FR3 and FR6. The play page MUST pass `feedbackSourceStep` (from `run.visited[visited.length - 2]` when on FEEDBACK) to PassageRenderer. PassageRenderer MUST call `logCertificationFeedback(questId, feedbackSourceStep ?? passage.name, feedback)` so each entry in `.feedback/cert_feedback.jsonl` has `passageName` set to the step where the issue was reported (e.g. STEP_1, STEP_2).

## Checklist

- [ ] Play page computes `feedbackSourceStep` when current passage is FEEDBACK and `visited.length >= 2`
- [ ] PassageRenderer accepts `feedbackSourceStep` prop and uses it in `handleFeedbackSubmit`
- [ ] CERTIFICATION_FEEDBACK.md documents that `passageName` is the source step
- [ ] Spec FR3 and FR6 updated

## Verification

1. Open a certification quest (e.g. cert-lore-cyoa-onboarding-v1)
2. On STEP_1, click "Report Issue" → submit feedback "Issue on step 1"
3. Click "Back to Previous Step", then "Next" to STEP_2
4. On STEP_2, click "Report Issue" → submit feedback "Issue on step 2"
5. Check `.feedback/cert_feedback.jsonl`: two entries with `passageName: "STEP_1"` and `passageName: "STEP_2"` respectively

## Reference

- Spec: [.specify/specs/certification-quest-ux/spec.md](../specs/certification-quest-ux/spec.md)
- Action: [src/actions/certification-feedback.ts](../../src/actions/certification-feedback.ts)
- Play page: [src/app/adventures/[id]/play/page.tsx](../../src/app/adventures/[id]/play/page.tsx)
- PassageRenderer: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
- Feedback docs: [docs/CERTIFICATION_FEEDBACK.md](../../docs/CERTIFICATION_FEEDBACK.md)
