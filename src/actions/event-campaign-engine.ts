'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { canCreateCampaignOnInstance, canCreateEventOnCampaign } from '@/actions/campaign-invitation'
import { intentToRaciRole } from '@/lib/bar-raci'
import {
  deriveKotterContext,
  deriveEpiphanyBridgeContext,
  buildIcsContent,
  type EventKotterContext,
  type EpiphanyBridgeContext,
} from '@/lib/event-kotter'
import {
  EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN,
  EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION,
  isEventCampaignType,
} from '@/lib/event-campaign-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

// ---------------------------------------------------------------------------
// createEventCampaign
// ---------------------------------------------------------------------------

export interface CreateEventCampaignInput {
  campaignContext: string
  topic: string
  primaryDomain: string
  productionGrammar: 'kotter' | 'epiphany_bridge'
  /**
   * `event_production` — dated gatherings (EventArtifact) attach here.
   * `awareness_content_run` — raise-awareness / social prompt sprint; **no** EventArtifact rows (use QuestThread + CHS).
   */
  campaignType?: string
  targetArchetypes?: string[]
  targetMoves?: string[]
  developmentalLens?: string
  /** Required — campaigns are created in the context of a residency. */
  instanceId: string
}

export async function createEventCampaign(
  input: CreateEventCampaignInput
): Promise<{ success: true; campaignId: string; threadId: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  if (!input.instanceId?.trim()) return { error: 'Instance is required' }
  if (!(await canCreateCampaignOnInstance(playerId, input.instanceId))) {
    return { error: 'You do not have permission to create a campaign for this instance' }
  }

  const rawType = input.campaignType?.trim() || EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION
  if (!isEventCampaignType(rawType)) {
    return { error: 'Invalid campaign type' }
  }

  const primaryDomain =
    rawType === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN ? 'RAISE_AWARENESS' : input.primaryDomain
  const productionGrammar =
    rawType === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN ? 'epiphany_bridge' : input.productionGrammar

  const campaign = await db.eventCampaign.create({
    data: {
      campaignContext: input.campaignContext,
      topic: input.topic,
      primaryDomain,
      productionGrammar,
      campaignType: rawType,
      hostActorIds: JSON.stringify([playerId]),
      targetArchetypes: JSON.stringify(input.targetArchetypes ?? []),
      targetMoves: JSON.stringify(input.targetMoves ?? []),
      developmentalLens: input.developmentalLens ?? null,
      instanceId: input.instanceId,
      status: 'proposed',
    },
    select: { id: true },
  })

  const threadTitlePrefix =
    rawType === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN ? 'Awareness run' : 'Production'

  // Create a linked production quest thread
  const thread = await db.questThread.create({
    data: {
      title: `${threadTitlePrefix}: ${input.campaignContext} — ${input.topic}`,
      creatorId: playerId,
      eventCampaignId: campaign.id,
      status: 'active',
    },
    select: { id: true },
  })

  revalidatePath('/event')
  revalidatePath('/admin/campaign-events')
  return { success: true, campaignId: campaign.id, threadId: thread.id }
}

// ---------------------------------------------------------------------------
// getEventCampaignsForInstance
// ---------------------------------------------------------------------------

export type EventCampaignListRow = {
  id: string
  topic: string
  campaignContext: string
  primaryDomain: string
  campaignType: string
  productionThreadId: string | null
}

