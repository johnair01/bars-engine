'use server'

import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { validatePrimaryDomain, validateSecondaryDomain } from '@/lib/event-campaign/domains'

export type CreateEventInput = {
  linkedCampaignId: string
  title: string
  description: string
  eventType: string
  secondaryDomain?: string
  targetArchetypes?: string[]
  targetMoves?: string[]
  developmentalLens?: string
  locationType: string
  locationDetails?: string
  startTime?: Date
  endTime?: Date
  timezone?: string
  visibility?: string
}

/**
 * Create event artifact. Inherits topic, campaignContext, primaryDomain from campaign.
 */
export async function createEvent(
  data: CreateEventInput
): Promise<{ success: true; eventId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const campaign = await db.eventCampaign.findUnique({
    where: { id: data.linkedCampaignId },
  })
  if (!campaign) return { error: 'Campaign not found' }

  if (data.secondaryDomain && !validateSecondaryDomain(data.secondaryDomain)) {
    return { error: `Invalid secondary domain: ${data.secondaryDomain}` }
  }

  try {
    const event = await db.eventArtifact.create({
      data: {
        linkedCampaignId: campaign.id,
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        topic: campaign.topic,
        campaignContext: campaign.campaignContext,
        primaryDomain: campaign.primaryDomain,
        secondaryDomain: data.secondaryDomain ?? null,
        targetArchetypes: JSON.stringify(data.targetArchetypes ?? []),
        targetMoves: JSON.stringify(data.targetMoves ?? []),
        developmentalLens: data.developmentalLens ?? null,
        locationType: data.locationType,
        locationDetails: data.locationDetails ?? null,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        timezone: data.timezone ?? null,
        visibility: data.visibility ?? 'campaign_visible',
        createdByActorId: player.id,
      },
    })

    const linkedIds = JSON.parse(campaign.linkedEventIds) as string[]
    linkedIds.push(event.id)
    await db.eventCampaign.update({
      where: { id: campaign.id },
      data: { linkedEventIds: JSON.stringify(linkedIds), updatedAt: new Date() },
    })

    revalidatePath('/')
    return { success: true, eventId: event.id }
  } catch (e: unknown) {
    console.error('[event-artifact] createEvent failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to create event',
    }
  }
}

/**
 * Get event by id.
 */
export async function getEvent(
  id: string
): Promise<{ success: true; event: Awaited<ReturnType<typeof db.eventArtifact.findUnique>> } | { error: string }> {
  try {
    const event = await db.eventArtifact.findUnique({
      where: { id },
      include: {
        campaign: true,
        creator: { select: { id: true, name: true } },
        participants: { include: { participant: { select: { id: true, name: true } } } },
        invites: { include: { actor: { select: { id: true, name: true } } } },
      },
    })
    if (!event) return { error: 'Event not found' }
    return { success: true, event }
  } catch (e: unknown) {
    console.error('[event-artifact] getEvent failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to fetch event',
    }
  }
}

export type ListEventsFilters = {
  campaignId?: string
  status?: string
  startAfter?: Date
  endBefore?: Date
  primaryDomain?: string
}

/**
 * List events with optional filters.
 */
export async function listEvents(
  filters?: ListEventsFilters
): Promise<{ success: true; events: Awaited<ReturnType<typeof db.eventArtifact.findMany>> } | { error: string }> {
  try {
    const where: Prisma.EventArtifactWhereInput = {}
    if (filters?.campaignId) where.linkedCampaignId = filters.campaignId
    if (filters?.status) where.status = filters.status
    if (filters?.primaryDomain) where.primaryDomain = filters.primaryDomain
    if (filters?.startAfter) where.startTime = { gte: filters.startAfter }
    if (filters?.endBefore) where.endTime = { lte: filters.endBefore }

    const events = await db.eventArtifact.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: { creator: { select: { id: true, name: true } } },
    })
    return { success: true, events }
  } catch (e: unknown) {
    console.error('[event-artifact] listEvents failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to list events',
    }
  }
}

/**
 * Invite actor(s) to event.
 */
export async function inviteToEvent(
  eventId: string,
  actorIds: string[],
  source?: string
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const event = await db.eventArtifact.findUnique({ where: { id: eventId } })
  if (!event) return { error: 'Event not found' }
  if (event.createdByActorId !== player.id) return { error: 'Only event creator can invite' }

  try {
    for (const actorId of actorIds) {
      await db.eventInvite.upsert({
        where: {
          eventId_actorId: { eventId, actorId },
        },
        create: {
          eventId,
          actorId,
          invitedByActorId: player.id,
          inviteSource: source ?? 'direct_actor',
        },
        update: {},
      })
    }
    revalidatePath('/')
    return { success: true }
  } catch (e: unknown) {
    console.error('[event-artifact] inviteToEvent failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to invite',
    }
  }
}

/**
 * Join event (RSVP).
 */
export async function joinEvent(
  eventId: string,
  state: 'RSVP_yes' | 'declined'
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const event = await db.eventArtifact.findUnique({ where: { id: eventId } })
  if (!event) return { error: 'Event not found' }

  try {
    await db.eventParticipant.upsert({
      where: {
        eventId_participantId: { eventId, participantId: player.id },
      },
      create: {
        eventId,
        participantId: player.id,
        participantState: state,
      },
      update: { participantState: state, updatedAt: new Date() },
    })

    await db.eventInvite.updateMany({
      where: { eventId, actorId: player.id },
      data: { inviteStatus: state === 'RSVP_yes' ? 'accepted' : 'declined' },
    })

    revalidatePath('/')
    return { success: true }
  } catch (e: unknown) {
    console.error('[event-artifact] joinEvent failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to join event',
    }
  }
}

/**
 * Attach recording URL to event.
 */
export async function attachRecording(
  eventId: string,
  url: string
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const event = await db.eventArtifact.findUnique({ where: { id: eventId } })
  if (!event) return { error: 'Event not found' }
  if (event.createdByActorId !== player.id) return { error: 'Only event creator can attach recording' }

  try {
    await db.eventArtifact.update({
      where: { id: eventId },
      data: {
        recordingUrl: url,
        status: event.status === 'completed' ? 'recorded' : event.status,
        updatedAt: new Date(),
      },
    })
    revalidatePath('/')
    return { success: true }
  } catch (e: unknown) {
    console.error('[event-artifact] attachRecording failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to attach recording',
    }
  }
}

/**
 * Get .ics calendar export for event.
 */
export async function getEventCalendarExport(
  eventId: string
): Promise<{ success: true; ics: string } | { error: string }> {
  const result = await getEvent(eventId)
  if ('error' in result) return result
  const event = result.event
  if (!event) return { error: 'Event not found' }

  const { createIcsForEvent } = await import('@/lib/event-campaign/calendar')
  const ics = createIcsForEvent({
    id: event.id,
    title: event.title,
    description: event.description,
    locationDetails: event.locationDetails,
    startTime: event.startTime,
    endTime: event.endTime,
    timezone: event.timezone,
  })
  return { success: true, ics }
}

/**
 * Mark event complete.
 */
export async function completeEvent(eventId: string): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const event = await db.eventArtifact.findUnique({ where: { id: eventId } })
  if (!event) return { error: 'Event not found' }
  if (event.createdByActorId !== player.id) return { error: 'Only event creator can complete event' }

  try {
    await db.eventArtifact.update({
      where: { id: eventId },
      data: { status: 'completed', updatedAt: new Date() },
    })
    revalidatePath('/')
    return { success: true }
  } catch (e: unknown) {
    console.error('[event-artifact] completeEvent failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to complete event',
    }
  }
}
