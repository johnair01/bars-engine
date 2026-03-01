# Prompt: Certification Quest Passage Links

**Use when adding markdown links to cert quest passages.**

## Source

Certification feedback (cert-lore-cyoa-onboarding-v1, cert-two-minute-ride-v1):

> /wiki doesn't show up as a link that opens in a new tab
> Certification quests will mention a feature but there isn't enough data to point to where the feature should be tested

## Prompt text

> Audit and update certification quest passages in seed-cyoa-certification-quests.ts. Every URL reference (e.g. /wiki, /event, /campaign) MUST use markdown link syntax [label](url). See [.specify/specs/cert-quest-passage-links/spec.md](../../specs/cert-quest-passage-links/spec.md).

## Reference

- Spec: [.specify/specs/cert-quest-passage-links/spec.md](../../specs/cert-quest-passage-links/spec.md)
- Seed: [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts)
