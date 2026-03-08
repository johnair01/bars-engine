# Narrative Quality — Reference

Progressive disclosure for the [Narrative Quality Skill](SKILL.md).

## Schema: .feedback/narrative_quality.jsonl

One JSON object per line (gitignored). Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | string (ISO8601) | yes | When feedback was logged |
| type | "edit" \| "rating" \| "explicit" | yes | edit=auto on save; rating=Accept/Needs work; explicit=Log as feedback |
| passageId | string | yes | Passage record ID |
| adventureId | string | yes | Adventure ID |
| nodeId | string | yes | Passage node ID (e.g. node_0) |
| before | string | for edit | Text before admin edit |
| after | string | for edit | Text after admin edit |
| rating | "accept" \| "needs_work" \| "reject" | for rating | Inline rating |
| tags | string[] | optional | e.g. too_corporate, good_arc, nonsensical |
| feedback | string | optional | Free text (explicit or needs_work) |
| source | string | yes | admin_edit, admin_rating, cert_feedback, manual |
| playerId | string | yes | Admin/player who submitted |

## Storage

- **Path**: `.feedback/narrative_quality.jsonl`
- **Future**: Instance-scoped via `instanceId` → `.feedback/instances/{id}/narrative_quality.jsonl`

## Prompt Patterns

### Few-shot from Accept

```
## Good examples (from admin feedback)

[Include 2–3 recent "accept" or "edit" after snippets — short, representative]
```

### Anti-patterns from Needs Work / Reject

```
## Avoid (from admin feedback)

- too_corporate: [include excerpt if available]
- nonsensical: [include excerpt if available]
- [other tags from needs_work entries]
```

### Verifying Feedback

```bash
tail -n 20 .feedback/narrative_quality.jsonl | jq -r '"\(.timestamp) [\(.nodeId)] \(.rating): \(.feedback // .tags | tostring)"'
```
