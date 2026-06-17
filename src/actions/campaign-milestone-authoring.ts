'use server'

/**
 * TSG Phase 3 — milestone authoring (the second missing throughput link, T6).
 *
 * Lets a steward (or a proposing player) author a *well-crafted* milestone:
 * a real "why it matters" narrative + a target + a celebration shown on reach —
 * not just a number. Propose → craft → approve.
 *
 * Schema-reuse (per journey-map.md T0.2 — NO new fields for v1):
 *  - The milestone itself = `CampaignMilestone` (title / description / targetValue /
 *    status proposed→active / proposedByPlayerId / approvedByPlayerId+approvedAt).
 *  - The celebration-on-reach = `CampaignMilestoneMarker` (triggerCount + narrativeText).
 *    That marker is ALREADY rendered by ContributionProgressBar when a player's
 *    contribution count reaches triggerCount — so authoring the marker IS wiring
 *    the celebration; no new event plumbing needed.
 *
 * v1 coupling note: `targetValue` doubles as the marker's `triggerCount` (rounded)
 * when a celebration is authored — i.e. the celebration narrative fires once that
 * many contributions land. A value-vs-count split (dollars vs. contribution count)
 * is deferred; see the optional `CampaignMilestone.celebration` field in T0.2.
 *
 * Authorization:
 *  - proposeMilestone: any logged-in player may propose (it lands as 'proposed').
 *  - updateMilestoneCraft: the proposer OR a steward+ may edit.
 *  - approveMilestone: steward+ only (activates the milestone + its celebration).
 */

import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { assertCanEditInstanceDonation } from '@/actions/donation-cta'

// ============================================================
// Types
// ============================================================

export type MilestoneStatus = 'proposed' | 'active' | 'complete' | 'retired'

/** A milestone in the authoring list, with its celebration narrative (if any). */
export type AuthoredMilestone = {
  id: string
  campaignRef: string
  title: string
  description: string | null
  targetValue: number | null
  currentValue: number
  status: MilestoneStatus
  proposedByPlayerId: string
  approvedByPlayerId: string | null
  /** Celebration narrative shown on reach (from the paired CampaignMilestoneMarker). */
  celebration: string | null
  /** Whether the current player can edit/approve this milestone. */
  canManage: boolean
}

type AuthorResult = { milestoneId: string } | { error: string } | { needsLogin: true }
type MutateResult = { success: true } | { error: string } | { needsLogin: true }

const MAX_TITLE = 120
const MAX_TEXT = 2000

// ============================================================
// Helpers
// ============================================================

/** Resolve the Instance backing a campaignRef (by campaignRef or slug). */
async function resolveInstanceId(campaignRef: string): Promise<string | null> {
  const inst = await db.instance.findFirst({
    where: { OR: [{ campaignRef: campaignRef.trim() }, { slug: campaignRef.trim() }] },
    select: { id: true },
  })
  return inst?.id ?? null
}

/** Steward+ (owner/steward of the backing instance, or global admin) for a campaignRef. */
async function canStewardCampaign(playerId: string, campaignRef: string): Promise<boolean> {
  const instanceId = await resolveInstanceId(campaignRef)
  if (!instanceId) return false
  return assertCanEditInstanceDonation(playerId, instanceId)
}

/**
 * The marker name we pair with an authored milestone's celebration. Deterministic
 * so re-crafting updates the same marker rather than spawning duplicates.
 */
function celebrationMarkerName(milestoneId: string): string {
  return `milestone:${milestoneId}`
}

/**
 * Upsert (or retire) the celebration marker for a milestone. When `celebration`
 * is non-empty and a numeric target exists, the marker fires its narrative once
 * `triggerCount` contributions land. When cleared, the marker is retired.
 */
