# Spec: Certification Feedback Stability (No Navigate-Away)

## Purpose

Fix the issue where the FEEDBACK passage sometimes navigates the user to the dashboard while they are typing, losing their feedback text. Reported in cert-lore-cyoa-onboarding-v1 and cert-two-minute-ride-v1: "when I access the submit feedback page on certification quests it kicks me to the dashboard" and "the app moves to the dashboard while I'm in the middle of typing."

## Root cause (to investigate)

Possible causes: session/auth check redirect, route change on revalidation, parent layout unmount, or focus loss triggering navigation. The play page or PassageRenderer may be re-rendering in a way that causes navigation.

## User story

**As a tester**, I want the feedback form to stay visible and stable while I type, so I can complete my report without losing my text or being kicked to the dashboard.

**Acceptance**: On FEEDBACK passage, typing in the textarea does not trigger navigation away. Feedback form remains mounted until user explicitly submits or clicks Back.

## Functional requirements

- **FR1**: The FEEDBACK passage MUST NOT trigger navigation (e.g. to dashboard) while the user is interacting with the form.
- **FR2**: If the root cause is a server action or revalidation, the play page MUST preserve the current passage and run state during feedback entry.
- **FR3**: Feedback text MUST persist in local state until submit or explicit Back/Cancel.

## Non-functional requirements

- Investigate: router.refresh(), revalidatePath, auth middleware, or layout effects that might redirect.
- Minimal change; prefer fixing the trigger over adding workarounds.

## Reference

- Feedback source: .feedback/cert_feedback.jsonl (cert-lore-cyoa-onboarding-v1, cert-two-minute-ride-v1 STEP_1)
- PassageRenderer: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
- Play page: [src/app/adventures/[id]/play/page.tsx](../../src/app/adventures/[id]/play/page.tsx)
