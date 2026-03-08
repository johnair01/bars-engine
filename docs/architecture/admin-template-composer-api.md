# Admin Template Composer API

## Purpose

Define service/API contracts for the admin template quest composer. Contracts are UI-independent; may be implemented as HTTP routes or service-layer functions.

---

## 1. List Approved Templates

**Operation:** List approved templates available for composition.

**Contract:** `listApprovedTemplates(params): Promise<TemplateSummary[]>`

**Request (query params):**

| Param | Type | Description |
|-------|------|-------------|
| template_family | string | Filter by family |
| onboarding_suitable | boolean | Filter by onboarding suitability |
| campaign_compatible | string | Filter by campaign |
| bar_pattern | string | Filter by BAR pattern |
| limit | number | Max results (default 50) |
| offset | number | Pagination offset |

**Response:** Array of `TemplateSummary` (template_id, template_name, template_family, bar_pattern, constraints summary).

---

## 2. Get Template Details

**Operation:** Return template details, constraints, placeholders, and example usages.

**Contract:** `getTemplateDetails(templateId: string): Promise<TemplateDetail | null>`

**Response:** Full template with fixed_structure, placeholders, constraints, forbidden_deviations, example_quest_ids.

---

## 3. Preview Generated Quest

**Operation:** Generate a quest draft from a selected template without persisting.

**Contract:** `previewTemplateQuest(params): Promise<PreviewResult>`

**Request:**

```json
{
  "template_id": "linear_onboarding_v1",
  "campaign_id": "bruised_banana_residency",
  "quest_theme": "welcome and choose lens",
  "target_outcome": "completion after one choice",
  "onboarding_flag": true,
  "actor_capabilities": ["observe", "continue"],
  "tone_guidance": "warm, concise",
  "validation_mode": true,
  "simulation_mode": true
}
```

**Response:**

```json
{
  "flow": { "flow_id": "...", "nodes": [...], "completion_conditions": [...], "expected_events": [...] },
  "validation_report": { "passed": true, "errors": [], "warnings": [] },
  "simulation_report": { "passed": true, "path": ["intro_1", "prompt_1", "choice_1", "completion_1"] },
  "score_summary": { "total_score": 25, "status": "ready" }
}
```

---

## 4. Persist Accepted Quest

**Operation:** Persist an accepted quest generated from a template.

**Contract:** `persistTemplateQuest(params): Promise<PersistResult>`

**Request:**

```json
{
  "flow": { "flow_id": "...", "nodes": [...], "completion_conditions": [...], "expected_events": [...] },
  "provenance": {
    "template_id": "linear_onboarding_v1",
    "admin_actor_id": "admin_123",
    "campaign_id": "bruised_banana_residency",
    "generation_mode": "template_conditioned"
  },
  "campaign_attachment": { "campaign_id": "bruised_banana_residency", "attach": true },
  "mode": "save_as_draft"
}
```

**Response:**

```json
{
  "success": true,
  "quest_id": "quest_abc123",
  "mode": "save_as_draft"
}
```

---

## 5. Reject Generated Quest

**Operation:** Reject a generated quest draft and store rejection reason.

**Contract:** `rejectTemplateQuest(draftId: string, reason: string): Promise<RejectResult>`

**Request:**

```json
{
  "reason": "Copy too verbose; needs revision",
  "admin_actor_id": "admin_123"
}
```

---

## 6. Regenerate Quest

**Operation:** Regenerate quest content using same template with updated inputs.

**Contract:** `regenerateTemplateQuest(draftId: string, updatedInputs: object): Promise<PreviewResult>`

**Rule:** Structure remains template-bound. Only inputs (theme, tone, etc.) may change.

---

## 7. Create Template From Goal

**Operation:** Create a candidate template from a desired game-state goal.

**Contract:** `createTemplateFromGoal(params): Promise<GoalToTemplateResult>`

**Request:** See [goal-to-template-creation.md](goal-to-template-creation.md) §2.

**Response:** Candidate template with proposed_structure, constraints, placeholders, goal_mapping, approval_status: "candidate".

**Approve:** `approveGoalTemplate(templateId, metadata)` — Promote candidate to approved.

**Reject:** `rejectGoalTemplate(templateId, reason)` — Reject with reason.

---

## 8. HTTP Route Mapping (Optional)

| Method | Path | Service |
|--------|------|---------|
| GET | /api/admin/templates | listApprovedTemplates |
| GET | /api/admin/templates/:id | getTemplateDetails |
| POST | /api/admin/template-quests/preview | previewTemplateQuest |
| POST | /api/admin/template-quests | persistTemplateQuest |
| POST | /api/admin/template-quests/:id/reject | rejectTemplateQuest |
| POST | /api/admin/template-quests/:id/regenerate | regenerateTemplateQuest |
| POST | /api/admin/goal-templates | createTemplateFromGoal |
| POST | /api/admin/goal-templates/:id/approve | approveGoalTemplate |
| POST | /api/admin/goal-templates/:id/reject | rejectGoalTemplate |

---

## 9. References

- [admin-template-quest-composer.md](admin-template-quest-composer.md)
- [goal-to-template-creation.md](goal-to-template-creation.md)
- [template-conditioned-generation-api.md](template-conditioned-generation-api.md)
