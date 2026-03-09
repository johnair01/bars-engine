# Prompt: Report Feedback Stability — API-First Fix

**Use this prompt when fixing the Report Issue / Report feedback kick-to-dashboard problem.**

## Prompt text

> Implement the spec in [.specify/specs/report-feedback-stability/spec.md](../specs/report-feedback-stability/spec.md): (1) Create POST /api/feedback/cert that writes to .feedback/cert_feedback.jsonl with no revalidation; (2) Replace logCertificationFeedback server action with fetch() in TwineQuestModal and PassageRenderer; (3) Consider skipping router.refresh() when advancing to FEEDBACK in PassageRenderer. API-first: the route handler must not call revalidatePath. Run build and check. Verify feedback is logged after submit.

## Checklist

1. Create /api/feedback/cert route (POST, JSON body, auth, append to jsonl)
2. TwineQuestModal handleFeedbackSubmit → fetch
3. PassageRenderer handleFeedbackSubmit → fetch
4. Test: modal flow, full-page flow; no kick to dashboard
5. Verify .feedback/cert_feedback.jsonl receives entries

## Reference

- Spec: [.specify/specs/report-feedback-stability/spec.md](../specs/report-feedback-stability/spec.md)
- Analysis: [.specify/specs/report-feedback-stability/ANALYSIS.md](../specs/report-feedback-stability/ANALYSIS.md)
- Prior fixes: cert-feedback-stability, cert-existing-players-v1-feedback, quest-grammar-cert-feedback
