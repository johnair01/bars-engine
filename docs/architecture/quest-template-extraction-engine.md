# Quest Template Extraction Engine

## Purpose

Analyze the normalized quest corpus to identify recurring structural patterns and promote them into reusable quest templates. The engine is API-first: extraction logic is callable without admin UI; all operations expose clear service contracts.

---

## 1. What Is a Quest Template?

A **quest template** is a reusable structural pattern derived from multiple quests in the corpus. It is not a single quest instance.

A template captures:

- Node sequence shape
- Action sequence shape
- BAR lifecycle pattern
- Branching pattern
- Completion style
- Optional placeholders for copy or theme

Templates must be **derived from corpus evidence**, not invented. The engine identifies patterns that recur across normalized quests and proposes them as candidates. Human review approves candidates before they become reusable templates.

---

## 2. Template Families (Candidate Examples)

| Family | Description |
|--------|-------------|
| linear_onboarding | introduction → prompt → action → completion |
| reflection_bar_completion | reflection → BAR_capture → completion |
| choice_action_completion | choice → action → completion |
| guide_action_handoff | guide interaction → user action → handoff |
| orientation_unlock | orientation → unlock next quest |
| collaboration_invitation | social/collaboration flow |
| signal_capture_attach | signal capture → attach to quest |

These are illustrative. Actual families are discovered by the engine from corpus data.

---

## 3. Template Representation

### Field Categories

| Category | Fields | Description |
|----------|--------|-------------|
| **Identity** | template_id, template_name, template_family | Unique ID, human name, family grouping |
| **Structural** | node_pattern, action_pattern, bar_pattern, completion_pattern | Flow structure abstractions |
| **Descriptive** | description | Human-readable summary |
| **Provenance** | source_quest_ids, source_books, extraction_pass | Where the template came from |
| **Review** | approval_status, confidence_score, example_quest_ids | Review state and evidence |
| **Constraints** | constraints | Structural or validation constraints |
| **Placeholders** | placeholders | Slots for copy, theme, or variable content |
| **Audit** | created_at, updated_at | Timestamps |

### Template Model (Conceptual)

```
template_id: string
template_name: string
template_family: string
description: string
source_quest_ids: string[]
source_books: string[]
extraction_pass: string
confidence_score: number (0–1)
node_pattern: NodePattern
action_pattern: ActionPattern
bar_pattern: BarPattern
completion_pattern: CompletionPattern
constraints: Constraint[]
placeholders: Placeholder[]
example_quest_ids: string[]
approval_status: candidate | under_review | approved | rejected | deprecated
created_at: ISO8601
updated_at: ISO8601
```

---

## 4. Pattern Extraction Logic

### Node Sequence Patterns

Extract ordered sequences of node types from each quest flow. Example:

- `introduction → prompt → action → completion`
- `introduction → reflection → BAR_capture → completion`
- `intro → choice → action → handoff`

**Method:** Traverse flow from start; record node types in visit order. Normalize to type sequence (ignore node IDs).

### Action Sequence Patterns

Extract action types in order. Example:

- `continue → create_BAR → confirm`
- `choose → join_quest`
- `confirm → unlock_next_step`

**Method:** Collect action types from each node; concatenate in flow order.

### BAR Patterns

Classify BAR usage. Example:

- `no_BAR`
- `BAR_capture_only`
- `BAR_capture_validation`
- `BAR_capture_handoff`

**Method:** Rule-based. Inspect flow for BAR_capture, BAR_validation, handoff nodes.

### Completion Patterns

Classify how completion is reached. Example:

- `node_reached`
- `quest_unlocked`
- `BAR_created`
- `actor_handoff_complete`

**Method:** Rule-based. Inspect terminal node type and completion_conditions.

### Clustering

**Approach:** Exact-match grouping first. Two quests belong to the same cluster if they share identical:

- node_pattern (type sequence)
- bar_pattern
- completion_pattern

