'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
  isBarEligibleSpokeAnchor,
  isSpokeMoveBedMoveType,
  passesSpokeKernelQualityGate,
  SPOKE_MOVE_BED_MOVE_TYPES,
  type SpokeMoveBedMoveType,
} from '@/lib/spoke-move-beds'

const WATERING_FACES = ['shaman', 'regent', 'challenger', 'architect', 'diplomat', 'sage'] as const

export type BedKernelSnapshot = {
  id: string
  title: string
  createdAt: string
  creatorId: string
  wateringComplete: number
  wateringTotal: number
}

export type BedSnapshot = {
  moveType: SpokeMoveBedMoveType
  anchorBarId: string | null
  anchorTitle: string | null
  anchoredAt: string | null
  kernels: BedKernelSnapshot[]
}

async function playerMayAdminSpokeBed(playerId: string, campaignRef: string): Promise<boolean> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { roles: { include: { role: true } } },
  })
  if (!player) return false
  if (player.roles.some((r) => r.role.key === 'admin')) return true
  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { id: true },
  })
  if (!instance) return false
  const m = await db.instanceMembership.findFirst({
    where: {
      instanceId: instance.id,
      playerId,
      roleKey: { in: ['owner', 'steward'] },
    },
  })
  return !!m
}

function wateringSummary(bar: { wateringProgress: string | null }): { complete: number; total: number } {
  let progress: Record<string, boolean> = {}
  try {
    progress = JSON.parse(bar.wateringProgress || '{}')
  } catch {
    progress = {}
  }
  const complete = WATERING_FACES.filter((f) => progress[f]).length
  return { complete, total: WATERING_FACES.length }
}

function playerCanUseBar(bar: { creatorId: string; claimedById: string | null }, playerId: string): boolean {
  return bar.creatorId === playerId || bar.claimedById === playerId
}

/**
 * Four beds for a spoke with anchor + planted campaign_kernel rows.
 */
