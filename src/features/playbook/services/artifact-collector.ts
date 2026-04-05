/**
 * Campaign Playbook — Artifact Collector
 *
 * Collects BARs, quests, events, memberships for playbook synthesis.
 * Spec: docs/architecture/campaign-playbook-system.md
 */

import { db } from '@/lib/db'

export interface CollectedArtifacts {
  instance: {
    id: string
    name: string
    slug: string
    campaignRef: string | null
    targetDescription: string | null
    kotterStage: number
  }
  bars: Array<{
    id: string
    title: string
    description: string
    type: string
    campaignRef: string | null
    kotterStage: number
    allyshipDomain: string | null
    createdAt: Date
    status: string
  }>
  completedQuests: Array<{
    id: string
    title: string
    completedAt: Date
  }>
  events: Array<{
    id: string
    title: string
    status: string
    startTime: Date | null
    eventType: string
  }>
  memberships: Array<{
    playerId: string
    playerName: string
    roleKey: string | null
  }>
  stewards: Array<{
    playerId: string
    playerName: string
    questId: string
    questTitle: string
  }>
  barResponders: Array<{
    barId: string
    responderId: string
    responderName: string
    responseType: string
  }>
  invitations: Array<{
    id: string
    targetActorId: string
    targetActorName: string
    invitedRole: string
    acceptedRole: string | null
    status: string
    sentAt: Date | null
  }>
}

/**
 * Collect all artifacts for an instance's campaign playbook.
 */
export async function collectArtifacts(
  instanceId: string
): Promise<CollectedArtifacts | null> {
  const instance = await db.instance.findUnique({
    where: { id: instanceId },
  })
  if (!instance) return null

  const campaignRef = instance.campaignRef ?? instance.slug

  // BARs and quests (CustomBar with campaignRef)
  const bars = await db.customBar.findMany({
    where: { campaignRef, status: 'active' },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      campaignRef: true,
      kotterStage: true,
      allyshipDomain: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Completed quests (PlayerQuest with completedAt)
  const completedPlayerQuests = await db.playerQuest.findMany({
    where: {
      quest: { campaignRef },
      completedAt: { not: null },
    },
    include: {
      quest: { select: { id: true, title: true } },
    },
    orderBy: { completedAt: 'desc' },
    take: 50,
  })

  // Events from instance's event campaigns
  const eventCampaigns = await db.eventCampaign.findMany({
    where: { instanceId },
    include: {
      events: {
        select: {
          id: true,
          title: true,
          status: true,
          startTime: true,
          eventType: true,
        },
      },
    },
  })

  // Instance memberships
  const memberships = await db.instanceMembership.findMany({
    where: { instanceId },
    include: { player: { select: { id: true, name: true } } },
  })

  // Gameboard stewards (Responsible)
  const slotsWithStewards = await db.gameboardSlot.findMany({
    where: {
      instanceId,
      campaignRef,
      stewardId: { not: null },
    },
    include: {
      quest: { select: { id: true, title: true } },
      steward: { select: { id: true, name: true } },
    },
  })

  // Bar responders (for RACI)
  const barIds = bars.map((b) => b.id)
  const responses = await db.barResponse.findMany({
    where: { barId: { in: barIds } },
    include: { responder: { select: { id: true, name: true } } },
  })

  // Campaign invitations
  const invitationRows = await db.campaignInvitation.findMany({
    where: { instanceId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const targetIds = [...new Set(invitationRows.map((i) => i.targetActorId))]
  const targetPlayers = await db.player.findMany({
    where: { id: { in: targetIds } },
    select: { id: true, name: true },
  })
  const targetNameMap = new Map(targetPlayers.map((p) => [p.id, p.name]))
  const invitations = invitationRows.map((i) => ({
    id: i.id,
    targetActorId: i.targetActorId,
    targetActorName: targetNameMap.get(i.targetActorId) ?? 'Unknown',
    invitedRole: i.invitedRole,
    acceptedRole: i.acceptedRole,
    status: i.status,
    sentAt: i.sentAt,
  }))

  return {
    instance: {
      id: instance.id,
      name: instance.name,
      slug: instance.slug,
      campaignRef: instance.campaignRef,
      targetDescription: instance.targetDescription,
      kotterStage: instance.kotterStage,
    },
    bars: bars.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      type: b.type,
      campaignRef: b.campaignRef,
      kotterStage: b.kotterStage,
      allyshipDomain: b.allyshipDomain,
      createdAt: b.createdAt,
      status: b.status,
    })),
    completedQuests: completedPlayerQuests.map((pq) => ({
      id: pq.quest.id,
      title: pq.quest.title,
      completedAt: pq.completedAt!,
    })),
    events: eventCampaigns.flatMap((ec) =>
      ec.events.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        startTime: e.startTime,
        eventType: e.eventType,
      }))
    ),
    memberships: memberships.map((m) => ({
      playerId: m.player.id,
      playerName: m.player.name,
      roleKey: m.roleKey,
    })),
    stewards: slotsWithStewards
      .filter((s) => s.quest && s.steward)
      .map((s) => ({
        playerId: s.steward!.id,
        playerName: s.steward!.name,
        questId: s.quest!.id,
        questTitle: s.quest!.title,
      })),
    barResponders: responses.map((r) => ({
      barId: r.barId,
      responderId: r.responder.id,
      responderName: r.responder.name,
      responseType: r.responseType,
    })),
    invitations,
  }
}
