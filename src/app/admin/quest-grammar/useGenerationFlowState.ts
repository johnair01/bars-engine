/**
 * Session persistence for Quest Grammar Generation Flow.
 * Data persists across refresh so admin can resume. Phase 4: CYOA process.
 */

import type { UnpackingAnswers } from '@/lib/quest-grammar'

const STORAGE_KEY = 'quest-grammar-generation-flow'

export interface PersistedFlowState {
  stepIndex: number
  answers: UnpackingAnswers
  alignedAction: string
  questModel: 'personal' | 'communal'
  segment: 'player' | 'sponsor' | 'both'
  targetNationId: string | null
  targetArchetypeIds: string[]
  developmentalLens: string | null
  q6Context: string
  expectedMovesSelected: string[]
  expectedMovesCustom: string
  playerPOV: Record<string, string>
  hexagramId: number | null
}

const DEFAULT_STATE: PersistedFlowState = {
  stepIndex: 0,
  answers: { q1: '', q2: [], q3: '', q4: [], q5: '', q6: [] } as UnpackingAnswers,
  alignedAction: '',
  questModel: 'personal',
  segment: 'player',
  targetNationId: null,
  targetArchetypeIds: [],
  developmentalLens: null,
  q6Context: '',
  expectedMovesSelected: [],
  expectedMovesCustom: '',
  playerPOV: {},
  hexagramId: null,
}

export function loadPersistedFlowState(): PersistedFlowState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedFlowState>
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return null
  }
}

export function savePersistedFlowState(state: PersistedFlowState): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function clearPersistedFlowState(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
