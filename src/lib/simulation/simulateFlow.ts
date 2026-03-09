/**
 * Flow simulation engine. Traverses nodes, executes actions, evaluates conditions.
 * @see docs/architecture/flow-simulator-contract.md
 */

import { getAvailableActions } from './flowUtils'
import type {
  FlowJSON,
  FlowAction,
  SimulateFlowInput,
  SimulationResult,
  StateChange,
} from './types'

const DEFAULT_CAPABILITIES = ['observe', 'create', 'continue', 'choose']

export function simulateFlow(input: SimulateFlowInput): SimulationResult {
  const flow = input.flow
  const capabilities = input.actor_capabilities ?? DEFAULT_CAPABILITIES
  const state: Record<string, unknown> = {
    bar_count: 0,
    ...input.initial_state,
  }

  const visitedNodes: string[] = []
  const eventsEmitted: string[] = []
  const stateChanges: StateChange[] = []
  const warnings: string[] = []
  const errors: string[] = []

  const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]))

  // missing_start_node
  if (!nodeMap.has(flow.start_node_id)) {
    errors.push(`missing_start_node: start_node_id "${flow.start_node_id}" not in nodes`)
    return {
      status: 'fail',
      flow_id: flow.flow_id,
      visited_nodes: visitedNodes,
      events_emitted: eventsEmitted,
      state_changes: stateChanges,
      warnings,
      errors,
      completion_reached: false,
    }
  }

  let currentId: string | null = flow.start_node_id
  let userActionCount = 0

  while (currentId) {
    const node = nodeMap.get(currentId)
    if (!node) {
      errors.push(`invalid_transition: node "${currentId}" not found`)
      break
    }

    visitedNodes.push(node.id)

    // completion or handoff
    if (node.type === 'completion' || node.type === 'handoff') {
      if (userActionCount === 0) {
        errors.push('completion_before_action: terminal reached with zero user actions')
      }
      const completionReached = userActionCount > 0
      if (node.emits) eventsEmitted.push(...node.emits)

      const hasErrors = errors.length > 0
      const expectedEvents = flow.expected_events ?? []
      const eventsMatch = expectedEvents.length === 0 || expectedEvents.every((e, i) => eventsEmitted[i] === e)
      const status = hasErrors ? 'fail' : !eventsMatch ? 'warn' : 'pass'

      return {
        status,
        flow_id: flow.flow_id,
        visited_nodes: visitedNodes,
        events_emitted: eventsEmitted,
        state_changes: stateChanges,
        warnings: !eventsMatch ? ['expected_events order mismatch'] : warnings,
        errors,
        completion_reached: completionReached && !hasErrors,
      }
    }

    const available = getAvailableActions(node, capabilities, state, eventsEmitted)
    if (available.length === 0) {
      const reqs = node.actions.flatMap((a) => a.requires ?? [])
      const missing = reqs.filter((r) => !capabilities.includes(r))
      if (missing.length > 0) {
        errors.push(
          `required_capability_missing: action requires [${[...new Set(missing)].join(', ')}] but actor has [${capabilities.join(', ')}]`
        )
      } else if (node.conditions?.length) {
        errors.push(`condition_failed: conditions not satisfied for node ${node.id}`)
      } else {
        errors.push(`permission_mismatch: no actions available for node ${node.id}`)
      }
      break
    }

    const action = available[0]
    if (action.emits) eventsEmitted.push(...action.emits)
    if (action.type === 'choose' || action.type === 'create_BAR' || action.type === 'confirm') {
      userActionCount++
    }

    if (action.type === 'create_BAR') {
      const prev = state.bar_count
      state.bar_count = (prev as number) + 1
      stateChanges.push({ key: 'bar_count', from: prev, to: state.bar_count })
    }

    const nextId = action.next_node_id
    if (nextId) {
      const nextNode = nodeMap.get(nextId)
      if (!nextNode) {
        errors.push(`invalid_transition: next_node_id "${nextId}" references non-existent node`)
        break
      }
      if (nextNode.type === 'BAR_validation' && !eventsEmitted.includes('bar_created')) {
        errors.push(`BAR_validation_before_BAR_creation: ${nextId} reached before bar_created`)
        break
      }
    }
    currentId = nextId
  }

  errors.push('completion_unreachable: no path from start to completion/handoff')
  return {
    status: 'fail',
    flow_id: flow.flow_id,
    visited_nodes: visitedNodes,
    events_emitted: eventsEmitted,
    state_changes: stateChanges,
    warnings,
    errors,
    completion_reached: false,
  }
}
