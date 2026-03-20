'use server'

import { Prisma } from '@prisma/client'
import { db, dbBase } from '@/lib/db'
import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

/** Resolve email or player name to player ID. */
async function resolveRecipient(identifier: string): Promise<string | null> {
  if (!identifier?.trim()) return null
  const trimmed = identifier.trim().toLowerCase()

  const account = await db.account.findUnique({
    where: { email: trimmed },
    include: { players: { select: { id: true }, take: 1 } },
  })
  if (account?.players[0]) return account.players[0].id

  const byContact = await db.player.findFirst({
    where: { contactValue: { equals: trimmed, mode: 'insensitive' } },
    select: { id: true },
  })
  if (byContact) return byContact.id

  const byName = await db.player.findFirst({
    where: { name: { equals: identifier.trim(), mode: 'insensitive' } },
    select: { id: true },
  })
  if (byName) return byName.id

  return null
}

/** Check if player can invite to instance: admin or owner/steward. */
async function canInviteToInstance(playerId: string, instanceId: string): Promise<boolean> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { roles: { include: { role: true } } },
  })
  if (!player) return false
  if (player.roles.some((r) => r.role.key === 'admin')) return true

  const membership = await db.instanceMembership.findUnique({
    where: { instanceId_playerId: { instanceId, playerId } },
  })
  return membership?.roleKey === 'owner' || membership?.roleKey === 'steward'
}

/** Hosts listed on EventCampaign.hostActorIds may invite to events on that campaign (e.g. Wendell + JJ). */
async function canInviteToEventArtifact(
  playerId: string,
  eventArtifactId: string,
  instanceId: string
): Promise<boolean> {
  if (await canInviteToInstance(playerId, instanceId)) return true
  const row = await dbBase.eventArtifact.findUnique({
    where: { id: eventArtifactId },
    select: { campaign: { select: { hostActorIds: true, instanceId: true } } },
  })
  if (!row?.campaign) return false
  if (row.campaign.instanceId && row.campaign.instanceId !== instanceId) return false
  try {
    const hosts = JSON.parse(row.campaign.hostActorIds || '[]') as string[]
    return Array.isArray(hosts) && hosts.includes(playerId)
  } catch {
    return false
  }
}

/** True if player may send BAR invites for any event on this instance (admin/steward OR campaign host). */
export async function canInviteToAnyEventOnInstance(
  playerId: string,
  instanceId: string
): Promise<boolean> {
  if (await canInviteToInstance(playerId, instanceId)) return true
  const campaigns = await dbBase.eventCampaign.findMany({
    where: { instanceId },
    select: { hostActorIds: true },
  })
  for (const c of campaigns) {
    try {
      const hosts = JSON.parse(c.hostActorIds || '[]') as string[]
      if (Array.isArray(hosts) && hosts.includes(playerId)) return true
    } catch {
      /* ignore */
    }
  }
  return false
}

/** Logged-in player may fetch .ics for this event (host/steward or any participant). */
export async function playerCanAccessEventCalendar(playerId: string, eventArtifactId: string): Promise<boolean> {
  const ev = await db.eventArtifact.findUnique({
    where: { id: eventArtifactId },
    select: {
      instanceId: true,
      campaign: { select: { instanceId: true } },
    },
  })
  if (!ev) return false
  const inst = ev.instanceId ?? ev.campaign?.instanceId
  if (!inst) return false
  if (await canInviteToAnyEventOnInstance(playerId, inst)) return true
  const row = await db.eventParticipant.findUnique({
    where: { eventId_participantId: { eventId: eventArtifactId, participantId: playerId } },
    select: { id: true },
  })
  return !!row
}

