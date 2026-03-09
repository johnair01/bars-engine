# Tasks: Report Feedback Stability

## Phase 1: API Route

- [x] Create src/app/api/feedback/cert/route.ts (POST, auth, append to jsonl, no revalidation)
- [x] Add request validation (questId, passageName, feedback required)
- [ ] Verify feedback appears in .feedback/cert_feedback.jsonl after POST

## Phase 2: Replace Server Action with Fetch

- [x] TwineQuestModal: handleFeedbackSubmit uses fetch('/api/feedback/cert')
- [x] PassageRenderer: handleFeedbackSubmit uses fetch('/api/feedback/cert')
- [x] CampaignReader: audit for feedback form; no cert feedback form (uses different node API)
- [x] Remove or deprecate logCertificationFeedback for cert flow

## Phase 3: executeBindingsForPassage (advance-to-FEEDBACK kick)

- [x] Pass skipRevalidate to executeBindingsForPassage when target is FEEDBACK
- [x] Skip revalidatePath('/') inside executeBindingsForPassage when skipRevalidate

## Phase 4: Avoid Unnecessary Refresh (if needed)

- [ ] PassageRenderer: when advancing to FEEDBACK, consider skipping router.refresh() or using optimistic update
- [ ] Verify full-page play still shows FEEDBACK passage after advance

## Phase 5: Audit and Docs

- [x] Document all revalidatePath('/') callers (see ANALYSIS.md)
- [x] Update CERTIFICATION_FEEDBACK.md with API contract
- [x] Run build and check
