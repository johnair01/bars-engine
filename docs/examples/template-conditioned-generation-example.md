# Template-Conditioned Generation Example

## Purpose

Show example generation requests for two approved templates: linear_onboarding_v1 and bar_reflection_v2. Demonstrates inputs supplied for each use case.

---

## 1. Linear Onboarding (linear_onboarding_v1)

### Request

```json
{
  "template_id": "linear_onboarding_v1",
  "campaign_id": "bruised_banana_residency",
  "quest_theme": "welcome the player and have them choose a lens: understanding, connecting, or acting",
  "onboarding_flag": true,
  "actor_capabilities": ["observe", "continue"],
  "target_outcome": "player reaches completion after one choice",
  "source_book": "handbook_intro",
  "tone_guidance": "warm, concise",
  "mode": "validate_only"
}
```

### Inputs Supplied

| Input | Value |
|-------|-------|
| template_id | linear_onboarding_v1 |
| campaign_id | bruised_banana_residency |
| quest_theme | welcome + choose lens |
| onboarding_flag | true |
| actor_capabilities | observe, continue |
| target_outcome | completion after one choice |
| tone_guidance | warm, concise |

### Expected Structure (from template)

- Node sequence: introduction → prompt → choice → action → completion
- No BAR nodes
- Single path, no branching
- Max 6 nodes

---

## 2. Reflection + BAR (bar_reflection_v2)

### Request

```json
{
  "template_id": "bar_reflection_v2",
  "campaign_id": "bruised_banana_residency",
  "quest_theme": "reflect on one obstacle, then capture it as a BAR",
  "onboarding_flag": false,
  "actor_capabilities": ["observe", "create", "reflect"],
  "target_outcome": "user creates one BAR from reflection and completes",
  "source_book": "igniting-joy",
  "tone_guidance": "reflective, supportive",
  "mode": "validate_only"
}
```

### Inputs Supplied

| Input | Value |
|-------|-------|
| template_id | bar_reflection_v2 |
| campaign_id | bruised_banana_residency |
| quest_theme | reflect on obstacle, capture as BAR |
| onboarding_flag | false |
| actor_capabilities | observe, create, reflect |
| target_outcome | BAR created from reflection, completion |
| tone_guidance | reflective, supportive |

### Expected Structure (from template)

- Node sequence: introduction → reflection → BAR_capture → completion
- BAR pattern: BAR_capture only (no validation)
- Completion: node_reached
- Max 6 nodes