async function withRsvpCounts(
  rows: Array<{
    id: string
    title: string
    startTime: Date | null
    endTime: Date | null
    timezone: string | null
    capacity: number | null
    parentEventArtifactId: string | null
  }>
): Promise<EventArtifactListItem[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const agg = await dbBase.eventParticipant.groupBy({
    by: ['eventId'],
    where: {
      eventId: { in: ids },
      participantState: { in: ['RSVP_yes', 'attending', 'attended'] },
    },
    _count: { _all: true },
  })
  const map = new Map(agg.map((a) => [a.eventId, a._count._all]))
  return rows.map((r) => ({
    ...r,
    rsvpCount: map.get(r.id) ?? 0,
  }))
}

export type EventParticipantRow = {
  id: string
  participantId: string
  name: string
  participantState: string
  functionalRole: string | null
}

export async function listEventParticipantsForManage(
  instanceId: string,
  eventArtifactId: string
): Promise<{ error: string } | { participants: EventParticipantRow[] }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  if (!(await canInviteToEventArtifact(playerId, eventArtifactId, instanceId))) {
    return { error: 'You do not have permission to view this list' }
  }
  const exists = await db.eventArtifact.findFirst({
    where: {
      id: eventArtifactId,
      OR: [{ instanceId }, { campaign: { instanceId } }],
    },
    select: { id: true },
  })
  if (!exists) return { error: 'Event not found' }

  const rows = await db.eventParticipant.findMany({
    where: { eventId: eventArtifactId },
    orderBy: { createdAt: 'asc' },
    include: { participant: { select: { id: true, name: true } } },
  })
  return {
    participants: rows.map((r) => ({
      id: r.id,
      participantId: r.participantId,
      name: r.participant.name ?? 'Player',
      participantState: r.participantState,
      functionalRole: r.functionalRole ?? null,
    })),
  }
}

export async function markEventParticipantAttended(
  instanceId: string,
  eventArtifactId: string,
  eventParticipantId: string
): Promise<{ success: true } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  if (!(await canInviteToEventArtifact(playerId, eventArtifactId, instanceId))) {
    return { error: 'You do not have permission to check in guests' }
  }
  const row = await db.eventParticipant.findFirst({
    where: { id: eventParticipantId, eventId: eventArtifactId },
  })
  if (!row) return { error: 'Participant not found' }
  if (!['RSVP_yes', 'attending'].includes(row.participantState)) {
    return { error: 'Only guests who RSVPed can be checked in' }
  }
  await db.eventParticipant.update({
    where: { id: eventParticipantId },
    data: { participantState: 'attended' },
  })
  revalidatePath('/event')
  return { success: true }
}

function parseLocalDatetimeInput(raw: string): Date | null {
  const t = raw?.trim()
  if (!t) return null
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return null
  return d
}

/**
 * Update start/end (and optional timezone / capacity) for an EventArtifact.
 * Same permission as sending event invites: admin / steward / owner OR campaign host.
 */
export async function updateEventArtifactSchedule(
  instanceId: string,
  eventArtifactId: string,
  startTimeLocal: string,
  endTimeLocal: string,
  timezoneInput: string,
  capacityInput: string
): Promise<{ success: true } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  if (!(await canInviteToEventArtifact(playerId, eventArtifactId, instanceId))) {
    return { error: 'You do not have permission to edit this event schedule' }
  }

  const artifact = await db.eventArtifact.findFirst({
    where: {
      id: eventArtifactId,
      OR: [{ instanceId }, { campaign: { instanceId } }],
    },
    select: { id: true },
  })
  if (!artifact) return { error: 'Event not found on this campaign' }

  const start = parseLocalDatetimeInput(startTimeLocal)
  const end = parseLocalDatetimeInput(endTimeLocal)
  if (startTimeLocal.trim() && !start) return { error: 'Invalid start date/time' }
  if (endTimeLocal.trim() && !end) return { error: 'Invalid end date/time' }
  if (start && end && end < start) return { error: 'End must be on or after start' }

  const tz = timezoneInput?.trim() || null

  let capacity: number | null = null
  const capRaw = capacityInput?.trim()
  if (capRaw) {
    const n = Number.parseInt(capRaw, 10)
    if (!Number.isFinite(n) || n < 1) return { error: 'Capacity must be a positive number or empty' }
    capacity = n
  }

  await db.eventArtifact.update({
    where: { id: eventArtifactId },
    data: {
      startTime: start,
      endTime: end,
      timezone: tz,
      capacity,
    },
  })

  revalidatePath('/event')
  return { success: true }
}

