import { db } from '@/lib/db'
import type { WakePatternsMeta } from '@/lib/game-master-quest/types'

const ANALYSIS_TYPES = new Set(['perception', 'identity', 'relational', 'systemic'])

/** Aggregate recent registry rows for Wake Up meta. */
export async function aggregateBarForgePatterns(limit = 200): Promise<WakePatternsMeta> {
  const rows = await db.barForgeRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { wavePhase: true, analysisType: true },
  })

  const wavePhaseCounts: Record<string, number> = {}
  const analysisTypeCounts: Record<string, number> = {}

  for (const r of rows) {
    const w = (r.wavePhase || 'unknown').trim() || 'unknown'
    wavePhaseCounts[w] = (wavePhaseCounts[w] ?? 0) + 1

    const t = ANALYSIS_TYPES.has(r.analysisType) ? r.analysisType : 'unknown'
    analysisTypeCounts[t] = (analysisTypeCounts[t] ?? 0) + 1
  }

  return {
    sampleSize: rows.length,
    wavePhaseCounts,
    analysisTypeCounts,
  }
}
