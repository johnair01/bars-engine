/**
 * Vault bingo query layer.
 *
 * Two reads per Vault render:
 *   loadVaultBingoCards     — cards the player already owns
 *   loadAvailableEventCards — events they can claim a card for (not yet claimed)
 */
import { db } from '@/lib/db'
import type { BingoCardSquare, BingoPrizeConfig } from '@/lib/community-character/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VaultBingoCardRow {
  id: string
  eventId: string
  campaignRef: string
  eventTitle: string
  eventType: string
  eventStart: Date | null
  squares: BingoCardSquare[]
  completedLines: number[][]
  prizeClaimedAt: Date | null
  prizeConfig: BingoPrizeConfig | null
  /** Best invite BAR id for this campaign — used to build per-square copy links. */
  inviteBarId: string | null
}

export interface AvailableEventRow {
  eventId: string
  campaignRef: string
  instanceId: string | null
  eventTitle: string
  eventType: string
  eventStart: Date | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePrizeConfig(raw: unknown): BingoPrizeConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.prizeType === 'vibeulon' && typeof r.vibeulonAmount === 'number') {
    return { prizeType: 'vibeulon', vibeulonAmount: r.vibeulonAmount }
  }
  if (r.prizeType === 'custom' && typeof r.description === 'string') {
    return { prizeType: 'custom', description: r.description }
  }
  return null
}

function parseSquares(raw: unknown): BingoCardSquare[] {
  if (!Array.isArray(raw)) return []
  return raw as BingoCardSquare[]
}

function parseLines(raw: unknown): number[][] {
  if (!Array.isArray(raw)) return []
  return raw as number[][]
}

// ─── Load player's existing bingo cards ──────────────────────────────────────

export async function loadVaultBingoCards(playerId: string): Promise<VaultBingoCardRow[]> {
  const cards = await db.eventBingoCard.findMany({
    where: { playerId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          eventType: true,
          startTime: true,
          bingoConfig: true,
          linkedCampaignId: true,
          instance: { select: { campaignRef: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (cards.length === 0) return []

  // Gather distinct campaignRefs to batch-fetch invite BARs
  const refs = [...new Set(cards.map((c) => c.campaignRef).filter(Boolean))]
  const inviteBars =
    refs.length > 0
      ? await db.customBar.findMany({
          where: {
            type: 'event_invite',
            status: 'active',
            archivedAt: null,
            campaignRef: { in: refs },
          },
          select: { id: true, campaignRef: true },
          orderBy: { createdAt: 'desc' },
        })
      : []

  // First invite BAR per campaignRef
  const barByCampaign = new Map<string, string>()
  for (const bar of inviteBars) {
    if (bar.campaignRef && !barByCampaign.has(bar.campaignRef)) {
      barByCampaign.set(bar.campaignRef, bar.id)
    }
  }

  return cards.map((card) => ({
    id: card.id,
    eventId: card.eventId,
    campaignRef: card.campaignRef,
    eventTitle: card.event.title,
    eventType: card.event.eventType,
    eventStart: card.event.startTime,
    squares: parseSquares(card.squares),
    completedLines: parseLines(card.completedLines),
    prizeClaimedAt: card.prizeClaimedAt,
    prizeConfig: parsePrizeConfig(card.event.bingoConfig),
    inviteBarId: barByCampaign.get(card.campaignRef) ?? null,
  }))
}

// ─── Load events the player can still claim a card for ───────────────────────

export async function loadAvailableEventCards(playerId: string): Promise<AvailableEventRow[]> {
  // Events already claimed
  const existing = await db.eventBingoCard.findMany({
    where: { playerId },
    select: { eventId: true },
  })
  const claimedIds = new Set(existing.map((c) => c.eventId))

  // Player's campaign memberships → instanceIds
  const memberships = await db.instanceMembership.findMany({
    where: { playerId },
    select: { instanceId: true },
  })
  const instanceIds = memberships.map((m) => m.instanceId)

  const events = await db.eventArtifact.findMany({
    where: {
      status: { in: ['scheduled', 'live'] },
      OR: [
        { visibility: 'public' },
        { instanceId: { in: instanceIds } },
      ],
    },
    select: {
      id: true,
      title: true,
      eventType: true,
      startTime: true,
      instanceId: true,
      instance: { select: { campaignRef: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 10,
  })

  return events
    .filter((e) => !claimedIds.has(e.id))
    .map((e) => ({
      eventId: e.id,
      campaignRef: e.instance?.campaignRef ?? '',
      instanceId: e.instanceId,
      eventTitle: e.title,
      eventType: e.eventType,
      eventStart: e.startTime,
    }))
}
