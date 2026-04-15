import type { BarAnalysis, BarAnalysisType, BarWavePhase } from '@/lib/bar-forge/types'

const TYPES: BarAnalysisType[] = ['perception', 'identity', 'relational', 'systemic']
const PHASES: BarWavePhase[] = ['Wake Up', 'Clean Up', 'Grow Up', 'Show Up']

/** Normalize a BarForgeRecord row into BAR + analysis. */
export function barForgeRowToBarAnalysis(row: {
  bar: string
  analysisType: string
  wavePhase: string
  polarity: unknown
}): { bar: string; analysis: BarAnalysis } {
  const polarity = Array.isArray(row.polarity) ? (row.polarity as string[]) : []
  const type = (TYPES.includes(row.analysisType as BarAnalysisType)
    ? row.analysisType
    : 'identity') as BarAnalysisType
  const wavePhase = (PHASES.includes(row.wavePhase as BarWavePhase)
    ? row.wavePhase
    : 'Clean Up') as BarWavePhase
  return {
    bar: row.bar,
    analysis: { type, wavePhase, polarity },
  }
}
