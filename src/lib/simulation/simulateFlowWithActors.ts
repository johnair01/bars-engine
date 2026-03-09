/**
 * Flow simulation with bounded simulated actors. Light scaffold — delegates to simulateFlow.
 * @see docs/architecture/flow-simulator-cli.md
 */

import { simulateFlow } from './simulateFlow'
import { getSimulatedActorRole } from './actors'
import type { FlowJSON, SimulateFlowInput, SimulationResult } from './types'

export interface SimulateFlowWithActorsInput extends SimulateFlowInput {
  actor_roster?: Array<{ role_id: string; actor_id?: string }>
}

/**
 * Runs a flow with one or more bounded simulated actors available.
 * In v1: uses primary actor capabilities; actor roster is for future extension.
 */
export function simulateFlowWithActors(input: SimulateFlowWithActorsInput): SimulationResult {
  const roster = input.actor_roster ?? []
  const primaryRoleId = roster[0]?.role_id ?? 'default'
  const role = getSimulatedActorRole(primaryRoleId)
  const capabilities =
    role?.flow_capabilities ?? ['observe', 'create', 'continue', 'choose']

  return simulateFlow({
    flow: input.flow,
    actor_capabilities: capabilities,
    initial_state: input.initial_state,
  })
}
