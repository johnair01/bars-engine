/**
 * Campaign Domain Decks
 *
 * One deck per allyship domain per instance. Draw filtered by Kotter stage;
 * cards stay out until deck exhausted, then reset.
 * See .specify/specs/campaign-domain-decks/spec.md
 */

import { db } from '@/lib/db'
import { getStageAction } from '@/lib/kotter'
import type { AllyshipDomain } from '@/lib/kotter'

function parseDomainDeckCycles(
  raw: unknown
): Record<string, { playedQuestIds: string[]; cycleId: string }> {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>
  const result: Record<string, { playedQuestIds: string[]; cycleId: string }> = {}
  for (const [domain, val] of Object.entries(obj)) {
    if (val && typeof val === 'object' && 'playedQuestIds' in val && 'cycleId' in val) {
      const v = val as { playedQuestIds: unknown; cycleId: unknown }
      const ids = Array.isArray(v.playedQuestIds)
        ? v.playedQuestIds.filter((x): x is string => typeof x === 'string')
        : []
      result[domain] = {
        playedQuestIds: ids,
        cycleId: String(v.cycleId ?? ''),
      }
    }
  }
  return result
}

/**
 * Get quest IDs eligible for the domain deck (full pool for this cycle).
 * Deck = quests with allyshipDomain matching, kotterStage matching or null, instance-scoped.
 */
export async function getCampaignDomainDeck(
  instanceId: string,
  campaignRef: string,
  domain: AllyshipDomain,
  kotterStage: number
): Promise<{ questIds: string[]; cycleId: string }> {
  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { domainDeckCycles: true },
  })
  const cycles = parseDomainDeckCycles(instance?.domainDeckCycles ?? {})
  const cycle = cycles[domain] ?? {
    playedQuestIds: [] as string[],
    cycleId: `${instanceId}-${domain}-${Date.now()}`,
  }

  const stage = Math.max(1, Math.min(8, Math.round(kotterStage)))

  const threadQuests = await db.threadQuest.findMany({
    where: {
      thread: { adventure: { campaignRef } },
      quest: {
        allyshipDomain: domain,
        kotterStage: stage,
      },
    },
    select: { questId: true },
  })
  const fromThreads = threadQuests.map((tq) => tq.questId)

  const fromBars = await db.customBar.findMany({
    where: {
      campaignRef,
      allyshipDomain: domain,
      type: { in: ['quest', 'inspiration', 'vibe'] },
      status: 'active',
      kotterStage: stage,
    },
    select: { id: true },
  })
  const barIds = fromBars.map((b) => b.id)

  const combined = [...new Set([...fromThreads, ...barIds])]
  return { questIds: combined, cycleId: cycle.cycleId }
}

/**
 * Get domain deck with moveType for path-dependent drawing.
 * When slot has moveType, prefer quests with matching moveType.
 */
export async function getCampaignDomainDeckWithMoveTypes(
  instanceId: string,
  campaignRef: string,
  domain: AllyshipDomain,
  kotterStage: number
): Promise<{ items: { id: string; moveType: string | null }[]; cycleId: string }> {
  const { questIds, cycleId } = await getCampaignDomainDeck(
    instanceId,
    campaignRef,
    domain,
    kotterStage
  )
  if (questIds.length === 0) return { items: [], cycleId }

  const bars = await db.customBar.findMany({
    where: { id: { in: questIds } },
    select: { id: true, moveType: true },
  })
  const byId = new Map(bars.map((b) => [b.id, { id: b.id, moveType: b.moveType }]))
  const items = questIds.map((id) => byId.get(id) ?? { id, moveType: null })
  return { items, cycleId }
}

/**
 * Draw up to count quest IDs from the domain deck.
 * Excludes: already on board, played this cycle.
 * When deck exhausted, resets cycle and draws from full pool.
 * When slotMoveTypes provided, draw per-slot preferring quests with matching moveType (path-dependent).
 */