async function syncCelebrationMarker(
  tx: Prisma.TransactionClient,
  milestone: { id: string; campaignRef: string; title: string; targetValue: number | null },
  celebration: string | null,
): Promise<void> {
  const name = celebrationMarkerName(milestone.id)
  const existing = await tx.campaignMilestoneMarker.findFirst({
    where: { campaignRef: milestone.campaignRef, name },
    select: { id: true },
  })

  const hasCelebration = !!celebration && celebration.trim().length > 0
  const triggerCount = Math.max(1, Math.round(milestone.targetValue ?? 1))

  if (!hasCelebration) {
    if (existing) {
      await tx.campaignMilestoneMarker.update({
        where: { id: existing.id },
        data: { status: 'retired' },
      })
    }
    return
  }

  if (existing) {
    await tx.campaignMilestoneMarker.update({
      where: { id: existing.id },
      data: { triggerCount, narrativeText: celebration.trim(), status: 'active' },
    })
  } else {
    await tx.campaignMilestoneMarker.create({
      data: {
        campaignRef: milestone.campaignRef,
        name,
        triggerCount,
        narrativeText: celebration.trim(),
        status: 'active',
      },
    })
  }
}

// ============================================================
// listCampaignMilestones (read — for the craft UI)
// ============================================================

/**
 * All milestones for a campaign, newest target first, each annotated with its
 * celebration narrative and whether the current player can manage it.
 * Fail-soft: returns [] on error.
 */
export async function listCampaignMilestones(campaignRef: string): Promise<AuthoredMilestone[]> {
  const player = await getCurrentPlayer()
  if (!player) return []

  try {
    const ref = campaignRef.trim()
    const [milestones, markers, isSteward] = await Promise.all([
      db.campaignMilestone.findMany({
        where: { campaignRef: ref },
        orderBy: { createdAt: 'desc' },
      }),
      db.campaignMilestoneMarker.findMany({
        where: { campaignRef: ref, status: 'active' },
        select: { name: true, narrativeText: true },
      }),
      canStewardCampaign(player.id, ref),
    ])

    const celebrationByMilestone = new Map(
      markers.map((m) => [m.name, m.narrativeText]),
    )

    return milestones.map((m) => ({
      id: m.id,
      campaignRef: m.campaignRef,
      title: m.title,
      description: m.description,
      targetValue: m.targetValue,
      currentValue: m.currentValue,
      status: m.status as MilestoneStatus,
      proposedByPlayerId: m.proposedByPlayerId,
      approvedByPlayerId: m.approvedByPlayerId,
      celebration: celebrationByMilestone.get(celebrationMarkerName(m.id)) ?? null,
      canManage: isSteward || m.proposedByPlayerId === player.id,
    }))
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[listCampaignMilestones]', e)
    }
    return []
  }
}

// ============================================================
// proposeMilestone
// ============================================================

export async function proposeMilestone(input: {
  campaignRef: string
  title: string
  description: string
  targetValue: number
  /** Copy/ritual shown when the milestone is reached. */
  celebration?: string
}): Promise<AuthorResult> {
  const player = await getCurrentPlayer()
  if (!player) return { needsLogin: true }

  const campaignRef = input.campaignRef?.trim()
  const title = input.title?.trim()
  if (!campaignRef || !title) return { error: 'A title and campaign are required.' }
  if (title.length > MAX_TITLE) return { error: 'Title is too long.' }

  const targetValue = Number(input.targetValue)
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    return { error: 'Set a positive target.' }
  }

  // Validate the campaign exists (any logged-in player may propose).
  const instanceId = await resolveInstanceId(campaignRef)
  if (!instanceId) return { error: 'That campaign could not be found.' }

  const description = (input.description ?? '').trim().slice(0, MAX_TEXT)
  const celebration = (input.celebration ?? '').trim().slice(0, MAX_TEXT) || null

  try {
    const milestoneId = await db.$transaction(async (tx) => {
      const created = await tx.campaignMilestone.create({
        data: {
          campaignRef,
          title,
          description: description || null,
          targetValue,
          status: 'proposed',
          proposedByPlayerId: player.id,
        },
        select: { id: true, campaignRef: true, title: true, targetValue: true },
      })
      await syncCelebrationMarker(tx, created, celebration)
      return created.id
    })
    revalidatePath(`/campaign/${campaignRef}/milestones`)
    return { milestoneId }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[proposeMilestone]', e)
    }
    return { error: 'Could not propose this milestone right now. Try again.' }
  }
}

