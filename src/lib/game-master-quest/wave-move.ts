import type { BarWavePhase } from '@/lib/bar-forge/types'

export type GmWaveMove = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'

const TO_PHASE: Record<GmWaveMove, BarWavePhase> = {
  wake_up: 'Wake Up',
  clean_up: 'Clean Up',
  grow_up: 'Grow Up',
  show_up: 'Show Up',
}

const TO_MOVE: Record<BarWavePhase, GmWaveMove> = {
  'Wake Up': 'wake_up',
  'Clean Up': 'clean_up',
  'Grow Up': 'grow_up',
  'Show Up': 'show_up',
}

export function gmWaveMoveToBarWavePhase(move: GmWaveMove): BarWavePhase {
  return TO_PHASE[move]
}

export function barWavePhaseToGmWaveMove(phase: BarWavePhase): GmWaveMove {
  return TO_MOVE[phase]
}
