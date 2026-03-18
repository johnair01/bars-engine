/**
 * Flow simulator types. Compatible with flow-simulator-contract and FlowOutput.
 */

export interface FlowAction {
  type: string
  requires?: string[]
  emits?: string[]
  next_node_id: string | null
  label?: string
}

export interface FlowNodeCondition {
  type: string
  source?: string
}

export interface FlowNode {
  id: string
  type: string
  copy: string
  actions: FlowAction[]
  conditions?: FlowNodeCondition[]
  emits?: string[]
  target_ref?: string
}

export interface CompletionCondition {
  type: string
  node_id?: string
}

export interface FlowJSON {
  flow_id: string
  campaign_id?: string
  start_node_id: string
  nodes: FlowNode[]
  completion_conditions?: CompletionCondition[]
  expected_events?: string[]
}

export interface SimulateFlowInput {
  flow: FlowJSON
  actor_capabilities?: string[]
  initial_state?: Record<string, unknown>
  /** Optional seed for deterministic runs. Same seed + same flow → same result. Used by agents for replay. */
  seed?: number
}

export interface StateChange {
  key: string
  from: unknown
  to: unknown
}

export interface SimulationResult {
  status: 'pass' | 'warn' | 'fail'
  flow_id: string
  visited_nodes: string[]
  /** Full event sequence for agent assertions. Order preserved. */
  events_emitted: string[]
  state_changes: StateChange[]
  warnings: string[]
  errors: string[]
  completion_reached: boolean
  /** Seed used (if provided). Enables deterministic replay. */
  seed?: number
}
