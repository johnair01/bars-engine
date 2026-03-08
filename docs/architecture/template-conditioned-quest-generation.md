# Template-Conditioned Quest Generation

## Purpose

Generate quest flows using an approved quest template as a structural scaffold. Templates constrain structure; generation fills content. Improves structural validity, reduces malformed flows, and supports onboarding reliability.

---

## 1. Core Concept

**Template-conditioned generation** supplies:

- An approved template ID
- Campaign or book context
- Theme or intent
- Optional constraints
- Optional actor capability assumptions
- Optional tone/copy guidance

The generator must produce a quest flow that:

- Preserves the template's structural pattern
- Fills placeholders appropriately
- Conforms to the quest flow grammar
- Passes validator and simulator checks
- Emits parseable structured JSON only

**Separation:** Templates constrain structure. Generation fills content.

---

## 2. Use Cases

| Use Case | Template | Inputs | Output |
|----------|----------|--------|--------|
| Generate onboarding quest | linear_onboarding_v1 | campaign, theme, onboarding_flag | Linear flow JSON |
| Generate reflection quest | bar_reflection_v2 | campaign, theme, actor_capabilities | Reflection + BAR flow |
| Generate orientation handoff | orientation_handoff_v1 | campaign, target_quest_ref | Handoff flow |
| Campaign-specific quest | Approved template + theme | campaign, theme, tone_guidance | Themed flow |
| Admin draft quest | Approved template | theme, for human editing | Draft flow (draft mode) |

---

## 3. Template Input Contract

The generation system receives from the template layer:

| Field | Category | Description |
|-------|----------|-------------|
| template_id | Identity | Unique ID |
| template_family | Identity | Family grouping |
| node_pattern | Fixed | Required node type sequence |
| action_pattern | Fixed | Required action types in order |
| bar_pattern | Fixed | BAR lifecycle (no_BAR, BAR_capture_only, etc.) |
| completion_pattern | Fixed | How completion is reached |
| constraints | Fixed | max_nodes, max_branches, requires_user_action |
| placeholders | Parameterized | Slots for copy |
| allowed_variation_zones | Optional | Where minor variation is allowed |
| forbidden_deviations | Fixed | What must not change |

### Conceptual Structure

```json
{
  "template_id": "linear_onboarding_v1",
  "fixed_structure": {
    "node_sequence": ["introduction", "prompt", "choice", "action", "completion"]
  },
  "placeholders": [
    { "key": "intro_copy", "required": true, "max_words": 30 },
    { "key": "prompt_copy", "required": true, "max_words": 30 },
    { "key": "action_copy", "required": true, "max_words": 15 },
    { "key": "completion_copy", "required": true, "max_words": 30 }
  ],
  "constraints": {
    "max_nodes": 6,
    "max_branches": 0,
    "requires_user_action": true,
    "first_action_by_node": 4
  },
  "forbidden_deviations": [
    "add_branch_beyond_max",
    "change_required_action_type",
    "remove_completion_node",
    "bar_validation_before_capture"
  ]
}
```

| Part | Mutability |
|------|------------|
| node_sequence, action_pattern, bar_pattern, completion_pattern | Fixed |
| placeholders (values) | Parameterized by generation |
| constraints | Fixed; generation must obey |
| forbidden_deviations | Fixed; generation must not violate |

---

## 4. Generation Request Contract

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| template_id | string | Yes | Approved template ID |
| campaign_id | string | Yes | Campaign context |
| source_book | string | No | Book context |
| quest_theme | string | Yes | Theme or intent |
| onboarding_flag | boolean | No | Default true for onboarding templates |
| actor_capabilities | string[] | No | e.g. ["continue", "create_BAR"] |
| target_outcome | string | No | Desired completion outcome |
| tone_guidance | string | No | Copy tone |
| terminology_rules | string[] | No | Allowed/forbidden terms |
| additional_constraints | object | No | Extra constraints |

**Rule:** Request inputs shape content, not template structure.

**Example:**

```json
{
  "template_id": "linear_onboarding_v1",
  "campaign_id": "bruised_banana_residency",
  "quest_theme": "introduce yourself through one live signal",
  "onboarding_flag": true,
  "actor_capabilities": ["continue", "create_BAR"],
  "target_outcome": "user creates one BAR and completes first onboarding loop"
}
```

---

## 5. Generation Output Contract

Output must be valid structured quest flow JSON conforming to:

- [quest-generation-prompt-contract.md](quest-generation-prompt-contract.md)
- [quest-bar-flow-grammar.md](quest-bar-flow-grammar.md)
- [flow-simulator-contract.md](flow-simulator-contract.md)
- Selected template invariants

**Format:** JSON only. No markdown or commentary.

**Required fields:** flow_id, campaign_id, start_node_id, nodes, completion_conditions, expected_events

**Metadata (provenance):**

