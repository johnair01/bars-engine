# Spec: Cert Quest Grammar Runtime Error (Certification Feedback)

## Purpose

Fix blocking runtime error and UX issues reported during cert-quest-grammar-v1 (2026-03-03): (1) **Runtime Error** — "Functions cannot be passed directly to Client Components" when QuestPacket (with telemetryHooks) is passed to GenerationFlow; (2) Report Issue still kicks to dashboard when typing; (3) Quest Grammar page layout — content justified right, should be centered on desktop.

## Root cause

- **Runtime Error**: `compileQuest` returns a QuestPacket with `telemetryHooks` (object of functions). When `compileQuestWithAI` or `compileQuest` result is passed to GenerationFlow (client component), Next.js cannot serialize functions across the server-client boundary.
- **Report Issue**: Same class as cert-feedback-stability — FEEDBACK passage revalidation may trigger navigate-away. Cert quest opens in modal; need skipRevalidate or equivalent.
- **Layout**: Quest Grammar admin page uses `max-w-2xl` with `ml-0 sm:ml-64`; content may appear right-justified. Should center content for desktop.

## User story

**As a tester** completing cert-quest-grammar-v1, I want the Quest Grammar flow to work without runtime errors, Report Issue to stay in-context when typing, and the page to look centered on desktop, so I can verify the feature.

## Functional requirements

- **FR1**: QuestPacket MUST NOT pass `telemetryHooks` (functions) to client components. Strip or omit telemetryHooks when returning from server actions that pass packet to client (e.g. compileQuestWithAI, or when compileQuest result is stored in client state).
- **FR2**: Report Issue flow in cert-quest-grammar-v1 MUST NOT kick user to dashboard when typing feedback. Apply same fixes as cert-existing-players-v1-feedback (skipRevalidate, sessionStorage persistence).
- **FR3**: Quest Grammar admin page content MUST be centered on desktop. Mobile-first preserved; desktop should not show awkward right-justified layout.

## Reference

- Feedback source: [.feedback/cert_feedback.jsonl](../../.feedback/cert_feedback.jsonl) — 2026-03-03 STEP_3
- Quest: cert-quest-grammar-v1
- Related: [quest-grammar-cert-feedback](../quest-grammar-cert-feedback/spec.md), [cert-feedback-stability](../cert-feedback-stability/spec.md)
