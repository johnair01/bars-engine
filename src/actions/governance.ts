'use server'

/**
 * governance.ts
 *
 * Holacracy-inspired governance actions for BARs Engine.
 *
 * Core loop:
 *   Role defined → check if filled → if not: NPC fills it (Regent carries until human steps in)
 *   Human ready → Regent grants role → prerequisite check → orientation quest spawned → NPC displaced
 *
 * Key design principles:
 *   - Unfilled roles default to NPC fill (like Holacracy's Lead Link filling unfilled roles)
 *   - NPC operates within its token budget; goes dormant when exhausted
 *   - Human takeover displaces NPC — NPC budget is freed
 *   - grantRole creates a real PlayerRole record, not just a face-move BAR
 */

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createFaceMoveBarAs } from './face-move-bar'
import { generateNpcName } from '@/lib/npc-name-grammar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GovernanceResult =
  | { success: true; message: string; data?: Record<string, unknown> }
  | { error: string }

type PrerequisiteCheck =
  | { eligible: true }
  | { eligible: false; reason: string; eligibilityQuestNeeded?: boolean }

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function getCurrentPlayerId(): Promise<string> {
  const cookieStore = await cookies()
  const id = cookieStore.get('bars_player_id')?.value
  if (!id) throw new Error('Not logged in')
  return id
}

async function requireRole(playerId: string, roleKey: string): Promise<void> {
  const playerRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: roleKey } },
  })
  if (!playerRole) throw new Error(`Role '${roleKey}' required`)
}

// ---------------------------------------------------------------------------
// Prerequisite checking
// ---------------------------------------------------------------------------

async function checkPrerequisites(
  targetPlayerId: string,
  roleKey: string
): Promise<PrerequisiteCheck> {
  const role = await db.role.findUnique({ where: { key: roleKey } })
  if (!role) return { eligible: false, reason: `Role '${roleKey}' not found` }

  if (!role.prerequisites) return { eligible: true }

  let prereqs: {
    minBars?: number
    requiredRoleKeys?: string[]
    alignmentThresholds?: Array<{ face?: string; moveType?: string; minCount?: number }>
  }

  try {
    prereqs = JSON.parse(role.prerequisites)
  } catch {
    return { eligible: true } // malformed JSON → no gate
  }

  // Check minimum BAR count
  if (prereqs.minBars) {
    const barCount = await db.playerQuest.count({
      where: { playerId: targetPlayerId, status: 'completed' },
    })
    if (barCount < prereqs.minBars) {
      return {
        eligible: false,
        reason: `Requires ${prereqs.minBars} completed BARs (player has ${barCount})`,
        eligibilityQuestNeeded: true,
      }
    }
  }

  // Check required existing roles
  if (prereqs.requiredRoleKeys?.length) {
    for (const requiredKey of prereqs.requiredRoleKeys) {
      const held = await db.playerRole.findFirst({
        where: { playerId: targetPlayerId, role: { key: requiredKey } },
      })
      if (!held) {
        return {
          eligible: false,
          reason: `Must hold '${requiredKey}' role first`,
        }
      }
    }
  }

  // Check PlayerAlignment thresholds
  if (prereqs.alignmentThresholds?.length) {
    const alignment = await db.playerAlignment.findUnique({
      where: { playerId: targetPlayerId },
    })
    if (!alignment) {
      return {
        eligible: false,
        reason: 'No alignment history yet — play more to qualify',
        eligibilityQuestNeeded: true,
      }
    }

    let counts: Record<string, number> = {}
    try {
      counts = JSON.parse(alignment.counts)
    } catch {
      counts = {}
    }

    for (const threshold of prereqs.alignmentThresholds) {
      const key = [threshold.face, threshold.moveType].filter(Boolean).join('_')
      const count = counts[key] ?? 0
      if (count < (threshold.minCount ?? 1)) {
        return {
          eligible: false,
          reason: `Requires deeper ${threshold.face ?? threshold.moveType} alignment`,
          eligibilityQuestNeeded: true,
        }
      }
    }
  }

  return { eligible: true }
}

// ---------------------------------------------------------------------------
// NPC spawn / find
// ---------------------------------------------------------------------------

/**
 * Find an existing available NPC with the right altitude for a role,
 * or create a new one if none exists.
 *
 * "Available" = not dormant, has budget, not already filling another role
 * in this same scope.
 */
