'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import {
  INTERACTION_BAR_TYPES,
  BAR_RESPONSE_TYPES,
  type BarResponseType,
  type CreateInteractionBarPayload,
  type ListBarsFilters,
  type BarFeedFilters,
} from '@/lib/interaction-bars-types'


function userSafeError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2021' || error.code === 'P2022') {
      return 'Database schema is not updated yet. Run Prisma db push, then retry.'
    }
  }
  return error instanceof Error ? (error.message || 'Unknown error') : 'Unknown error'
}

// ---------------------------------------------------------------------------
// createInteractionBar
// ---------------------------------------------------------------------------

export async function createInteractionBar(
  payload: CreateInteractionBarPayload
): Promise<{ success: true; barId: string } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const { barType, title, description, visibility, payload: barPayload, parentId, campaignRef } = payload

    if (!INTERACTION_BAR_TYPES.includes(barType)) {
      return { error: `Invalid bar type: ${barType}` }
    }
    if (!title?.trim()) return { error: 'Title is required' }
    if (!description?.trim()) return { error: 'Description is required' }

    if (parentId) {
      const parent = await db.customBar.findUnique({
        where: { id: parentId },
        select: { id: true, type: true },
      })
      if (!parent) return { error: 'Parent BAR or quest not found' }
    }

    const inputs = JSON.stringify(barPayload)
    const effectiveVisibility = visibility === 'public' ? 'public' : 'private'
    const initialStatus = barType === 'appreciation' ? 'active' : 'open'

    const bar = await db.customBar.create({
      data: {
        creatorId: player.id,
        title: title.trim(),
        description: description.trim(),
        type: barType,
        reward: 0,
        visibility: effectiveVisibility,
        status: initialStatus,
        inputs,
        parentId: parentId || null,
        campaignRef: campaignRef?.trim() || null,
        rootId: 'temp',
      },
    })

    await db.customBar.update({
      where: { id: bar.id },
      data: { rootId: bar.id },
    })

    revalidatePath('/')
    revalidatePath('/bars')
    return { success: true, barId: bar.id }
  } catch (error) {
    console.error('[interaction-bars] createInteractionBar failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// listBars
// ---------------------------------------------------------------------------

export async function listBars(
  filters: ListBarsFilters
): Promise<{ success: true; bars: Array<Record<string, unknown>> } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const where: Prisma.CustomBarWhereInput = {}

    if (filters.campaignRef) {
      where.campaignRef = filters.campaignRef
    }
    if (filters.barType) {
      where.type = Array.isArray(filters.barType)
        ? { in: filters.barType }
        : filters.barType
    }
    if (filters.visibility) {
      where.visibility = filters.visibility
    }
    if (filters.creatorId) {
      where.creatorId = filters.creatorId
    }
    if (filters.parentId) {
      where.parentId = filters.parentId
    }
    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status
    }

    // Visibility: private only visible to creator
    where.OR = [
      { visibility: 'public' },
      { creatorId: player.id },
    ]

    const bars = await db.customBar.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
    })

    return {
      success: true,
      bars: bars.map((b) => ({
        id: b.id,
        type: b.type,
        title: b.title,
        description: b.description,
        visibility: b.visibility,
        status: b.status,
        parentId: b.parentId,
        campaignRef: b.campaignRef,
        inputs: b.inputs,
        createdAt: b.createdAt,
        creator: b.creator,
        responseCount: b._count.responses,
      })),
    }
  } catch (error) {
    console.error('[interaction-bars] listBars failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// getBar
// ---------------------------------------------------------------------------

export async function getBar(
  id: string
): Promise<
  | { success: true; bar: Record<string, unknown>; responses: Array<Record<string, unknown>> }
  | { error: string }
> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        responses: {
          include: { responder: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!bar) return { error: 'BAR not found' }

    if (bar.visibility === 'private' && bar.creatorId !== player.id) {
      return { error: 'Not authorized to view this BAR' }
    }

    return {
      success: true,
      bar: {
        id: bar.id,
        type: bar.type,
        title: bar.title,
        description: bar.description,
        visibility: bar.visibility,
        status: bar.status,
        parentId: bar.parentId,
        campaignRef: bar.campaignRef,
        inputs: bar.inputs,
        createdAt: bar.createdAt,
        creator: bar.creator,
      },
      responses: bar.responses.map((r) => ({
        id: r.id,
        responseType: r.responseType,
        message: r.message,
        createdAt: r.createdAt,
        responder: r.responder,
      })),
    }
  } catch (error) {
    console.error('[interaction-bars] getBar failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// respondToBar
// ---------------------------------------------------------------------------

export async function respondToBar(
  barId: string,
  response: { responseType: BarResponseType; message?: string }
): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    if (!BAR_RESPONSE_TYPES.includes(response.responseType)) {
      return { error: `Invalid response type: ${response.responseType}` }
    }

    const bar = await db.customBar.findUnique({
      where: { id: barId },
      select: { id: true, type: true, status: true, creatorId: true, visibility: true, inputs: true },
    })

    if (!bar) return { error: 'BAR not found' }
    if (bar.visibility === 'private' && bar.creatorId !== player.id) {
      return { error: 'Not authorized to respond to this BAR' }
    }
    if (!['open', 'active'].includes(bar.status)) {
      return { error: 'BAR is not accepting responses' }
    }

    const existing = await db.barResponse.findUnique({
      where: { barId_responderId: { barId, responderId: player.id } },
    })
    if (existing) return { error: 'You have already responded to this BAR' }

    await db.$transaction(async (tx) => {
      await tx.barResponse.create({
        data: {
          barId,
          responderId: player.id,
          responseType: response.responseType,
          message: response.message?.trim() || null,
        },
      })

      // Auto-transition: open → active on first response; check fulfilled for quest_invitation
      if (bar.status === 'open') {
        const joinResponses = ['join', 'offer_help', 'appreciate']
        if (joinResponses.includes(response.responseType)) {
          await tx.customBar.update({
            where: { id: barId },
            data: { status: 'active' },
          })
        }
      }

      // Check fulfilled for quest_invitation (requestedSlots reached)
      if (bar.type === 'quest_invitation' && bar.inputs) {
        try {
          const payload = JSON.parse(bar.inputs) as { requestedSlots?: number }
          const requestedSlots = payload.requestedSlots ?? 1
          const joinCount = await tx.barResponse.count({
            where: {
              barId,
              responseType: { in: ['join', 'offer_help'] },
            },
          })
          if (joinCount >= requestedSlots) {
            await tx.customBar.update({
              where: { id: barId },
              data: { status: 'fulfilled' },
            })
          }
        } catch {
          // ignore parse errors
        }
      }
    })

    revalidatePath('/')
    revalidatePath('/bars')
    return { success: true }
  } catch (error) {
    console.error('[interaction-bars] respondToBar failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// closeBar
// ---------------------------------------------------------------------------

export async function closeBar(barId: string): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
      where: { id: barId },
      select: { id: true, creatorId: true, type: true },
    })

    if (!bar) return { error: 'BAR not found' }
    if (bar.creatorId !== player.id) return { error: 'Only the creator can close this BAR' }

    await db.customBar.update({
      where: { id: barId },
      data: { status: 'closed' },
    })

    revalidatePath('/')
    revalidatePath('/bars')
    return { success: true }
  } catch (error) {
    console.error('[interaction-bars] closeBar failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// archiveBar
// ---------------------------------------------------------------------------

export async function archiveBar(barId: string): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
      where: { id: barId },
      select: { id: true, creatorId: true },
    })

    if (!bar) return { error: 'BAR not found' }
    if (bar.creatorId !== player.id) return { error: 'Only the creator can archive this BAR' }

    await db.customBar.update({
      where: { id: barId },
      data: { status: 'archived' },
    })

    revalidatePath('/')
    revalidatePath('/bars')
    return { success: true }
  } catch (error) {
    console.error('[interaction-bars] archiveBar failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// transitionBarState
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  open: ['active', 'closed'],
  active: ['fulfilled', 'closed'],
  fulfilled: ['closed', 'archived'],
  closed: ['archived'],
  archived: [],
}

export async function transitionBarState(
  barId: string,
  toStatus: string
): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
      where: { id: barId },
      select: { id: true, creatorId: true, status: true },
    })

    if (!bar) return { error: 'BAR not found' }
    if (bar.creatorId !== player.id) return { error: 'Only the creator can transition this BAR' }

    const allowed = ALLOWED_TRANSITIONS[bar.status] ?? []
    if (!allowed.includes(toStatus)) {
      return { error: `Cannot transition from "${bar.status}" to "${toStatus}"` }
    }

    await db.customBar.update({
      where: { id: barId },
      data: { status: toStatus },
    })

    revalidatePath('/')
    revalidatePath('/bars')
    return { success: true }
  } catch (error) {
    console.error('[interaction-bars] transitionBarState failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// getBarFeed
// ---------------------------------------------------------------------------

export async function getBarFeed(
  filters: BarFeedFilters = {}
): Promise<{ success: true; bars: Array<Record<string, unknown>> } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const where: Prisma.CustomBarWhereInput = {
      type: { in: [...INTERACTION_BAR_TYPES] },
      OR: [{ visibility: 'public' }, { creatorId: player.id }],
    }

    if (filters.campaignRef) {
      where.campaignRef = filters.campaignRef
    }
    if (filters.barTypes?.length) {
      where.type = { in: filters.barTypes }
    }
    if (filters.statuses?.length) {
      where.status = { in: filters.statuses }
    } else {
      // Default: actionable (open, active)
      where.status = { in: ['open', 'active'] }
    }

    const limit = Math.min(filters.limit ?? 20, 50)
    const offset = filters.offset ?? 0

    const bars = await db.customBar.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
    })

    return {
      success: true,
      bars: bars.map((b) => ({
        id: b.id,
        type: b.type,
        title: b.title,
        description: b.description,
        status: b.status,
        campaignRef: b.campaignRef,
        parentId: b.parentId,
        inputs: b.inputs,
        createdAt: b.createdAt,
        creator: b.creator,
        responseCount: b._count.responses,
      })),
    }
  } catch (error) {
    console.error('[interaction-bars] getBarFeed failed:', error)
    return { error: userSafeError(error) }
  }
}