export async function getEventCampaignsForInstance(instanceId: string): Promise<EventCampaignListRow[]> {
  const inst = await db.instance.findUnique({
    where: { id: instanceId },
    select: { campaignRef: true },
  })
  const cref = inst?.campaignRef ?? null
  const campaigns = await db.eventCampaign.findMany({
    where: cref
      ? { OR: [{ instanceId }, { instance: { campaignRef: cref } }] }
      : { instanceId },
    select: {
      id: true,
      topic: true,
      campaignContext: true,
      primaryDomain: true,
      campaignType: true,
      productionThread: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return campaigns.map((c) => ({
    id: c.id,
    topic: c.topic,
    campaignContext: c.campaignContext,
    primaryDomain: c.primaryDomain,
    campaignType: c.campaignType,
    productionThreadId: c.productionThread?.id ?? null,
  }))
}

// ---------------------------------------------------------------------------
// createEventArtifact
// ---------------------------------------------------------------------------

export interface CreateEventArtifactInput {
  /** Instance this event is being created for (must match campaign scope). */
  instanceId: string
  campaignId: string
  title: string
  description: string
  eventType: string
  topic: string
  campaignContext: string
  primaryDomain: string
  secondaryDomain?: string
  locationType: string
  locationDetails?: string
  startTime?: Date
  endTime?: Date
  timezone?: string
  capacity?: number
  visibility?: string
  targetArchetypes?: string[]
  targetMoves?: string[]
  parentEventArtifactId?: string
}

export async function createEventArtifact(
  input: CreateEventArtifactInput
): Promise<{ success: true; artifactId: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  if (!input.instanceId?.trim()) return { error: 'Instance is required' }

  const campaign = await db.eventCampaign.findUnique({
    where: { id: input.campaignId },
    select: { id: true, instanceId: true, campaignType: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  if (campaign.campaignType === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN) {
    return {
      error:
        'This campaign is an awareness / social content run — it does not use calendar gatherings. Use the production quest thread and campaign hub spokes instead.',
    }
  }

  if (campaign.instanceId && campaign.instanceId !== input.instanceId) {
    return { error: 'This campaign is not linked to this instance' }
  }

  const canCreate = await canCreateEventOnCampaign(playerId, input.campaignId, input.instanceId)
  if (!canCreate) return { error: 'You do not have permission to create events for this campaign' }

  if (input.parentEventArtifactId) {
    const parent = await db.eventArtifact.findUnique({
      where: { id: input.parentEventArtifactId },
      select: { linkedCampaignId: true, parentEventArtifactId: true },
    })
    if (!parent || parent.linkedCampaignId !== input.campaignId) {
      return { error: 'Parent event must belong to this campaign' }
    }
    if (parent.parentEventArtifactId) {
      return { error: 'Attach crew events to the main event, not to another crew row' }
    }
  }

  const artifactInstanceId = campaign.instanceId ?? input.instanceId
  const status = input.startTime ? 'scheduled' : 'draft'

  const artifact = await db.$transaction(async (tx) => {
    if (!campaign.instanceId) {
      await tx.eventCampaign.update({
        where: { id: input.campaignId },
        data: { instanceId: input.instanceId },
      })
    }

    return tx.eventArtifact.create({
      data: {
        linkedCampaignId: input.campaignId,
        instanceId: artifactInstanceId,
        title: input.title,
        description: input.description,
        eventType: input.eventType,
        topic: input.topic,
        campaignContext: input.campaignContext,
        primaryDomain: input.primaryDomain,
        secondaryDomain: input.secondaryDomain ?? null,
        targetArchetypes: JSON.stringify(input.targetArchetypes ?? []),
        targetMoves: JSON.stringify(input.targetMoves ?? []),
        locationType: input.locationType,
        locationDetails: input.locationDetails ?? null,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        timezone: input.timezone ?? null,
        capacity: input.capacity ?? null,
        visibility: input.visibility ?? 'campaign_visible',
        createdByActorId: playerId,
        parentEventArtifactId: input.parentEventArtifactId ?? null,
        status,
      },
      select: { id: true },
    })
  })

  revalidatePath('/event')
  return { success: true, artifactId: artifact.id }
}

// ---------------------------------------------------------------------------
// getEventCampaignWithArtifacts
// ---------------------------------------------------------------------------

export interface EventCampaignView {
  id: string
  campaignContext: string
  topic: string
  primaryDomain: string
  campaignType: string
  productionGrammar: string
  status: string
  hostActorIds: string[]
  targetArchetypes: string[]
  targetMoves: string[]
  developmentalLens: string | null
  instanceId: string | null
  createdAt: Date
  productionThreadId: string | null
  artifacts: Array<{
    id: string
    title: string
    eventType: string
    topic: string
    locationType: string
    startTime: Date | null
    endTime: Date | null
    status: string
    visibility: string
    participantCount: number
    parentEventArtifactId: string | null
  }>
}

export async function getEventCampaignWithArtifacts(
  campaignId: string
): Promise<EventCampaignView | { error: string }> {
  const campaign = await db.eventCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      campaignContext: true,
      topic: true,
      primaryDomain: true,
      campaignType: true,
      productionGrammar: true,
      status: true,
      hostActorIds: true,
      targetArchetypes: true,
      targetMoves: true,
      developmentalLens: true,
      instanceId: true,
      createdAt: true,
      productionThread: { select: { id: true } },
      events: {
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          title: true,
          eventType: true,
          topic: true,
          locationType: true,
          startTime: true,
          endTime: true,
          status: true,
          visibility: true,
          parentEventArtifactId: true,
          _count: { select: { participants: true } },
        },
      },
    },
  })

  if (!campaign) return { error: 'Campaign not found' }

  const parseJsonArray = (s: string) => {
    try { return JSON.parse(s) as string[] } catch { return [] }
  }

  return {
    id: campaign.id,
    campaignContext: campaign.campaignContext,
    topic: campaign.topic,
    primaryDomain: campaign.primaryDomain,
    campaignType: campaign.campaignType,
    productionGrammar: campaign.productionGrammar,
    status: campaign.status,
    hostActorIds: parseJsonArray(campaign.hostActorIds),
    targetArchetypes: parseJsonArray(campaign.targetArchetypes),
    targetMoves: parseJsonArray(campaign.targetMoves),
    developmentalLens: campaign.developmentalLens,
    instanceId: campaign.instanceId,
    createdAt: campaign.createdAt,
    productionThreadId: campaign.productionThread?.id ?? null,
    artifacts: campaign.events.map((e) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      topic: e.topic,
      locationType: e.locationType,
      startTime: e.startTime,
      endTime: e.endTime,
      status: e.status,
      visibility: e.visibility,
      participantCount: e._count.participants,
      parentEventArtifactId: e.parentEventArtifactId,
    })),
  }
}