async function findOrSpawnNpcForRole(
  roleKey: string,
  nationId: string | null,
  instanceId: string | null
): Promise<string> {
  const role = await db.role.findUnique({ where: { key: roleKey } })
  const targetAltitude = role?.npcFace ?? 'sage'
  const targetTier = role?.npcTier ?? 1

  // Look for an existing agent player with matching altitude who is available
  const existingNpc = await db.player.findFirst({
    where: {
      creatorType: 'agent',
      npcProfile: {
        altitude: targetAltitude,
        tier: targetTier,
        dormantUntil: null,   // not dormant
      },
      // Not already filling a role in this scope
      NOT: {
        roles: {
          some: {
            isFilledByNpc: true,
            ...(instanceId ? { instanceId } : {}),
            ...(nationId ? { nationId } : {}),
          },
        },
      },
    },
    include: { npcProfile: true },
  })

  if (existingNpc) return existingNpc.id

  // No suitable NPC found — spawn a new one
  const nationKey = nationId
    ? (await db.nation.findUnique({ where: { id: nationId }, select: { name: true } }))
        ?.name?.toLowerCase() ?? 'meridia'
    : 'meridia'

  const newPlayerId = `npc_${roleKey}_${Date.now()}`
  const nameResult = generateNpcName(newPlayerId, nationKey, targetAltitude, targetTier as 1 | 2 | 3 | 4)

  // Need a unique contact value for the agent player
  const contactValue = `npc-${roleKey}-${Date.now()}@simulated.local`

  // Find the invite to attach (use a system invite if any exists)
  const systemInvite = await db.invite.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!systemInvite) throw new Error('No invite record found — cannot create NPC player')

  const newPlayer = await db.player.create({
    data: {
      name: nameResult.informalName,
      creatorType: 'agent',
      contactType: 'email',
      contactValue,
      inviteId: systemInvite.id,
      nationId: nationId ?? undefined,
    },
  })

  // Create the NpcProfile
  await db.npcProfile.create({
    data: {
      playerId: newPlayer.id,
      altitude: targetAltitude,
      tier: targetTier,
      weeklyBudget: targetTier <= 1 ? 5000 : targetTier === 2 ? 10000 : targetTier === 3 ? 20000 : 40000,
      budgetResetAt: new Date(),
      sourceInstanceId: instanceId ?? undefined,
    },
  })

  return newPlayer.id
}

// ---------------------------------------------------------------------------
// Fill unfilled roles with NPCs
// ---------------------------------------------------------------------------

/**
 * Scan all roles defined for an instance/nation and fill any that have no
 * current PlayerRole with an appropriately-altituded NPC.
 *
 * Called: on instance creation, on period declaration, by cron.
 */
export async function fillUnfilledRoles(opts: {
  instanceId?: string
  nationId?: string
}): Promise<GovernanceResult> {
  try {
    const roles = await db.role.findMany({
      where: {
        scope: opts.nationId ? 'nation' : 'instance',
      },
    })

    let filled = 0
    let alreadyFilled = 0

    for (const role of roles) {
      const existing = await db.playerRole.findFirst({
        where: {
          roleId: role.id,
          ...(opts.instanceId ? { instanceId: opts.instanceId } : {}),
          ...(opts.nationId ? { nationId: opts.nationId } : {}),
        },
      })

      if (existing) { alreadyFilled++; continue }

      // No player holding this role — find or spawn NPC
      const npcPlayerId = await findOrSpawnNpcForRole(
        role.key,
        opts.nationId ?? null,
        opts.instanceId ?? null
      )

      await db.playerRole.create({
        data: {
          playerId: npcPlayerId,
          roleId: role.id,
          instanceId: opts.instanceId,
          nationId: opts.nationId,
          isFilledByNpc: true,
        },
      })

      filled++
    }

    revalidatePath('/admin/governance')
    return {
      success: true,
      message: `Filled ${filled} role(s) with NPCs. ${alreadyFilled} already held.`,
      data: { filled, alreadyFilled },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'fillUnfilledRoles failed' }
  }
}

// ---------------------------------------------------------------------------
// Grant role to a human player (the main governance move)
// ---------------------------------------------------------------------------

/**
 * Grant a role to a human player.
 *
 * Flow:
 *   1. Verify granter is authorized (admin, nation regent, or steward)
 *   2. Check prerequisites for the target player
 *   3. If prerequisites unmet → return eligibility quest offer
 *   4. If met → create PlayerRole → displace NPC if present → spawn orientation quest
 *   5. Create the grantRole face move BAR (narrative record)
 */
