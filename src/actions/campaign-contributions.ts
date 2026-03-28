'use server'

/**
 * CCV — Campaign Contribution Visibility
 * Server actions for player contribution tracking and aggregated campaign stats.
 *
 * Design: API-first — types defined before UI wiring.
 * Pattern: follows src/actions/campaign-overview.ts and src/actions/admin.ts conventions.
 */

import { db } from '@/lib/db'

// ============================================================
// Types
// ============================================================

/** The type of tracked action that counts as a campaign contribution. */
export type ContributionSourceType = 'quest' | 'bar' | 'milestone' | 'adventure'

/** Status of a contribution record — active or soft-archived (retired). */
export type ContributionStatus = 'active' | 'retired'

/**
 * A single contribution item in the player's campaign contribution list.
 * Contains the GM-written label for player-facing display.
 * Retired items were completed before a milestone/adventure was soft-archived;
 * they are still counted in historical progress but marked as retired.
 */
export type MyContributionItem = {
  /** Unique ID of the underlying record (PlayerQuest.id or MilestoneContribution.id) */
  id: string
  sourceType: ContributionSourceType
  /** FK to the specific action (CustomBar.id, CampaignMilestone.id, etc.) */
  sourceId: string
  /**
   * GM-written label for this contribution, sourced from ContributionAnnotation.gmLabel
   * if the GM annotated this action, or falling back to the action's own title.
   */
  gmLabel: string
  /** active = counts toward progress; retired = soft-archived but historically preserved */
  status: ContributionStatus
  /** When the player completed this action */
  completedAt: Date | null
  /** Contribution weight (1 for quests/adventures; dollar amount for milestone donations) */
  value: number
}

/**
 * Full result returned by getMyContributions.
 * The completedCount / availableCount pair drives the progress bar.
 * Milestones whose triggerCount ≤ completedCount are considered unlocked.
 */
export type GetMyContributionsResult = {
  campaignRef: string
  playerId: string
  /** All contribution items, sorted newest-first */
  contributions: MyContributionItem[]
  /** Count of active contributions (excludes retired) */
  completedCount: number
  /**
   * Total annotated actions for this campaign that are still active.
   * Used as the denominator for the progress bar.
   * Falls back to completedCount when no annotations exist yet.
   */
  availableCount: number
  /** IDs of CampaignMilestones the player has reached (currentValue ≥ targetValue or completedCount ≥ triggerCount) */
  unlockedMilestoneIds: string[]
}

// ============================================================
// getMyContributions
// ============================================================

/**
 * Returns a player's campaign contribution summary for a given campaignRef.
 *
 * Data sources (leveraging existing infrastructure):
 * 1. ContributionAnnotation — GM-authored labels for specific annotated actions
 * 2. PlayerQuest (status='completed') where CustomBar.campaignRef matches
 * 3. MilestoneContribution where CampaignMilestone.campaignRef matches
 *
 * Privacy: this action is scoped to a single playerId — never returns
 * cross-player individual data. Use getCampaignAggregate() for aggregated totals.
 *
 * @param campaignRef  e.g. 'bruised-banana'
 * @param playerId     The authenticated player's ID
 */
