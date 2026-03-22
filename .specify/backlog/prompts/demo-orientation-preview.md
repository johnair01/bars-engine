# Backlog Prompt: Demo Orientation Preview (DOP)

## Spec kit

- [spec.md](../specs/demo-orientation-preview/spec.md)
- [plan.md](../specs/demo-orientation-preview/plan.md)
- [tasks.md](../specs/demo-orientation-preview/tasks.md)

## One-liner

Shareable URLs for a **bounded orientation adventure** without login; **signup CTA** preserves `ref` / invite attribution.

## Implement in order

Follow `tasks.md` T1 → T12. Reuse `CampaignReader` + `/api/adventures/[slug]/[nodeId]`; add `demoMode` and a small config model for tokens.
