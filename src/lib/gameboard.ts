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
 * Get deck items with moveType for path-dependent drawing.
 * When slot has moveType, prefer quests with matching moveType.
 */
export async function getCampaignDeckWithMoveTypes(
  campaignRef: string,
  period?: number,
  playerId?: string
): Promise<{ id: string; moveType: string | null }[]> {
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
        adventure: { campaignRef },
      },
    },
    include: {
      quest: { select: { id: true, kotterStage: true, emotionalAlchemyTag: true, moveType: true } },
    },
  })
  const matchesEmotionalAlchemy = (tag: string | null) =>
    emotionalAlchemy == null || tag == null || tag === emotionalAlchemy

  let fromThreads: { id: string; moveType: string | null }[] = threadQuests
    .filter((tq) => matchesEmotionalAlchemy(tq.quest.emotionalAlchemyTag))
    .map((tq) => ({ id: tq.quest.id, moveType: tq.quest.moveType }))
  if (period != null) {
    fromThreads = threadQuests
      .filter((tq) => tq.quest.kotterStage === period && matchesEmotionalAlchemy(tq.quest.emotionalAlchemyTag))
      .map((tq) => ({ id: tq.quest.id, moveType: tq.quest.moveType }))
  }

  const fromBars = await db.customBar.findMany({
    where: {
      campaignRef,
      type: { in: ['quest', 'inspiration', 'vibe'] },
      status: 'active',
      ...(period != null && { kotterStage: period }),
      ...emotionalAlchemyFilter,
    },
    select: { id: true, moveType: true },
  })

  const byId = new Map<string, { id: string; moveType: string | null }>()
  for (const x of fromThreads) byId.set(x.id, x)
  for (const b of fromBars) byId.set(b.id, { id: b.id, moveType: b.moveType })
  return Array.from(byId.values())
}

/**
 * Draw up to `count` quest IDs from the campaign deck, excluding already-drawn.
 * When playerId provided, deck is filtered by player's emotional_alchemy (Bruised Banana onboarding).
 * When slotMoveTypes provided, draw per-slot preferring quests with matching moveType (path-dependent).
 */
export async function drawFromCampaignDeck(
  instanceId: string,
  campaignRef: string,
  period: number,
  count: number,
  playerId?: string,
  slotMoveTypes?: (string | null)[]
): Promise<string[]> {
  const existing = await db.gameboardSlot.findMany({
    where: { instanceId, campaignRef, period },
    select: { questId: true },
  })
  const drawnIds = new Set(
    existing.map((s) => s.questId).filter((id): id is string => !!id)
  )

  if (slotMoveTypes != null && slotMoveTypes.length > 0) {
    const deck = await getCampaignDeckWithMoveTypes(campaignRef, period, playerId)
    if (deck.length === 0) return []

    const result: string[] = []
    for (let i = 0; i < Math.min(count, slotMoveTypes.length); i++) {
      const slotMove = slotMoveTypes[i]?.trim() || null
      const available = deck.filter((d) => !drawnIds.has(d.id))
      if (available.length === 0) break

      const matching = slotMove
        ? available.filter((d) => d.moveType?.toLowerCase() === slotMove.toLowerCase())
        : []
      const pool = matching.length > 0 ? matching : available
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      const picked = shuffled[0]
      if (picked) {
        result.push(picked.id)
        drawnIds.add(picked.id)
      }
    }
    return result
  }

  const deck = await getCampaignDeckQuestIds(campaignRef, period, playerId)
  if (deck.length === 0) return []

  const available = deck.filter((id) => !drawnIds.has(id))
  if (available.length === 0) return []

  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