export type CreateCampaignRoleInvitationResult =
  | { success: true; barId: string; invitationId: string }
  | { error: string }

/**
 * Create a campaign role invitation: BAR + CampaignInvitation + BarShare.
 * Sender must be admin or owner/steward of the instance.
 */
export async function createCampaignRoleInvitation(formData: FormData): Promise<CreateCampaignRoleInvitationResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const instanceId = (formData.get('instanceId') as string)?.trim()
  const roleKey = (formData.get('roleKey') as string)?.trim()
  const targetPlayerIdRaw = (formData.get('targetPlayerId') as string)?.trim()
  const recipientIdentifier = (formData.get('recipient') as string)?.trim()
  const messageText = (formData.get('messageText') as string)?.trim() || ''
  const barId = (formData.get('barId') as string)?.trim() || null

  if (!instanceId) return { error: 'Instance is required' }
  if (!roleKey) return { error: 'Role is required' }
  if (!['owner', 'steward', 'contributor'].includes(roleKey)) {
    return { error: 'Role must be owner, steward, or contributor' }
  }

  let targetPlayerId = targetPlayerIdRaw || null
  if (!targetPlayerId && recipientIdentifier) {
    targetPlayerId = await resolveRecipient(recipientIdentifier)
  }
  if (!targetPlayerId) return { error: 'Recipient is required (email or player name)' }
  if (targetPlayerId === playerId) return { error: 'Cannot invite yourself' }

  const canInvite = await canInviteToInstance(playerId, instanceId)
  if (!canInvite) return { error: 'You do not have permission to invite to this campaign' }

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    include: { childInstances: { select: { id: true } } },
  })
  if (!instance) return { error: 'Instance not found' }

  const targetExists = await db.player.findUnique({ where: { id: targetPlayerId } })
  if (!targetExists) return { error: 'Recipient not found' }

  try {
    let finalBarId = barId
    if (!finalBarId) {
      const bar = await db.customBar.create({
        data: {
          creatorId: playerId,
          title: `Invitation to ${instance.name}`,
          description: messageText || `You're invited to be ${roleKey} in ${instance.name}.`,
          type: 'bar',
          reward: 0,
          visibility: 'private',
          status: 'active',
          inputs: '[]',
          rootId: 'temp',
        },
      })
      await db.customBar.update({
        where: { id: bar.id },
        data: { rootId: bar.id },
      })
      finalBarId = bar.id
    } else {
      const existing = await db.customBar.findUnique({
        where: { id: finalBarId },
        include: { campaignInvitation: true },
      })
      if (!existing) return { error: 'BAR not found' }
      if (existing.creatorId !== playerId) return { error: "You don't own this BAR" }
      if (existing.campaignInvitation) return { error: 'This BAR already has an invitation' }
    }

    const invitation = await db.campaignInvitation.create({
      data: {
        instanceId,
        targetActorId: targetPlayerId,
        createdByActorId: playerId,
        invitedRole: roleKey,
        invitationType: 'role_invitation',
        messageText: messageText || `You're invited to be ${roleKey} in ${instance.name}.`,
        status: 'sent',
        sentAt: new Date(),
        barId: finalBarId,
      },
    })

    await db.barShare.create({
      data: {
        barId: finalBarId,
        fromUserId: playerId,
        toUserId: targetPlayerId,
        note: `Invitation to be ${roleKey} in ${instance.name}`,
      },
    })

    revalidatePath('/admin/instances')
    revalidatePath('/admin/campaigns')
    revalidatePath('/bars')
    revalidatePath(`/bars/${finalBarId}`)

    return { success: true, barId: finalBarId, invitationId: invitation.id }
  } catch (e) {
    console.error('[campaign-invitation] create failed:', e)
    return { error: e instanceof Error ? e.message : 'Failed to create invitation' }
  }
}

