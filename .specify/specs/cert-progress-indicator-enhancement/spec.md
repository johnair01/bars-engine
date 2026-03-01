# Spec: Certification Quest Progress Indicator Enhancement

## Purpose

Make the campaign progress indicator ("Step X of N") more visually impactful with a colorful status bar (e.g. green). Reported in cert-two-minute-ride-v1 STEP_3: "progress is visible, but I think a colorful status bar (green) is more impactful for users."

## User story

**As a tester**, I want the progress indicator to use a colored bar (e.g. green) so my progress through the CYOA feels more tangible and motivating.

**Acceptance**: The "Step X of N" UI includes a visual progress bar (fill or gradient) that advances as the user moves through steps.

## Functional requirements

- **FR1**: The campaign play page MUST display a progress bar (or equivalent visual) that reflects current step / total steps.
- **FR2**: The bar SHOULD use a distinct color (e.g. green, purple) for visibility and impact.
- **FR3**: Progress MUST update when the user navigates to a new passage.

## Non-functional requirements

- Minimal change to existing progress display.
- Reuse Tailwind or existing design tokens.

## Reference

- Feedback source: .feedback/cert_feedback.jsonl (cert-two-minute-ride-v1 STEP_3)
- Campaign play: [src/app/campaign/](../../src/app/campaign/) or adventures play page
