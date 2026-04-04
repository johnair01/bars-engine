'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  validateTransition,
  fireLifecycleHooks,
  type RequiredRole,
} from '@/lib/campaign-lifecycle'
import type { CampaignStatus } from '@prisma/client'

// Register lifecycle hooks (side-effect import — hooks register at module load)
import '@/lib/campaign-lifecycle-hooks'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

/** True when the player holds the global `admin` role. */
async function isGlobalAdmin(playerId: string): Promise<boolean> {
  const row = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  return !!row
}

/**
 * True when the player is an admin, or holds owner/steward membership on the
 * instance that owns the given campaign.
 */
async function isStewardPlusForCampaign(
  playerId: string,
  campaignId: string
): Promise<boolean> {
  // Global admin always passes
  if (await isGlobalAdmin(playerId)) return true

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { instanceId: true, createdById: true },
  })
  if (!campaign) return false

  const membership = await db.instanceMembership.findUnique({
    where: {
      instanceId_playerId: {
        instanceId: campaign.instanceId,
        playerId,
      },
    },
  })

  return membership?.roleKey === 'owner' || membership?.roleKey === 'steward'
}

/**
 * Shared transition executor — validates transition, checks role, updates DB,
 * fires lifecycle hooks. Prevents any bypass of the state machine.
 */
async function executeTransition(
  campaignId: string,
  targetStatus: CampaignStatus,
  playerId: string,
  extraData?: Record<string, unknown>
): Promise<ActionResult> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true, slug: true, instanceId: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  // --- State machine guard ---
  const validation = validateTransition(
    campaign.status as CampaignStatus,
    targetStatus
  )
  if (!validation.valid) return { error: validation.reason }

  // --- Role guard ---
  const roleOk = await checkRole(
    playerId,
    campaignId,
    validation.requiredRole
  )
  if (!roleOk) {
    return {
      error: validation.requiredRole === 'admin'
        ? 'Not authorized — admin role required'
        : 'Not authorized — steward or higher role required',
    }
  }

  // --- Execute the transition ---
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: targetStatus,
      ...extraData,
    },
  })

  // --- Fire lifecycle hooks (non-blocking to the caller) ---
  await fireLifecycleHooks({
    campaignId,
    from: campaign.status as CampaignStatus,
    to: targetStatus,
    actorId: playerId,
    metadata: extraData as Record<string, unknown> | undefined,
    timestamp: new Date(),
  })

  revalidatePath(`/campaigns/${campaign.slug}`)
  revalidatePath('/admin/campaigns')

  return { success: true, message: `Campaign status changed to ${targetStatus}` }
}

/**
 * Check whether a player satisfies the required role for a transition.
 */
async function checkRole(
  playerId: string,
  campaignId: string,
  required: RequiredRole
): Promise<boolean> {
  if (required === 'admin') return isGlobalAdmin(playerId)
  return isStewardPlusForCampaign(playerId, campaignId)
}

// ---------------------------------------------------------------------------
// listCampaignsForReview — Admin fetches campaigns filtered by status
// ---------------------------------------------------------------------------

export async function listCampaignsForReview(
  statusFilter?: string
) {
  const playerId = await getPlayerId()
  if (!playerId) return []

  if (!(await isGlobalAdmin(playerId))) return []

  const where = statusFilter && statusFilter !== 'all'
    ? { status: statusFilter as 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'LIVE' | 'ARCHIVED' }
    : {}

  const campaigns = await db.campaign.findMany({
    where,
    orderBy: [
      { submittedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      status: true,
      allyshipDomain: true,
      shareUrl: true,
      submittedAt: true,
      createdAt: true,
      startDate: true,
      endDate: true,
      rejectionReason: true,
      reviewedAt: true,
      createdBy: { select: { id: true, name: true, contactValue: true } },
      reviewedBy: { select: { id: true, name: true } },
      instance: { select: { id: true, name: true } },
    },
  })

  return campaigns as typeof campaigns
}

export type ReviewQueueCampaign = Awaited<ReturnType<typeof listCampaignsForReview>>[number]

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

type ActionResult =
  | { success: true; message: string }
  | { error: string }

// ---------------------------------------------------------------------------
// submitForReview  —  Steward+ submits a DRAFT campaign for admin review
// ---------------------------------------------------------------------------

export async function submitForReview(
  campaignId: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  return executeTransition(campaignId, 'PENDING_REVIEW', playerId, {
    submittedAt: new Date(),
    // Clear any previous rejection metadata on re-submission
    rejectionReason: null,
    reviewedById: null,
    reviewedAt: null,
  })
}

// ---------------------------------------------------------------------------
// approveCampaign  —  Admin approves a PENDING_REVIEW campaign
// ---------------------------------------------------------------------------

export async function approveCampaign(
  campaignId: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  return executeTransition(campaignId, 'APPROVED', playerId, {
    reviewedById: playerId,
    reviewedAt: new Date(),
    rejectionReason: null,
  })
}

// ---------------------------------------------------------------------------
// rejectCampaign  —  Admin rejects a PENDING_REVIEW campaign with a reason
// ---------------------------------------------------------------------------

export async function rejectCampaign(
  campaignId: string,
  reason: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  if (!reason?.trim()) {
    return { error: 'A rejection reason is required' }
  }

  return executeTransition(campaignId, 'REJECTED', playerId, {
    reviewedById: playerId,
    reviewedAt: new Date(),
    rejectionReason: reason.trim(),
  })
}

// ---------------------------------------------------------------------------
// goLiveCampaign  —  Admin launches an APPROVED campaign (APPROVED → LIVE)
// ---------------------------------------------------------------------------

export async function goLiveCampaign(
  campaignId: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  return executeTransition(campaignId, 'LIVE', playerId)
}

// ---------------------------------------------------------------------------
// archiveCampaign  —  Steward+ archives a LIVE campaign (LIVE → ARCHIVED)
// ---------------------------------------------------------------------------

export async function archiveCampaign(
  campaignId: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  return executeTransition(campaignId, 'ARCHIVED', playerId)
}
