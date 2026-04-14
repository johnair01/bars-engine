'use server'

/**
 * Chapter-Spoke Template server actions.
 *
 * Slice 2:
 *   - registerChapterSpoke: upsert ChapterRegistration + ChapterMilestone rows
 *   - recordChapterEntry: upsert PlayerChapterProgress on entry
 *   - getPlayerChapterProgress: list progress for a book
 *
 * Slice 3:
 *   - resolveChapterContext: given an instanceSlug, find the registered chapter
 *   - recordChapterCompletion: atomic BAR tag + milestone roll-up + progress update
 *   - getBookMilestoneRollup: aggregated chapter milestones for the book hub view
 *
 * See: .specify/specs/chapter-spoke-template/spec.md
 */

import { Prisma } from '@prisma/client'
import { getCurrentPlayer } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import type { ChapterDefinition, ChapterProgress } from '@/lib/chapter-spoke/types'

// ─── Chapter context resolution ───────────────────────────────────────────────

export type ChapterContext = {
  chapterRef: string
  bookRef: string
  orgRef: string
  parentCampaignRef: string | null
  milestoneRef: string
  minBarsRequired: number
}

/**
 * Given an instanceSlug, check whether it corresponds to a registered chapter spoke.
 * Returns the chapter context if found, null if this instance is not a chapter.
 *
 * Convention: a chapter's instanceSlug matches its chapterRef
 * (e.g. instanceSlug='mtgoa-chapter-1' → chapterRef='mtgoa-chapter-1').
 * When the instance slug doesn't match directly, we also check if any registered
 * chapter's bookRef matches (for book-level instances).
 */
export async function resolveChapterContext(
  instanceSlug: string,
): Promise<ChapterContext | null> {
  const [reg, milestone] = await Promise.all([
    dbBase.chapterRegistration.findUnique({ where: { chapterRef: instanceSlug } }),
    dbBase.chapterMilestone.findUnique({
      where: { chapterRef: instanceSlug },
      select: { minBarsRequired: true },
    }),
  ])
  if (!reg) return null

  const def = reg.definition as unknown as ChapterDefinition

  return {
    chapterRef: reg.chapterRef,
    bookRef: reg.bookRef,
    orgRef: reg.orgRef,
    parentCampaignRef: def.parentCampaignRef ?? null,
    milestoneRef: `${reg.chapterRef}-milestone`,
    minBarsRequired: milestone?.minBarsRequired ?? 1,
  }
}

// ─── Register a chapter ───────────────────────────────────────────────────────

export async function registerChapterSpoke(input: {
  definition: ChapterDefinition
}): Promise<{ success: true; chapterRef: string } | { error: string }> {
  const { definition } = input

  try {
    // Upsert ChapterRegistration
    await dbBase.chapterRegistration.upsert({
      where: { chapterRef: definition.chapterRef },
      create: {
        chapterRef: definition.chapterRef,
        bookRef: definition.bookRef,
        orgRef: definition.orgRef,
        version: definition.version,
        definition: definition as unknown as Prisma.InputJsonValue,
      },
      update: {
        bookRef: definition.bookRef,
        orgRef: definition.orgRef,
        version: definition.version,
        definition: definition as unknown as Prisma.InputJsonValue,
      },
    })

    // Upsert ChapterMilestone
    const m = definition.milestone
    await dbBase.chapterMilestone.upsert({
      where: { chapterRef: definition.chapterRef },
      create: {
        chapterRef: definition.chapterRef,
        bookRef: definition.bookRef,
        title: m.title,
        description: m.description,
        parentMilestoneRef: m.rollupTo.parentMilestoneRef,
        rollupWeight: m.rollupTo.weight,
        minBarsRequired: m.completionCriteria.minBarsRequired,
      },
      update: {
        title: m.title,
        description: m.description,
        parentMilestoneRef: m.rollupTo.parentMilestoneRef,
        rollupWeight: m.rollupTo.weight,
        minBarsRequired: m.completionCriteria.minBarsRequired,
      },
    })

    return { success: true, chapterRef: definition.chapterRef }
  } catch (err) {
    console.error('[chapter-spoke] registerChapterSpoke failed:', err)
    return { error: 'Failed to register chapter spoke' }
  }
}

