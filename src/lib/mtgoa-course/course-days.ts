import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'

export type MtgoaCourseDayId = `day-${number}`
export type MtgoaCourseMove = 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'

export type MtgoaCourseDay = {
  id: MtgoaCourseDayId
  number: number
  move: MtgoaCourseMove
  title: string
  question: string
  output: 'awareness' | 'experience' | 'insight'
  route: string
}

export const MTGOA_COURSE_ROUNDS = 6 as const
export const MTGOA_MOVES_PER_ROUND = 5 as const
export const MTGOA_COURSE_LENGTH = MTGOA_COURSE_ROUNDS * MTGOA_MOVES_PER_ROUND

const COURSE_MOVE_SLUGS: Record<MtgoaCourseMove, string> = {
  wake_up: 'wake-up', open_up: 'open-up', clean_up: 'clean-up', grow_up: 'grow-up', show_up: 'show-up',
}

/** Stable route convention for six five-move rounds; content variants remain an authoring concern. */
export function mtgoaCourseRoute(round: number, move: MtgoaCourseMove): string {
  if (!Number.isInteger(round) || round < 1 || round > MTGOA_COURSE_ROUNDS) throw new Error('MTGOA course round must be between 1 and 6.')
  return `/mastering-allyship/course/${round}/${COURSE_MOVE_SLUGS[move]}`
}

export function mtgoaCourseDayNumber(round: number, move: MtgoaCourseMove): number {
  const moveIndex = (Object.keys(COURSE_MOVE_SLUGS) as MtgoaCourseMove[]).indexOf(move)
  if (moveIndex < 0) throw new Error('Unknown MTGOA course move.')
  return (round - 1) * MTGOA_MOVES_PER_ROUND + moveIndex + 1
}

/**
 * The beginning of the 30-day self-paced course. These are canonical move
 * definitions, not a claim that the rest of the course has been authored.
 */
export const MTGOA_COURSE_DAYS: MtgoaCourseDay[] = [
  { id: 'day-1', number: 1, move: 'wake_up', title: 'Wake Up', question: 'What is happening?', output: 'awareness', route: mtgoaCourseRoute(1, 'wake_up') },
  { id: 'day-2', number: 2, move: 'open_up', title: 'Open Up', question: 'What energy is trying to get through?', output: 'experience', route: mtgoaCourseRoute(1, 'open_up') },
  { id: 'day-3', number: 3, move: 'clean_up', title: 'Clean Up', question: 'What move is missing?', output: 'insight', route: mtgoaCourseRoute(1, 'clean_up') },
]

function practicesFor(move: MtgoaCourseDay['move']): MoveCard[] {
  return assembleDeck('mtgoa-course').cards.filter(
    (card): card is MoveCard => card.kind === 'move' && card.move === move,
  )
}

/** All 24 canonical Wake Up cards, available for Day 1's random draw. */
export const WAKE_UP_PRACTICES = practicesFor('wake_up')

/** All 24 canonical Clean Up cards, available for Day 3's random draw. */
export const CLEAN_UP_PRACTICES = practicesFor('clean_up')
