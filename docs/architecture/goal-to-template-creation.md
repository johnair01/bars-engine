# Goal-to-Template Creation

## Purpose

Allow admins to create new candidate quest templates from desired game-state outcomes. Goal-derived templates are design-driven, distinct from corpus-extracted templates. Both sources produce reviewable candidates; neither bypasses approval.

---

## 1. Core Idea

Admins specify a desired state transition or game goal. The system derives a candidate quest template that could move actors toward that outcome.

**Examples:**

- Increase onboarding completion
- Move actor from uninitiated → enrolled participant
- Help actor create first BAR
- Move actor from observer → collaborator
- Unlock first quest after orientation
- Encourage ally enrollment after blocked quest state

---

## 2. Goal Input Contract

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| goal_id | string | No | Unique goal identifier |
| goal_name | string | Yes | Human-readable goal name |
| source_campaign | string | No | Campaign context |
| current_state | string | Yes | Starting state |
| target_state | string | Yes | Desired end state |
| actor_type | string | No | e.g. "human participant" |
| required_player_action | string | Yes | Action type (create_BAR, join_quest, etc.) |
| bar_requirement | string | No | no_BAR, BAR_capture_only, etc. |
| completion_evidence | string | Yes | e.g. "bar_created event emitted" |
| complexity_target | string | No | low, medium, high |
| onboarding_relevance | boolean | No | Default false |
| branching_tolerance | string | No | none, low, medium |
| tone_guidance | string | No | Copy tone |

**Example:**

```json
{
  "goal_name": "first_bar_completion",
  "current_state": "orientation_started",
  "target_state": "first_bar_created",
  "actor_type": "human participant",
  "required_player_action": "create_BAR",
  "completion_evidence": "bar_created event emitted",
  "complexity_target": "low",
  "onboarding_relevance": true
}
```

---

## 3. Goal-to-Template Derivation Rules

Rule-based mapping (no black-box inference):

| Goal Input | Template Output |
|------------|-----------------|
| current_state | Opening node pattern (e.g. orientation_started → introduction) |
| required_player_action | Action pattern |
| target_state | Completion pattern |
| bar_requirement | BAR lifecycle pattern |
| complexity_target | max_nodes, max_branches |
| onboarding_relevance | Stricter clarity constraints |

**Examples:**

- `orientation_started` → introduction or prompt opening
- `create_BAR` → BAR_capture in flow
- `first_bar_created` → completion_pattern: bar_created
- `complexity_target: low` → max_nodes: 6, max_branches: 0
- `onboarding_relevance: true` → first_action_by_node: 4, max 30 words per node

---

## 4. State-Driven Template Design

Templates are state transition scaffolds. The system answers:

- What quest structures help move actors from state A to state B?
- What actions are required for that move?
- What evidence proves the transition happened?
- What event should be emitted when complete?

**Example state transitions:**

| From | To |
|------|-----|
| visitor | user |
| user | actor enrolled in campaign |
| actor enrolled | orientation complete |
| orientation complete | first quest joined |
| no_BAR | BAR created |
| blocked quest | ally enrolled |
| passive participant | contributor |

---

## 5. Output of Goal-to-Template Creation

Produces a **candidate template**, not auto-approved.

| Field | Description |
|-------|-------------|
| template_id | Generated ID (e.g. goal_first_bar_v1) |
| template_family | Derived from goal |
| source | "goal_derived" |
| goal_mapping_summary | current_state, target_state, required_action |
| proposed_node_pattern | Derived node sequence |
| proposed_action_pattern | Derived action sequence |
| proposed_bar_pattern | Derived BAR pattern |
| completion_pattern | Derived completion |
| constraints | max_nodes, max_branches, etc. |
| placeholders | Copy slots |
| review_notes | Suggested review focus |
| approval_status | "candidate" |

---

## 6. Goal-to-Template Review Workflow

| Status | Meaning |
|--------|---------|
| candidate | Created; not yet reviewed |
| under_review | In review queue |
| approved | Promoted for generation use |
| rejected | Not promoted; reason captured |
| revised | Modified and re-submitted |

**Review checks:**

- Does the template support the target state transition?
- Is the structure valid and teachable?
- Is the template too narrow or too broad?
- Does it duplicate an existing approved template?
- Does it introduce unsupported mechanics?

Goal-derived templates do not become live generation templates without approval.

---

## 7. Validation Requirements

For goal-derived templates:

- Validate template structure (node sequence, BAR pattern, completion)
- Validate placeholder completeness
- Validate compatibility with template-conditioned generation
- Simulate a minimal example if possible

Templates that fail structural checks are not approvable.

---

## 8. Provenance

Goal-derived templates retain:

- admin_actor_id
- goal_id / goal_name
- current_state
- target_state
- required_action
- completion_evidence
- created_at
- updated_at

---

## 9. API Contract

**Contract:** `createTemplateFromGoal(params): Promise<GoalToTemplateResult>`

**Request:** Goal input contract (see §2)

**Response:**

```json
{
  "template_id": "goal_first_bar_v1",
  "approval_status": "candidate",
  "proposed_structure": {
    "node_pattern": ["introduction", "prompt", "BAR_capture", "completion"],
    "action_pattern": ["continue", "create_BAR"],
    "bar_pattern": "BAR_capture_only",
    "completion_pattern": "bar_created"
  },
  "constraints": { "max_nodes": 5, "max_branches": 0 },
  "placeholders": ["intro_copy", "bar_prompt", "completion_copy"],
  "goal_mapping": {
    "current_state": "orientation_started",
    "target_state": "first_bar_created",
    "required_action": "create_BAR"
  }
}
```

---

## 10. Constraints

- Goal-derived templates are candidates only
- No auto-approval
- Rule-based derivation; no black-box inference
- Preserve source lineage
- Compatible with template-conditioned generation

---

## 11. References

- [admin-template-quest-composer.md](admin-template-quest-composer.md)
- [quest-template-extraction-engine.md](quest-template-extraction-engine.md)
- [goal-to-template-example.md](../examples/goal-to-template-example.md)