// ─── Record chapter entry ─────────────────────────────────────────────────────

export async function recordChapterEntry(input: {
  chapterRef: string
}): Promise<{ success: true; isReentry: boolean } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  try {
    const existing = await dbBase.playerChapterProgress.findUnique({
      where: { playerId_chapterRef: { playerId: player.id, chapterRef: input.chapterRef } },
    })

    if (existing) {
      await dbBase.playerChapterProgress.update({
        where: { playerId_chapterRef: { playerId: player.id, chapterRef: input.chapterRef } },
        data: {
          lastEnteredAt: new Date(),
          enterCount: { increment: 1 },
        },
      })
      return { success: true, isReentry: true }
    }

    await dbBase.playerChapterProgress.create({
      data: {
        playerId: player.id,
        chapterRef: input.chapterRef,
      },
    })
    return { success: true, isReentry: false }
  } catch (err) {
    console.error('[chapter-spoke] recordChapterEntry failed:', err)
    return { error: 'Failed to record chapter entry' }
  }
}

// ─── Get player progress ──────────────────────────────────────────────────────

export async function getPlayerChapterProgress(input: {
  bookRef: string
}): Promise<ChapterProgress[] | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  try {
    // Get all registered chapters for this book
    const registrations = await dbBase.chapterRegistration.findMany({
      where: { bookRef: input.bookRef },
      select: { chapterRef: true, definition: true },
    })

    // Get this player's progress rows for each chapter
    const progressRows = await dbBase.playerChapterProgress.findMany({
      where: {
        playerId: player.id,
        chapterRef: { in: registrations.map((r) => r.chapterRef) },
      },
    })

    const progressMap = new Map(progressRows.map((p) => [p.chapterRef, p]))

    return registrations.map((reg) => {
      const def = reg.definition as unknown as ChapterDefinition
      const progress = progressMap.get(reg.chapterRef)
      return {
        chapterRef: reg.chapterRef,
        title: def.title ?? reg.chapterRef,
        visited: !!progress,
        completed: progress?.completed ?? false,
        barCount: progress?.barCount ?? 0,
      }
    })
  } catch (err) {
    console.error('[chapter-spoke] getPlayerChapterProgress failed:', err)
    return { error: 'Failed to get chapter progress' }
  }
}

// ─── recordChapterCompletion (Slice 3) ────────────────────────────────────────

/**
 * Called when a player creates a BAR inside a chapter spoke.
 *
 * Atomically (in one transaction):
 *   1. Tags the BAR's agentMetadata with chapterRef / bookRef / orgRef / parentCampaignRef
 *   2. Upserts PlayerChapterProgress: increments barCount, marks completed if threshold met
 *   3. Increments ChapterMilestone.totalBarCount (and totalPlayerCount on first completion)
 *
 * Returns milestoneProgress: the chapter's totalBarCount after this write.
 */
