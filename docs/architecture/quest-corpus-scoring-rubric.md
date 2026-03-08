# Quest Corpus Scoring Rubric

## Purpose

Define a consistent, machine-readable evaluation system for quests extracted from books and normalized through the quest corpus pipeline. Scores support aggregation across books and normalization passes, enabling corpus health tracking and prioritization of human review.

---

## 1. Scoring Dimensions

Each quest receives a score from 0–5 per dimension. All scores are integers.

| Dimension | Key | Max | Description |
|-----------|-----|-----|-------------|
| Structural Validity | `structural_validity` | 5 | Conformance to quest/BAR flow grammar |
| BAR Lifecycle Integrity | `bar_lifecycle` | 5 | Correct BAR creation, validation, and use order |
| State Compatibility | `state_compatibility` | 5 | Valid engine state transitions and actor permissions |
| Language Clarity | `language_clarity` | 5 | Legible, concrete, jargon-free copy |
| Onboarding Suitability | `onboarding_suitability` | 5 | Short arc, early action, minimal branching (when applicable) |
| Simulation Readiness | `simulation_readiness` | 5 | Passes flow simulator; completion reachable |

**Total score:** Sum of all dimension scores. **Max:** 30.

---

## 2. Dimension Criteria

### Structural Validity (0–5)

| Score | Criteria |
|-------|----------|
| 5 | Valid start node; all nodes reachable; completion or handoff reachable; no orphan nodes; all transitions valid; no invalid node types |
| 4 | Minor structural issues (e.g., one extra optional node) |
| 3 | Missing or invalid start; reachability issues |
| 2 | Orphan nodes; broken transitions |
| 1 | No completion path; multiple start nodes |
| 0 | Unparseable; no start; no completion |

**Reference:** [quest-bar-flow-grammar.md](quest-bar-flow-grammar.md), [quest-bar-validation.md](quest-bar-validation.md)

### BAR Lifecycle Integrity (0–5)

| Score | Criteria |
|-------|----------|
| 5 | BAR creation precedes validation; BAR use is meaningful; no BAR required before creation |
| 4 | Minor ordering or optional BAR misuse |
| 3 | BAR_validation without prior BAR_capture in same flow |
| 2 | BAR required before it exists; invalid BAR refs |
| 1 | Multiple BAR lifecycle violations |
| 0 | Unusable BAR flow; broken dependencies |

### State Compatibility (0–5)

| Score | Criteria |
|-------|----------|
| 5 | Actor permissions align with required actions; quest states transition legally; campaign membership valid |
| 4 | Minor permission or state assumptions |
| 3 | Missing or invalid actor permissions |
| 2 | Illegal state transitions; onboarding quest requires unavailable capabilities |
| 1 | Multiple state violations |
| 0 | Unplayable due to state or permission issues |

**Reference:** [state-transitions.md](state-transitions.md)

### Language Clarity (0–5)

| Score | Criteria |
|-------|----------|
| 5 | Instructions clear; prompts concrete; copy concise; no system jargon |
| 4 | Minor clarity issues |
| 3 | Vague instructions; ambiguous prompts |
| 2 | Placeholder text; missing labels |
| 1 | Unclear or abstract copy |
| 0 | Empty or broken copy |

### Onboarding Suitability (0–5)

| Score | Criteria |
|-------|----------|
| 5 | Short arc, early action, clear completion, minimal branching, approachable instructions |
| 4 | Slightly long or complex |
| 3 | First action after node 5; >12 nodes |
| 2 | >3 choices per node; >2 branch levels |
| 1 | Social before solo; no prior BAR required violated |
| 0 | Not suitable for onboarding |

**Note:** For non-onboarding quests, score 5 if N/A criteria do not apply.

### Simulation Readiness (0–5)

