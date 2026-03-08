# Narrative Quality Feedback

The narrative quality skill learns from admin feedback to improve quest prose and passage content over time.

## Flow

```
Generate (quest/passage)
    → Admin reviews (Accept / Needs work / edit)
    → Feedback logged (automatic on save + explicit)
    → Skill ingests .feedback/narrative_quality.jsonl + KB
    → Next generation uses learned patterns
```

## Where to Log

- **Inline on passage edit**: "Accept" / "Needs work" buttons below the passage form
- **On save**: Check "Log this edit as feedback" to capture before/after diffs
- **Explicit**: "Log this as feedback" button opens a form for free-text feedback

## Storage

- **File**: `.feedback/narrative_quality.jsonl` (gitignored)
- **Format**: One JSON object per line

## Schema

| Field | Type | Description |
|-------|------|-------------|
| timestamp | string (ISO8601) | When feedback was logged |
| type | "edit" \| "rating" \| "explicit" | edit=auto on save; rating=Accept/Needs work; explicit=Log as feedback |
| passageId | string | Passage record ID |
| adventureId | string | Adventure ID |
| nodeId | string | Passage node ID |
| before | string | (edit only) Text before admin edit |
| after | string | (edit only) Text after admin edit |
| rating | "accept" \| "needs_work" \| "reject" | (rating only) Inline rating |
| tags | string[] | Optional tags (e.g. too_corporate, nonsensical) |
| feedback | string | Optional free text |
| source | string | admin_edit, admin_rating, cert_feedback, manual |
| playerId | string | Admin who submitted |

## Using the Skill

See [.agents/skills/narrative-quality/SKILL.md](../.agents/skills/narrative-quality/SKILL.md) for:

- When to use the skill (generating prose, auditing, triaging feedback)
- How to read `.feedback/narrative_quality.jsonl` and build prompt context
- How to incorporate KB (Voice Style Guide, emotional-alchemy)
- Audit mode: compare new output to learned patterns

## Quick Commands

```bash
# View recent feedback
tail -n 20 .feedback/narrative_quality.jsonl | jq -r '"\(.timestamp) [\(.nodeId)] \(.rating // .type): \(.feedback // .tags | tostring)"'
```
