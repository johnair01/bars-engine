# Quest Corpus Score Example

## Purpose

Demonstrate how a single quest is scored using the [Quest Corpus Scoring Rubric](../architecture/quest-corpus-scoring-rubric.md). This example shows rubric application, issue identification, and recommended normalization actions.

---

## 1. Quest Summary

| Field | Value |
|-------|-------|
| quest_id | `orientation_welcome_v2` |
| source_book | `handbook_intro` |
| node_count | 8 |
| flow_type | onboarding |

**Flow structure (simplified):**

```
start (introduction)
  → prompt (welcome)
  → choice (continue)
  → action (signup)
  → quest_progress
  → completion
```

---

## 2. Rubric Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| structural_validity | 4 | Valid start, reachable completion; one optional node has no incoming transition |
| bar_lifecycle | 5 | No BAR nodes; N/A |
| state_compatibility | 4 | Signup requires anonymous actor; minor assumption |
| language_clarity | 5 | Clear instructions; concrete prompts |
| onboarding_suitability | 3 | First action at node 4; acceptable but not ideal |
| simulation_readiness | 4 | Completion reachable; one condition may block in edge case |

**Total score:** 25  
**Status:** `ready`

---

## 3. Identified Issues

### Errors

| Code | Message | Severity |
|------|---------|----------|
| (none) | — | — |

### Warnings

| Code | Message | Severity |
|------|---------|----------|
| `optional_node_unreachable` | Node `intro_sidebar` has no incoming transition | warning |
| `first_action_late` | First action at node 4; onboarding prefers node 3 or earlier | warning |

---

## 4. Raw Score JSON

```json
{
  "quest_id": "orientation_welcome_v2",
  "source_book": "handbook_intro",
  "pass_id": "pass-01",
  "scored_at": "2025-03-06T12:00:00Z",
  "scores": {
    "structural_validity": 4,
    "bar_lifecycle": 5,
    "state_compatibility": 4,
    "language_clarity": 5,
    "onboarding_suitability": 3,
    "simulation_readiness": 4
  },
  "total_score": 25,
  "status": "ready",
  "issues": [],
  "warnings": [
    {
      "code": "optional_node_unreachable",
      "message": "Node intro_sidebar has no incoming transition",
      "severity": "warning"
    },
    {
      "code": "first_action_late",
      "message": "First action at node 4; onboarding prefers node 3 or earlier",
      "severity": "warning"
    }
  ],
  "requires_human_review": false
}
```

---

## 5. Recommended Normalization Actions

| Priority | Action | Rationale |
|----------|--------|-----------|
| Low | Add incoming transition to `intro_sidebar` or remove if unused | Resolves optional_node_unreachable |
| Low | Move first action earlier (e.g., node 3) if flow structure allows | Improves onboarding_suitability |
| None | — | Quest is already `ready`; changes are optional |

---

## 6. Example: Broken Quest

For contrast, a quest that scores **broken**:

| Dimension | Score | Notes |
|-----------|-------|-------|
| structural_validity | 1 | No completion path; orphan nodes |
| bar_lifecycle | 2 | BAR_validation before BAR_capture |
| state_compatibility | 2 | Action requires permission actor lacks |
| language_clarity | 3 | Vague prompts |
| onboarding_suitability | 1 | >12 nodes; excessive branching |
| simulation_readiness | 0 | Fails flow simulator |

**Total score:** 9  
**Status:** `broken`  
**requires_human_review:** true

**Issues:**

- `unreachable_completion`
- `invalid_bar_lifecycle`
- `missing_actor_permissions`
- `orphan_nodes`
- `excessive_branching`

**Recommended actions:** Run normalization pipeline; if unresolved, escalate to human review.
