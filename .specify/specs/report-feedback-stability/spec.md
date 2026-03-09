# Spec: Report Feedback Stability — Root Cause and API-First Fix

## Purpose

Fix the recurring issue where "Report Issue" / "Report feedback" kicks the user to the dashboard while typing or submitting, losing context and sometimes the typed text. Despite multiple prior fixes (skipRevalidate, sessionStorage, etc.), the problem persists. This spec provides a root cause analysis and an API-first solution that eliminates the failure mode.

## Root Cause Analysis

### Why Prior Fixes Keep Failing

| Prior Fix | What It Addressed | Why It Fails |
|-----------|-------------------|--------------|
| skipRevalidate in advanceRun | Avoid revalidatePath('/') when navigating to FEEDBACK | Only applies when advanceRun is the trigger. Other code paths (bindings, concurrent requests, layout) can still call revalidatePath('/'). |
| sessionStorage for feedback text | Preserve typed text when kicked | Mitigates symptom; does not prevent the kick. User still loses context and must click back. |
| skipRevalidate in modal | TwineQuestModal passes true | Modal state is in React state. Any revalidation of `/` causes the dashboard server component to re-render. Client children may re-mount or receive new props; modal state (selectedQuest) can reset. |
| "Report another issue" button | Multi-report flow | Unrelated to the kick; addresses stale thank-you message. |

### Actual Root Causes

0. **executeBindingsForPassage revalidates unconditionally** (root cause for click-to-FEEDBACK kick)
   - When advancing to any passage, `advanceRun` calls `executeBindingsForPassage`. That function calls `revalidatePath('/')` whenever bindings fire or diagnostic state changes.
   - Even when `advanceRun` skips revalidation (skipRevalidate=true for FEEDBACK), the bindings helper still revalidated `/`, re-rendering the dashboard and closing the modal.
   - **Fix**: Pass `skipRevalidate` to `executeBindingsForPassage` when advancing to FEEDBACK; skip `revalidatePath('/')` inside the helper when that flag is set.

1. **Multiple entry points, inconsistent handling**
   - **TwineQuestModal** (dashboard): advanceRun with skipRevalidate=true; no router.refresh on advance. Modal state lost when parent revalidates.
   - **PassageRenderer** (full page /adventures/[id]/play): advanceRun with skipRevalidate when target=FEEDBACK; **calls router.refresh() after every advance**. Refresh re-fetches the play page; in some React/Next.js scenarios this can cause navigation or state loss.
   - **CampaignReader** (campaign flow): Different API; may have its own feedback path. Cert quests like cert-lore-cyoa, cert-two-minute-ride use CampaignReader.
   - **GenerationFlow** (Quest Grammar admin): Cert quest opens in modal; telemetryHooks and other props caused runtime errors; separate fix.

2. **Revalidation cascade**
   - revalidatePath('/') is called from 30+ places (donate, economy, gameboard, quest-grammar, etc.).
   - Any server action that runs (including from layout, middleware, or concurrent requests) can trigger revalidation.
   - When `/` revalidates, the dashboard re-renders. Modal state (selectedQuest) lives in QuestPack/QuestThread client state. A full server re-render can cause client components to receive new props; if the tree structure or keys change, state resets.

3. **router.refresh() after advance**
   - PassageRenderer calls router.refresh() after every successful advance (including to FEEDBACK).
   - Refresh triggers a full RSC re-fetch. The play page re-renders. Even with skipRevalidate, the client-initiated refresh can cause unexpected behavior (e.g. layout effects, suspense boundaries).

4. **Form submit uses server action**
   - logCertificationFeedback is a server action. Server actions can trigger revalidation implicitly in some Next.js versions or when used with useActionState/useFormState.
   - Even if logCertificationFeedback does not call revalidatePath, the form submission flow may trigger other revalidations (e.g. from getCurrentPlayer or layout).

## Design Decision: API-First