export async function recordChapterCompletion(input: {
  chapterRef: string
  barId: string
}): Promise<{ success: true; milestoneProgress: number } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  try {
    const [milestone, existingProgress, bar] = await Promise.all([
      dbBase.chapterMilestone.findUnique({ where: { chapterRef: input.chapterRef } }),
      dbBase.playerChapterProgress.findUnique({
        where: { playerId_chapterRef: { playerId: player.id, chapterRef: input.chapterRef } },
      }),
      dbBase.customBar.findUnique({ where: { id: input.barId }, select: { agentMetadata: true } }),
    ])

    if (!milestone) return { error: `No milestone found for chapter ${input.chapterRef}` }
    if (!bar) return { error: `BAR ${input.barId} not found` }

    const isFirstCompletion = !existingProgress?.completed
    const newBarCount = (existingProgress?.barCount ?? 0) + 1
    const nowCompleted = newBarCount >= milestone.minBarsRequired

    // 1. Tag the BAR with chapter context (merge into existing agentMetadata)
    let existingMeta: Record<string, unknown> = {}
    if (bar.agentMetadata) {
      try { existingMeta = JSON.parse(bar.agentMetadata) as Record<string, unknown> } catch { /* ignore */ }
    }
    const reg = await dbBase.chapterRegistration.findUnique({
      where: { chapterRef: input.chapterRef },
      select: { bookRef: true, orgRef: true, definition: true },
    })
    const def = reg?.definition as unknown as ChapterDefinition | undefined
    const taggedMeta = JSON.stringify({
      ...existingMeta,
      chapterRef: input.chapterRef,
      bookRef: reg?.bookRef ?? null,
      orgRef: reg?.orgRef ?? null,
      parentCampaignRef: def?.parentCampaignRef ?? null,
    })

    // 2 + 3. Atomic transaction: update BAR + progress + milestone
    await dbBase.$transaction([
      dbBase.customBar.update({
        where: { id: input.barId },
        data: { agentMetadata: taggedMeta },
      }),
      existingProgress
        ? dbBase.playerChapterProgress.update({
            where: { playerId_chapterRef: { playerId: player.id, chapterRef: input.chapterRef } },
            data: {
              barCount: { increment: 1 },
              lastEnteredAt: new Date(),
              completed: nowCompleted || existingProgress.completed,
            },
          })
        : dbBase.playerChapterProgress.create({
            data: {
              playerId: player.id,
              chapterRef: input.chapterRef,
              barCount: 1,
              completed: nowCompleted,
            },
          }),
      dbBase.chapterMilestone.update({
        where: { chapterRef: input.chapterRef },
        data: {
          totalBarCount: { increment: 1 },
          ...(isFirstCompletion && nowCompleted
            ? { totalPlayerCount: { increment: 1 } }
            : {}),
        },
      }),
    ])

    const updated = await dbBase.chapterMilestone.findUnique({
      where: { chapterRef: input.chapterRef },
      select: { totalBarCount: true },
    })
    return { success: true, milestoneProgress: updated?.totalBarCount ?? 1 }
  } catch (err) {
    console.error('[chapter-spoke] recordChapterCompletion failed:', err)
    return { error: 'Failed to record chapter completion' }
  }
}

// ─── getBookMilestoneRollup (Slice 3) ─────────────────────────────────────────

export type BookMilestoneRollup = {
  bookRef: string
  chapters: Array<{
    chapterRef: string
    title: string
    totalBarCount: number
    totalPlayerCount: number
    rollupWeight: number
    /** 0..1 progress fraction (capped at 1). Based on bar count vs minBarsRequired. */
    progressFraction: number
  }>
  /** Weighted sum of all chapter progress fractions (0..1). */
  overallProgress: number
}

/**
 * Aggregates chapter milestone progress for a book hub view.
 * No auth required — this is public campaign progress data.
 */
export async function getBookMilestoneRollup(
  bookRef: string,
): Promise<BookMilestoneRollup | { error: string }> {
  try {
    const [milestones, registrations] = await Promise.all([
      dbBase.chapterMilestone.findMany({ where: { bookRef } }),
      dbBase.chapterRegistration.findMany({
        where: { bookRef },
        select: { chapterRef: true, definition: true },
      }),
    ])

    const titleMap = new Map(
      registrations.map((r) => [
        r.chapterRef,
        (r.definition as unknown as ChapterDefinition)?.shortTitle ?? r.chapterRef,
      ]),
    )

    const chapters = milestones.map((m) => {
      const progress = Math.min(1, m.totalBarCount / Math.max(1, m.minBarsRequired))
      return {
        chapterRef: m.chapterRef,
        title: titleMap.get(m.chapterRef) ?? m.title,
        totalBarCount: m.totalBarCount,
        totalPlayerCount: m.totalPlayerCount,
        rollupWeight: m.rollupWeight,
        progressFraction: progress,
      }
    })

    const totalWeight = chapters.reduce((sum, c) => sum + c.rollupWeight, 0)
    const overallProgress =
      totalWeight > 0
        ? chapters.reduce((sum, c) => sum + c.progressFraction * c.rollupWeight, 0) / totalWeight
        : 0

    return { bookRef, chapters, overallProgress }
  } catch (err) {
    console.error('[chapter-spoke] getBookMilestoneRollup failed:', err)
    return { error: 'Failed to get book milestone rollup' }
  }
}
