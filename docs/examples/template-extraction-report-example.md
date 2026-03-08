# Template Extraction Report Example

## Purpose

Show a sample extraction report: summary, candidate templates, confidence scores, outliers, and review recommendations.

---

## 1. Extraction Summary

| Field | Value |
|-------|-------|
| extraction_id | ext_abc123 |
| extracted_at | 2025-03-06T12:00:00Z |
| mode | propose_candidates |
| quests_analyzed | 45 |
| clusters_found | 8 |
| candidates_created | 5 |
| outliers_count | 3 |

---

## 2. Top Template Families

| Family | Match Count | Avg Confidence |
|--------|-------------|----------------|
| linear_onboarding | 12 | 0.86 |
| reflection_bar_completion | 5 | 0.72 |
| choice_action_completion | 4 | 0.68 |
| guide_action_handoff | 3 | 0.61 |
| orientation_unlock | 2 | 0.55 |

---

## 3. Recurring Node Patterns

| Pattern | Count |
|---------|-------|
| introduction → prompt → action → completion | 12 |
| introduction → reflection → BAR_capture → completion | 5 |
| intro → choice → action → handoff | 4 |
| introduction → prompt → choice → quest_progress → completion | 3 |

---

## 4. Recurring Action Patterns

| Pattern | Count |
|---------|-------|
| continue → signup | 8 |
| choose → create_BAR → confirm | 5 |
| continue → join_quest | 4 |
| confirm → unlock_next_step | 3 |

---

## 5. Candidate Templates

| template_id | family | confidence | match_count | source_books |
|-------------|--------|------------|-------------|--------------|
| linear_onboarding_v1 | linear_onboarding | 0.86 | 12 | handbook_intro, bruised_banana |
| reflection_bar_v1 | reflection_bar_completion | 0.72 | 5 | handbook_intro |
| choice_action_v1 | choice_action_completion | 0.68 | 4 | bruised_banana |
| guide_handoff_v1 | guide_action_handoff | 0.61 | 3 | handbook_intro |
| orientation_unlock_v1 | orientation_unlock | 0.55 | 2 | handbook_intro |

---

## 6. Unresolved Outliers

| quest_id | source_book | Reason |
|----------|-------------|--------|
| broken_flow_v1 | extraction_test | no_matching_cluster |
| experimental_branch_v1 | handbook_intro | unique_structure |
| legacy_flow_v1 | bruised_banana | deprecated_node_types |

---

## 7. Review Recommendations

| template_id | Recommendation | Reason |
|-------------|----------------|--------|
| linear_onboarding_v1 | approve | High confidence; stable across books |
| reflection_bar_v1 | approve | Good match count; single book but validated |
| choice_action_v1 | under_review | Moderate confidence; verify BAR usage |
| guide_handoff_v1 | under_review | Low match count; check for overfitting |
| orientation_unlock_v1 | reject | Too few matches; may be noise |

---

## 8. Raw Report Payload (Example)

```json
{
  "extraction_id": "ext_abc123",
  "extracted_at": "2025-03-06T12:00:00Z",
  "summary": {
    "quests_analyzed": 45,
    "clusters_found": 8,
    "candidates_created": 5,
    "outliers_count": 3
  },
  "top_template_families": [
    { "family": "linear_onboarding", "count": 12, "avg_confidence": 0.86 },
    { "family": "reflection_bar_completion", "count": 5, "avg_confidence": 0.72 }
  ],
  "recurring_node_patterns": [
    { "pattern": "introduction→prompt→action→completion", "count": 12 },
    { "pattern": "introduction→reflection→BAR_capture→completion", "count": 5 }
  ],
  "unresolved_outliers": [
    { "quest_id": "broken_flow_v1", "source_book": "extraction_test", "reason": "no_matching_cluster" }
  ],
  "review_recommendations": [
    {
      "template_id": "linear_onboarding_v1",
      "recommendation": "approve",
      "reason": "High confidence; stable across books"
    }
  ]
}
```