| Topic | Decision |
|-------|----------|
| Submit mechanism | Use **fetch() to POST /api/feedback/cert** instead of a server action. No server action = no implicit revalidation from the form submit path. |
| Advance to FEEDBACK | Keep advanceRun with skipRevalidate. For PassageRenderer, **do not call router.refresh()** when advancing to FEEDBACK. |
| Modal stability | Ensure no revalidatePath('/') when on FEEDBACK. Extend the contract: any code path that could run while user is on FEEDBACK must not revalidate `/`. |
| Text persistence | Keep sessionStorage as defense-in-depth. |

## API Contract

### POST /api/feedback/cert

**Auth**: Requires session (cookies). Returns 401 if not logged in.

**Input** (JSON body):
```json
{
  "questId": "cert-quest-grammar-v1",
  "passageName": "STEP_1",
  "feedback": "The form kicked me to the dashboard while typing."
}
```

**Output**:
- 200: `{ "success": true }`
- 400: `{ "error": "Feedback is required" }` (empty/whitespace)
- 401: `{ "error": "Not logged in" }`
- 500: `{ "error": "Failed to write feedback" }`

**Behavior**:
- Writes to `.feedback/cert_feedback.jsonl` (same format as logCertificationFeedback).
- **MUST NOT** call revalidatePath or router.refresh.
- Idempotent for logging; duplicate submissions are acceptable.

## Functional Requirements

### FR1: Create POST /api/feedback/cert

- Route handler that reads JSON body, validates questId/passageName/feedback.
- Uses getCurrentPlayer() for auth.
- Appends to .feedback/cert_feedback.jsonl.
- Returns JSON. No revalidation.

### FR2: Replace server action with fetch in feedback forms

- **TwineQuestModal**: handleFeedbackSubmit calls fetch('/api/feedback/cert', { method: 'POST', body: JSON.stringify({...}) }) instead of logCertificationFeedback.
- **PassageRenderer**: Same change.
- **CampaignReader** (if it has feedback): Same change.
- Remove or deprecate logCertificationFeedback for cert feedback (keep for backward compat if other callers exist; add comment to prefer API).

### FR3: Avoid unnecessary refresh when advancing to FEEDBACK (PassageRenderer)

- In PassageRenderer handleChoice: when targetPassageName === 'FEEDBACK', consider skipping router.refresh() or using a scoped update. The play page is server-rendered; after advanceRun the run is updated in DB. We need the FEEDBACK passage to display—either via refresh or client-side fetch. Start with Phase 1–2 (API-first submit). If kick persists, implement optimistic update or scoped refresh.

### FR4: Audit and document revalidation

- List all callers of revalidatePath('/'). For each, document whether it could run during a cert quest feedback flow (e.g. from a layout, a concurrent request, or a form submit).
- Add a rule: "When user is on FEEDBACK passage, no code path must call revalidatePath('/')."

## User Stories

### P1: Submit feedback without kick

**As a tester**, I want to click "Report Issue", fill out the feedback form, and submit without being kicked to the dashboard, so my feedback is logged and I can continue the quest.

**Acceptance**: In both modal and full-page contexts, submitting feedback does not cause navigation away. Feedback is written to .feedback/cert_feedback.jsonl.

### P2: Type without kick

**As a tester**, I want to type in the feedback textarea without the page navigating away, so I can complete my report.

**Acceptance**: Typing in the feedback form does not trigger navigation. No revalidation or refresh while the user is on the FEEDBACK passage.

## Non-Goals

- Changing the format of cert_feedback.jsonl
- Adding a feedback UI outside of cert quests
- Real-time validation or character limits

## References

- [cert-feedback-stability](../cert-feedback-stability/spec.md)
- [certification-feedback-multi-report](../certification-feedback-multi-report/spec.md)
- [quest-grammar-cert-feedback](../quest-grammar-cert-feedback/spec.md)
- [src/actions/certification-feedback.ts](../../src/actions/certification-feedback.ts)
- [src/components/TwineQuestModal.tsx](../../src/components/TwineQuestModal.tsx)
- [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
