# Certification Quest Feedback

Feedback submitted via "Report Issue" during verification quests is logged for triage and automation.

## Flow

1. **Report Issue** — Tester clicks "Report Issue" on any cert quest step → navigates to FEEDBACK passage
2. **Submit** — `POST /api/feedback/cert` (JSON body: `questId`, `passageName`, `feedback`) writes to `.feedback/cert_feedback.jsonl`. API-first: no server action, no revalidation.
3. **Triage** — Use the [cert-feedback-triage skill](../.agents/skills/cert-feedback-triage/SKILL.md) to create specs, backlog prompts, and BACKLOG.md entries

## Entry Points

Cert quests can be played in two ways:

| Entry | Component | URL | Notes |
|-------|-----------|-----|-------|
| **Modal (dashboard)** | QuestPack / QuestThread → QuestDetailModal → TwineQuestModal | `/` | Opens over dashboard; `skipRevalidate` prevents kick when advancing to FEEDBACK |
| **Full page** | StarterQuestBoard Link → play page | `/adventures/[id]/play?questId=...` | Full-page navigation; `router.refresh()` after advance |

When playing from a pack or thread on the dashboard, the modal uses `skipRevalidate: true` so server action completion does not revalidate `/` and close the modal. Use `?focusQuest=questId` in the URL to restore the modal after a refresh (defense in depth).

## Location

- **`.feedback/cert_feedback.jsonl`** — One JSON object per line (gitignored)
- Each entry: `timestamp`, `playerId`, `playerName`, `questId`, `passageName`, `feedback`
- **`passageName`** is the **step where the issue was reported** (e.g. STEP_1, STEP_2), not "FEEDBACK"

## Verifying feedback was logged

After submitting via the FEEDBACK passage:

```bash
tail -n 5 .feedback/cert_feedback.jsonl
```

## Automation (backlog / triage)

To consume feedback for backlog updates or issue creation:

```bash
# View recent feedback (pretty)
tail -n 20 .feedback/cert_feedback.jsonl | jq -r '"\(.timestamp) [\(.questId)] \(.playerName): \(.feedback)"'

# Parse for automation
while IFS= read -r line; do
  quest=$(echo "$line" | jq -r '.questId')
  feedback=$(echo "$line" | jq -r '.feedback')
  # e.g. create GitHub issue, update BACKLOG.md, etc.
done < .feedback/cert_feedback.jsonl
```

Use the cert-feedback-triage skill to triage new feedback into specs and backlog.

## Reference

- API: [src/app/api/feedback/cert/route.ts](../src/app/api/feedback/cert/route.ts) — POST handler (preferred)
- Legacy: [src/actions/certification-feedback.ts](../src/actions/certification-feedback.ts) — deprecated
- Spec: [.specify/specs/certification-quest-ux/spec.md](../.specify/specs/certification-quest-ux/spec.md)
- Triage skill: [.agents/skills/cert-feedback-triage/SKILL.md](../.agents/skills/cert-feedback-triage/SKILL.md)
