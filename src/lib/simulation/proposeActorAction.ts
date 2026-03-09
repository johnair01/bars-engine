/**
 * Proposes a bounded action or guidance event for a simulated actor.
 * Phase 1: Role-specific proposals based on flow state.
 * @see docs/architecture/simulated-actor-roles.md
 */

import { getSimulatedActorRole } from './actors'
import { getAvailableActions } from './flowUtils'
import type { FlowJSON, FlowNode, FlowAction } from './types'

export interface QuestState {
  current_node_id?: string
  visited_nodes?: string[]
  events_emitted?: string[]
  bar_count?: number
}

export interface ProposeActorActionInput {
  actor_role_id: string
  flow: FlowJSON
  quest_state: QuestState
  /** Human participant capabilities for "what the player can do" — used when Librarian proposes. Default: full. */
  player_capabilities?: string[]
  context?: Record<string, unknown>
}

export interface SuggestedAction {
  label: string
  next_node_id: string
  type: string
}

export interface ProposedActorAction {
  action_type: 'observe' | 'propose' | 'suggest' | 'acknowledge' | 'none'
  message: string
  allowed: boolean
  suggested_actions?: SuggestedAction[]
}

const DEFAULT_PLAYER_CAPABILITIES = ['observe', 'create', 'continue', 'choose']

function buildState(questState: QuestState): Record<string, unknown> {
  const barCount =
    questState.bar_count ??
    (questState.events_emitted?.filter((e) => e === 'bar_created').length ?? 0)
  return { bar_count: barCount }
}

function getNode(flow: FlowJSON, nodeId: string): FlowNode | undefined {
  return flow.nodes.find((n) => n.id === nodeId)
}

/**
 * Librarian: Propose next valid actions at current node.
 */
function librarianPropose(
  flow: FlowJSON,
  node: FlowNode,
  questState: QuestState,
  playerCaps: string[]
): ProposedActorAction {
  const state = buildState(questState)
  const events = questState.events_emitted ?? []
  const available = getAvailableActions(node, playerCaps, state, events)

  if (available.length === 0) {
    const blocked =
      node.conditions?.length && !events.includes('bar_created')
        ? ' Complete your BAR first to continue.'
        : ' No actions available with your current permissions.'
    return {
      action_type: 'propose',
      message: `At "${node.id}":${blocked}`,
      allowed: true,
      suggested_actions: [],
    }
  }

  const suggested: SuggestedAction[] = available
    .filter((a) => a.next_node_id)
    .map((a) => ({
      label: a.label ?? (a.type === 'read' ? 'Continue' : a.type),
      next_node_id: a.next_node_id!,
      type: a.type,
    }))

  const parts = suggested.map((s) => `"${s.label}" → ${s.next_node_id}`)
  const message =
    suggested.length === 1
      ? `You could ${suggested[0].label}.`
      : `You could: ${parts.join('; ')}`

  return {
    action_type: 'propose',
    message,
    allowed: true,
    suggested_actions: suggested,
  }
}

/**
 * Witness: Reflect progress; acknowledge milestones.
 */
function witnessPropose(
  flow: FlowJSON,
  node: FlowNode,
  questState: QuestState
): ProposedActorAction {
  const visited = questState.visited_nodes ?? []
  const events = questState.events_emitted ?? []

  if (node.type === 'completion' || node.type === 'handoff') {
    return {
      action_type: 'acknowledge',
      message: `You've reached the end. ${visited.length} steps completed.`,
      allowed: true,
    }
  }

  const milestoneCount = events.filter(
    (e) =>
      e === 'orientation_viewed' ||
      e === 'choice_selected' ||
      e === 'bar_created' ||
      e === 'nation_selected' ||
      e === 'archetype_selected' ||
      e === 'quest_completed'
  ).length

  return {
    action_type: 'acknowledge',
    message: `${visited.length} steps so far. ${milestoneCount} milestone${milestoneCount === 1 ? '' : 's'} reached.`,
    allowed: true,
  }
}

/**
 * Collaborator: Suggest substeps or decomposition.
 */
function collaboratorPropose(
  flow: FlowJSON,
  node: FlowNode,
  questState: QuestState,
  playerCaps: string[]
): ProposedActorAction {
  const state = buildState(questState)
  const events = questState.events_emitted ?? []
  const available = getAvailableActions(node, playerCaps, state, events)

  if (node.type === 'BAR_capture' && !events.includes('bar_created')) {
    return {
      action_type: 'suggest',
      message: 'Consider drafting your BAR before validating. A short, concrete intention works best.',
      allowed: true,
    }
  }

  if (node.type === 'BAR_validation' && events.includes('bar_created')) {
    return {
      action_type: 'suggest',
      message: 'Your BAR is ready. Confirm to move forward.',
      allowed: true,
    }
  }

  if (available.length > 1) {
    return {
      action_type: 'suggest',
      message: `Multiple paths available. ${available.map((a) => a.label ?? a.type).join(', ')} — choose what fits.`,
      allowed: true,
    }
  }

  if (available.length === 1) {
    const a = available[0]
    return {
      action_type: 'suggest',
      message: `Next step: ${a.label ?? a.type}.`,
      allowed: true,
    }
  }

  return {
    action_type: 'observe',
    message: 'Collaborator observing current state.',
    allowed: true,
  }
}

/**
 * Returns a bounded proposed action or guidance event for a simulated actor.
 * Role-specific: Librarian proposes next actions; Witness reflects; Collaborator suggests substeps.
 */
export function proposeActorAction(input: ProposeActorActionInput): ProposedActorAction {
  const role = getSimulatedActorRole(input.actor_role_id)
  if (!role) {
    return { action_type: 'none', message: 'Unknown role.', allowed: false }
  }

  const flow = input.flow
  const nodeId = input.quest_state.current_node_id
  if (!nodeId) {
    return {
      action_type: 'observe',
      message: `${role.role_name} needs a current node to propose.`,
      allowed: true,
    }
  }

  const node = getNode(flow, nodeId)
  if (!node) {
    return {
      action_type: 'none',
      message: `Node "${nodeId}" not found in flow.`,
      allowed: false,
    }
  }

  const playerCaps = input.player_capabilities ?? DEFAULT_PLAYER_CAPABILITIES

  switch (role.role_id) {
    case 'librarian':
      return librarianPropose(flow, node, input.quest_state, playerCaps)
    case 'witness':
      return witnessPropose(flow, node, input.quest_state)
    case 'collaborator':
      return collaboratorPropose(flow, node, input.quest_state, playerCaps)
    default:
      return {
        action_type: 'observe',
        message: `${role.role_name} would observe current state.`,
        allowed: true,
      }
  }
}
