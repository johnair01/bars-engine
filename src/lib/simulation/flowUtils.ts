/**
 * Shared flow logic for simulation and actor proposals.
 * @see docs/architecture/flow-simulator-contract.md
 */

import type { FlowNode, FlowAction } from './types'

export function satisfiesRequires(requires: string[] | undefined, capabilities: string[]): boolean {
  if (!requires || requires.length === 0) return true
  return requires.every((r) => capabilities.includes(r))
}

export function satisfiesConditions(
  conditions: { type: string; source?: string }[] | undefined,
  state: Record<string, unknown>,
  eventsEmitted: string[]
): boolean {
  if (!conditions || conditions.length === 0) return true
  for (const c of conditions) {
    if (c.type === 'BAR_exists') {
      if (!eventsEmitted.includes('bar_created')) return false
    }
  }
  return true
}

/**
 * Returns actions available at a node given capabilities, state, and events.
 */
export function getAvailableActions(
  node: FlowNode,
  capabilities: string[],
  state: Record<string, unknown>,
  eventsEmitted: string[]
): FlowAction[] {
  const condOk = satisfiesConditions(node.conditions, state, eventsEmitted)
  if (!condOk) return []
  return node.actions.filter((a) => satisfiesRequires(a.requires, capabilities))
}
