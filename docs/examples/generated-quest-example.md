# Generated Quest Example

## Purpose

Example of a valid AI-generated quest flow. Shows prompt input, generated JSON, and why the flow is valid. Use as reference for the [Quest Generation Prompt Contract](../architecture/quest-generation-prompt-contract.md).

---

## Prompt Input

```
Generate a quest flow using the defined schema. Return JSON only. No commentary.

Campaign: bruised_banana_residency

Quest theme: Minimal orientation — introduce the Conclave and have the player choose a lens (understanding, connecting, or acting).

Onboarding: true

Actor capabilities: observe, create, continue

Target outcome: Player reaches completion after one choice.

Constraints: Linear flow. No BAR creation. 4 nodes. Copy under 30 words per node.
```

---

## Generated JSON

```json
{
  "flow_id": "orientation_lens_choice_v1",
  "campaign_id": "bruised_banana_residency",
  "start_node_id": "intro_1",
  "nodes": [
    {
      "id": "intro_1",
      "type": "introduction",
      "copy": "The Conclave has convened. Five nations. A heist at the Robot Oscars. You're joining the crew.",
      "actions": [
        {
          "type": "read",
          "requires": ["observe"],
          "emits": ["orientation_viewed"],
          "next_node_id": "prompt_1"
        }
      ]
    },
    {
      "id": "prompt_1",
      "type": "prompt",
      "copy": "What draws you most right now? Understanding, connecting, or acting?",
      "actions": [
        {
          "type": "read",
          "requires": ["observe"],
          "emits": ["prompt_viewed"],
          "next_node_id": "action_1"
        }
      ]
    },
    {
      "id": "action_1",
      "type": "action",
      "copy": "Choose your lens.",
      "actions": [
        {
          "type": "choose",
          "requires": ["observe"],
          "emits": ["choice_selected"],
          "next_node_id": "completion_1"
        }
      ]
    },
    {
      "id": "completion_1",
      "type": "completion",
      "copy": "You've chosen your path. Welcome to the Conclave.",
      "actions": [],
      "emits": ["quest_completed"]
    }
  ],
  "completion_conditions": [
    {
      "type": "node_reached",
      "node_id": "completion_1"
    }
  ],
  "expected_events": [
    "orientation_viewed",
    "prompt_viewed",
    "choice_selected",
    "quest_completed"
  ]
}
```

---

## Why This Flow Is Valid

### Structural

- **Start node:** intro_1 exists and is start_node_id
- **Reachability:** Path intro_1 → prompt_1 → action_1 → completion_1
- **Completion:** completion_1 is terminal (actions empty)
- **No orphans:** All nodes reachable from start
- **User action:** choose at action_1 before completion

### BAR Lifecycle

- No BAR_capture or BAR_validation; N/A

### Onboarding

- 4 nodes (≤6)
- 0 branches (≤1)
- 1 user action (choose)
- Copy ≤30 words per node
- Clear instructions

### Language

- Concrete: "Choose your lens"
- Action-oriented: "What draws you most?"
- No jargon
- First-time user can follow

### Simulation

- With actor_capabilities: ["observe", "create", "continue"], all actions pass
- expected_events matches run: orientation_viewed → prompt_viewed → choice_selected → quest_completed
- Completion reachable

---

## Validation Result

```json
{
  "status": "pass",
  "visited_nodes": ["intro_1", "prompt_1", "action_1", "completion_1"],
  "events_emitted": ["orientation_viewed", "prompt_viewed", "choice_selected", "quest_completed"],
  "warnings": [],
  "errors": []
}
```
