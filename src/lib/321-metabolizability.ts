/**
 * 321 Metabolizability Report
 *
 * Aggregates Shadow321Session by outcome, moveType (from phase2Snapshot), creationType.
 * Computes completion rate (questCompletedAt / quest_created).
 * Spec: .specify/specs/singleplayer-charge-metabolism/spec.md
 */

import { db } from '@/lib/db'

export type MetabolizabilityFilters = {
  outcome?: string
  moveType?: string
}

export type MetabolizabilityRow = {
  outcome: string
  moveType: string | null
  count: number
  completedCount: number
  completionRate: number
}

/**
 * Aggregate Shadow321Session by outcome, moveType; compute completion rate.
 */
export async function getMetabolizabilityReport(
  filters?: MetabolizabilityFilters
): Promise<MetabolizabilityRow[]> {
  const sessions = await db.shadow321Session.findMany({
    where: {
      ...(filters?.outcome && { outcome: filters.outcome }),
    },
    select: {
      outcome: true,
      phase2Snapshot: true,
      linkedQuestId: true,
      questCompletedAt: true,
    },
  })

  const byKey = new Map<string, { count: number; completed: number }>()

  for (const s of sessions) {
    let moveType: string | null = null
    try {
      const phase2 = JSON.parse(s.phase2Snapshot) as Record<string, unknown>
      const aligned = phase2?.alignedAction as string | undefined
      if (aligned) {
        const lower = aligned.toLowerCase()
        if (/\bwake\s*up\b/.test(lower)) moveType = 'wakeUp'
        else if (/\bclean\s*up\b/.test(lower)) moveType = 'cleanUp'
        else if (/\bgrow\s*up\b/.test(lower)) moveType = 'growUp'
        else if (/\bshow\s*up\b/.test(lower)) moveType = 'showUp'
      }
    } catch {
      /* ignore parse errors */
    }

    if (filters?.moveType && moveType !== filters.moveType) continue

    const key = `${s.outcome}::${moveType ?? 'unknown'}`
    const prev = byKey.get(key) ?? { count: 0, completed: 0 }
    prev.count += 1
    if (s.linkedQuestId && s.questCompletedAt) prev.completed += 1
    byKey.set(key, prev)
  }

  return Array.from(byKey.entries()).map(([key, { count, completed }]) => {
    const [outcome, moveType] = key.split('::')
    return {
      outcome,
      moveType: moveType === 'unknown' ? null : moveType,
      count,
      completedCount: completed,
      completionRate: count > 0 ? completed / count : 0,
    }
  })
}
