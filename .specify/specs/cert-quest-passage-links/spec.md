# Spec: Certification Quest Passage Links

## Purpose

Ensure all certification quest passages that reference URLs include markdown links that render as clickable `<a target="_blank">`, so testers can open pages in new tabs without losing their place. Reported: "/wiki doesn't show up as a link" (cert-lore-cyoa-onboarding-v1) and "certification quests will mention a feature but there isn't enough data to point to where the feature should be tested" (cert-two-minute-ride-v1).

## Root cause

- FR1/FR2 of [certification-quest-ux](../certification-quest-ux/spec.md) require markdown links and target="_blank".
- Passage text may use plain URLs or prose without `[text](url)` markdown.
- ReactMarkdown in PassageRenderer already uses target="_blank" for links; the gap is passage content.

## User story

**As a tester**, I want every URL or feature reference in certification quest steps to be a clickable link that opens in a new tab, so I can test the feature without losing my place.

**Acceptance**: Each passage that mentions a route (e.g. /wiki, /event, /campaign) includes `[Open /wiki](/wiki)`-style markdown. Rendered links open in new tab.

## Functional requirements

- **FR1**: Certification quest passages that reference URLs MUST use markdown link syntax `[label](url)` (e.g. `[Open /wiki](/wiki)`).
- **FR2**: PassageRenderer MUST continue to render links with `target="_blank"` and `rel="noopener noreferrer"` (already required by certification-quest-ux).
- **FR3**: Audit seed script: all cert quest passages mentioning /wiki, /event, /campaign, /admin, etc. MUST have corresponding markdown links.

## Non-functional requirements

- Update [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts) passage text.
- No schema changes.

## Reference

- Feedback source: .feedback/cert_feedback.jsonl (cert-lore-cyoa-onboarding-v1, cert-two-minute-ride-v1 STEP_1)
- Certification Quest UX: [.specify/specs/certification-quest-ux/spec.md](../certification-quest-ux/spec.md)
- Seed script: [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts)
