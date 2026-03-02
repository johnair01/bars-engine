'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireAdmin(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

/**
 * Fetch raw passage for editing. Returns null if no passage exists (e.g. hardcoded node).
 */
export async function getCampaignPassageForEdit(
  adventureSlug: string,
  nodeId: string
): Promise<{ text: string; choices: { text: string; targetId: string }[] } | null> {
  await requireAdmin()

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
 * Upsert campaign passage. Creates if missing, updates if exists.
 * Requires admin. Used for in-context campaign editing.
 */
export async function upsertCampaignPassage(
  adventureSlug: string,
  nodeId: string,
  data: { text: string; choices: { text: string; targetId: string }[] }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireAdmin()

    const adventure = await db.adventure.findFirst({
      where: { slug: adventureSlug, status: 'ACTIVE' },
    })
    if (!adventure) {
      return { success: false, error: 'Adventure not found or inactive' }
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
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save'
    return { success: false, error: msg }
  }
}