| Score | Criteria |
|-------|----------|
| 5 | Nodes executable; completion reachable; event emissions defined; no broken dependencies |
| 4 | Minor simulation issues |
| 3 | Some nodes unreachable or blocked |
| 2 | Completion not reachable; missing events |
| 1 | Multiple simulation failures |
| 0 | Fails flow simulator |

**Reference:** [flow-simulator-contract.md](flow-simulator-contract.md)

---

## 3. Quality Tiers

| Total Score | Tier | Status | Action |
|-------------|------|--------|--------|
| 25–30 | Ready | `ready` | Deployable |
| 18–24 | Usable with minor fixes | `usable` | Minor normalization |
| 10–17 | Needs normalization | `needs_normalization` | Run normalization pipeline |
| 0–9 | Broken | `broken` | Human review required |

---

## 4. Scoring Data Format

```json
{
  "quest_id": "string",
  "source_book": "string",
  "pass_id": "string",
  "scored_at": "ISO8601",
  "scores": {
    "structural_validity": 4,
    "bar_lifecycle": 3,
    "state_compatibility": 4,
    "language_clarity": 5,
    "onboarding_suitability": 3,
    "simulation_readiness": 4
  },
  "total_score": 23,
  "status": "usable",
  "issues": [
    {
      "code": "bar_validation_before_capture",
      "message": "BAR_validation node without prior BAR_capture",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "code": "long_first_action",
      "message": "First action at node 6",
      "severity": "warning"
    }
  ],
  "requires_human_review": false
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `quest_id` | string | Unique quest identifier |
| `source_book` | string | Book slug or ID from extraction |
| `pass_id` | string | Normalization pass identifier (e.g., `pass-01`) |
| `scored_at` | string | ISO8601 timestamp |
| `scores` | object | Per-dimension scores (0–5) |
| `total_score` | number | Sum of dimension scores |
| `status` | string | `ready` \| `usable` \| `needs_normalization` \| `broken` |
| `issues` | array | Errors with `code`, `message`, `severity` |
| `warnings` | array | Non-blocking issues |
| `requires_human_review` | boolean | True if status is `broken` or issues contain unresolved patterns |

---

## 5. Corpus-Level Metrics

| Metric | Description | Computation |
|--------|-------------|-------------|
| Pass Rate | % of quests with status `ready` or `usable` | `(ready + usable) / total * 100` |
| Average Score | Mean total_score across corpus | `sum(total_score) / count` |
| Book-Level Quality | Average score per source_book | `sum(quest_scores) / count` per book |
| Failure Categories | Counts by issue code | `group by issues[].code` |
| Normalization Impact | Score delta between passes | `pass_N - pass_N-1` per quest |

### Common Failure Categories

| Code | Description |
|------|-------------|
| `unreachable_completion` | No path from start to completion |
| `invalid_bar_lifecycle` | BAR used before creation |
| `missing_actor_permissions` | Action requires permissions actor lacks |
| `confusing_prompts` | Vague or unclear copy |
| `orphan_nodes` | Nodes not reachable from start |
| `invalid_transitions` | targetId references non-existent node |
| `placeholder_text` | TODO, {{, [placeholder] detected |
| `excessive_branching` | >3 choices or >2 branch levels |

---

## 6. Integration with Pipeline

```
generate quest
→ validate (structural)
→ simulate (flow simulator)
→ score (rubric)
→ accept / reject
→ add to corpus
```

Scores are produced after each normalization pass. Artifacts stored at:

- `/reports/quest-corpus/pass-{N}-scores.json`
- `/reports/quest-corpus/pass-{N}-dashboard-summary.md`

---

## 7. References

- [quest-bar-flow-grammar.md](quest-bar-flow-grammar.md)
- [quest-bar-validation.md](quest-bar-validation.md)
- [flow-simulator-contract.md](flow-simulator-contract.md)
- [quest-generation-prompt-contract.md](quest-generation-prompt-contract.md)
- [quest-review-dashboard.md](quest-review-dashboard.md)
