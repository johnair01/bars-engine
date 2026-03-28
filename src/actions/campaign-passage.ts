'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { validateAdventurePassagesGraph } from '@/lib/story-graph/adventurePassagesGraph'
import {
  playerCanEditCampaignAdventure,
  type PlayerRoleRow,
} from '@/lib/campaign-passage-permissions'

async function requireCampaignPassageEditor(adventureSlug: string): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')

  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { roles: { include: { role: true } } },
  })
  if (!player) throw new Error('Not logged in')

  const roles: PlayerRoleRow[] = player.roles.map((r) => ({ role: r.role }))
  const ok = await playerCanEditCampaignAdventure(playerId, roles, adventureSlug)
  if (!ok) throw new Error('Not authorized to edit passages for this campaign adventure')
  return playerId
}

/**
 * Fetch raw passage for editing. Returns null if no passage exists (e.g. hardcoded node).
 */
export async function getCampaignPassageForEdit(
  adventureSlug: string,
  nodeId: string
): Promise<{ text: string; choices: { text: string; targetId: string }[] } | null> {
  await requireCampaignPassageEditor(adventureSlug)

  const adventure = await db.adventure.findFirst({
    where: { slug: adventureSlug, status: 'ACTIVE' },
  })
  if (!adventure) return null

  const passage = await db.passage.findUnique({
    where: {
      adventureId_nodeId: { adventureId: adventure.id, nodeId },
    },
  })
  if (!passage) return null

  let choices: { text: string; targetId: string }[] = []
  try {
    choices = JSON.parse(passage.choices)
  } catch {
    // ignore
  }
  return { text: passage.text, choices }
}

/**
 * All passage node ids for an active adventure — for CYOA target picker (steward/owner/admin per adventure).
 */
export async function listCampaignPassageNodeIds(
  adventureSlug: string
): Promise<{ nodeIds: string[] } | { error: string }> {
  try {
    await requireCampaignPassageEditor(adventureSlug)
    const adventure = await db.adventure.findFirst({
      where: { slug: adventureSlug, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!adventure) return { error: 'Adventure not found or inactive' }
    const passages = await db.passage.findMany({
      where: { adventureId: adventure.id },
      select: { nodeId: true },
      orderBy: { nodeId: 'asc' },
    })
    return { nodeIds: passages.map((p) => p.nodeId) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to list passages'
    return { error: msg }
  }
}

/**
 * Upsert campaign passage. Creates if missing, updates if exists.
 * Requires steward/owner/admin per `campaign-passage-permissions`. Used for in-context campaign editing.
 */
export async function upsertCampaignPassage(
  adventureSlug: string,
  nodeId: string,
  data: { text: string; choices: { text: string; targetId: string }[] }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireCampaignPassageEditor(adventureSlug)

    const adventure = await db.adventure.findFirst({
      where: { slug: adventureSlug, status: 'ACTIVE' },
    })
    if (!adventure) {
      return { success: false, error: 'Adventure not found or inactive' }
    }

    const existingRows = await db.passage.findMany({
      where: { adventureId: adventure.id },
      select: { nodeId: true, choices: true },
    })

    const graphResult = validateAdventurePassagesGraph(
      existingRows.map((r) => ({ nodeId: r.nodeId, choicesJson: r.choices })),
      nodeId.trim(),
      data.choices,
      adventure.startNodeId
    )

    if (!graphResult.ok) {
      const msg = graphResult.errors.map((e) => e.message).join('\n')
      return { success: false, error: msg || 'Graph validation failed' }
    }

    const choicesJson = JSON.stringify(data.choices)

    await db.passage.upsert({
      where: {
        adventureId_nodeId: { adventureId: adventure.id, nodeId },
      },
      create: {
        adventureId: adventure.id,
        nodeId,
        text: data.text,
        choices: choicesJson,
      },
      update: {
        text: data.text,
        choices: choicesJson,
      },
    })

    revalidatePath('/campaign')
    revalidatePath('/campaign/initiation')
    revalidatePath('/campaign/event', 'layout')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save'
    return { success: false, error: msg }
  }
}
