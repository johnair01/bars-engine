# Flow Simulator Contract

## Purpose

Define minimal expectations for a flow simulator. The simulator validates generated quest/BAR flows without full engine integration. It is a lightweight validation tool for the generate → parse → validate → simulate → accept/reject pipeline.

---

## 1. Simulator Inputs

The simulator accepts:

| Input | Type | Description |
|-------|------|-------------|
| flow | object | Flow JSON (see fixture format) |
| actor_capabilities | string[] | Permissions the actor has (e.g., `["observe", "create", "continue"]`) |
| initial_state | object | Optional context (e.g., `initial_bar_count`, `is_authenticated`) |

**Example:**
```json
{
  "flow": { "flow_id": "...", "nodes": [...], ... },
  "actor_capabilities": ["observe", "create", "continue"],
  "initial_state": {
    "initial_bar_count": 0,
    "is_authenticated": false
  }
}
```

---

## 2. Simulator Responsibilities

The simulator must:

1. **Load a flow fixture** — Parse flow JSON; validate schema
2. **Traverse nodes** — Start from `start_node_id`; follow `actions[].next_node_id`
3. **Execute available actions** — For each action, check `requires` against `actor_capabilities`
4. **Evaluate conditions** — Resolve `conditions[]` using simulated state (e.g., `BAR_exists`)
5. **Track emitted events** — Collect events from `emits` on actions and nodes
6. **Determine completion** — Check whether `completion_conditions` are met

---

## 3. Checks Performed

### Start Node Validity

- `start_node_id` exists in `nodes`
- Start node has at least one action (or is terminal with explicit completion)

### Node Reachability

- All `next_node_id` values reference existing nodes (or `null` for terminal)
- At least one path from start to a completion/handoff node exists
- No orphan nodes (all nodes reachable from start)

### Action Execution

- For each action taken: `requires` ⊆ `actor_capabilities` (or `requires` empty for public actions)
- Actions with unmet requirements block traversal on that path

### Condition Evaluation

- `conditions` must resolve to true before actions are available
- `BAR_exists`: true only if `bar_created` was emitted earlier in the current run
- Unmet conditions block the action

### Event Emission

- Events from `expected_events` must occur in order during a successful run
- No event may occur before its prerequisite (e.g., `bar_validated` after `bar_created`)

### Completion Reachability

- A path exists from start to a node that satisfies `completion_conditions`
- Completion node has `type: "completion"` or `type: "handoff"`
- At least one user action (choose, create_BAR, signup, etc.) before completion

---

## 4. Validation Failures

The simulator must detect and report:

| Failure | Description |
|---------|-------------|
| missing_start_node | `start_node_id` not in nodes |
| unreachable_node | Node exists but no path from start |
| invalid_transition | `next_node_id` references non-existent node |
| required_object_missing | BAR_validation before BAR_capture; condition BAR_exists false |
| permission_mismatch | Action requires capability actor lacks |
| completion_unreachable | No path from start to completion/handoff |
| BAR_validation_before_creation | bar_validated or BAR_validation node reached before bar_created |
| completion_before_action | Terminal reached with zero user actions |

---

## 5. Simulation Output

Return a result object:

```ts
interface SimulationResult {
  status: 'pass' | 'warn' | 'fail'
  visited_nodes: string[]
  events_emitted: string[]
  warnings: string[]
  errors: string[]
}
```

**status:**
- `pass` — All checks pass; completion reached; expected_events match
- `warn` — Completion reached but with warnings (e.g., extra events, long path)
- `fail` — One or more validation failures

**Example (pass):**
```json
{
  "status": "pass",
  "visited_nodes": ["intro_1", "prompt_1", "action_1", "completion_1"],
  "events_emitted": ["orientation_viewed", "prompt_viewed", "choice_selected", "quest_completed"],
  "warnings": [],
  "errors": []
}
```

**Example (fail):**
```json
{
  "status": "fail",
  "visited_nodes": ["intro_1", "prompt_1", "bar_capture_1", "bar_validation_1"],
  "events_emitted": ["orientation_viewed", "prompt_viewed"],
  "warnings": [],
  "errors": [
    "permission_mismatch: action create_BAR requires [create] but actor has [observe]",
    "BAR_validation_before_creation: bar_validation_1 reached before bar_created"
  ]
}
```

---

## 6. Fixture Format Reference

Flow JSON must include:

- `flow_id` — Unique identifier
- `campaign_id` — Campaign context
- `start_node_id` — Start node
- `nodes` — Array of node objects
- `completion_conditions` — Conditions for success
- `expected_events` — Events in successful run order

Node object:

- `id` — Required
- `type` — Required (introduction, prompt, action, BAR_capture, BAR_validation, completion, handoff, etc.)
- `copy` — Required (user-facing text)
- `actions` — Array; each has `type`, `requires?`, `emits?`, `next_node_id`
- `conditions` — Optional; each has `type`, `source`
- `emits` — Optional; node-level events when reached

---

## 7. Algorithm Sketch

```
function simulate(flow, actor_capabilities, initial_state):
  state = { bar_count: initial_state.initial_bar_count ?? 0, ... }
  visited = []
  events = []
  current = flow.start_node_id

  if current not in flow.nodes: return fail("missing_start_node")

  while current:
    node = flow.nodes[current]
    visited.push(current.id)

    if node.type in [completion, handoff]:
      if len(events) == 0 or no_user_action(events): return fail("completion_before_action")
      return pass(visited, events)

    available = []
    for action in node.actions:
      if satisfies(action.requires, actor_capabilities) and satisfies(node.conditions, state):
        available.push(action)

    if available.empty: return fail("permission_mismatch or condition_failed")

    action = available[0]  // or non-deterministic for branching
    events.push(...action.emits)
    if action.type == "create_BAR": state.bar_count++
    if action.type == "BAR_validation" and state.bar_count == 0: return fail("BAR_validation_before_creation")

    current = action.next_node_id
    if current and current not in flow.nodes: return fail("invalid_transition")

  return fail("completion_unreachable")
```

---

## 8. Fixture Locations

- `fixtures/flows/orientation_linear_minimal.json`
- `fixtures/flows/orientation_bar_create.json`
- `fixtures/flows/orientation_handoff_first_quest.json`

These fixtures must simulate to `pass` with default actor capabilities `["observe", "create", "continue"]`.
