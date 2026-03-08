# Admin Template Composer Example

## Purpose

Show the workflow for selecting linear_onboarding_v1, providing inputs, previewing a quest, seeing validation/simulation results, and saving an accepted draft.

---

## 1. Select Template

Admin lists approved templates, filters by `template_family: linear_onboarding`, selects `linear_onboarding_v1`.

**Template details returned:**
- Node sequence: introduction → prompt → choice → action → completion
- Placeholders: intro_copy, prompt_copy, action_copy, completion_copy
- Constraints: max_nodes 6, max_branches 0

---

## 2. Provide Inputs

```json
{
  "template_id": "linear_onboarding_v1",
  "campaign_id": "bruised_banana_residency",
  "quest_theme": "welcome the player and have them choose a lens: understanding, connecting, or acting",
  "target_outcome": "player reaches completion after one choice",
  "onboarding_flag": true,
  "actor_capabilities": ["observe", "continue"],
  "tone_guidance": "warm, concise"
}
```

---

## 3. Preview Quest

**Request:** POST /admin/template-quests/preview with above inputs

**Response:**

```json
{
  "flow": {
    "flow_id": "orientation_lens_choice_v1",
    "campaign_id": "bruised_banana_residency",
    "start_node_id": "intro_1",
    "nodes": [
      {
        "id": "intro_1",
        "type": "introduction",
        "copy": "The Conclave has convened. Five nations. A heist at the Robot Oscars. You're joining the crew.",
        "actions": [{ "type": "read", "next_node_id": "prompt_1" }]
      },
      {
        "id": "prompt_1",
        "type": "prompt",
        "copy": "What draws you most right now? Understanding, connecting, or acting?",
        "actions": [{ "type": "read", "next_node_id": "choice_1" }]
      },
      {
        "id": "choice_1",
        "type": "choice",
        "copy": "Choose your lens.",
        "actions": [{ "type": "choose", "next_node_id": "completion_1" }]
      },
      {
        "id": "completion_1",
        "type": "completion",
        "copy": "You've chosen your path. Welcome to the Conclave.",
        "actions": []
      }
    ],
    "completion_conditions": [{ "type": "node_reached", "node_id": "completion_1" }],
    "expected_events": ["orientation_viewed", "prompt_viewed", "choice_selected"]
  },
  "validation_report": { "passed": true, "errors": [], "warnings": [] },
  "simulation_report": { "passed": true, "path": ["intro_1", "prompt_1", "choice_1", "completion_1"] },
  "score_summary": { "total_score": 25, "status": "ready" }
}
```

---

## 4. Validation and Simulation Results

| Check | Result |
|-------|--------|
| Template invariants | Passed |
| Quest/BAR grammar | Passed |
| Flow simulation | Passed |
| Score | 25 (ready) |

---

## 5. Save Accepted Draft

**Request:** POST /admin/template-quests

```json
{
  "flow": { "flow_id": "orientation_lens_choice_v1", "nodes": [...], "completion_conditions": [...], "expected_events": [...] },
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
