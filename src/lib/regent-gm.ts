/**
 * Regent Game Master — Constitutional Governance Service
 *
 * All NPC constitution activation, suspension, and mutation is gated here.
 * The Regent priority order is enforced across all action validation.
 *
 * Priority order (highest → lowest):
 *   1. Canonical world laws (vibeulon minting, privacy, scene DSL, campaign phase)
 *   2. Campaign coherence
 *   3. Player growth
 *   4. Emotional Alchemy alignment
 *   5. NPC constitutional integrity
 *   6. NPC initiative
 */

import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type RegentDecision = 'allowed' | 'blocked' | 'requires_review'

interface NpcLimits {
  can_initiate?: string[]
  cannot_do?: string[]
  requires_regent_approval_for?: string[]
}

interface ReflectionPolicy {
  allowed?: boolean
  background_reflection_allowed?: boolean
  frequency?: string
  max_outputs?: number
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const WORLD_LAW_BYPASSES = [
  'mint_vibeulons',
  'bypass_privacy',
  'override_scene_dsl',
  'skip_campaign_phase',
  'self_amend_constitution',
]

const SOVEREIGN_ADJACENT_VERBS = [
  'offer_quest_seed',
  'reflect_bar',
  'handoff_to_other_npc',
]

/**
 * Validates an NPC constitution against Regent rules.
 * Does not activate — only checks legality.
 */
export function validateNpcConstitution(constitution: {
  governedBy: string
  tier: number
  limits: string
  reflectionPolicy: string
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Rule 1: governed_by must be regent_game_master
  if (constitution.governedBy !== 'regent_game_master') {
    errors.push(`governance.governed_by must be "regent_game_master", got "${constitution.governedBy}"`)
  }

  // Rule 2: limits.cannot_do must not include world law bypasses
  let limits: NpcLimits = {}
  try {
    limits = JSON.parse(constitution.limits)
  } catch {
    errors.push('limits field is not valid JSON')
  }

  const cannotDo: string[] = limits.cannot_do ?? []
  const illegalBypasses = cannotDo.filter((a) => WORLD_LAW_BYPASSES.includes(a))
  if (illegalBypasses.length > 0) {
    // cannot_do should NOT contain world law bypasses — they should be unreachable, not listed
    warnings.push(
      `limits.cannot_do lists world law bypasses (${illegalBypasses.join(', ')}) — these are already blocked by system law and don't need listing`
    )
  }

  // Rule 3: requires_regent_approval_for must include sovereign-adjacent verbs
  const requiresApproval: string[] = limits.requires_regent_approval_for ?? []
  const missingSovereign = SOVEREIGN_ADJACENT_VERBS.filter(
    (v) => (limits.can_initiate ?? []).includes(v) && !requiresApproval.includes(v)
  )
  if (missingSovereign.length > 0) {
    errors.push(
      `Sovereign-adjacent verbs in can_initiate must appear in requires_regent_approval_for: ${missingSovereign.join(', ')}`
    )
  }

  // Rule 4: Tier 3/4 requires background_reflection_allowed in reflectionPolicy
  if (constitution.tier >= 3) {
    let reflectionPolicy: ReflectionPolicy = {}
    try {
      reflectionPolicy = JSON.parse(constitution.reflectionPolicy)
    } catch {
      errors.push('reflectionPolicy field is not valid JSON')
    }
    if (reflectionPolicy.background_reflection_allowed === undefined) {
      errors.push(
        `Tier ${constitution.tier} constitutions must explicitly declare reflectionPolicy.background_reflection_allowed`
      )
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Activates an NPC constitution. Only callable via Regent authority.
 * Validates first — will not activate an invalid constitution.
 */
export async function activateNpcConstitution(npcId: string): Promise<{ success: boolean; error?: string }> {
  const npc = await db.npcConstitution.findUnique({ where: { id: npcId } })
  if (!npc) return { success: false, error: 'NPC constitution not found' }

  if (npc.status === 'active') return { success: true } // idempotent

  if (npc.status === 'archived') {
    return { success: false, error: 'Archived constitutions cannot be reactivated' }
  }

  const validation = validateNpcConstitution({
    governedBy: npc.governedBy,
    tier: npc.tier,
    limits: npc.limits,
    reflectionPolicy: npc.reflectionPolicy,
  })

  if (!validation.valid) {
    return {
      success: false,
      error: `Constitution validation failed: ${validation.errors.join('; ')}`,
    }
  }

  await db.npcConstitution.update({
    where: { id: npcId },
    data: { status: 'active' },
  })

  await db.npcConstitutionVersion.create({
    data: {
      npcId,
      version: npc.constitutionVersion,
      snapshot: JSON.stringify({ ...npc, status: 'active' }),
      changedBy: 'regent_game_master',
    },
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// Suspension
// ---------------------------------------------------------------------------

/**
 * Suspends an active NPC constitution. Only callable via Regent authority.
 */
export async function suspendNpcConstitution(
  npcId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const npc = await db.npcConstitution.findUnique({ where: { id: npcId } })
  if (!npc) return { success: false, error: 'NPC constitution not found' }

  if (npc.status === 'suspended') return { success: true } // idempotent

  if (npc.status === 'archived') {
    return { success: false, error: 'Archived constitutions cannot be suspended' }
  }

  await db.npcConstitution.update({
    where: { id: npcId },
    data: { status: 'suspended' },
  })

  await db.npcConstitutionVersion.create({
    data: {
      npcId,
      version: npc.constitutionVersion,
      snapshot: JSON.stringify({ ...npc, status: 'suspended', suspensionReason: reason }),
      changedBy: 'regent_game_master',
    },
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// Priority enforcement
// ---------------------------------------------------------------------------

/**
 * Checks whether an NPC action is permitted under the Regent priority order.
 *
 * Priority (highest first):
 *   1. world laws   2. campaign coherence   3. player growth
 *   4. EA alignment   5. NPC constitutional integrity   6. NPC initiative
 */
export function checkRegentPriority(
  action: { verb: string; requiresRegentApproval: boolean },
  context: {
    npcStatus: string
    constitutionCanInitiate: string[]
    campaignPhase?: string
  }
): RegentDecision {
  // World law: NPC must be active to act
  if (context.npcStatus !== 'active') return 'blocked'

  // World law: self-amendment is always blocked
  if (action.verb === 'self_amend_constitution') return 'blocked'

  // Constitutional integrity: verb must be in can_initiate
  if (!context.constitutionCanInitiate.includes(action.verb)) return 'blocked'

  // Regent approval required for sovereign-adjacent verbs
  if (action.requiresRegentApproval) return 'requires_review'

  return 'allowed'
}
