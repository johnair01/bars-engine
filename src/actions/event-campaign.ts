'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  assertPrimaryDomain,
  assertProductionGrammar,
  type EventCampaignDomain,
  type EventProductionGrammar,
} from '@/lib/event-campaign/domains'

export type CreateCampaignInput = {
  campaignContext: string
  topic: string
  primaryDomain: string
  productionGrammar: string
  campaignType?: string
  hostActorIds?: string[]
  targetArchetypes?: string[]
  targetMoves?: string[]
  developmentalLens?: string
  instanceId?: string
}

/**
 * Create an event campaign.
 */
export async function createCampaign(
  data: CreateCampaignInput
): Promise<{ success: true; campaignId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    assertPrimaryDomain(data.primaryDomain)
    assertProductionGrammar(data.productionGrammar)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Invalid domain or grammar' }
  }

  try {
    const campaign = await db.eventCampaign.create({
      data: {
        campaignContext: data.campaignContext,
        topic: data.topic,
        primaryDomain: data.primaryDomain as EventCampaignDomain,
        productionGrammar: data.productionGrammar as EventProductionGrammar,
        campaignType: data.campaignType ?? 'event_production',
        hostActorIds: JSON.stringify(data.hostActorIds ?? []),
        targetArchetypes: JSON.stringify(data.targetArchetypes ?? []),
        targetMoves: JSON.stringify(data.targetMoves ?? []),
        developmentalLens: data.developmentalLens ?? null,
        instanceId: data.instanceId ?? null,
      },
    })
    revalidatePath('/')
    return { success: true, campaignId: campaign.id }
  } catch (e: unknown) {
    console.error('[event-campaign] createCampaign failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to create campaign',
    }
  }
}

/**
 * Get campaign by id.
 */
export async function getCampaign(
  id: string
): Promise<{ success: true; campaign: Awaited<ReturnType<typeof db.eventCampaign.findUnique>> } | { error: string }> {
  try {
    const campaign = await db.eventCampaign.findUnique({
      where: { id },
      include: {
        events: true,
        productionThread: true,
        instance: true,
      },
    })
    if (!campaign) return { error: 'Campaign not found' }
    return { success: true, campaign }
  } catch (e: unknown) {
    console.error('[event-campaign] getCampaign failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to fetch campaign',
    }
  }
}

/**
 * Instantiate event production quest thread for campaign.
 */
export async function instantiateEventProductionThread(
  campaignId: string
): Promise<{ success: true; threadId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const campaign = await db.eventCampaign.findUnique({
    where: { id: campaignId },
    include: { productionThread: true },
  })
  if (!campaign) return { error: 'Campaign not found' }
  if (campaign.productionThread) return { error: 'Campaign already has a production thread' }

  try {
    const thread = await db.questThread.create({
      data: {
        title: `Event Production: ${campaign.campaignContext}`,
        description: `Production thread for ${campaign.topic}. Stages: Clarify purpose, Choose format, Choose date/time, Choose location, Invite collaborators, Publish BARs, Handle logistics, Confirm attendance, Host event, Capture outcomes, Archive.`,
        threadType: 'event_production',
        creatorType: 'player',
        creatorId: player.id,
        eventCampaignId: campaignId,
      },
    })
    revalidatePath('/')
    return { success: true, threadId: thread.id }
  } catch (e: unknown) {
    console.error('[event-campaign] instantiateEventProductionThread failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to create production thread',
    }
  }
}

/**
 * Advance campaign milestone or grammar stage.
 */
export async function advanceCampaignMilestone(
  campaignId: string,
  stage: string
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const campaign = await db.eventCampaign.findUnique({ where: { id: campaignId } })
  if (!campaign) return { error: 'Campaign not found' }

  const statusOrder = [
    'proposed',
    'planning',
    'assembling',
    'promotion',
    'ready',
    'event_live',
    'post_event',
    'archived',
  ]
  const idx = statusOrder.indexOf(campaign.status)
  const nextIdx = statusOrder.indexOf(stage)
  if (nextIdx < 0) return { error: `Invalid stage: ${stage}` }
  if (nextIdx <= idx) return { error: 'Stage must advance forward' }

  try {
    await db.eventCampaign.update({
      where: { id: campaignId },
      data: { status: stage, updatedAt: new Date() },
    })
    revalidatePath('/')
    return { success: true }
  } catch (e: unknown) {
    console.error('[event-campaign] advanceCampaignMilestone failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to advance campaign',
    }
  }
}

export type ReadinessConditions = {
  dateTimeChosen: boolean
  locationChosen: boolean
  hostAssigned: boolean
  minMilestonesCompleted: boolean
}

/**
 * Check if campaign is ready to emit an event.
 */
export async function checkCampaignReadiness(
  campaignId: string
): Promise<{ ready: boolean; conditions: ReadinessConditions }> {
  const campaign = await db.eventCampaign.findUnique({
    where: { id: campaignId },
    include: { events: true },
  })
  if (!campaign) {
    return {
      ready: false,
      conditions: {
        dateTimeChosen: false,
        locationChosen: false,
        hostAssigned: false,
        minMilestonesCompleted: false,
      },
    }
  }

  const hostIds = JSON.parse(campaign.hostActorIds) as string[]
  const hostAssigned = hostIds.length > 0

  const statusOrder = ['proposed', 'planning', 'assembling', 'promotion', 'ready', 'event_live', 'post_event', 'archived']
  const readyIdx = statusOrder.indexOf('ready')
  const currentIdx = statusOrder.indexOf(campaign.status)
  const minMilestonesCompleted = currentIdx >= readyIdx

  const conditions: ReadinessConditions = {
    dateTimeChosen: true,
    locationChosen: true,
    hostAssigned,
    minMilestonesCompleted,
  }

  const ready = conditions.hostAssigned && conditions.minMilestonesCompleted
  return { ready, conditions }
}

export type EmitEventInput = {
  title: string
  description: string
  eventType: string
  locationType: string
  locationDetails?: string
  startTime?: Date
  endTime?: Date
  timezone?: string
  secondaryDomain?: string
  targetArchetypes?: string[]
  targetMoves?: string[]
  developmentalLens?: string
  visibility?: string
}

/**
 * Emit event from campaign when ready.
 */
export async function emitEventFromCampaign(
  campaignId: string,
  eventData: EmitEventInput
): Promise<{ success: true; eventId: string } | { error: string }> {
  const { ready } = await checkCampaignReadiness(campaignId)
  if (!ready) return { error: 'Campaign not ready to emit event' }

  const { createEvent } = await import('@/actions/event-artifact')
  return createEvent({
    linkedCampaignId: campaignId,
    ...eventData,
  })
}

/**
 * List events produced by campaign.
 */
export async function listCampaignEvents(
  campaignId: string
): Promise<{ success: true; events: Awaited<ReturnType<typeof db.eventArtifact.findMany>> } | { error: string }> {
  try {
    const events = await db.eventArtifact.findMany({
      where: { linkedCampaignId: campaignId },
      orderBy: { startTime: 'asc' },
      include: { creator: { select: { id: true, name: true } } },
    })
    return { success: true, events }
  } catch (e: unknown) {
    console.error('[event-campaign] listCampaignEvents failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to list events',
    }
  }
}