export type AcceptCampaignRoleInvitationResult =
  | { success: true; redirectTo: string }
  | { error: string }

/**
 * Accept a campaign role invitation. Creates InstanceMembership(s).
 * Parent accept → owner on parent + steward on each child.
 * Sub-campaign accept → owner on that instance only.
 */
export async function acceptCampaignRoleInvitation(invitationId: string): Promise<AcceptCampaignRoleInvitationResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const invitation = await db.campaignInvitation.findUnique({
    where: { id: invitationId },
    include: {
      instance: { include: { childInstances: { select: { id: true } } } },
    },
  })

  if (!invitation) return { error: 'Invitation not found' }
  if (invitation.targetActorId !== playerId) return { error: 'This invitation is not for you' }
  if (invitation.status !== 'sent') return { error: 'This invitation has already been responded to' }

  try {
    const instance = invitation.instance
    const isParent = !instance.parentInstanceId && instance.childInstances.length > 0

    if (isParent) {
      await db.instanceMembership.upsert({
        where: { instanceId_playerId: { instanceId: instance.id, playerId } },
        update: { roleKey: invitation.invitedRole },
        create: { instanceId: instance.id, playerId, roleKey: invitation.invitedRole },
      })
      for (const child of instance.childInstances) {
        await db.instanceMembership.upsert({
          where: { instanceId_playerId: { instanceId: child.id, playerId } },
          update: { roleKey: 'steward' },
          create: { instanceId: child.id, playerId, roleKey: 'steward' },
        })
      }
    } else {
      await db.instanceMembership.upsert({
        where: { instanceId_playerId: { instanceId: instance.id, playerId } },
        update: { roleKey: invitation.invitedRole },
        create: { instanceId: instance.id, playerId, roleKey: invitation.invitedRole },
      })
    }

    await db.campaignInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'accepted',
        acceptedRole: invitation.invitedRole,
        respondedAt: new Date(),
      },
    })

    revalidatePath('/admin/campaigns')
    revalidatePath('/admin/instances')
    revalidatePath('/bars')
    revalidatePath(`/bars/${invitation.barId ?? ''}`)

    return { success: true, redirectTo: '/admin/instances' }
  } catch (e) {
    console.error('[campaign-invitation] accept failed:', e)
    return { error: e instanceof Error ? e.message : 'Failed to accept invitation' }
  }
}

export type DeclineCampaignRoleInvitationResult = { success: true } | { error: string }

/**
 * Decline a campaign role invitation.
 */
export async function declineCampaignRoleInvitation(invitationId: string): Promise<DeclineCampaignRoleInvitationResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const invitation = await db.campaignInvitation.findUnique({
    where: { id: invitationId },
  })

  if (!invitation) return { error: 'Invitation not found' }
  if (invitation.targetActorId !== playerId) return { error: 'This invitation is not for you' }
  if (invitation.status !== 'sent') return { error: 'This invitation has already been responded to' }

  try {
    await db.campaignInvitation.update({
      where: { id: invitationId },
      data: { status: 'declined', respondedAt: new Date() },
    })

    revalidatePath('/bars')
    revalidatePath(`/bars/${invitation.barId ?? ''}`)

    return { success: true }
  } catch (e) {
    console.error('[campaign-invitation] decline failed:', e)
    return { error: e instanceof Error ? e.message : 'Failed to decline invitation' }
  }
}

/**
 * List EventArtifacts for an instance (via event_artifacts.instance_id OR event_campaigns.instanceId).
 *
 * Uses $queryRaw so /event does not 500 when `prisma generate` is stale and the client rejects
 * `EventArtifactWhereInput.instanceId` (PrismaClientValidationError: Unknown argument `instanceId`).
 */
