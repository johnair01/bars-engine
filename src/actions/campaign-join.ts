'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JoinCampaignResult =
  | { success: true; campaignSlug: string; campaignName: string; alreadyMember: boolean }
  | { error: string }

// ---------------------------------------------------------------------------
// joinCampaign
// ---------------------------------------------------------------------------

/**
 * Join a campaign via an invite token.
 *
 * Flow:
 *   1. Authenticate the current player (cookie-based).
 *   2. Load the Invite by token — verify it exists, is active, and has capacity.
 *   3. Verify the invite is linked to a Campaign in APPROVED or LIVE status.
 *   4. In a single transaction:
 *      a. Upsert InstanceMembership on the campaign's parent Instance.
 *      b. Increment Invite.uses (mark exhausted when maxUses reached).
 *   5. Revalidate relevant paths and return campaign info for redirect.
 */
export async function joinCampaign(token: string): Promise<JoinCampaignResult> {
  // ── 1. Auth ──────────────────────────────────────────────────────────
  const player = await getCurrentPlayer()
  if (!player) {
    return { error: 'Authentication required. Please sign in to join this campaign.' }
  }

  const playerId = player.id

  // ── 2. Validate invite token ─────────────────────────────────────────
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { error: 'Invalid invite token.' }
  }

  const invite = await db.invite.findUnique({
    where: { token: token.trim() },
    select: {
      id: true,
      token: true,
      status: true,
      uses: true,
      maxUses: true,
      campaignId: true,
      instanceId: true,
      preassignedRoleKey: true,
      campaign: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          instanceId: true,
        },
      },
    },
  })

  if (!invite) {
    return { error: 'Invitation not found. The link may be invalid or expired.' }
  }

  if (invite.status !== 'active') {
    return { error: 'This invitation is no longer active.' }
  }

  if (invite.uses >= invite.maxUses) {
    return { error: 'This invitation has reached its maximum number of uses.' }
  }

  // ── 3. Validate campaign ─────────────────────────────────────────────
  if (!invite.campaign) {
    return { error: 'This invitation is not linked to a campaign.' }
  }

  const { campaign } = invite

  if (campaign.status !== 'APPROVED' && campaign.status !== 'LIVE') {
    return { error: 'This campaign is not currently accepting new members.' }
  }

  // Determine the instance to join — campaign's parent Instance
  const instanceId = campaign.instanceId

  // ── 3b. Check if already a member ────────────────────────────────────
  const existingMembership = await db.instanceMembership.findUnique({
    where: {
      instanceId_playerId: { instanceId, playerId },
    },
    select: { id: true },
  })

  if (existingMembership) {
    // Already a member — still a success (idempotent), but tell the caller
    return {
      success: true,
      campaignSlug: campaign.slug,
      campaignName: campaign.name,
      alreadyMember: true,
    }
  }

  // ── 4. Transaction: create membership + increment invite uses ────────
  const now = new Date()
  const newUses = invite.uses + 1
  const exhausted = newUses >= invite.maxUses

  try {
    await db.$transaction(async (tx) => {
      // 4a. Create instance membership
      await tx.instanceMembership.create({
        data: {
          instanceId,
          playerId,
          roleKey: invite.preassignedRoleKey ?? null,
        },
      })

      // 4b. Increment invite usage
      await tx.invite.update({
        where: { id: invite.id },
        data: {
          uses: newUses,
          ...(exhausted ? { usedAt: now, status: 'used' } : {}),
        },
      })
    })
  } catch (err) {
    // Handle race condition: membership may have been created between the
    // check and the transaction (rare but possible under concurrency).
    if (
      err instanceof Error &&
      err.message.includes('Unique constraint')
    ) {
      return {
        success: true,
        campaignSlug: campaign.slug,
        campaignName: campaign.name,
        alreadyMember: true,
      }
    }

    console.error('[joinCampaign] Transaction failed:', err)
    return { error: 'Something went wrong joining the campaign. Please try again.' }
  }

  // ── 5. Revalidate and return ─────────────────────────────────────────
  revalidatePath('/', 'layout')
  revalidatePath(`/campaigns/${campaign.slug}`)

  return {
    success: true,
    campaignSlug: campaign.slug,
    campaignName: campaign.name,
    alreadyMember: false,
  }
}

// ---------------------------------------------------------------------------
// validateCampaignInviteToken (read-only helper)
// ---------------------------------------------------------------------------

/**
 * Lightweight token validation for UI gating (e.g. show join button vs error).
 * Does NOT mutate anything — safe to call on page load.
 *
 * Returns basic campaign info if the token is valid and campaign is joinable,
 * or an error string explaining why not.
 */
export type ValidateTokenResult =
  | {
      valid: true
      campaignId: string
      campaignSlug: string
      campaignName: string
      instanceName: string
      isAuthenticated: boolean
      isAlreadyMember: boolean
    }
  | { valid: false; reason: string }

export async function validateCampaignInviteToken(
  token: string,
): Promise<ValidateTokenResult> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { valid: false, reason: 'Missing invite token.' }
  }

  const invite = await db.invite.findUnique({
    where: { token: token.trim() },
    select: {
      status: true,
      uses: true,
      maxUses: true,
      campaign: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          instanceId: true,
          instance: { select: { name: true } },
        },
      },
    },
  })

  if (!invite) {
    return { valid: false, reason: 'Invitation not found.' }
  }

  if (invite.status !== 'active') {
    return { valid: false, reason: 'This invitation is no longer active.' }
  }

  if (invite.uses >= invite.maxUses) {
    return { valid: false, reason: 'This invitation has been fully used.' }
  }

  if (!invite.campaign) {
    return { valid: false, reason: 'This invitation is not linked to a campaign.' }
  }

  const { campaign } = invite

  if (campaign.status !== 'APPROVED' && campaign.status !== 'LIVE') {
    return { valid: false, reason: 'This campaign is not currently accepting members.' }
  }

  // Check auth + existing membership
  const player = await getCurrentPlayer()
  const isAuthenticated = !!player

  let isAlreadyMember = false
  if (player) {
    const membership = await db.instanceMembership.findUnique({
      where: {
        instanceId_playerId: {
          instanceId: campaign.instanceId,
          playerId: player.id,
        },
      },
      select: { id: true },
    })
    isAlreadyMember = !!membership
  }

  return {
    valid: true,
    campaignId: campaign.id,
    campaignSlug: campaign.slug,
    campaignName: campaign.name,
    instanceName: campaign.instance.name,
    isAuthenticated,
    isAlreadyMember,
  }
}
