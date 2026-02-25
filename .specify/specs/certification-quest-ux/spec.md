# Spec: Certification Quest UX (Links + Feedback)

## Purpose
Improve certification quest UX so testers can open referenced URLs in new tabs (keeping their place in the quest) and report issues when a feature is not working. Both changes apply to verification/certification quests played in the Adventures Twine player.

## User stories

### P1: Links open in new tab
**As a tester**, I want URLs in certification quest passage text (e.g. /campaign, /admin/adventures) to be clickable and open in a new tab, so I can test the feature without losing my place in the quest.

**Acceptance**: Markdown links `[text](url)` in passage content render as `<a target="_blank">`; clicking opens the URL in a new tab.

### P2: Report Issue branched path
**As a tester**, I want a "Report Issue" option on each step that branches to a feedback form, so I can describe what isn't working and have it logged as a bug to fix.

**Acceptance**: Each step has a "Report Issue" choice → FEEDBACK passage with textarea + Submit. On submit, feedback is written to `.feedback/cert_feedback.jsonl`. Thank-you message + "Back to previous step" returns to the quest.

## Functional requirements

- **FR1**: Passage content MUST be rendered with ReactMarkdown; all `<a>` elements MUST have `target="_blank"` and `rel="noopener noreferrer"`.
- **FR2**: Certification quest passages that reference URLs MUST include markdown links (e.g. `[Open /campaign](/campaign)`) so they are clickable.
- **FR3**: A FEEDBACK passage (name `FEEDBACK` or tag `feedback`) MUST render a feedback form: textarea + Submit button. On submit, call `logCertificationFeedback(questId, passageName, feedback)`.
- **FR4**: `logCertificationFeedback` MUST append to `.feedback/cert_feedback.jsonl` with `{ timestamp, playerId, playerName, questId, passageName, feedback }`. No admin required.
- **FR5**: Each certification quest step MUST have a "Report Issue" link to FEEDBACK. FEEDBACK passage MUST exist in the story.

## Non-functional requirements

- Reuse existing PassageRenderer and Twine patterns.
- Feedback file is gitignored; no schema changes.

## Reference
- PassageRenderer: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
- Admin feedback pattern: [src/actions/admin-feedback.ts](../../src/actions/admin-feedback.ts)
- Certification quests seed: [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts)