**Fallback:** If clusters are too small, relax to rule-based similarity (e.g., allow one node type difference). Prefer simple methods; avoid opaque ML clustering in v1.

---

## 5. Extraction Modes

| Mode | Behavior | Automation |
|------|----------|------------|
| **analyze_only** | Identify candidate patterns; no persistent records | Safe |
| **propose_candidates** | Generate candidate templates with provenance and confidence | Safe |
| **approve_template** | Promote reviewed candidate to reusable template | Requires human |
| **recompute_from_corpus** | Re-run extraction after corpus changes | Safe |

**Human review required:** approve_template. Extracted patterns must not auto-become generation templates.

---

## 6. Confidence Scoring

Factors (simple, explainable):

| Factor | Weight | Description |
|--------|--------|-------------|
| match_count | High | Number of source quests matching the pattern |
| structural_consistency | Medium | Variance in node/action sequences across matches |
| validation_pass_rate | Medium | % of source quests with status ready/usable |
| bar_lifecycle_similarity | Low | Consistency of BAR usage |
| completion_similarity | Low | Consistency of completion conditions |
| stability_across_passes | Low | Pattern unchanged across normalization passes |

**Output example:**

```json
{
  "template_id": "linear_onboarding_v1",
  "confidence_score": 0.86,
  "match_count": 12,
  "source_books": ["handbook_intro", "bruised_banana"]
}
```

**Formula (v1):** `confidence = min(1, (match_count / 5) * 0.4 + validation_pass_rate * 0.3 + (1 - structural_variance) * 0.3)`. Tune as needed; keep explainable.

---

## 7. Human Review Workflow

| Status | Meaning |
|--------|---------|
| candidate | Extracted; not yet reviewed |
| under_review | In review queue |
| approved | Promoted for reuse |
| rejected | Not promoted; reason captured |
| deprecated | Previously approved; no longer recommended |

**Review checks:**

- Pattern usefulness
- Structural validity
- Pedagogical or gameplay coherence
- Overfitting to one noisy quest cluster
- Duplication with existing templates

---

## 8. Outlier Handling

Quests that do not fit recurring patterns are **outliers**.

- Identify: Quest does not cluster with any group above min_cluster_size (e.g., 2).
- Report: Include in extraction report under "unresolved outliers."
- Exclude: Do not force into a template family.
- Review: Outliers may be mutations (intentional) or symptoms (extraction/validation issues).

---

## 9. Versioning and Provenance

Each template retains:

- source_quest_ids
- extraction_run_id / pass
- source_books
- normalization_pass_version
- scoring/validation context

**Versioning:** When extraction is rerun, new candidates get new IDs (e.g., `linear_onboarding_v2`). Approved templates are not silently mutated. Deprecate and replace instead.

---

## 10. Downstream Usage

Approved templates are used by:

- AI quest generation (prompt conditioning)
- Admin quest creation shortcuts
- Onboarding flow generation
- Corpus tagging
- Analytics
- Generation scoring

Templates are **scaffolds**, not rigid final quests. Copy, theme, and minor structure may vary.

---

## 11. Constraints

- Prefer simple rule-based extraction over ML
- Operate on normalized quest flows only
- Support repeated corpus passes
- Preserve source lineage
- Compatible with scoring, validation, simulator
- No auto-approval of templates
- Explainable confidence scores

---

## 12. Implementation Structure

| Path | Purpose |
|------|---------|
| `src/features/questTemplates/api/` | API entry points, route handlers |
| `src/features/questTemplates/services/` | Extraction, clustering, confidence |
| `src/features/questTemplates/types/` | TypeScript types |
| `src/features/questTemplates/__tests__/` | Tests |

---

## 13. References

- [quest-template-api.md](quest-template-api.md)
- [quest-corpus-scoring-rubric.md](quest-corpus-scoring-rubric.md)
- [quest-bar-flow-grammar.md](quest-bar-flow-grammar.md)
- [quest-template-example.md](../examples/quest-template-example.md)
- [template-extraction-report-example.md](../examples/template-extraction-report-example.md)
