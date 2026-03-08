# Template-Conditioned Output Example

## Purpose

Show example generated JSON flow from template linear_onboarding_v1. Explains why it passes validation and how it preserves template structure.

---

## 1. Generated Flow (linear_onboarding_v1)

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
          "next_node_id": "choice_1"
        }
      ]
    },
    {
      "id": "choice_1",
      "type": "choice",
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
      "actions": []
    }
  ],
  "completion_conditions": [
    { "type": "node_reached", "node_id": "completion_1" }
  ],
  "expected_events": [
    "orientation_viewed",
    "prompt_viewed",
    "choice_selected"
  ]
}
```

---

## 2. Why It Passes

### Template Invariants Preserved

| Invariant | Check |
|-----------|-------|
| node_sequence | introduction → prompt → choice → completion (matches template) |
| action_pattern | read → read → choose (continue equivalents) |
| bar_pattern | no_BAR (no BAR nodes) |
| completion_pattern | node_reached |
| max_nodes | 4 ≤ 6 |
| max_branches | 0 |
| requires_user_action | choose before completion |

### Grammar Validation

- Single start node (intro_1)
- All nodes reachable
- Completion reachable
- No orphan nodes
- Valid node types
- Valid action types

### Simulation

- Path: intro_1 → prompt_1 → choice_1 → completion_1
- Actor has observe; all actions require observe or less
- expected_events match successful run order

---

## 3. Placeholder Mapping

| Placeholder | Generated Value |
|-------------|-----------------|
| intro_copy | "The Conclave has convened. Five nations. A heist at the Robot Oscars. You're joining the crew." |
| prompt_copy | "What draws you most right now? Understanding, connecting, or acting?" |
| action_copy | "Choose your lens." |
| completion_copy | "You've chosen your path. Welcome to the Conclave." |

All within 30 words per node.

---

## 4. Metadata (Provenance)

```json
{
  "template_id": "linear_onboarding_v1",
  "generation_mode": "template_conditioned",
  "source_book": "handbook_intro",
  "generated_at": "2025-03-06T12:00:00Z"
}
```
