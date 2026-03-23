'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { intentToRaciRole } from '@/lib/bar-raci'
import {
  deriveKotterContext,
  deriveEpiphanyBridgeContext,
  buildIcsContent,
  type EventKotterContext,
  type EpiphanyBridgeContext,
} from '@/lib/event-kotter'

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
  targetArchetypes?: string[]
  targetMoves?: string[]
  developmentalLens?: string
  instanceId?: string
}

export async function createEventCampaign(
  input: CreateEventCampaignInput
): Promise<{ success: true; campaignId: string; threadId: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const campaign = await db.eventCampaign.create({
    data: {
      campaignContext: input.campaignContext,
      topic: input.topic,
      primaryDomain: input.primaryDomain,
      productionGrammar: input.productionGrammar,
      hostActorIds: JSON.stringify([playerId]),
      targetArchetypes: JSON.stringify(input.targetArchetypes ?? []),
      targetMoves: JSON.stringify(input.targetMoves ?? []),
      developmentalLens: input.developmentalLens ?? null,
      instanceId: input.instanceId ?? null,
      status: 'proposed',
    },
    select: { id: true },
  })

  // Create a linked production quest thread
  const thread = await db.questThread.create({
    data: {
      title: `Production: ${input.campaignContext} — ${input.topic}`,
      creatorId: playerId,
      eventCampaignId: campaign.id,
      status: 'active',
    },
    select: { id: true },
  })

  return { success: true, campaignId: campaign.id, threadId: thread.id }
}

// ---------------------------------------------------------------------------
// createEventArtifact
// ---------------------------------------------------------------------------

export interface CreateEventArtifactInput {
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

  const campaign = await db.eventCampaign.findUnique({
    where: { id: input.campaignId },
    select: { id: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  const artifact = await db.eventArtifact.create({
    data: {
      linkedCampaignId: input.campaignId,
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
      status: 'draft',
    },
    select: { id: true },
  })

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
