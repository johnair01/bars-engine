/**
 * Campaign Deck — pure functions for period draw, portal hydration, and spoke outcomes.
 * WMC spec: .specify/specs/world-map-campaign-deck-portals/spec.md
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeckCard {
  id: string
  campaignRef: string
  hexagramId: number
  theme: string | null
  domain: string | null
  cyoaAdventureId: string | null
  questId: string | null
  status: string
}

export interface PeriodPortal {
  slotIndex: number
  hexagramId: number | null
  deckCardId: string | null
  cyoaAdventureId: string | null
  questId: string | null
  theme: string | null
}

export interface SpokeOutcome {
  moveType: string
  gmFace: string
  barSeedIds: string[]
  generatedQuestId: string | null
}

export interface MilestoneView {
  id: string
  campaignRef: string
  title: string
  description: string | null
  targetValue: number | null
  currentValue: number
  status: string
  proposedByPlayerId: string
  approvedByPlayerId: string | null
  approvedAt: Date | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const GATHER_RESOURCES_CAMPAIGN_REFS = ['bruised-banana'] as const

export const PORTALS_PER_PERIOD = 8

export const DONATION_DOMAIN = 'GATHERING_RESOURCES'

// ─── Pure functions ───────────────────────────────────────────────────────────

/**
 * Returns all deck cards eligible for a new period draw — i.e. cards that have
 * not appeared in any previous period for this campaign.
 */
export function buildDrawPool(
  allCards: DeckCard[],
  usedCardIds: string[],
): DeckCard[] {
  const used = new Set(usedCardIds)
  return allCards.filter((c) => c.status === 'active' && !used.has(c.id))
}

/**
 * Deterministically draws `count` cards from the pool.
 * Order is preserved from the pool (first N eligible cards).
 * Throws if the pool has fewer cards than requested.
 */
export function drawCards(pool: DeckCard[], count: number): DeckCard[] {
  if (pool.length < count) {
    throw new Error(
      `Draw pool has only ${pool.length} cards; ${count} requested.`,
    )
  }
  return pool.slice(0, count)
}

/**
 * Maps drawn cards to portal slot descriptors (slotIndex 0–7).
 * If a "Gather Resources" campaign requires a donation portal but none of the
 * drawn cards covers that domain, the last slot is reserved for a donation card
 * if one is available in the overflow pool.
 */
export function hydratePortals(drawn: DeckCard[]): PeriodPortal[] {
  return drawn.map((card, idx) => ({
    slotIndex: idx,
    hexagramId: card.hexagramId,
    deckCardId: card.id,
    cyoaAdventureId: card.cyoaAdventureId,
    questId: card.questId,
    theme: card.theme,
  }))
}

/**
 * Returns true when the campaign requires at least one donation-path portal
 * in each period (i.e. "Gather Resources" campaigns like Bruised Banana).
 */
export function isDonationPortalRequired(campaignRef: string): boolean {
  return (GATHER_RESOURCES_CAMPAIGN_REFS as readonly string[]).includes(
    campaignRef,
  )
}

/**
 * Returns true when the drawn set already contains a portal for the donation
 * domain, so no override is needed.
 */
export function hasDonationPortal(drawn: DeckCard[]): boolean {
  return drawn.some((c) => c.domain === DONATION_DOMAIN)
}

/**
 * Collects all card IDs that appeared in previous periods to seed the exclusion
 * set for the next draw. Accepts the raw `drawnCardIds` JSON strings stored on
 * each CampaignPeriod record.
 */
export function collectUsedCardIds(drawnCardIdsJsonList: string[]): string[] {
  return drawnCardIdsJsonList.flatMap((json) => {
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? (parsed as string[]) : []
    } catch {
      return []
    }
  })
}