export async function listEventArtifactsForInstance(instanceId: string): Promise<EventArtifactListItem[]> {
  type Row = {
    id: string
    title: string
    startTime: Date | null
    endTime: Date | null
    timezone: string | null
    capacity: number | null
    parentEventArtifactId: string | null
  }

  try {
    const raw = await dbBase.$queryRaw<Row[]>(Prisma.sql`
      SELECT ea.id,
             ea.title,
             ea."startTime",
             ea."endTime",
             ea.timezone,
             ea.capacity,
             ea.parent_event_artifact_id AS "parentEventArtifactId"
      FROM event_artifacts ea
      LEFT JOIN event_campaigns ec ON ec.id = ea."linkedCampaignId"
      WHERE ea.instance_id = ${instanceId}
         OR ec."instanceId" = ${instanceId}
      ORDER BY (ea.parent_event_artifact_id IS NOT NULL) ASC,
               ea."startTime" ASC NULLS LAST
    `)
    return withRsvpCounts(raw)
  } catch (e) {
    console.warn(
      '[campaign-invitation] listEventArtifactsForInstance raw SQL failed; try ORM fallback:',
      e
    )
    try {
      const rows = await dbBase.eventArtifact.findMany({
        where: {
          OR: [{ instanceId }, { campaign: { instanceId } }],
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          timezone: true,
          capacity: true,
          parentEventArtifactId: true,
        },
        orderBy: [{ parentEventArtifactId: 'asc' }, { startTime: 'asc' }],
      })
      const normalized: Row[] = rows.map((r) => ({
        ...r,
        capacity: r.capacity ?? null,
        parentEventArtifactId: r.parentEventArtifactId ?? null,
      }))
      return withRsvpCounts(normalized)
    } catch (e2) {
      console.warn('[campaign-invitation] listEventArtifactsForInstance fallback failed:', e2)
      return []
    }
  }
}

/**
 * Get the pending campaign invitation for a BAR and user (if they are the target).
 */
export async function getCampaignInvitationForBar(barId: string, playerId: string) {
  return db.campaignInvitation.findFirst({
    where: {
      barId,
      targetActorId: playerId,
      status: 'sent',
    },
    include: {
      instance: { select: { id: true, name: true, slug: true } },
      eventArtifact: { select: { id: true, title: true, startTime: true, endTime: true } },
    },
  })
}

// ---------------------------------------------------------------------------
// Event Invitation (event_participant)
// ---------------------------------------------------------------------------

export type CreateEventInvitationResult =
  | { success: true; barId: string; invitationId: string }
  | { error: string }

/**
 * Create an event invitation: BAR + CampaignInvitation (event_participant) + BarShare + EventInvite + EventParticipant.
 * Sender must be admin or owner/steward of the instance.
 */
