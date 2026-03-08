# Template-Conditioned Generation API

## Purpose

Define the API surface for template-conditioned quest generation. Contracts are UI-independent; may be implemented as HTTP routes or service-layer functions.

---

## 1. Generate Quest from Template

**Operation:** Generate a quest flow from an approved template.

**Contract:** `generateQuestFromTemplate(params): Promise<GenerateResult>`

**Request:**

```json
{
  "template_id": "linear_onboarding_v1",
  "campaign_id": "bruised_banana_residency",
  "quest_theme": "introduce yourself through one live signal",
  "onboarding_flag": true,
  "actor_capabilities": ["continue", "create_BAR"],
  "target_outcome": "user creates one BAR and completes first onboarding loop",
  "source_book": "igniting-joy",
  "tone_guidance": "warm, concise",
  "mode": "validate_only"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| template_id | string | Yes | Approved template ID |
| campaign_id | string | Yes | Campaign context |
| quest_theme | string | Yes | Theme or intent |
| onboarding_flag | boolean | No | Default true |
| actor_capabilities | string[] | No | Actor permissions |
| target_outcome | string | No | Desired outcome |
| source_book | string | No | Book context |
| tone_guidance | string | No | Copy tone |
| terminology_rules | string[] | No | Allowed/forbidden terms |
| mode | string | No | draft \| validate_only \| generate_and_propose \| generate_and_store |

**Response (success):**

```json
{
  "status": "success",
  "flow": {
    "flow_id": "orientation_signal_v1",
    "campaign_id": "bruised_banana_residency",
    "start_node_id": "intro_1",
    "nodes": [...],
    "completion_conditions": [...],
    "expected_events": [...]
  },
  "metadata": {
    "template_id": "linear_onboarding_v1",
    "generation_mode": "template_conditioned",
    "generated_at": "2025-03-06T12:00:00Z"
  },
  "validation_result": { "passed": true },
  "simulation_result": { "passed": true }
}
```

**Response (failure):**

```json
{
  "status": "fail",
  "failure_type": "invariant_violation",
  "errors": ["Generated flow added a branch, but template max_branches is 0"]
}
```

---

## 2. Get Template Constraints

**Operation:** Return template constraints for generation clients.

**Contract:** `getTemplateConstraints(templateId: string): Promise<TemplateConstraints | null>`

**Response:**

```json
{
  "template_id": "linear_onboarding_v1",
  "fixed_structure": {
    "node_sequence": ["introduction", "prompt", "choice", "action", "completion"]
  },
  "placeholders": [
    { "key": "intro_copy", "required": true, "max_words": 30 },
    { "key": "prompt_copy", "required": true, "max_words": 30 }
  ],
  "constraints": {
    "max_nodes": 6,
    "max_branches": 0,
    "requires_user_action": true
  },
  "forbidden_deviations": [
    "add_branch_beyond_max",
    "change_required_action_type",
    "remove_completion_node"
  ]
}
```

---

## 3. Validate Generated Flow

**Operation:** Validate a candidate flow without persisting.

**Contract:** `validateGeneratedFlow(flow: QuestFlow, templateId: string): Promise<ValidationResult>`

**Request:** Quest flow JSON + template_id

**Response:**

```json
{
  "valid": false,
  "invariant_checks": [
    { "check": "node_sequence", "passed": true },
    { "check": "max_branches", "passed": false }
  ],
  "grammar_checks": [
    { "check": "start_node", "passed": true },
    { "check": "completion_reachable", "passed": true }
  ],
  "errors": [
    "Generated flow has 1 branch; template max_branches is 0"
  ]
}
```

---

## 4. Preview Generation

**Operation:** Generate preview content for admin review. May produce partial copy while preserving structure.

**Contract:** `previewGeneration(params): Promise<PreviewResult>`

**Request:** Same as generateQuestFromTemplate, with mode: "draft"

**Response:** Generated flow + validation summary. No persistence.

---

## 5. HTTP Route Mapping (Optional)

| Method | Path | Service |
|--------|------|---------|
| POST | /api/quest-generation/from-template | generateQuestFromTemplate |
| GET | /api/quest-generation/templates/:id/constraints | getTemplateConstraints |
| POST | /api/quest-generation/from-template/validate | validateGeneratedFlow |
| POST | /api/quest-generation/from-template/preview | previewGeneration |

---

## 6. Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| template_not_found | 404 | Template ID invalid |
| template_not_approved | 400 | Template not approved |
| output_schema_invalid | 400 | JSON parse/schema failure |
| invariant_violation | 400 | Template structure violated |
| validation_failure | 400 | Grammar validation failed |
| simulation_failure | 400 | Flow simulator failed |
| 500 | 500 | Internal error |

---

## 7. References

- [template-conditioned-quest-generation.md](template-conditioned-quest-generation.md)
