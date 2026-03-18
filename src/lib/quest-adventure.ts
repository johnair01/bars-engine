/**
 * Quest–Adventure linking: get adventures for a quest (from QuestAdventureLink or QuestThread).
 * @see .specify/specs/game-map-gameboard-bridge/spec.md
 */

'use server'

import { db } from '@/lib/db'

export type AdventureForQuest = {
  adventureId: string
  slug: string
  startNodeId: string | null
  title: string
  moveType: string | null
}

/**
 * Get adventures linked to a quest.
 * Sources: QuestAdventureLink (with moveType), QuestThread (sourceQuestId) for backward compat.
 */
export async function getAdventuresForQuest(questId: string): Promise<AdventureForQuest[]> {
  const [links, threads] = await Promise.all([
    db.questAdventureLink.findMany({
      where: { questId },
      include: {
        adventure: { select: { id: true, slug: true, startNodeId: true, title: true } },
      },
    }),
    db.questThread.findMany({
      where: { sourceQuestId: questId, adventureId: { not: null } },
      include: {
        adventure: { select: { id: true, slug: true, startNodeId: true, title: true } },
      },
    }),
  ])

  const byAdventureId = new Map<string, AdventureForQuest>()

  for (const link of links) {
    if (link.adventure) {
      byAdventureId.set(link.adventureId, {
        adventureId: link.adventure.id,
        slug: link.adventure.slug,
        startNodeId: link.adventure.startNodeId,
        title: link.adventure.title,
        moveType: link.moveType,
      })
    }
  }

  for (const t of threads) {
    if (t.adventure && !byAdventureId.has(t.adventure.id)) {
      byAdventureId.set(t.adventure.id, {
        adventureId: t.adventure.id,
        slug: t.adventure.slug,
        startNodeId: t.adventure.startNodeId,
        title: t.adventure.title,
        moveType: null,
      })
    }
  }

  return Array.from(byAdventureId.values())
}

/**
 * Get hub data for a quest with multiple adventures.
 * Returns list of adventures to choose from.
 */
export async function getAdventureHubData(questId: string): Promise<AdventureForQuest[]> {
  return getAdventuresForQuest(questId)
}