export async function createEventInvitation(formData: FormData): Promise<CreateEventInvitationResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const eventArtifactId = (formData.get('eventArtifactId') as string)?.trim()
  const instanceId = (formData.get('instanceId') as string)?.trim()
  const recipientIdentifier = (formData.get('recipient') as string)?.trim()
  const messageText = (formData.get('messageText') as string)?.trim() || ''

  if (!eventArtifactId) return { error: 'Event is required' }
  if (!instanceId) return { error: 'Instance is required' }

  const targetPlayerId = await resolveRecipient(recipientIdentifier)
  if (!targetPlayerId) return { error: 'Recipient is required (email or player name)' }
  if (targetPlayerId === playerId) return { error: 'Cannot invite yourself' }

  const eventArtifact = await db.eventArtifact.findUnique({
    where: { id: eventArtifactId },
    include: {
      campaign: { select: { instanceId: true } },
      parentEvent: { select: { title: true } },
    },
  })
  if (!eventArtifact) return { error: 'Event not found' }
  if (eventArtifact.campaign.instanceId && eventArtifact.campaign.instanceId !== instanceId) {
    return { error: 'Event does not belong to this instance' }
  }

  const canInvite = await canInviteToEventArtifact(playerId, eventArtifactId, instanceId)
  if (!canInvite) return { error: 'You do not have permission to invite to this event' }

  const instance = await db.instance.findUnique({ where: { id: instanceId } })
  if (!instance) return { error: 'Instance not found' }

  const targetExists = await db.player.findUnique({ where: { id: targetPlayerId } })
  if (!targetExists) return { error: 'Recipient not found' }

  const dateStr = eventArtifact.startTime
    ? new Date(eventArtifact.startTime).toLocaleDateString(undefined, { dateStyle: 'long' })
    : ''

  const parentTitle = eventArtifact.parentEvent?.title
  const defaultDesc =
    eventArtifact.parentEventArtifactId && parentTitle
      ? `You're invited to help with pre-production for “${parentTitle}” — crew: “${eventArtifact.title}”.`
      : `You're invited to ${eventArtifact.title}${dateStr ? ` on ${dateStr}` : ''}.`

  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: playerId,
        title: `Invitation: ${eventArtifact.title}`,
        description: messageText || defaultDesc,
        type: 'bar',
        reward: 0,
        visibility: 'private',
        status: 'active',
        inputs: '[]',
        rootId: 'temp',
      },
    })
    await db.customBar.update({
      where: { id: bar.id },
      data: { rootId: bar.id },
    })

    const invitation = await db.campaignInvitation.create({
      data: {
        instanceId,
        targetActorId: targetPlayerId,
        createdByActorId: playerId,
        invitedRole: 'participant',
        invitationType: 'event_participant',
        messageText: messageText || defaultDesc,
        status: 'sent',
        sentAt: new Date(),
        barId: bar.id,
        eventArtifactId,
      },
    })

    await db.barShare.create({
      data: {
        barId: bar.id,
        fromUserId: playerId,
        toUserId: targetPlayerId,
        note: `Invitation to ${eventArtifact.title}`,
      },
    })

    await db.eventInvite.upsert({
      where: { eventId_actorId: { eventId: eventArtifactId, actorId: targetPlayerId } },
      update: { inviteStatus: 'pending' },
      create: {
        eventId: eventArtifactId,
        actorId: targetPlayerId,
        invitedByActorId: playerId,
        inviteStatus: 'pending',
        inviteSource: 'quest_bar',
      },
    })

    await db.eventParticipant.upsert({
      where: { eventId_participantId: { eventId: eventArtifactId, participantId: targetPlayerId } },
      update: { participantState: 'invited' },
      create: {
        eventId: eventArtifactId,
        participantId: targetPlayerId,
        participantState: 'invited',
      },
    })

    revalidatePath('/admin/instances')
    revalidatePath('/admin/campaigns')
    revalidatePath('/event')
    revalidatePath('/bars')
    revalidatePath(`/bars/${bar.id}`)

    return { success: true, barId: bar.id, invitationId: invitation.id }
  } catch (e) {
    console.error('[campaign-invitation] createEventInvitation failed:', e)
    return { error: e instanceof Error ? e.message : 'Failed to create event invitation' }
  }
}

export type AcceptEventInvitationResult =
  | { success: true; redirectTo: string }
  | { error: string }

/**
 * Accept an event invitation (RSVP). Updates EventParticipant and EventInvite.
 */
