/**
 * Gameboard and Campaign Deck
 *
 * Campaign deck = quests in threads with adventure.campaignRef.
 * Draw logic for populating gameboard slots.
 * See .specify/specs/gameboard-campaign-deck/spec.md
 */

import { db } from '@/lib/db'

/**
 * Get quest IDs eligible for the campaign deck.
 * Deck = quests in ThreadQuest whose thread has adventure with campaignRef.
 * Also includes CustomBars with campaignRef matching (for campaign-tagged quests).
 * When period provided, filter to quests with kotterStage = period (Kotter-stage alignment).
 * When playerId provided and player has emotional_alchemy in storyProgress, prefer quests
 * with matching emotionalAlchemyTag (exclude quests tagged for other branches).
 */
export async function getCampaignDeckQuestIds(
  campaignRef: string,
  period?: number,
  playerId?: string
): Promise<string[]> {
  let emotionalAlchemy: string | null = null
  if (playerId) {
    const player = await db.player.findUnique({
      where: { id: playerId },
      select: { storyProgress: true },
    })
    if (player?.storyProgress) {
      try {
        const parsed = JSON.parse(player.storyProgress) as { state?: { emotional_alchemy?: string } }
        const ea = parsed?.state?.emotional_alchemy
        if (typeof ea === 'string' && ['aligned', 'curious', 'skeptical'].includes(ea)) {
          emotionalAlchemy = ea
        }
      } catch {
        // ignore
      }
    }
  }

  const emotionalAlchemyFilter =
    emotionalAlchemy != null
      ? { OR: [{ emotionalAlchemyTag: null }, { emotionalAlchemyTag: emotionalAlchemy }] }
      : {}

  const threadQuests = await db.threadQuest.findMany({
    where: {
      thread: {
        adventure: {
          campaignRef,
        },
      },
    },
    include: {
      quest: { select: { id: true, kotterStage: true, emotionalAlchemyTag: true } },
    },
  })
  const matchesEmotionalAlchemy = (tag: string | null) =>
    emotionalAlchemy == null || tag == null || tag === emotionalAlchemy

  let fromThreads = threadQuests.filter((tq) => matchesEmotionalAlchemy(tq.quest.emotionalAlchemyTag)).map((tq) => tq.quest.id)
  if (period != null) {
    fromThreads = threadQuests
      .filter((tq) => tq.quest.kotterStage === period && matchesEmotionalAlchemy(tq.quest.emotionalAlchemyTag))
      .map((tq) => tq.quest.id)
  }

  const fromBars = await db.customBar.findMany({
    where: {
      campaignRef,
      type: { in: ['quest', 'inspiration', 'vibe'] },
      status: 'active',
      ...(period != null && { kotterStage: period }),
      ...emotionalAlchemyFilter,
    },
    select: { id: true },
  })
  const barIds = fromBars.map((b) => b.id)

  const combined = [...new Set([...fromThreads, ...barIds])]
  return combined
}

/**
 * Draw up to `count` quest IDs from the campaign deck, excluding already-drawn.
 * When playerId provided, deck is filtered by player's emotional_alchemy (Bruised Banana onboarding).
 */
export async function drawFromCampaignDeck(
  instanceId: string,
  campaignRef: string,
  period: number,
  count: number,
  playerId?: string
): Promise<string[]> {
  const deck = await getCampaignDeckQuestIds(campaignRef, period, playerId)
  if (deck.length === 0) return []

  const existing = await db.gameboardSlot.findMany({
    where: { instanceId, campaignRef, period },
    select: { questId: true },
  })
  const drawnIds = new Set(
    existing.map((s) => s.questId).filter((id): id is string => !!id)
  )
  const available = deck.filter((id) => !drawnIds.has(id))
  if (available.length === 0) return []

  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
