# Flow JSON Schema

Contract for flow fixtures used by the Flow Simulator CLI. Agents must validate fixtures against this schema before run. Use deterministic IDs for replay.

## Root: FlowJSON

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| flow_id | string | yes | Unique identifier (e.g. `bb_campaign_intro_v1`) |
| campaign_id | string | no | Campaign context |
| start_node_id | string | yes | ID of the starting node |
| nodes | FlowNode[] | yes | Array of flow nodes |
| completion_conditions | CompletionCondition[] | no | Conditions for success |
| expected_events | string[] | no | Events in successful run order (for validation) |

## FlowNode

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique node ID (deterministic; no random IDs) |
| type | string | yes | introduction, prompt, choice, BAR_capture, BAR_validation, completion, handoff |
| copy | string | yes | User-facing text |
| actions | FlowAction[] | yes | Available actions |
| conditions | FlowNodeCondition[] | no | Must be satisfied before actions available |
| emits | string[] | no | Node-level events when reached |
| target_ref | string | no | Optional reference |

## FlowAction

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | read, choose, create_BAR, confirm |
| requires | string[] | no | Capabilities required (observe, create, continue, choose) |
| emits | string[] | no | Events emitted when action taken |
| next_node_id | string \| null | yes | Next node ID or null for terminal |
| label | string | no | User-facing label |

## FlowNodeCondition

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | BAR_exists, etc. |
| source | string | no | Context (e.g. current_actor) |

## CompletionCondition

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | node_reached, BAR_created_before_validation |
| node_id | string | no | For node_reached |

## Deterministic IDs

- Use stable, human-readable IDs (e.g. `Arrival`, `bar_capture_1`, `completion_1`)
- Do not use random UUIDs or timestamps
- Same flow + same seed → same result

## Validation

Before simulation, call `validateFlowSchema(flow)`. Returns `[]` if valid.

```ts
import { validateFlowSchema } from '@/lib/simulation/validateFlowSchema'

const errors = validateFlowSchema(flow)
if (errors.length > 0) {
  throw new Error(errors.map((e) => `${e.path}: ${e.message}`).join('; '))
}
```

## References

- [flow-simulator-contract.md](../architecture/flow-simulator-contract.md)
- [flow-simulator-cli spec](../../.specify/specs/flow-simulator-cli/spec.md)