// ---------------------------------------------------------------------------
// syncEventParticipantRolesFromBarResponses
// ---------------------------------------------------------------------------

/**
 * GA/GB integration: read BarResponse RACI for a quest → upsert EventParticipant.raciRole.
 * Call this after takeQuest() or respondToBar() to reflect intent in the event's participant list.
 */
export async function syncEventParticipantRolesFromBarResponses(
  eventId: string,
  questId: string
): Promise<{ success: true; synced: number } | { error: string }> {
  const event = await db.eventArtifact.findUnique({
    where: { id: eventId },
    select: { id: true },
  })
  if (!event) return { error: 'Event not found' }

  const responses = await db.barResponse.findMany({
    where: { barId: questId, depth: 0, intent: { not: null } },
    select: { responderId: true, intent: true, raciRole: true },
  })

  let synced = 0
  for (const r of responses) {
    const raciRole = r.raciRole ?? intentToRaciRole(r.intent)
    if (!raciRole) continue

    const existing = await db.eventParticipant.findUnique({
      where: { eventId_participantId: { eventId, participantId: r.responderId } },
      select: { id: true, participantState: true },
    })

    if (existing) {
      await db.eventParticipant.update({
        where: { id: existing.id },
        data: { raciRole },
      })
    } else {
      await db.eventParticipant.create({
        data: {
          eventId,
          participantId: r.responderId,
          participantState: 'interested',
          raciRole,
        },
      })
    }
    synced++
  }

  return { success: true, synced }
}

// ---------------------------------------------------------------------------
// getEventKotterContext
// ---------------------------------------------------------------------------

export async function getEventKotterContext(
  campaignId: string
): Promise<EventKotterContext | EpiphanyBridgeContext | { error: string }> {
  const campaign = await db.eventCampaign.findUnique({
    where: { id: campaignId },
    select: {
      productionGrammar: true,
      events: { select: { status: true } },
    },
  })

  if (!campaign) return { error: 'Campaign not found' }

  const total = campaign.events.length
  const completed = campaign.events.filter((e) => e.status === 'completed').length

  if (campaign.productionGrammar === 'epiphany_bridge') {
    return deriveEpiphanyBridgeContext(completed, total)
  }

  return deriveKotterContext(completed, total)
}

// ---------------------------------------------------------------------------
// exportEventArtifactToIcs
// ---------------------------------------------------------------------------

export async function exportEventArtifactToIcs(
  eventId: string
): Promise<{ icsContent: string; filename: string } | { error: string }> {
  const event = await db.eventArtifact.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      locationType: true,
      locationDetails: true,
      startTime: true,
      endTime: true,
      createdAt: true,
    },
  })

  if (!event) return { error: 'Event not found' }

  const locationStr = event.locationDetails
    ? `${event.locationType}: ${event.locationDetails}`
    : event.locationType

  const icsContent = buildIcsContent({
    uid: event.id,
    summary: event.title,
    description: event.description,
    location: locationStr,
    startTime: event.startTime,
    endTime: event.endTime,
    createdAt: event.createdAt,
  })

  const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  const filename = `${slug}-${event.id.slice(0, 8)}.ics`

  return { icsContent, filename }
}