export async function getSpokeMoveBeds(input: {
  campaignRef: string
  spokeIndex: number
}): Promise<{ beds: BedSnapshot[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const campaignRef = input.campaignRef?.trim()
  if (!campaignRef) return { error: 'campaignRef required' }
  const spokeIndex = input.spokeIndex
  if (!Number.isFinite(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) {
    return { error: 'spokeIndex must be 0–7' }
  }

  const rows = await db.spokeMoveBed.findMany({
    where: { campaignRef, spokeIndex },
    include: {
      anchorBar: { select: { id: true, title: true } },
      additionalKernels: {
        include: {
          kernelBar: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              creatorId: true,
              wateringProgress: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const byMove = new Map(rows.map((r) => [r.moveType as SpokeMoveBedMoveType, r]))

  const beds: BedSnapshot[] = SPOKE_MOVE_BED_MOVE_TYPES.map((moveType) => {
    const row = byMove.get(moveType)
    const kernels: BedKernelSnapshot[] =
      row?.additionalKernels.map((k) => {
        const w = wateringSummary(k.kernelBar)
        return {
          id: k.kernelBar.id,
          title: k.kernelBar.title,
          createdAt: k.kernelBar.createdAt.toISOString(),
          creatorId: k.kernelBar.creatorId,
          wateringComplete: w.complete,
          wateringTotal: w.total,
        }
      }) ?? []

    return {
      moveType,
      anchorBarId: row?.anchorBarId ?? null,
      anchorTitle: row?.anchorBar?.title ?? null,
      anchoredAt: row?.anchoredAt?.toISOString() ?? null,
      kernels,
    }
  })

  return { beds }
}

export type PlantKernelFromBarResult =
  | { success: true; kind: 'anchor'; bedId: string }
  | { success: true; kind: 'additional'; bedId: string; kernelId: string }
  | { error: string }

/**
 * First mover: bind spoke-emitted vibe BAR as anchor. Others: plant `campaign_kernel` from any owned BAR.
 */
export async function plantKernelFromBar(input: {
  campaignRef: string
  spokeIndex: number
  moveType: string
  barId: string
  intent: 'anchor_spoke_bar' | 'additional'
}): Promise<PlantKernelFromBarResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const campaignRef = input.campaignRef?.trim()
  if (!campaignRef) return { error: 'campaignRef required' }
  const spokeIndex = input.spokeIndex
  if (!Number.isFinite(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) {
    return { error: 'spokeIndex must be 0–7' }
  }
  if (!isSpokeMoveBedMoveType(input.moveType)) return { error: 'Invalid moveType' }

  const moveType = input.moveType
  const bar = await db.customBar.findUnique({
    where: { id: input.barId },
  })
  if (!bar) return { error: 'BAR not found' }
  if (!playerCanUseBar(bar, player.id)) return { error: 'You cannot use this BAR' }
  if (bar.mergedIntoId || bar.archivedAt) return { error: 'BAR is not available' }

  if (!passesSpokeKernelQualityGate(bar.title, bar.description)) {
    return {
      error: `Seed text is too short (title ≥3 chars, description ≥10).`,
    }
  }

  if (input.intent === 'anchor_spoke_bar') {
    if (!isBarEligibleSpokeAnchor(bar, campaignRef, spokeIndex, moveType)) {
      return { error: 'This BAR is not the spoke-emitted BAR for this bed' }
    }

    let bed = await db.spokeMoveBed.findUnique({
      where: {
        campaignRef_spokeIndex_moveType: { campaignRef, spokeIndex, moveType },
      },
    })

    if (!bed) {
      bed = await db.spokeMoveBed.create({
        data: {
          campaignRef,
          spokeIndex,
          moveType,
          anchorBarId: bar.id,
          anchoredByPlayerId: player.id,
          anchoredAt: new Date(),
        },
      })
      revalidatePath(`/campaign/${campaignRef}/spoke/${spokeIndex}/seeds`)
      revalidatePath('/campaign/landing')
      return { success: true, kind: 'anchor', bedId: bed.id }
    }

    if (bed.anchorBarId && bed.anchorBarId !== bar.id) {
      return { error: 'This bed already has an anchor' }
    }
    if (bed.anchorBarId === bar.id) {
      revalidatePath(`/campaign/${campaignRef}/spoke/${spokeIndex}/seeds`)
      return { success: true, kind: 'anchor', bedId: bed.id }
    }

    const upd = await db.spokeMoveBed.updateMany({
      where: { id: bed.id, anchorBarId: null },
      data: {
        anchorBarId: bar.id,
        anchoredByPlayerId: player.id,
        anchoredAt: new Date(),
      },
    })
    if (upd.count === 0) {
      const fresh = await db.spokeMoveBed.findUnique({ where: { id: bed.id } })
      if (fresh?.anchorBarId === bar.id) {
        return { success: true, kind: 'anchor', bedId: fresh.id }
      }
      return { error: 'This bed already has an anchor' }
    }

    revalidatePath(`/campaign/${campaignRef}/spoke/${spokeIndex}/seeds`)
    revalidatePath('/campaign/landing')
    return { success: true, kind: 'anchor', bedId: bed.id }
  }

  // additional — create campaign_kernel from source BAR
  let allyshipDomain: string | null = null
  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { allyshipDomain: true, primaryCampaignDomain: true },
  })
  allyshipDomain = instance?.allyshipDomain ?? instance?.primaryCampaignDomain ?? null

  if (bar.type === 'campaign_kernel') {
    return { error: 'Pick a BAR that is not already a campaign seed' }
  }

  const result = await db.$transaction(async (tx) => {
    const bed = await tx.spokeMoveBed.upsert({
      where: {
        campaignRef_spokeIndex_moveType: { campaignRef, spokeIndex, moveType },
      },
      create: {
        campaignRef,
        spokeIndex,
        moveType,
      },
      update: {},
    })

    const kernel = await tx.customBar.create({
      data: {
        creatorId: player.id,
        title: bar.title.trim(),
        description: bar.description.trim(),
        type: 'campaign_kernel',
        reward: 0,
        visibility: 'private',
        status: 'active',
        isSystem: false,
        inputs: '[]',
        rootId: 'temp',
        campaignRef,
        allyshipDomain: allyshipDomain ?? undefined,
        sourceBarId: bar.id,
        wateringProgress: JSON.stringify(Object.fromEntries(WATERING_FACES.map((f) => [f, false]))),
        agentMetadata: JSON.stringify({
          spokeMoveBedProvenance: { bedId: bed.id, campaignRef, spokeIndex, moveType, sourceBarId: bar.id },
        }),
      },
    })

    await tx.customBar.update({
      where: { id: kernel.id },
      data: { rootId: kernel.id },
    })

    const link = await tx.spokeMoveBedKernel.create({
      data: {
        bedId: bed.id,
        kernelBarId: kernel.id,
        plantedById: player.id,
        sourceBarId: bar.id,
      },
    })

    return { bedId: bed.id, kernelId: kernel.id, linkId: link.id }
  })

  revalidatePath(`/campaign/${campaignRef}/spoke/${spokeIndex}/seeds`)
  revalidatePath('/hand')
  return { success: true, kind: 'additional', bedId: result.bedId, kernelId: result.kernelId }
}

export type PlayerBarPick = { id: string; title: string; type: string }

/** Bars the current player may use as input for an additional plant (not kernels). */
export async function listBarsForSpokePlant(): Promise<{ bars: PlayerBarPick[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const bars = await db.customBar.findMany({
    where: {
      OR: [{ creatorId: player.id }, { claimedById: player.id }],
      mergedIntoId: null,
      archivedAt: null,
      type: { not: 'campaign_kernel' },
    },
    select: { id: true, title: true, type: true },
    orderBy: { createdAt: 'desc' },
    take: 80,
  })

  return { bars }
}

export async function adminReassignBedAnchor(input: {
  campaignRef: string
  spokeIndex: number
  moveType: string
  newAnchorBarId: string | null
  reason: string
}): Promise<{ success: true } | { error: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return { error: 'Not authenticated' }

  const campaignRef = input.campaignRef?.trim()
  if (!campaignRef) return { error: 'campaignRef required' }
  if (!isSpokeMoveBedMoveType(input.moveType)) return { error: 'Invalid moveType' }
  const spokeIndex = input.spokeIndex
  if (!Number.isFinite(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) {
    return { error: 'spokeIndex must be 0–7' }
  }

  const ok = await playerMayAdminSpokeBed(playerId, campaignRef)
  if (!ok) return { error: 'Forbidden' }

  const reason = input.reason?.trim() || 'reassign'
  const moveType = input.moveType

  const bed = await db.spokeMoveBed.findUnique({
    where: {
      campaignRef_spokeIndex_moveType: { campaignRef, spokeIndex, moveType },
    },
  })

  if (!bed) {
    if (input.newAnchorBarId === null) return { success: true }
    return { error: 'Bed does not exist yet' }
  }

  if (input.newAnchorBarId === null) {
    await db.spokeMoveBed.update({
      where: { id: bed.id },
      data: {
        anchorBarId: null,
        anchoredByPlayerId: null,
        anchoredAt: null,
        anchorReassignedById: playerId,
        anchorReassignedAt: new Date(),
        anchorReassignReason: reason,
      },
    })
    revalidatePath(`/campaign/${campaignRef}/spoke/${spokeIndex}/seeds`)
    return { success: true }
  }

  const newBar = await db.customBar.findUnique({ where: { id: input.newAnchorBarId } })
  if (!newBar) return { error: 'BAR not found' }

  const other = await db.spokeMoveBed.findFirst({
    where: { anchorBarId: input.newAnchorBarId, id: { not: bed.id } },
  })
  if (other) return { error: 'That BAR is already an anchor elsewhere' }

  // Admin may assign without strict spoke-portal metadata (governance override)
  await db.spokeMoveBed.update({
    where: { id: bed.id },
    data: {
      anchorBarId: newBar.id,
      anchoredByPlayerId: null,
      anchoredAt: new Date(),
      anchorReassignedById: playerId,
      anchorReassignedAt: new Date(),
      anchorReassignReason: reason,
    },
  })

  revalidatePath(`/campaign/${campaignRef}/spoke/${spokeIndex}/seeds`)
  return { success: true }
}

/** Whether the current player may call adminReassignBedAnchor for this campaign. */
export async function canAdminSpokeMoveBed(campaignRef: string): Promise<boolean> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return false
  return playerMayAdminSpokeBed(playerId, campaignRef.trim())
}
