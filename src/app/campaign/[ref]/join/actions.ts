'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type JoinFormResult =
  | { success: true; campaignSlug: string; alreadyMember: boolean }
  | { error: string }
  | null

/**
 * Server action: join a campaign by creating an InstanceMembership.
 *
 * Supports two paths:
 *   A) Direct join — campaignId identifies the campaign; no invite token needed.
 *   B) Invite-token join — inviteToken provided; validates + increments usage.
 *
 * Pre-conditions:
 *   - Player must be authenticated (cookie)
 *   - Campaign must be APPROVED or LIVE
 *   - Player must not already be a member
 *   - If invite token: must be active + have capacity
 *
 * On success: returns { success, campaignSlug } so the client can
 * redirect via NavigationContract (campaign_join → /campaign/hub).
 * On failure: returns { error } for the form to display.
 */
export async function joinCampaign(
  _prevState: JoinFormResult,
  formData: FormData,
): Promise<JoinFormResult> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    return { error: 'You must be logged in to join a campaign.' }
  }

  const campaignId = formData.get('campaignId') as string
  const campaignSlug = formData.get('campaignSlug') as string
  const inviteToken = (formData.get('inviteToken') as string)?.trim() || null

  if (!campaignId || !campaignSlug) {
    return { error: 'Missing campaign information.' }
  }

  // ── Resolve invite (if token provided) ──────────────────────────────────
  let invite: {
    id: string
    uses: number
    maxUses: number
    preassignedRoleKey: string | null
  } | null = null

  if (inviteToken) {
    const found = await db.invite.findUnique({
      where: { token: inviteToken },
      select: {
        id: true,
        status: true,
        uses: true,
        maxUses: true,
        campaignId: true,
        preassignedRoleKey: true,
      },
    })

    if (!found || found.status !== 'active') {
      return { error: 'This invitation is no longer active.' }
    }
    if (found.uses >= found.maxUses) {
      return { error: 'This invitation has reached its maximum number of uses.' }
    }
    // Invite must belong to this campaign (or be unlinked)
    if (found.campaignId && found.campaignId !== campaignId) {
      return { error: 'This invitation is for a different campaign.' }
    }
    invite = found
  }

  // ── Fetch campaign and verify it's joinable ─────────────────────────────
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      slug: true,
      status: true,
      instanceId: true,
    },
  })

  if (!campaign || (campaign.status !== 'APPROVED' && campaign.status !== 'LIVE')) {
    return { error: 'This campaign is not currently accepting new members.' }
  }

  // ── Check if already a member ───────────────────────────────────────────
  const existing = await db.instanceMembership.findUnique({
    where: {
      instanceId_playerId: {
        instanceId: campaign.instanceId,
        playerId,
      },
    },
    select: { id: true },
  })

  if (existing) {
    // Already a member — still counts as success (idempotent)
    return { success: true, campaignSlug: campaign.slug, alreadyMember: true }
  }

  // ── Transaction: create membership + (optionally) increment invite ──────
  const roleKey = invite?.preassignedRoleKey ?? null

  try {
    await db.$transaction(async (tx) => {
      // Create instance membership
      await tx.instanceMembership.create({
        data: {
          instanceId: campaign.instanceId,
          playerId,
          roleKey,
        },
      })

      // Increment invite usage if token-based join
      if (invite) {
        const newUses = invite.uses + 1
        const exhausted = newUses >= invite.maxUses
        await tx.invite.update({
          where: { id: invite.id },
          data: {
            uses: newUses,
            ...(exhausted ? { usedAt: new Date(), status: 'used' } : {}),
          },
        })
      }
    })
  } catch (err: unknown) {
    // Handle race condition (duplicate membership)
    if (
      err instanceof Error &&
      err.message.includes('Unique constraint')
    ) {
      return { success: true, campaignSlug: campaign.slug, alreadyMember: true }
    }
    console.error('[joinCampaign] Transaction failed:', err)
    return { error: 'Failed to join campaign. Please try again.' }
  }

  revalidatePath(`/campaign/${encodeURIComponent(campaign.slug)}`)
  revalidatePath(`/campaign/${encodeURIComponent(campaign.slug)}/join`)
  revalidatePath('/campaign/hub')
  revalidatePath('/', 'layout')

  return { success: true, campaignSlug: campaign.slug, alreadyMember: false }
}
