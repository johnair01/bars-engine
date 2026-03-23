'use server'

/**
 * Campaign Deck server actions — WMC spec.
 * .specify/specs/world-map-campaign-deck-portals/
 */

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
  buildDrawPool,
  collectUsedCardIds,
  drawCards,
  hasDonationPortal,
  hydratePortals,
  isDonationPortalRequired,
  PORTALS_PER_PERIOD,
  type DeckCard,
  type MilestoneView,
  type PeriodPortal,
  type SpokeOutcome,
} from '@/lib/campaign-deck'

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

async function requireAdmin(): Promise<{ id: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  const ok = player.roles.some((r) => r.role.key === 'admin')
  if (!ok) return { error: 'Admin role required' }
  return { id: player.id }
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateDeckCardInput {
  campaignRef: string
  hexagramId: number
  theme?: string
  domain?: string
  cyoaAdventureId?: string
  questId?: string
}

export interface DrawPeriodInput {
  campaignRef: string
  instanceId?: string
  kotterStage?: string
}

export interface CompleteSpokeSessionInput {
  sessionId: string
  outcome: SpokeOutcome
}

export interface CreateMilestoneInput {
  campaignRef: string
  title: string
  description?: string
  targetValue?: number
}

export interface RecordContributionInput {
  milestoneId: string
  barId?: string
  donationRef?: string
  value: number
  note?: string
}

// ─── createDeckCard ───────────────────────────────────────────────────────────

/**
 * Campaign author creates a deck card for a hexagram slot.
 * Only one card per (campaignRef, hexagramId) is allowed.
 */
export async function createDeckCard(
  input: CreateDeckCardInput,
): Promise<{ success: true; cardId: string } | { error: string }> {
  const admin = await requireAdmin()
  if ('error' in admin) return admin
  const playerId = admin.id

  const { campaignRef, hexagramId, theme, domain, cyoaAdventureId, questId } =
    input

  if (hexagramId < 1 || hexagramId > 64) {
    return { error: 'hexagramId must be 1–64' }
  }

  try {
    const card = await db.campaignDeckCard.upsert({
      where: { campaignRef_hexagramId: { campaignRef, hexagramId } },
      create: {
        campaignRef,
        hexagramId,
        theme: theme ?? null,
        domain: domain ?? null,
        cyoaAdventureId: cyoaAdventureId ?? null,
        questId: questId ?? null,
        createdByPlayerId: playerId,
        status: 'draft',
      },
      update: {
        theme: theme ?? undefined,
        domain: domain ?? undefined,
        cyoaAdventureId: cyoaAdventureId ?? undefined,
        questId: questId ?? undefined,
      },
      select: { id: true },
    })
    return { success: true, cardId: card.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

/**
 * Activate a draft deck card so it can be included in period draws.
 */
export async function activateDeckCard(
  cardId: string,
): Promise<{ success: true } | { error: string }> {
  const admin = await requireAdmin()
  if ('error' in admin) return admin

  try {
    await db.campaignDeckCard.update({
      where: { id: cardId },
      data: { status: 'active' },
    })
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

// ─── drawPeriod ───────────────────────────────────────────────────────────────

/**
 * Admin/owner advances to a new period for the campaign.
 * Draws 8 unique cards (no repeats from prior periods) and creates portals.
 * For "Gather Resources" campaigns, ensures at least one donation-domain portal.
 */
export async function drawPeriod(
  input: DrawPeriodInput,
): Promise<{ success: true; periodId: string; portals: PeriodPortal[] } | { error: string }> {
  const admin = await requireAdmin()
  if ('error' in admin) return admin

  const { campaignRef, instanceId, kotterStage } = input

  try {
    // Close any currently active period
    await db.campaignPeriod.updateMany({
      where: { campaignRef, status: 'active' },
      data: { status: 'closed', endedAt: new Date() },
    })

    // Collect all previously drawn card IDs to prevent repeats
    const previousPeriods = await db.campaignPeriod.findMany({
      where: { campaignRef },
      select: { drawnCardIds: true, periodNumber: true },
      orderBy: { periodNumber: 'asc' },
    })

    const usedCardIds = collectUsedCardIds(
      previousPeriods.map((p) => p.drawnCardIds),
    )
    const nextPeriodNumber =
      previousPeriods.length > 0
        ? Math.max(...previousPeriods.map((p) => p.periodNumber)) + 1
        : 1

    // Load all active deck cards for this campaign
    const rawCards = await db.campaignDeckCard.findMany({
      where: { campaignRef, status: 'active' },
      select: {
        id: true,
        campaignRef: true,
        hexagramId: true,
        theme: true,
        domain: true,
        cyoaAdventureId: true,
        questId: true,
        status: true,
      },
    })

    const pool = buildDrawPool(rawCards as DeckCard[], usedCardIds)

    // If Gather Resources campaign needs a donation portal, ensure one is in the draw
    const requiresDonation = isDonationPortalRequired(campaignRef)
    let drawn: DeckCard[]

    if (requiresDonation && !hasDonationPortal(pool.slice(0, PORTALS_PER_PERIOD))) {
      // Find a donation card from the full pool and put it at the last slot
      const donationCard = pool.find((c) => c.domain === 'GATHERING_RESOURCES')
      const nonDonationPool = pool.filter((c) => c.id !== donationCard?.id)
      const base = drawCards(nonDonationPool, PORTALS_PER_PERIOD - (donationCard ? 1 : 0))
      drawn = donationCard ? [...base, donationCard] : base
    } else {
      drawn = drawCards(pool, PORTALS_PER_PERIOD)
    }

    const portals = hydratePortals(drawn)
    const drawnCardIds = drawn.map((c) => c.id)

    // Create the period and portals in a transaction
    const period = await db.$transaction(async (tx) => {
      const p = await tx.campaignPeriod.create({
        data: {
          campaignRef,
          instanceId: instanceId ?? null,
          periodNumber: nextPeriodNumber,
          kotterStage: kotterStage ?? null,
          status: 'active',
          drawnCardIds: JSON.stringify(drawnCardIds),
          startedAt: new Date(),
        },
        select: { id: true },
      })

      await tx.campaignPortal.createMany({
        data: portals.map((portal) => ({
          periodId: p.id,
          campaignRef,
          slotIndex: portal.slotIndex,
          hexagramId: portal.hexagramId,
          deckCardId: portal.deckCardId,
          cyoaAdventureId: portal.cyoaAdventureId,
          questId: portal.questId,
        })),
      })

      return p
    })

    return { success: true, periodId: period.id, portals }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

// ─── getPeriodPortals ─────────────────────────────────────────────────────────

export interface PortalWithMeta extends PeriodPortal {
  portalId: string
  completionCount: number
  periodId: string
}

/**
 * Returns the 8 active period portals for a campaign, hydrated with quest and
 * CYOA adventure info for rendering the hub page.
 */
export async function getPeriodPortals(
  campaignRef: string,
): Promise<PortalWithMeta[] | { error: string }> {
  try {
    const activePeriod = await db.campaignPeriod.findFirst({
      where: { campaignRef, status: 'active' },
      orderBy: { periodNumber: 'desc' },
      select: { id: true },
    })

    if (!activePeriod) {
      return { error: 'No active period found for campaign' }
    }

    const portals = await db.campaignPortal.findMany({
      where: { periodId: activePeriod.id },
      orderBy: { slotIndex: 'asc' },
      select: {
        id: true,
        slotIndex: true,
        hexagramId: true,
        deckCardId: true,
        cyoaAdventureId: true,
        questId: true,
        completionCount: true,
        periodId: true,
        deckCard: { select: { theme: true } },
      },
    })

    return portals.map((p) => ({
      portalId: p.id,
      slotIndex: p.slotIndex,
      hexagramId: p.hexagramId,
      deckCardId: p.deckCardId,
      cyoaAdventureId: p.cyoaAdventureId,
      questId: p.questId,
      theme: p.deckCard?.theme ?? null,
      completionCount: p.completionCount,
      periodId: p.periodId,
    }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

// ─── startSpokeSession ────────────────────────────────────────────────────────

/**
 * Player begins a spoke CYOA adventure. Creates a SpokeSession in_progress.
 * Players can run multiple sessions per portal but must finish before returning
 * to the hub (enforced at UI layer; DB allows multiple).
 */
export async function startSpokeSession(
  portalId: string,
): Promise<{ success: true; sessionId: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  try {
    const portal = await db.campaignPortal.findUnique({
      where: { id: portalId },
      select: { campaignRef: true },
    })
    if (!portal) return { error: 'Portal not found' }

    const session = await db.spokeSession.create({
      data: {
        portalId,
        playerId,
        campaignRef: portal.campaignRef,
        status: 'in_progress',
        barSeedIds: '[]',
      },
      select: { id: true },
    })

    return { success: true, sessionId: session.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

// ─── completeSpokeSession ─────────────────────────────────────────────────────

/**
 * Marks a spoke session complete, emits BAR seeds (CustomBar status=seed) and
 * optionally a personal quest, increments the portal's completion count.
 */
export async function completeSpokeSession(
  input: CompleteSpokeSessionInput,
): Promise<{ success: true; barSeedIds: string[] } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const { sessionId, outcome } = input

  try {
    const session = await db.spokeSession.findUnique({
      where: { id: sessionId },
      select: { portalId: true, campaignRef: true, playerId: true, status: true },
    })

    if (!session) return { error: 'Session not found' }
    if (session.playerId !== playerId) return { error: 'Forbidden' }
    if (session.status !== 'in_progress') return { error: 'Session not in progress' }

    // Create BAR seeds for each emitted seed ID (already created by CYOA engine;
    // here we just link them to the session and mark status=seed if needed)
    if (outcome.barSeedIds.length > 0) {
      await db.customBar.updateMany({
        where: { id: { in: outcome.barSeedIds }, creatorId: playerId },
        data: { status: 'seed', spokeSessionId: sessionId },
      })
    }

    await db.$transaction([
      db.spokeSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          moveType: outcome.moveType,
          gmFace: outcome.gmFace,
          barSeedIds: JSON.stringify(outcome.barSeedIds),
          generatedQuestId: outcome.generatedQuestId ?? null,
          completedAt: new Date(),
          moveChosenAt: new Date(),
          faceChosenAt: new Date(),
        },
      }),
      db.campaignPortal.update({
        where: { id: session.portalId },
        data: { completionCount: { increment: 1 } },
      }),
    ])

    return { success: true, barSeedIds: outcome.barSeedIds }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

// ─── createMilestone ──────────────────────────────────────────────────────────

/**
 * Player proposes a public campaign milestone (admin approval required).
 */
export async function createMilestone(
  input: CreateMilestoneInput,
): Promise<{ success: true; milestoneId: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const { campaignRef, title, description, targetValue } = input

  try {
    const milestone = await db.campaignMilestone.create({
      data: {
        campaignRef,
        title,
        description: description ?? null,
        targetValue: targetValue ?? null,
        status: 'proposed',
        proposedByPlayerId: playerId,
      },
      select: { id: true },
    })
    return { success: true, milestoneId: milestone.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

/**
 * Admin approves a proposed milestone, making it publicly active.
 */
export async function approveMilestone(
  milestoneId: string,
): Promise<{ success: true } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  try {
    await db.campaignMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'active',
        approvedByPlayerId: playerId,
        approvedAt: new Date(),
      },
    })
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

// ─── recordContribution ───────────────────────────────────────────────────────

/**
 * Records a player's contribution toward a milestone and updates its running total.
 */
export async function recordContribution(
  input: RecordContributionInput,
): Promise<{ success: true; contributionId: string; newTotal: number } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const { milestoneId, barId, donationRef, value, note } = input

  try {
    const [contribution, milestone] = await db.$transaction([
      db.milestoneContribution.create({
        data: {
          milestoneId,
          playerId,
          barId: barId ?? null,
          donationRef: donationRef ?? null,
          value,
          note: note ?? null,
        },
        select: { id: true },
      }),
      db.campaignMilestone.update({
        where: { id: milestoneId },
        data: { currentValue: { increment: value } },
        select: { currentValue: true },
      }),
    ])

    return {
      success: true,
      contributionId: contribution.id,
      newTotal: milestone.currentValue,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

// ─── getMilestones ────────────────────────────────────────────────────────────

/**
 * Returns active (approved) milestones for a campaign, sorted by currentValue desc.
 */
export async function getMilestones(
  campaignRef: string,
  status: 'proposed' | 'active' | 'complete' = 'active',
): Promise<MilestoneView[] | { error: string }> {
  try {
    const milestones = await db.campaignMilestone.findMany({
      where: { campaignRef, status },
      orderBy: { currentValue: 'desc' },
      select: {
        id: true,
        campaignRef: true,
        title: true,
        description: true,
        targetValue: true,
        currentValue: true,
        status: true,
        proposedByPlayerId: true,
        approvedByPlayerId: true,
        approvedAt: true,
      },
    })
    return milestones
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}
