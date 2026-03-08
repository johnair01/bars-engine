# Quest Template Example

## Purpose

Show one approved template: its structure, provenance, and downstream use. This template was extracted from the corpus and approved for reuse.

---

## 1. Template Summary

| Field | Value |
|-------|-------|
| template_id | `linear_onboarding_v1` |
| template_name | Linear Onboarding |
| template_family | linear_onboarding |
| approval_status | approved |
| confidence_score | 0.86 |
| match_count | 12 |
| source_books | handbook_intro, bruised_banana |

---

## 2. Structure

### Node Pattern

```
introduction → prompt → choice → action → completion
```

### Action Pattern

```
continue → signup
```

### BAR Pattern

`no_BAR` — No BAR nodes in flow.

### Completion Pattern

`node_reached` — Completion when actor reaches completion node.

---

## 3. Source Quests

| quest_id | source_book | total_score |
|----------|-------------|-------------|
| orientation_welcome_v2 | handbook_intro | 25 |
| campaign_join_v1 | bruised_banana | 25 |
| signup_flow_v1 | handbook_intro | 24 |
| ... | ... | ... |

---

## 4. Placeholders

| Key | Type | Description |
|-----|------|-------------|
| welcome_copy | string | Welcome message (≤80 chars) |
| action_label | string | Button/label for primary action |
| completion_message | string | Completion confirmation text |

---

## 5. Constraints

- Node count: 5–8
- First action by node 4
- No branching (single path)
- Onboarding-safe action types only

---

## 6. Why It Is Useful

- **Recurrence:** 12 quests across 2 books share this structure.
- **Stability:** Pattern unchanged across normalization passes.
- **Validation:** Source quests average score 24+ (ready/usable).
- **Onboarding:** Short, linear, low cognitive load.
- **Generation:** Clear scaffold for AI; fill placeholders with campaign-specific copy.

---

## 7. Full Template Payload (Example)

```json
{
  "template_id": "linear_onboarding_v1",
  "template_name": "Linear Onboarding",
  "template_family": "linear_onboarding",
  "description": "Short linear flow: intro → prompt → action → completion. Suitable for signup, join, or first action.",
  "approval_status": "approved",
  "confidence_score": 0.86,
  "match_count": 12,
  "source_quest_ids": ["orientation_welcome_v2", "campaign_join_v1", "signup_flow_v1"],
  "source_books": ["handbook_intro", "bruised_banana"],
  "extraction_pass": "pass-01",
  "node_pattern": ["introduction", "prompt", "choice", "action", "completion"],
  "action_pattern": ["continue", "signup"],
  "bar_pattern": "no_BAR",
  "completion_pattern": "node_reached",
  "constraints": [
    { "type": "node_count", "min": 5, "max": 8 },
    { "type": "first_action_by", "node_index": 4 },
    { "type": "no_branching" }
  ],
  "placeholders": [
    { "key": "welcome_copy", "type": "string", "description": "Welcome message" },
    { "key": "action_label", "type": "string", "description": "Primary action label" },
    { "key": "completion_message", "type": "string", "description": "Completion text" }
  ],
  "example_quest_ids": ["orientation_welcome_v2", "campaign_join_v1"],
  "created_at": "2025-03-06T12:00:00Z",
  "updated_at": "2025-03-06T12:00:00Z"
}
```