export async function acceptEventInvitation(invitationId: string): Promise<AcceptEventInvitationResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const invitation = await db.campaignInvitation.findUnique({
    where: { id: invitationId },
    include: { eventArtifact: { select: { id: true } } },
  })

  if (!invitation) return { error: 'Invitation not found' }
  if (invitation.invitationType !== 'event_participant') return { error: 'Not an event invitation' }
  if (invitation.targetActorId !== playerId) return { error: 'This invitation is not for you' }
  if (invitation.status !== 'sent') return { error: 'This invitation has already been responded to' }
  if (!invitation.eventArtifactId) return { error: 'Event not found' }

  const artifactMeta = await dbBase.eventArtifact.findUnique({
    where: { id: invitation.eventArtifactId },
    select: { parentEventArtifactId: true, capacity: true },
  })
  const preproductionRole = artifactMeta?.parentEventArtifactId ? 'preproduction' : null

  const existingRsvp = await db.eventParticipant.findUnique({
    where: {
      eventId_participantId: { eventId: invitation.eventArtifactId, participantId: playerId },
    },
    select: { participantState: true },
  })
  const alreadyGoing =
    existingRsvp?.participantState === 'RSVP_yes' ||
    existingRsvp?.participantState === 'attending' ||
    existingRsvp?.participantState === 'attended'

  if (
    !alreadyGoing &&
    artifactMeta?.capacity != null &&
    artifactMeta.capacity > 0
  ) {
    const cnt = await db.eventParticipant.count({
      where: {
        eventId: invitation.eventArtifactId,
        participantState: { in: ['RSVP_yes', 'attending', 'attended'] },
      },
    })
    if (cnt >= artifactMeta.capacity) {
      return { error: 'This event is at capacity' }
    }
  }

  try {
    await db.eventParticipant.upsert({
      where: {
        eventId_participantId: { eventId: invitation.eventArtifactId, participantId: playerId },
      },
      update: {
        participantState: 'RSVP_yes',
        ...(preproductionRole ? { functionalRole: preproductionRole } : {}),
      },
      create: {
        eventId: invitation.eventArtifactId,
        participantId: playerId,
        participantState: 'RSVP_yes',
        ...(preproductionRole ? { functionalRole: preproductionRole } : {}),
      },
    })

    await db.eventInvite.updateMany({
      where: { eventId: invitation.eventArtifactId, actorId: playerId },
      data: { inviteStatus: 'accepted' },
    })

    await db.campaignInvitation.update({
      where: { id: invitationId },
      data: { status: 'accepted', respondedAt: new Date() },
    })

    revalidatePath('/event')
    revalidatePath('/bars')
    revalidatePath(`/bars/${invitation.barId ?? ''}`)

    return { success: true, redirectTo: '/event' }
  } catch (e) {
    console.error('[campaign-invitation] acceptEventInvitation failed:', e)
    return { error: e instanceof Error ? e.message : 'Failed to accept invitation' }
  }
}

export type DeclineEventInvitationResult = { success: true } | { error: string }

/**
 * Decline an event invitation.
 */
export async function declineEventInvitation(invitationId: string): Promise<DeclineEventInvitationResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const invitation = await db.campaignInvitation.findUnique({
    where: { id: invitationId },
  })

  if (!invitation) return { error: 'Invitation not found' }
  if (invitation.invitationType !== 'event_participant') return { error: 'Not an event invitation' }
  if (invitation.targetActorId !== playerId) return { error: 'This invitation is not for you' }
  if (invitation.status !== 'sent') return { error: 'This invitation has already been responded to' }
  if (!invitation.eventArtifactId) return { error: 'Event not found' }

  try {
    await db.eventParticipant.upsert({
      where: {
        eventId_participantId: { eventId: invitation.eventArtifactId, participantId: playerId },
      },
      update: { participantState: 'declined' },
      create: {
        eventId: invitation.eventArtifactId,
        participantId: playerId,
        participantState: 'declined',
      },
    })

    await db.eventInvite.updateMany({
      where: { eventId: invitation.eventArtifactId, actorId: playerId },
      data: { inviteStatus: 'declined' },
    })

    await db.campaignInvitation.update({
      where: { id: invitationId },
      data: { status: 'declined', respondedAt: new Date() },
    })

    revalidatePath('/bars')
    revalidatePath(`/bars/${invitation.barId ?? ''}`)

    return { success: true }
  } catch (e) {
    console.error('[campaign-invitation] declineEventInvitation failed:', e)
    return { error: e instanceof Error ? e.message : 'Failed to decline invitation' }
  }
}
