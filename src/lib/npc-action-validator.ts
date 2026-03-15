/**
 * NPC Action Validator
 *
 * Validates an NPC action against its constitution limits and Regent priority rules.
 * Called before any action is executed.
 */

import { checkRegentPriority } from '@/lib/regent-gm'

export const VALID_VERBS = [
  'reveal_lore',
  'ask_question',
  'challenge_player',
  'affirm_player',
  'offer_quest_seed',
  'reflect_bar',
  'redirect_scene',
  'deepen_scene',
  'handoff_to_other_npc',
] as const

export type NpcVerb = typeof VALID_VERBS[number]

export interface NpcActionInput {
  verb: string
  payload: Record<string, unknown>
  requiresRegentApproval?: boolean
}

export interface NpcActionValidationResult {
  valid: boolean
  decision: 'allowed' | 'blocked' | 'requires_review'
  reason?: string
}

interface ConstitutionLimits {
  can_initiate?: string[]
  cannot_do?: string[]
  requires_regent_approval_for?: string[]
}

/**
 * Validates an NPC action against constitution limits and Regent priority order.
 */
export function validateNpcAction(
  action: NpcActionInput,
  constitution: {
    status: string
    limits: string
  },
  _context?: { sceneId?: string; campaignPhase?: string }
): NpcActionValidationResult {
  // Must be a known verb
  if (!VALID_VERBS.includes(action.verb as NpcVerb)) {
    return { valid: false, decision: 'blocked', reason: `Unknown verb: "${action.verb}"` }
  }

  let limits: ConstitutionLimits = {}
  try {
    limits = JSON.parse(constitution.limits)
  } catch {
    return { valid: false, decision: 'blocked', reason: 'Constitution limits are malformed JSON' }
  }

  const canInitiate = limits.can_initiate ?? []
  const requiresApproval = limits.requires_regent_approval_for ?? []

  const requiresRegentApproval =
    action.requiresRegentApproval === true || requiresApproval.includes(action.verb)

  const decision = checkRegentPriority(
    { verb: action.verb, requiresRegentApproval },
    { npcStatus: constitution.status, constitutionCanInitiate: canInitiate }
  )

  return {
    valid: decision !== 'blocked',
    decision,
    reason:
      decision === 'blocked'
        ? `Action "${action.verb}" is blocked by Regent priority rules`
        : decision === 'requires_review'
        ? `Action "${action.verb}" requires Regent approval before execution`
        : undefined,
  }
}