export async function getMyContributions(
  campaignRef: string,
  playerId: string,
): Promise<GetMyContributionsResult> {
  // Fetch all three data sources in parallel
  const [annotations, completedQuests, milestoneContributions, activeMilestones] =
    await Promise.all([
      // 1. GM annotations for this campaign (provide labels + retirement status)
      db.contributionAnnotation.findMany({
        where: { campaignRef },
      }),

      // 2. Completed PlayerQuests linked to this campaign
      db.playerQuest.findMany({
        where: {
          playerId,
          status: 'completed',
          quest: { campaignRef },
        },
        include: {
          quest: {
            select: {
              id: true,
              title: true,
              archivedAt: true,
              campaignRef: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),

      // 3. MilestoneContributions for this player in this campaign
      db.milestoneContribution.findMany({
        where: {
          playerId,
          milestone: { campaignRef },
        },
        include: {
          milestone: {
            select: {
              id: true,
              title: true,
              status: true,
              targetValue: true,
              currentValue: true,
            },
          },
        },
        orderBy: { contributedAt: 'desc' },
      }),

      // 4. Active milestones — used to determine unlocked milestone IDs
      db.campaignMilestone.findMany({
        where: {
          campaignRef,
          status: { in: ['active', 'complete'] },
        },
        select: {
          id: true,
          targetValue: true,
          currentValue: true,
          status: true,
        },
      }),
    ])

  // Build a lookup map for annotation data by actionType+actionId
  type AnnotationKey = `${string}:${string}`
  const annotationMap = new Map<
    AnnotationKey,
    (typeof annotations)[number]
  >()
  for (const ann of annotations) {
    annotationMap.set(`${ann.actionType}:${ann.actionId}`, ann)
  }

  // --- Build contribution items from completed PlayerQuests ---
  const questItems: MyContributionItem[] = completedQuests.map((pq) => {
    const annotation = annotationMap.get(`quest:${pq.questId}`)
    // A quest is retired if: (a) GM explicitly retired its annotation, or
    // (b) the quest itself has been soft-archived (archivedAt set)
    const isRetired =
      annotation?.status === 'retired' || pq.quest.archivedAt != null
    return {
      id: pq.id,
      sourceType: 'quest' as ContributionSourceType,
      sourceId: pq.questId,
      gmLabel: annotation?.gmLabel ?? pq.quest.title,
      status: (isRetired ? 'retired' : 'active') as ContributionStatus,
      completedAt: pq.completedAt,
      value: 1,
    }
  })

  // --- Build contribution items from MilestoneContributions ---
  const milestoneItems: MyContributionItem[] = milestoneContributions.map((mc) => {
    const annotation = annotationMap.get(`milestone:${mc.milestoneId}`)
    const isRetired =
      annotation?.status === 'retired' || mc.milestone.status === 'retired'
    return {
      id: mc.id,
      sourceType: 'milestone' as ContributionSourceType,
      sourceId: mc.milestoneId,
      gmLabel: annotation?.gmLabel ?? mc.milestone.title,
      status: (isRetired ? 'retired' : 'active') as ContributionStatus,
      completedAt: mc.contributedAt,
      value: mc.value,
    }
  })

  // Merge and sort all contributions newest-first
  const allItems: MyContributionItem[] = [
    ...questItems,
    ...milestoneItems,
  ].sort(
    (a, b) =>
      (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
  )

  const completedCount = allItems.filter((c) => c.status === 'active').length

  // availableCount: active annotations act as the denominator for progress bar.
  // If no annotations configured yet, fall back to completedCount (100% for now).
  const activeAnnotations = annotations.filter((a) => a.status === 'active')
  const availableCount =
    activeAnnotations.length > 0 ? activeAnnotations.length : completedCount

  // Determine unlocked milestones: status='complete' or currentValue ≥ targetValue
  const unlockedMilestoneIds = activeMilestones
    .filter(
      (m) =>
        m.status === 'complete' ||
        (m.targetValue != null && m.currentValue >= m.targetValue),
    )
    .map((m) => m.id)

  return {
    campaignRef,
    playerId,
    contributions: allItems,
    completedCount,
    availableCount,
    unlockedMilestoneIds,
  }
}

// ============================================================
// getCampaignContributionProgress — Sub-AC 3a
// Counts completed actions vs. total available actions across
// all sub-campaign branches for a given campaign and player.
// ============================================================

/**
 * Player-level progress across ALL sub-campaign branches, rolled up to campaign level.
 *
 * completedCount: total ContributionRecord rows for this player in this campaign
 *   (includes retired records — soft-archive preserves historical progress).
 * availableCount: total active ContributionAnnotation rows for this campaign
 *   (the denominator for the progress bar).
 * progress01: completedCount / availableCount, clamped 0–1.
 * unlockedMilestoneMarkers: CampaignMilestoneMarker rows whose triggerCount
 *   the player has reached, sorted ascending.
 *
 * Design notes:
 * - Progress rolls up to campaign level only — no per-branch counts.
 * - Retired contribution records still count toward completedCount per the
 *   soft-archive contract: "marked retired, still counted in progress".
 * - availableCount falls back to completedCount (= 100%) when no annotations
 *   have been configured yet, so the progress bar remains meaningful.
 */
/** A single milestone marker row, carrying both threshold and narrative. */
export type MilestoneMarkerItem = {
  id: string
  name: string
  narrativeText: string
  triggerCount: number
}

export type CampaignContributionProgress = {
  campaignRef: string
  playerId: string
  /**
   * Total contributions earned by this player (all branches, all statuses).
   * Retired records are included so removed milestones/adventures don't erase history.
   */
  completedCount: number
  /**
   * Total active GM-annotated actions for the campaign (across all branches).
   * Denominator for the progress bar. Only 'active' annotations are counted.
   */
  availableCount: number
  /**
   * Progress as 0.0–1.0 (clamped). Use directly as the progress bar value.
   * May exceed 1.0 if retired annotations inflated the denominator — clamp downstream.
   */
  progress01: number
  /**
   * Name of the highest milestone marker the player has unlocked.
   * Null when no milestones have been reached yet.
   * Satisfies Sub-AC 1: "current milestone label" surfaced at the top level.
   */
  currentMilestoneLabel: string | null
  /**
   * Narrative text for the current (highest unlocked) milestone marker.
   * Null when no milestones have been reached.
   */
  currentMilestoneNarrative: string | null
  /**
   * The trigger count of the next locked milestone above completedCount.
   * Null when the player has unlocked all markers.
   * Use to render "X more contributions to reach <next milestone>".
   */
  nextMilestoneThreshold: number | null
  /**
   * Milestone markers the player has unlocked (completedCount ≥ triggerCount).
   * Sorted ascending by triggerCount. Each item contains the narrative text
   * generated during the GM intake wizard.
   */
  unlockedMilestoneMarkers: MilestoneMarkerItem[]
  /**
   * All active milestone markers for the campaign, sorted ascending by triggerCount.
   * Includes both locked and unlocked — allows the UI to render the full threshold
   * ladder without a second fetch.
   */
  allMilestoneMarkers: MilestoneMarkerItem[]
}

/**
 * Returns a player's campaign contribution progress, aggregating across all
 * sub-campaign branches (CampaignSlot hierarchy) for a given campaignRef.
 *
 * Both ContributionRecord and ContributionAnnotation are scoped by campaignRef,
 * so they inherently span all branches at any nesting depth — no explicit slot
 * traversal is needed for the roll-up total.
 *
 * @param campaignRef  e.g. 'bruised-banana'
 * @param playerId     The authenticated player's ID
 * @returns Progress metrics, or null on auth/DB error (fail-soft for dashboard).
 */
export async function getCampaignContributionProgress(
  campaignRef: string,
  playerId: string,
): Promise<CampaignContributionProgress | null> {
  try {
    const [completedCount, availableCount, milestoneMarkers] = await Promise.all([
      // Completed: ALL ContributionRecord rows for this player + campaign.
      // Includes retired rows so soft-archived actions still count in progress.
      db.contributionRecord.count({
        where: { campaignRef, playerId },
      }),

      // Available: active ContributionAnnotation count — denominator for progress bar.
      // Only 'active' annotations define the current scope of meaningful actions.
      db.contributionAnnotation.count({
        where: { campaignRef, status: 'active' },
      }),

      // Milestones: all active CampaignMilestoneMarkers for this campaign.
      // We filter for unlocked (completedCount ≥ triggerCount) after the counts resolve.
      db.campaignMilestoneMarker.findMany({
        where: { campaignRef, status: 'active' },
        select: {
          id: true,
          name: true,
          narrativeText: true,
          triggerCount: true,
        },
        orderBy: { triggerCount: 'asc' },
      }),
    ])

    // Fallback: if no annotations configured yet, treat denominator as completedCount
    // so the bar shows 100% (full) rather than 0%. Once GMs add annotations the
    // denominator updates automatically.
    const effectiveAvailableCount = availableCount > 0 ? availableCount : completedCount

    const progress01 =
      effectiveAvailableCount > 0
        ? Math.min(1, completedCount / effectiveAvailableCount)
        : 0

    const unlockedMilestoneMarkers = milestoneMarkers.filter(
      (m) => completedCount >= m.triggerCount,
    )

    // currentMilestone = the highest unlocked marker (last item in asc-sorted array)
    const currentMilestone = unlockedMilestoneMarkers.at(-1) ?? null

    // nextMilestoneThreshold = lowest triggerCount above completedCount
    const nextMarker = milestoneMarkers.find((m) => m.triggerCount > completedCount)

    return {
      campaignRef,
      playerId,
      completedCount,
      availableCount: effectiveAvailableCount,
      progress01,
      currentMilestoneLabel: currentMilestone?.name ?? null,
      currentMilestoneNarrative: currentMilestone?.narrativeText ?? null,
      nextMilestoneThreshold: nextMarker?.triggerCount ?? null,
      unlockedMilestoneMarkers,
      allMilestoneMarkers: milestoneMarkers,
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getCampaignContributionProgress]', e)
    }
    return null
  }
}

// ============================================================
// getCampaignAggregate (aggregated — no individual breakdown)
// ============================================================

/**
 * Campaign-wide aggregated contribution stats, safe to show to all players.
 * Never exposes individual player contribution data.
 */
export type CampaignAggregateResult = {
  campaignRef: string
  totalContributions: number
  totalContributors: number
}

/**
 * Returns aggregated campaign contribution totals.
 * Counts completed quests + milestone contributions across all players.
 * Suitable for the hub-level display ("42 contributions from 12 players").
 */
export async function getCampaignAggregate(
  campaignRef: string,
): Promise<CampaignAggregateResult> {
  const [questAgg, milestoneAgg] = await Promise.all([
    // Count completed PlayerQuests for campaign-linked quests
    db.playerQuest.groupBy({
      by: ['playerId'],
      where: {
        status: 'completed',
        quest: { campaignRef },
      },
      _count: { id: true },
    }),

    // Count milestone contributions per player
    db.milestoneContribution.groupBy({
      by: ['playerId'],
      where: {
        milestone: { campaignRef },
      },
      _count: { id: true },
    }),
  ])

  // Merge per-player contribution counts
  const contributorMap = new Map<string, number>()

  for (const row of questAgg) {
    contributorMap.set(
      row.playerId,
      (contributorMap.get(row.playerId) ?? 0) + row._count.id,
    )
  }
  for (const row of milestoneAgg) {
    contributorMap.set(
      row.playerId,
      (contributorMap.get(row.playerId) ?? 0) + row._count.id,
    )
  }

  let totalContributions = 0
  for (const count of contributorMap.values()) {
    totalContributions += count
  }

  return {
    campaignRef,
    totalContributions,
    totalContributors: contributorMap.size,
  }
}
