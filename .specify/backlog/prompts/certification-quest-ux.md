# Prompt: Certification Quest UX (Links + Feedback)

**Use this prompt when adding or modifying certification/verification quests.**

## Prompt text

> When implementing certification quests: (1) Render passage content with ReactMarkdown so markdown links `[text](url)` are clickable; all links MUST open in new tab (`target="_blank"`). (2) Add a "Report Issue" branched path: each step has a link to FEEDBACK passage; FEEDBACK renders a form (textarea + Submit) that calls `logCertificationFeedback`; feedback is written to `.feedback/cert_feedback.jsonl`. (3) Include markdown links in passage text where URLs are referenced (e.g. `[Open /campaign](/campaign)`). See [.specify/specs/certification-quest-ux/spec.md](../../specs/certification-quest-ux/spec.md).

## Checklist for new certification quests

- [ ] Passage text uses markdown links for URLs (e.g. `/campaign`, `/admin/adventures`)
- [ ] Each step has "Report Issue" link to FEEDBACK
- [ ] FEEDBACK passage exists with `tags: ['feedback']` or `name: 'FEEDBACK'`
- [ ] PassageRenderer handles FEEDBACK (form + logCertificationFeedback + Back button)

## Reference

- Spec: [.specify/specs/certification-quest-ux/spec.md](../../specs/certification-quest-ux/spec.md)
- Action: [src/actions/certification-feedback.ts](../../../src/actions/certification-feedback.ts)
- Feedback location & automation: [docs/CERTIFICATION_FEEDBACK.md](../../../docs/CERTIFICATION_FEEDBACK.md)