// ============================================================
// updateMilestoneCraft
// ============================================================

export async function updateMilestoneCraft(input: {
  milestoneId: string
  title?: string
  description?: string
  targetValue?: number
  celebration?: string
}): Promise<MutateResult> {
  const player = await getCurrentPlayer()
  if (!player) return { needsLogin: true }

  const milestoneId = input.milestoneId?.trim()
  if (!milestoneId) return { error: 'Missing milestone.' }

  const milestone = await db.campaignMilestone.findUnique({
    where: { id: milestoneId },
    select: {
      id: true,
      campaignRef: true,
      title: true,
      targetValue: true,
      proposedByPlayerId: true,
    },
  })
  if (!milestone) return { error: 'That milestone no longer exists.' }

  // Proposer or steward+ may edit the craft.
  const allowed =
    milestone.proposedByPlayerId === player.id ||
    (await canStewardCampaign(player.id, milestone.campaignRef))
  if (!allowed) return { error: 'You do not have permission to edit this milestone.' }

  // Build the patch only from provided fields.
  const data: { title?: string; description?: string | null; targetValue?: number } = {}
  if (input.title !== undefined) {
    const t = input.title.trim()
    if (!t) return { error: 'Title cannot be empty.' }
    if (t.length > MAX_TITLE) return { error: 'Title is too long.' }
    data.title = t
  }
  if (input.description !== undefined) {
    data.description = input.description.trim().slice(0, MAX_TEXT) || null
  }
  if (input.targetValue !== undefined) {
    const tv = Number(input.targetValue)
    if (!Number.isFinite(tv) || tv <= 0) return { error: 'Set a positive target.' }
    data.targetValue = tv
  }

  const nextTitle = data.title ?? milestone.title
  const nextTarget = data.targetValue ?? milestone.targetValue

  try {
    await db.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.campaignMilestone.update({ where: { id: milestoneId }, data })
      }
      if (input.celebration !== undefined) {
        const celebration = input.celebration.trim().slice(0, MAX_TEXT) || null
        await syncCelebrationMarker(
          tx,
          { id: milestoneId, campaignRef: milestone.campaignRef, title: nextTitle, targetValue: nextTarget },
          celebration,
        )
      }
    })
    revalidatePath(`/campaign/${milestone.campaignRef}/milestones`)
    return { success: true }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[updateMilestoneCraft]', e)
    }
    return { error: 'Could not update this milestone right now. Try again.' }
  }
}

// ============================================================
// approveMilestone (steward+)
// ============================================================

export async function approveMilestone(input: {
  milestoneId: string
}): Promise<MutateResult> {
  const player = await getCurrentPlayer()
  if (!player) return { needsLogin: true }

  const milestoneId = input.milestoneId?.trim()
  if (!milestoneId) return { error: 'Missing milestone.' }

  const milestone = await db.campaignMilestone.findUnique({
    where: { id: milestoneId },
    select: { id: true, campaignRef: true, status: true },
  })
  if (!milestone) return { error: 'That milestone no longer exists.' }

  if (!(await canStewardCampaign(player.id, milestone.campaignRef))) {
    return { error: 'Only a steward can approve a milestone.' }
  }
  if (milestone.status === 'active' || milestone.status === 'complete') {
    return { success: true } // idempotent — already live
  }

  try {
    await db.campaignMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'active',
        approvedByPlayerId: player.id,
        approvedAt: new Date(),
      },
    })
    revalidatePath(`/campaign/${milestone.campaignRef}/milestones`)
    revalidatePath(`/campaign/${milestone.campaignRef}`)
    return { success: true }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[approveMilestone]', e)
    }
    return { error: 'Could not approve this milestone right now. Try again.' }
  }
}