```json
{
  "template_id": "linear_onboarding_v1",
  "generation_mode": "template_conditioned",
  "source_book": "igniting-joy",
  "generated_at": "2025-03-06T12:00:00Z"
}
```

---

## 6. Template Invariants

### Fixed Invariants (Must Preserve)

- Required node sequence
- Required action types
- Required completion pattern
- Required BAR lifecycle pattern

### Allowed Variation

- Node copy (text)
- Theme-specific phrasing
- Optional guide actor name
- Campaign-specific flavor

### Forbidden Variation

- Adding branches beyond template constraint
- Changing required action type
- Removing completion node
- Moving BAR validation before BAR creation

The generator must preserve fixed invariants unless the request explicitly allows a compatible template extension mode. Start conservative.

---

## 7. Placeholder Filling Rules

| Placeholder | Required | Max Words | Context-Dependent |
|-------------|----------|-----------|-------------------|
| intro_copy | Yes | 30 | Campaign |
| prompt_copy | Yes | 30 | Theme |
| action_copy | Yes | 15 | Theme |
| completion_copy | Yes | 30 | Campaign |
| guide_name | No | — | Optional |
| quest_theme | No | — | From request |
| bar_prompt | No | 30 | When BAR_capture present |

**Rule:** Placeholder filling must not change node type or transition logic.

---

## 8. Prompting Strategy

### System Prompt Responsibilities

- Obey output schema
- Preserve template structure
- Fill placeholders only
- Honor constraints
- Avoid invalid transitions

### User Prompt Responsibilities

- Provide campaign context
- Provide theme
- Provide actor capability assumptions
- Provide onboarding flag
- Provide special language constraints if needed

### Template Data in Prompt

- Embedded JSON (fixed_structure, constraints, placeholders)
- Summarized structural instructions
- Placeholder list with requirements
- Invariants list (forbidden deviations)

Favor explicit structural guidance over prose implication.

---

## 9. Validation + Simulation Pipeline

```
select approved template
→ build generation request
→ generate quest flow JSON
→ parse output
→ validate against template invariants
→ validate against quest/BAR grammar
→ simulate
→ score
→ accept / reject / flag for review
```

**Fail fast if:**

- Template is not approved
- Required placeholders are missing
- Output violates fixed invariants
- Output fails structural validation
- Output fails simulation

---

## 10. Generation Modes

| Mode | Behavior |
|------|----------|
| **draft** | Generate draft for human review; do not persist |
| **validate_only** | Generate and validate; do not persist |
| **generate_and_propose** | Generate candidate with validation/simulation reports |
| **generate_and_store** | Persist only if all checks pass |

Start with conservative defaults. Default: validate_only or draft.

---

## 11. Failure Handling

| failure_type | Description |
|--------------|-------------|
| template_not_found | Template ID invalid |
| template_not_approved | Template status not approved |
| output_schema_invalid | JSON parse or schema violation |
| invariant_violation | Template structure not preserved |
| validation_failure | Quest/BAR grammar violation |
| simulation_failure | Flow simulator failed |
| copy_quality_warning | Copy exceeds word limit or quality check |
| missing_required_action | No user action before completion |
| onboarding_complexity_too_high | Exceeds onboarding constraints |

**Example failure response:**

```json
{
  "status": "fail",
  "failure_type": "invariant_violation",
  "errors": [
    "Generated flow added a branch, but template max_branches is 0"
  ]
}
```

---

## 12. Provenance + Traceability

Generated quests retain:

- template_id
- template_version (if versioned)
- generation_request_id
- source_book
- campaign_id
- model/version (if tracked)
- validation_result_summary
- simulation_result_summary
- generated_at

---

## 13. Constraints

- Work only with approved templates
- Preserve template invariants strictly
- Favor short linear or lightly branching quests
- Support onboarding first
- Compatible with validator, simulator, scoring
- No speculative adaptive branching
- No freeform narrative generation
- No template structure alteration by default
- No auto-bypass of validation

---

## 14. Implementation Structure

| Path | Purpose |
|------|---------|
| `src/features/questGeneration/api/` | API entry points |
| `src/features/questGeneration/services/` | Generation, validation, simulation |
| `src/features/questGeneration/templates/` | Template loading, constraint resolution |
| `src/features/questGeneration/__tests__/` | Tests |

---

## 15. References

- [template-conditioned-generation-api.md](template-conditioned-generation-api.md)
- [quest-template-extraction-engine.md](quest-template-extraction-engine.md)
- [quest-generation-prompt-contract.md](quest-generation-prompt-contract.md)
- [quest-bar-flow-grammar.md](quest-bar-flow-grammar.md)
- [flow-simulator-contract.md](flow-simulator-contract.md)
- [template-conditioned-generation-example.md](../examples/template-conditioned-generation-example.md)
- [template-conditioned-output-example.md](../examples/template-conditioned-output-example.md)