export async function drawFromDeck(
  instanceId: string,
  campaignRef: string,
  domain: AllyshipDomain,
  kotterStage: number,
  count: number,
  excludeQuestIds: string[] = [],
  slotMoveTypes?: (string | null)[]
): Promise<{ questIds: string[]; exhausted: boolean }> {
  const exclude = new Set(excludeQuestIds)

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { domainDeckCycles: true },
  })
  const cycles = parseDomainDeckCycles(instance?.domainDeckCycles ?? {})
  let cycle = cycles[domain] ?? {
    playedQuestIds: [] as string[],
    cycleId: `${instanceId}-${domain}-${Date.now()}`,
  }

  if (slotMoveTypes != null && slotMoveTypes.length > 0) {
    let { items } = await getCampaignDomainDeckWithMoveTypes(
      instanceId,
      campaignRef,
      domain,
      kotterStage
    )
    if (items.length === 0) {
      const didReset = await resetDeckCycle(instanceId, domain)
      if (didReset) {
        const fresh = await getCampaignDomainDeckWithMoveTypes(
          instanceId,
          campaignRef,
          domain,
          kotterStage
        )
        items = fresh.items
      }
    }

    const result: string[] = []
    const drawn = new Set(exclude)
    for (let i = 0; i < Math.min(count, slotMoveTypes.length); i++) {
      const slotMove = slotMoveTypes[i]?.trim() || null
      const available = items.filter((d) => !drawn.has(d.id) && !cycle.playedQuestIds.includes(d.id))
      if (available.length === 0) break

      const matching = slotMove
        ? available.filter((d) => d.moveType?.toLowerCase() === slotMove.toLowerCase())
        : []
      const pool = matching.length > 0 ? matching : available
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      const picked = shuffled[0]
      if (picked) {
        result.push(picked.id)
        drawn.add(picked.id)
      }
    }
    return { questIds: result, exhausted: false }
  }

  const { questIds: pool } = await getCampaignDomainDeck(
    instanceId,
    campaignRef,
    domain,
    kotterStage
  )
  const available = pool.filter((id) => !exclude.has(id) && !cycle.playedQuestIds.includes(id))

  if (available.length === 0) {
    const didReset = await resetDeckCycle(instanceId, domain)
    if (didReset) {
      const fresh = await getCampaignDomainDeck(
        instanceId,
        campaignRef,
        domain,
        kotterStage
      )
      const freshAvailable = fresh.questIds.filter((id) => !exclude.has(id))
      if (freshAvailable.length === 0) return { questIds: [], exhausted: true }
      const shuffled = [...freshAvailable].sort(() => Math.random() - 0.5)
      return {
        questIds: shuffled.slice(0, count),
        exhausted: false,
      }
    }
    return { questIds: [], exhausted: true }
  }

  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return {
    questIds: shuffled.slice(0, count),
    exhausted: false,
  }
}

/**
 * Mark a quest as played this cycle (stays out until deck exhausted).
 */
export async function markQuestPlayed(
  instanceId: string,
  domain: AllyshipDomain,
  questId: string
): Promise<boolean> {
  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { domainDeckCycles: true },
  })
  const cycles = parseDomainDeckCycles(instance?.domainDeckCycles ?? {})
  const cycle = cycles[domain] ?? {
    playedQuestIds: [] as string[],
    cycleId: `${instanceId}-${domain}-${Date.now()}`,
  }
  if (cycle.playedQuestIds.includes(questId)) return true

  const updated = {
    ...cycles,
    [domain]: {
      ...cycle,
      playedQuestIds: [...cycle.playedQuestIds, questId],
    },
  }

  await db.instance.update({
    where: { id: instanceId },
    data: { domainDeckCycles: updated as object },
  })
  return true
}

/**
 * Reset the deck cycle for a domain (return all to pool).
 */
export async function resetDeckCycle(
  instanceId: string,
  domain: AllyshipDomain
): Promise<boolean> {
  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { domainDeckCycles: true },
  })
  const cycles = parseDomainDeckCycles(instance?.domainDeckCycles ?? {})
  const updated = {
    ...cycles,
    [domain]: {
      playedQuestIds: [] as string[],
      cycleId: `${instanceId}-${domain}-${Date.now()}`,
    },
  }

  await db.instance.update({
    where: { id: instanceId },
    data: { domainDeckCycles: updated as object },
  })
  return true
}

/**
 * Translate quest presentation for the current Kotter stage.
 * Returns title and description contextualized by stage action.
 */
export function translateQuestForStage(
  quest: { title: string; description: string | null },
  domain: AllyshipDomain,
  kotterStage: number
): { title: string; description: string } {
  const stage = Math.max(1, Math.min(8, Math.round(kotterStage)))
  const stageAction = getStageAction(stage, domain)
  const prefix = `${stageAction} — `
  const title = quest.title.startsWith(prefix) ? quest.title : `${prefix}${quest.title}`
  const desc = quest.description?.trim() ?? ''
  const description = desc ? `${stageAction}\n\n${desc}` : stageAction
  return { title, description }
}

export type CampaignMove = 'WAKE_UP' | 'CLEAN_UP' | 'GROW_UP' | 'SHOW_UP'

export const CAMPAIGN_MOVES: CampaignMove[] = [
  'WAKE_UP',
  'CLEAN_UP',
  'GROW_UP',
  'SHOW_UP',
]
