import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'

export type MtgoaCourseDayId = 'day-1' | 'day-2' | 'day-3'

export type MtgoaCourseDay = {
  id: MtgoaCourseDayId
  number: 1 | 2 | 3
  move: 'wake_up' | 'open_up' | 'clean_up'
  title: string
  question: string
  output: 'awareness' | 'experience' | 'insight'
  route: string
}

/**
 * The beginning of the 30-day self-paced course. These are canonical move
 * definitions, not a claim that the rest of the course has been authored.
 */
export const MTGOA_COURSE_DAYS: MtgoaCourseDay[] = [
  { id: 'day-1', number: 1, move: 'wake_up', title: 'Wake Up', question: 'What is happening?', output: 'awareness', route: '/mastering-allyship/wake-up' },
  { id: 'day-2', number: 2, move: 'open_up', title: 'Open Up', question: 'What energy is trying to get through?', output: 'experience', route: '/mastering-allyship/open-up' },
  { id: 'day-3', number: 3, move: 'clean_up', title: 'Clean Up', question: 'What move is missing?', output: 'insight', route: '/mastering-allyship/clean-up' },
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
