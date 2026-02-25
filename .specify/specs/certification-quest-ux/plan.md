# Plan: Certification Quest UX (Links + Feedback)

## Summary
Links in passage text open in new tabs; branched "Report Issue" path logs feedback to `.feedback/cert_feedback.jsonl`.

## Implementation (done)

1. **PassageRenderer** — ReactMarkdown for passage content with `target="_blank"` on all links; FEEDBACK passage detection and form rendering.
2. **logCertificationFeedback** — New server action; appends to cert_feedback.jsonl; no admin required.
3. **Seed script** — Markdown links in passage text; Report Issue + FEEDBACK passage in both certification quests.

## Verification
- Open certification quest → click [Open /campaign](/campaign) → opens in new tab.
- Click "Report Issue" → FEEDBACK form → submit → thank-you + Back.
- Check `.feedback/cert_feedback.jsonl` for entry.
