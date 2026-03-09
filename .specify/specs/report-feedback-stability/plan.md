# Plan: Report Feedback Stability — API-First Fix

## Summary

Create POST /api/feedback/cert; replace logCertificationFeedback server action with fetch() in all feedback forms. Audit revalidatePath('/') and add guardrails. No router.refresh() when advancing to FEEDBACK in PassageRenderer (use optimistic update or ensure refresh is scoped).

## Phases

### Phase 1: API Route

1. Create `src/app/api/feedback/cert/route.ts`
   - POST handler
   - Read JSON body: questId, passageName, feedback
   - getCurrentPlayer() for auth
   - Append to .feedback/cert_feedback.jsonl (reuse logic from logCertificationFeedback)
   - Return { success: true } or { error }
   - **No revalidatePath, no redirect**

### Phase 2: Replace Server Action in Forms

2. **TwineQuestModal** handleFeedbackSubmit
   - Replace `await logCertificationFeedback(...)` with `fetch('/api/feedback/cert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questId, passageName, feedback }) })`
   - Parse response, set feedbackSubmitted or setError

3. **PassageRenderer** handleFeedbackSubmit
   - Same replacement

4. **CampaignReader** (if has feedback form)
   - Same replacement

5. **AdminFeedbackInput** or other feedback components
   - Audit and update if they submit cert feedback

### Phase 3: Avoid Refresh on Advance to FEEDBACK (PassageRenderer)

6. In PassageRenderer handleChoice, when targetPassageName === 'FEEDBACK':
   - Do NOT call router.refresh()
   - The play page passes `passage` from server. After advanceRun, the run is updated but the page hasn't re-fetched. We need the FEEDBACK passage to display.
   - **Option A**: Have advanceRun return the passage data; client renders it optimistically.
   - **Option B**: Call router.refresh() but ensure it's the only refresh (no other revalidation). The kick might be from something else.
   - **Option C**: Use a client-side fetch to get the passage after advance, then set state. Avoids full page refresh.
   - **Recommendation**: Start with Phase 1–2. If kick persists, implement Option A or C.

### Phase 4: Audit and Documentation

7. Grep revalidatePath('/') and document each caller.
8. Add to cert-feedback-stability or this spec: "When user is on FEEDBACK, no code path must revalidate /."
9. Update CERTIFICATION_FEEDBACK.md with API contract.

## File Impacts

| File | Action |
|------|--------|
| src/app/api/feedback/cert/route.ts | Create |
| src/components/TwineQuestModal.tsx | Replace logCertificationFeedback with fetch |
| src/app/adventures/[id]/play/PassageRenderer.tsx | Replace logCertificationFeedback with fetch; consider skip refresh for FEEDBACK |
| src/actions/certification-feedback.ts | Deprecate or keep for non-API callers; add comment |
