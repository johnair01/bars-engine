/**
 * Bounded simulated actor roles. Light scaffold for future single-player mode.
 * @see docs/architecture/simulated-actor-roles.md
 */

export type SimulatedActorRoleId = 'librarian' | 'collaborator' | 'witness'

export interface SimulatedActorRole {
  role_id: SimulatedActorRoleId
  role_name: string
  purpose: string
  allowed_observations: string[]
  allowed_actions: string[]
  forbidden_actions: string[]
  event_types: string[]
  policy_summary: string
  /** Flow simulator capabilities this role may use when simulating. */
  flow_capabilities: string[]
}

const ROLES: Record<SimulatedActorRoleId, SimulatedActorRole> = {
  librarian: {
    role_id: 'librarian',
    role_name: 'Librarian',
    purpose:
      'Explain available quest steps; suggest relevant BAR or quest next moves; help the player understand what to do next.',
    allowed_observations: ['quest_state', 'available_actions', 'current_node', 'flow_progress'],
    allowed_actions: ['observe', 'propose', 'recommend', 'emit_guidance'],
    forbidden_actions: ['complete_player_action', 'mutate_critical_state_without_approval'],
    event_types: ['guidance_emitted', 'proposal_made'],
    policy_summary: 'Proposes and recommends; does not complete player actions or mutate critical state.',
    flow_capabilities: ['observe', 'continue'],
  },
  collaborator: {
    role_id: 'collaborator',
    role_name: 'Collaborator',
    purpose:
      'Help advance work-oriented quests; propose substeps; draft small bounded outputs; join shared quest state in a limited way.',
    allowed_observations: ['quest_state', 'subtasks', 'shared_state', 'draft_context'],
    allowed_actions: ['propose_subtask', 'suggest_decomposition', 'draft_small_output', 'emit_collaboration'],
    forbidden_actions: ['finalize_user_decisions', 'impersonate_user_intent', 'silently_complete_gated_progression'],
    event_types: ['collaboration_emitted', 'subtask_proposed'],
    policy_summary: 'Helps draft and propose; does not finalize important decisions or impersonate user intent.',
    flow_capabilities: ['observe', 'create', 'continue'],
  },
  witness: {
    role_id: 'witness',
    role_name: 'Witness',
    purpose:
      'Reflect progress back to the player; confirm milestones; reinforce completion and continuity; help maintain narrative coherence.',
    allowed_observations: ['completed_actions', 'milestones', 'outstanding_steps', 'narrative_state'],
    allowed_actions: ['summarize', 'reflect', 'acknowledge', 'emit_acknowledgment'],
    forbidden_actions: ['invent_progress', 'create_false_state_changes'],
    event_types: ['acknowledgment_emitted', 'summary_emitted'],
    policy_summary: 'Reflects and acknowledges; does not invent progress or create false state changes.',
    flow_capabilities: ['observe'],
  },
}

/**
 * Returns the role definition for a bounded simulated actor.
 * @param roleId - librarian | collaborator | witness
 * @returns Role contract or undefined if roleId is unknown
 */
export function getSimulatedActorRole(roleId: string): SimulatedActorRole | undefined {
  if (roleId in ROLES) {
    return ROLES[roleId as SimulatedActorRoleId]
  }
  return undefined
}
