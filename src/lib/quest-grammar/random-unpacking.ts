/**
 * Random unpacking for I Ching grammatic quests.
 * Uses canonical kernel: satisfaction/dissatisfaction from emotional alchemy moves;
 * experience from nation + playbook; alignedAction = move name.
 *
 * See: .specify/specs/random-unpacking-canonical-kernel/spec.md
 */

import type { UnpackingAnswers } from './types'
import type { ElementKey } from './elements'
import type { PersonalMoveType } from './types'
import {
  SHADOW_VOICE_OPTIONS,
  LIFE_STATE_OPTIONS,
} from './unpacking-constants'
import { ALL_CANONICAL_MOVES } from './move-engine'
import { getLabelsForMove, pickExperienceForPlayer } from './canonical-kernel'

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

const Q3_PHRASES = [
  'There is momentum but also resistance.',
  'Things are shifting beneath the surface.',
  'The path is unclear but the destination calls.',
  'Energy is building in unexpected ways.',
  'Old patterns are loosening their grip.',
]

const Q5_PHRASES = [
  'Something wants to emerge through this moment.',
  'The emotional truth is closer than it appears.',
  'What we resist persists until we meet it.',
  'Clarity comes when we stop fighting the current.',
  'The gap between here and there is bridgeable.',
]

export interface RandomUnpackingPlayerContext {
  nationElement?: ElementKey
  playbookPrimaryWave?: PersonalMoveType
}

export interface RandomUnpackingResult {
  unpackingAnswers: UnpackingAnswers
  alignedAction: string
  moveType?: PersonalMoveType
}

/**
 * Generate random unpacking using canonical kernel.
 * Q2/Q4 from move; Q1 from player context or random; Q6 from SHADOW_VOICE_OPTIONS.
 * alignedAction = move.name; moveType = move.primaryWaveStage.
 */
export function generateRandomUnpacking(
  playerContext?: RandomUnpackingPlayerContext
): RandomUnpackingResult {
  const move = pick(ALL_CANONICAL_MOVES)
  const { dissatisfiedLabels, satisfiedLabels } = getLabelsForMove(move)

  const q1 = pickExperienceForPlayer(
    playerContext?.nationElement,
    playerContext?.playbookPrimaryWave
  )

  const lifeState = pick(LIFE_STATE_OPTIONS)
  const q3Phrase = pick(Q3_PHRASES)
  const q3 = `${lifeState}. ${q3Phrase}`

  const q5 = pick(Q5_PHRASES)
  const q6 = pickN(SHADOW_VOICE_OPTIONS, 2)

  return {
    unpackingAnswers: {
      q1,
      q2: satisfiedLabels,
      q3,
      q4: dissatisfiedLabels,
      q5,
      q6,
    },
    alignedAction: move.name,
    moveType: move.primaryWaveStage,
  }
}
