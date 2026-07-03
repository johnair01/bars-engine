'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  mergePlayerQuestMetadata,
  parsePlayerQuestMetadata,
  type WaitingForKind,
  type WaitingForState,
} from '@/lib/quest-waiting-for'

export type SetWaitingForInput = {
  questId: string
  kind: WaitingForKind
  label: string
  askedFor?: string
  followUpAt?: string
}

export type CampaignWaitingOnItem = {
  questId: string
  questTitle: string
  waitingFor: WaitingForState
}

async function getAssignedPlayerQuest(playerId: string, questId: string) {
  return db.playerQuest.findUnique({
    where: { playerId_questId: { playerId, questId } },
    select: {
      id: true,
      status: true,
      metadataJson: true,
      quest: { select: { id: true, title: true, campaignRef: true } },
    },
  })
}

export async function getWaitingForForQuest(
  questId: string
): Promise<WaitingForState | null> {
  const player = await getCurrentPlayer()
  if (!player) return null

  const assignment = await getAssignedPlayerQuest(player.id, questId)
  if (!assignment || assignment.status !== 'assigned') return null

  return parsePlayerQuestMetadata(assignment.metadataJson).waitingFor ?? null
}

export async function setWaitingFor(
  input: SetWaitingForInput
): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const label = input.label?.trim()
    if (!label) return { error: 'Who or what are you waiting on?' }

    const assignment = await getAssignedPlayerQuest(player.id, input.questId)
    if (!assignment) return { error: 'Quest not assigned to you' }
    if (assignment.status !== 'assigned') return { error: 'Quest is not active' }

    const waitingFor: WaitingForState = {
      kind: input.kind,
      label: label.slice(0, 200),
      since: new Date().toISOString(),
      askedFor: input.askedFor?.trim().slice(0, 500) || undefined,
      followUpAt: input.followUpAt?.trim() || undefined,
    }

    const metadataJson = mergePlayerQuestMetadata(assignment.metadataJson, { waitingFor })

    await db.playerQuest.update({
      where: { id: assignment.id },
      data: { metadataJson },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to set waiting-on'
    return { error: message }
  }
}

export async function clearWaitingFor(
  questId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const assignment = await getAssignedPlayerQuest(player.id, questId)
    if (!assignment) return { error: 'Quest not assigned to you' }

    const metadataJson = mergePlayerQuestMetadata(assignment.metadataJson, { waitingFor: undefined })

    await db.playerQuest.update({
      where: { id: assignment.id },
      data: { metadataJson },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to clear waiting-on'
    return { error: message }
  }
}

/** In-app "ping" move — records lastPingAt; no push notification. */
export async function recordWaitingForPing(
  questId: string
): Promise<{ success: true; lastPingAt: string } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const assignment = await getAssignedPlayerQuest(player.id, questId)
    if (!assignment) return { error: 'Quest not assigned to you' }

    const meta = parsePlayerQuestMetadata(assignment.metadataJson)
    if (!meta.waitingFor) return { error: 'Nothing is marked as waiting-on for this quest' }

    const lastPingAt = new Date().toISOString()
    const waitingFor: WaitingForState = { ...meta.waitingFor, lastPingAt }
    const metadataJson = mergePlayerQuestMetadata(assignment.metadataJson, { waitingFor })

    await db.playerQuest.update({
      where: { id: assignment.id },
      data: { metadataJson },
    })

    revalidatePath('/', 'layout')
    return { success: true, lastPingAt }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record ping'
    return { error: message }
  }
}

export async function getCampaignWaitingOnQuests(
  campaignRef: string
): Promise<CampaignWaitingOnItem[]> {
  const player = await getCurrentPlayer()
  if (!player) return []

  const assignments = await db.playerQuest.findMany({
    where: {
      playerId: player.id,
      status: 'assigned',
      metadataJson: { not: null },
      quest: {
        campaignRef,
        type: 'quest',
      },
    },
    select: {
      metadataJson: true,
      quest: { select: { id: true, title: true } },
    },
    orderBy: { assignedAt: 'desc' },
    take: 50,
  })

  const items: CampaignWaitingOnItem[] = []
  for (const row of assignments) {
    const waitingFor = parsePlayerQuestMetadata(row.metadataJson).waitingFor
    if (!waitingFor) continue
    items.push({
      questId: row.quest.id,
      questTitle: row.quest.title,
      waitingFor,
    })
  }
  return items
}