export async function grantRoleToPlayer(input: {
  targetPlayerId: string
  roleKey: string
  instanceId?: string
  nationId?: string
  focus?: string
  skipPrerequisiteCheck?: boolean // admin override
}): Promise<GovernanceResult> {
  try {
    const granterId = await getCurrentPlayerId()

    // Authorization: admin, steward, or nation regent
    const isAdmin = await db.playerRole.findFirst({
      where: { playerId: granterId, role: { key: 'admin' } },
    })
    const isSteward = await db.playerRole.findFirst({
      where: { playerId: granterId, role: { key: 'steward' } },
    })
    if (!isAdmin && !isSteward) {
      throw new Error('Only admins or stewards can grant roles')
    }

    const role = await db.role.findUnique({ where: { key: input.roleKey } })
    if (!role) return { error: `Role '${input.roleKey}' not found` }

    const targetPlayer = await db.player.findUnique({
      where: { id: input.targetPlayerId },
      select: { name: true },
    })
    if (!targetPlayer) return { error: 'Target player not found' }

    // Prerequisite check
    if (!input.skipPrerequisiteCheck) {
      const check = await checkPrerequisites(input.targetPlayerId, input.roleKey)
      if (!check.eligible) {
        return {
          error: `Prerequisites not met: ${check.reason}`,
          // Note: eligibilityQuestNeeded is on the check object — caller can use it
        }
      }
    }

    // Displace any NPC currently holding this role in this scope
    const npcRoleRecord = await db.playerRole.findFirst({
      where: {
        roleId: role.id,
        isFilledByNpc: true,
        ...(input.instanceId ? { instanceId: input.instanceId } : {}),
        ...(input.nationId ? { nationId: input.nationId } : {}),
      },
    })
    if (npcRoleRecord) {
      await db.playerRole.delete({ where: { id: npcRoleRecord.id } })
    }

    // Create the PlayerRole for the human
    const barResult = await createFaceMoveBarAs(granterId, 'regent', 'grant_role', {
      title: `Role granted: ${targetPlayer.name} — ${role.displayName}`,
      description: `${role.displayName} granted to ${targetPlayer.name}${input.focus ? ` (focus: ${input.focus})` : ''}`,
      barType: 'vibe',
      instanceId: input.instanceId,
      metadata: {
        targetPlayerId: input.targetPlayerId,
        roleKey: input.roleKey,
        focus: input.focus,
      },
    })

    const barId = 'barId' in barResult ? barResult.barId : undefined

    await db.playerRole.create({
      data: {
        playerId: input.targetPlayerId,
        roleId: role.id,
        grantedByAdminId: granterId,
        instanceId: input.instanceId,
        nationId: input.nationId,
        focus: input.focus,
        grantedByBarId: barId,
        isFilledByNpc: false,
      },
    })

    // Spawn orientation quest if role has a template
    if (role.orientationTemplateId) {
      await db.playerQuest.create({
        data: {
          playerId: input.targetPlayerId,
          questId: role.orientationTemplateId,
          status: 'assigned',
        },
      })
    }

    revalidatePath('/admin/governance')
    revalidatePath('/hand')

    return {
      success: true,
      message: `${role.displayName} granted to ${targetPlayer.name}`,
      data: { roleKey: input.roleKey, barId, npcDisplaced: !!npcRoleRecord },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'grantRoleToPlayer failed' }
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** Returns all roles with current holder info for a given scope. */
export async function getRoleManifest(opts: {
  instanceId?: string
  nationId?: string
}) {
  const roles = await db.role.findMany({
    include: {
      players: {
        where: {
          ...(opts.instanceId ? { instanceId: opts.instanceId } : {}),
          ...(opts.nationId ? { nationId: opts.nationId } : {}),
        },
        include: { player: { select: { id: true, name: true, creatorType: true } } },
      },
    },
  })

  return roles.map(role => ({
    key: role.key,
    displayName: role.displayName,
    purpose: role.purpose,
    npcFace: role.npcFace,
    holder: role.players[0]
      ? {
          playerId: role.players[0].player.id,
          name: role.players[0].player.name,
          isNpc: role.players[0].player.creatorType === 'agent',
          isFilledByNpc: role.players[0].isFilledByNpc,
          focus: role.players[0].focus,
        }
      : null,
    unfilled: role.players.length === 0,
  }))
}

/** Consume tokens from an NPC's weekly budget. Returns false if over budget (NPC should go dormant). */
export async function consumeNpcTokens(
  npcPlayerId: string,
  tokensUsed: number
): Promise<boolean> {
  const profile = await db.npcProfile.findUnique({ where: { playerId: npcPlayerId } })
  if (!profile) return false

  // Reset budget if week has rolled over
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const resetNeeded = Date.now() - profile.budgetResetAt.getTime() > weekMs
  if (resetNeeded) {
    await db.npcProfile.update({
      where: { playerId: npcPlayerId },
      data: { tokensUsed: tokensUsed, budgetResetAt: new Date(), dormantUntil: null },
    })
    return true
  }

  const newTotal = profile.tokensUsed + tokensUsed
  if (newTotal > profile.weeklyBudget) {
    // Over budget — mark dormant until next reset
    const nextReset = new Date(profile.budgetResetAt.getTime() + weekMs)
    await db.npcProfile.update({
      where: { playerId: npcPlayerId },
      data: { tokensUsed: newTotal, dormantUntil: nextReset },
    })
    return false
  }

  await db.npcProfile.update({
    where: { playerId: npcPlayerId },
    data: { tokensUsed: newTotal },
  })
  return true
}
