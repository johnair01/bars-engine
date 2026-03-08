# Goal-to-Template Example

## Purpose

Show the workflow for defining a goal ("move user from orientation_started to first_bar_created"), generating a candidate template, reviewing its proposed structure, and approving or rejecting it.

---

## 1. Define Goal

```json
{
  "goal_name": "first_bar_completion",
  "current_state": "orientation_started",
  "target_state": "first_bar_created",
  "actor_type": "human participant",
  "required_player_action": "create_BAR",
  "completion_evidence": "bar_created event emitted",
  "complexity_target": "low",
  "onboarding_relevance": true
}
```

---

## 2. Generate Candidate Template

**Request:** POST /admin/goal-templates with above goal

**Response:**

```json
{
  "template_id": "goal_first_bar_v1",
  "approval_status": "candidate",
  "source": "goal_derived",
  "proposed_structure": {
    "node_pattern": ["introduction", "prompt", "BAR_capture", "completion"],
    "action_pattern": ["continue", "create_BAR"],
    "bar_pattern": "BAR_capture_only",
    "completion_pattern": "bar_created"
  },
  "constraints": {
    "max_nodes": 5,
    "max_branches": 0,
    "requires_user_action": true,
    "first_action_by_node": 3
  },
  "placeholders": [
    { "key": "intro_copy", "required": true, "max_words": 30 },
    { "key": "bar_prompt", "required": true, "max_words": 30 },
    { "key": "completion_copy", "required": true, "max_words": 30 }
  ],
  "goal_mapping": {
    "current_state": "orientation_started",
    "target_state": "first_bar_created",
    "required_action": "create_BAR",
    "completion_evidence": "bar_created event emitted"
  },
  "review_notes": "Verify BAR_capture placement; ensure completion emits bar_created"
}
```

---

## 3. Review Proposed Structure

| Aspect | Proposed | Review Check |
|--------|----------|--------------|
| Node sequence | intro → prompt → BAR_capture → completion | Valid; BAR created before completion |
| Action pattern | continue → create_BAR | Matches required_player_action |
| BAR pattern | BAR_capture_only | No validation needed for first BAR |
| Completion | bar_created | Matches completion_evidence |
| Complexity | max_nodes 5, max_branches 0 | Low; suitable for onboarding |

---

## 4. Approve or Reject

**Approve:** POST /admin/goal-templates/goal_first_bar_v1/approve

```json
{
  "reviewer_id": "admin_123",
  "review_notes": "Structure valid; suitable for first BAR onboarding"
}
```

**Reject:** POST /admin/goal-templates/goal_first_bar_v1/reject

```json
{
  "reason": "Too narrow; duplicates existing bar_reflection_v2",
  "reviewer_id": "admin_123"
}
```

---

## 5. After Approval

Approved goal-derived template enters the template library with `approval_status: approved`. It becomes available for template-conditioned quest generation and the admin composer.
