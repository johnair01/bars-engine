/**
 * Actor guidance API. Wraps proposeActorAction for UI consumption.
 * @see .specify/specs/simulated-collaborators/plan.md
 */

import { proposeActorAction } from './proposeActorAction'
import { getSimulatedActorRole } from './actors'
import type { FlowJSON } from './types'
import type { QuestState } from './proposeActorAction'

export interface GuidanceResponse {
  role_id: string
  role_name: string
  message: string
  suggested_actions?: Array<{ label: string; target_id: string }>
  allowed: boolean
}

export interface GetActorGuidanceInput {
  flow: FlowJSON
  current_node_id: string
  role_id: string
  quest_state?: Partial<QuestState>
  player_capabilities?: string[]
}

/**
 * Returns guidance from a simulated actor for the given flow state.
 * Wraps proposeActorAction with a UI-friendly response shape.
 */
export function getActorGuidance(input: GetActorGuidanceInput): GuidanceResponse {
  const role = getSimulatedActorRole(input.role_id)
  const questState: QuestState = {
    current_node_id: input.current_node_id,
    visited_nodes: input.quest_state?.visited_nodes ?? [],
    events_emitted: input.quest_state?.events_emitted ?? [],
    bar_count: input.quest_state?.bar_count,
  }

  const result = proposeActorAction({
    actor_role_id: input.role_id,
    flow: input.flow,
    quest_state: questState,
    player_capabilities: input.player_capabilities,
  })

  return {
    role_id: role?.role_id ?? input.role_id,
    role_name: role?.role_name ?? input.role_id,
    message: result.message,
    suggested_actions: result.suggested_actions?.map((a) => ({
      label: a.label,
      target_id: a.next_node_id,
    })),
    allowed: result.allowed,
  }
}
