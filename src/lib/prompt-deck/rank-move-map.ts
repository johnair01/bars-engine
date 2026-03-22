/**
 * Rank → Wake / Clean / Grow / Show level + wild (13).
 * Same mapping for every suit. @see .specify/specs/prompt-deck-draw-hand/spec.md
 */

export type PromptMoveFamily = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | 'wild'

export type RankMoveInfo =
  | { family: Exclude<PromptMoveFamily, 'wild'>; level: 1 | 2 | 3 }
  | { family: 'wild'; level: null }

const RANK_TO_FAMILY: Record<number, Exclude<PromptMoveFamily, 'wild'>> = {
  1: 'wakeUp',
  2: 'wakeUp',
  3: 'wakeUp',
  4: 'cleanUp',
  5: 'cleanUp',
  6: 'cleanUp',
  7: 'growUp',
  8: 'growUp',
  9: 'growUp',
  10: 'showUp',
  11: 'showUp',
  12: 'showUp',
}

/** Map rank 1–13 to move family + level; rank 13 = wild (level chosen at play time). */
export function rankToPromptMove(rank: number): RankMoveInfo | null {
  if (!Number.isInteger(rank) || rank < 1 || rank > 13) return null
  if (rank === 13) return { family: 'wild', level: null }
  const family = RANK_TO_FAMILY[rank]
  if (!family) return null
  const level = (((rank - 1) % 3) + 1) as 1 | 2 | 3
  return { family, level }
}

export function promptMoveFamilyLabel(family: PromptMoveFamily): string {
  switch (family) {
    case 'wakeUp':
      return 'Wake Up'
    case 'cleanUp':
      return 'Clean Up'
    case 'growUp':
      return 'Grow Up'
    case 'showUp':
      return 'Show Up'
    case 'wild':
      return 'Wild'
    default:
      return family
  }
}
