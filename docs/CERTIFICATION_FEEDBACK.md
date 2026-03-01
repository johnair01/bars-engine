# Certification Quest Feedback

Feedback submitted via "Report Issue" during verification quests is logged for triage and automation.

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

## Reference

- Action: [src/actions/certification-feedback.ts](../src/actions/certification-feedback.ts)
- Spec: [.specify/specs/certification-quest-ux/spec.md](../.specify/specs/certification-quest-ux/spec.md)
