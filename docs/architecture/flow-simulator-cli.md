# Flow Simulator CLI

A command-line tool for simulating quest flows and fixtures. Reduces debugging uncertainty by making quest behavior inspectable outside the UI.

## Core CLI Goal

The CLI allows a developer to run flows and inspect whether they:

- start correctly
- traverse valid nodes
- execute available actions
- satisfy conditions
- emit expected events
- reach completion
- fail in understandable ways

## Initial CLI Commands

This repo uses **`npm run simulate`** (see `scripts/simulate-flow.ts`). Equivalent: `make simulate FILE=<path>`.

| Command | Description |
|---------|-------------|
| `npm run simulate -- <path-to-flow-json>` | Simulate one flow |
| `npm run simulate -- flow <path>` | Same as above (explicit subcommand for unified CLI tooling) |
| `npm run simulate:bb` | Run all three Bruised Banana onboarding fixtures |
| `npm run simulate -- <a.json> <b.json>` | Simulate multiple fixtures |
| `npm run simulate -- <path> --actor librarian` | Simulate with bounded role capabilities (`librarian`, `collaborator`, `witness`, …) |
| `npm run simulate -- <path> --verbose` | Verbose output (traversal log) |
| `npm run simulate -- <path> --json` | Emit JSON report for CI/tooling |
| `npm run simulate -- validate <path>` | Validate flow JSON schema only |

Legacy/doc name `bars simulate` maps to the same script if you add a shell alias.

## Simulator Inputs

| Input | Type | Description |
|-------|------|-------------|
| flow JSON | object | Flow fixture (flow_id, nodes, start_node_id, etc.) |
| actor_capabilities | string[] | Capabilities the actor has (e.g. `["continue", "choose", "create_BAR"]`) |
| initial_state | object | Optional context (campaign_enrolled, bar_count, etc.) |
| actor_roster | object[] | Optional simulated actor roster (Level 2) |
| campaign_context | object | Optional campaign context |

**Example input:**

```json
{
  "flow_id": "bb_campaign_intro_v0",
  "actor_capabilities": ["continue", "choose", "create_BAR"],
  "initial_state": {
    "campaign_enrolled": true,
    "bar_count": 0
  }
}
```

## Simulator Responsibilities (Level 1)

The first version must:

1. Load a quest flow fixture or generated quest flow
2. Confirm the start node exists
3. Traverse nodes from the start node
4. Execute actions allowed by the actor's capabilities
5. Evaluate conditions
6. Update simulated state
7. Emit events
8. Determine whether completion is reached
9. Produce a clear pass/warn/fail result

**Deterministic.** No full world simulation in v1.

## Simulator Output

```json
{
  "status": "pass | warn | fail",
  "flow_id": "string",
  "visited_nodes": [],
  "events_emitted": [],
  "state_changes": [],
  "warnings": [],
  "errors": [],
  "completion_reached": true
}
```

- **Verbose mode:** Readable traversal log (node-by-node).
- **JSON mode:** Machine-readable output for tooling and CI.

## Failure Cases

| Failure | Description |
|---------|-------------|
| missing_start_node | start_node_id not in nodes |
| invalid_transition | next_node_id references non-existent node |
| unreachable_completion | No path from start to completion |
| required_capability_missing | Action requires capability actor lacks |
| condition_can_never_pass | Condition blocks all paths |
| BAR_validation_before_BAR_creation | bar_validated reached before bar_created |
| node_references_missing | Referenced node id does not exist |
| dead_end_without_completion | Terminal node without completion or handoff |

Failures must be explicit and debuggable.

## Bruised Banana Support

Required first-class test targets:

- `campaign_intro.json`
- `identity_selection.json`
- `intended_impact_bar.json`

These fixtures must simulate to `pass` with default actor capabilities.

## Simulation Scope Boundaries

| Level | Scope | v1 Status |
|-------|-------|-----------|
| **Level 1: Flow Simulation** | Node traversal, action execution, state updates, event emission, completion checks | Implement |
| **Level 2: Actor Simulation** | Bounded simulated actors participate; simple role-based behavior; useful next-action proposals | Light scaffold only |
| **Level 3: World Simulation** | Campaign-wide multi-actor; background progression; emergent state across many quests | Do not build |

## References

- [flow-simulator-contract.md](flow-simulator-contract.md)
- [flow-simulator-notes.md](flow-simulator-notes.md)
- [quest-bar-flow-grammar.md](quest-bar-flow-grammar.md)
- [orientation-golden-paths.md](../examples/orientation-golden-paths.md)
