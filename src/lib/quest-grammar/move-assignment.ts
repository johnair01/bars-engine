/**
 * Move Assignment for Choice Privileging
 *
 * Selects 2–3 canonical moves per passage, privileging nation element and playbook WAVE.
 * Used by compileQuest and generateQuestOverviewWithAI.
 */

import {
  ALL_CANONICAL_MOVES,
  type CanonicalMove,
} from './move-engine'
import type { ElementKey } from './elements'
import type { PersonalMoveType } from './types'

/** Moves that involve the given element (transcend or translate from/to) */
export function getMovesForElement(element: ElementKey): CanonicalMove[] {
  return ALL_CANONICAL_MOVES.filter((m) => {
    if (m.element === element) return true
    if (m.fromElement === element || m.toElement === element) return true
    return false
  })
}

/** Moves whose primary WAVE stage matches */
export function getMovesForWaveStage(stage: PersonalMoveType): CanonicalMove[] {
  return ALL_CANONICAL_MOVES.filter((m) => m.primaryWaveStage === stage)
}

export interface SelectPrivilegedChoicesParams {
  validMoves: CanonicalMove[]
  nationElement: ElementKey
  playbookWave: PersonalMoveType
  limit?: number
}

/**
 * Select 2–3 moves from validMoves, privileging at least one nation-element move
 * and one playbook-WAVE move when possible.
 */
export function selectPrivilegedChoices(params: SelectPrivilegedChoicesParams): CanonicalMove[] {
  const { validMoves, nationElement, playbookWave, limit = 3 } = params
  if (validMoves.length === 0) return []
  if (validMoves.length <= limit) return validMoves

  const nationMoves = validMoves.filter((m) => {
    if (m.element === nationElement) return true
    if (m.fromElement === nationElement || m.toElement === nationElement) return true
    return false
  })
  const waveMoves = validMoves.filter((m) => m.primaryWaveStage === playbookWave)

  const selected: CanonicalMove[] = []
  const used = new Set<string>()

  // 1. Add one nation-element move if available
  const nationPick = nationMoves.find((m) => !used.has(m.id))
  if (nationPick) {
    selected.push(nationPick)
    used.add(nationPick.id)
  }

  // 2. Add one playbook-WAVE move if available (and not already added)
  const wavePick = waveMoves.find((m) => !used.has(m.id))
  if (wavePick) {
    selected.push(wavePick)
    used.add(wavePick.id)
  }

  // 3. Fill remaining slots from validMoves
  for (const m of validMoves) {
    if (selected.length >= limit) break
    if (!used.has(m.id)) {
      selected.push(m)
      used.add(m.id)
    }
  }

  return selected
}
