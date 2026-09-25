/**
 * Emotional Alchemy — interim composer-card seam.
 * Spec: .specify/specs/emotional-alchemy-practice-card/spec.md
 *
 * Until the Allyship-Deck draw is wired (gap G13), the player picks the WAVE
 * move at "Form the practice"; this supplies the composer's `submove` and a
 * CANONICAL stance question from the deck grammar's MOVES (never invented).
 */

import type { ComposerCard } from './composer'
import type { WaveLens } from './types'
import { MOVES } from '@/lib/allyship-deck/move-library'

/** The five WAVE moves, in order, with their canonical purpose (deck grammar). */
export const SUBMOVE_META: { key: WaveLens; label: string; purpose: string; question: string }[] = MOVES.map((m) => ({
  key: m.key,
  label: m.label,
  purpose: m.purpose,
  question: m.question,
}))

const QUESTION = Object.fromEntries(MOVES.map((m) => [m.key, m.question])) as Record<WaveLens, string>

export function interimComposerCard(submove: WaveLens): ComposerCard {
  return { submove, stanceQuestion: QUESTION[submove] }
}
