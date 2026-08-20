import { notFound } from 'next/navigation'
import { MovePractice } from '@/components/mtgoa-course/MovePractice'
import { OpenUpCheck } from '@/components/open-up/OpenUpCheck'
import { MTGOA_COURSE_ROUNDS } from '@/lib/mtgoa-course/course-days'

const AVAILABLE_MOVES = new Set(['wake-up', 'open-up', 'clean-up'])

/**
 * Course route convention: /course/{1..6}/{move}. We publish only the authored
 * first-round practices; later rounds and Grow Up / Show Up remain unavailable
 * until their distinct variants exist.
 */
export default async function MtgoaCourseMovePage({ params }: { params: Promise<{ round: string; move: string }> }) {
  const { round: rawRound, move } = await params
  const round = Number(rawRound)
  if (!Number.isInteger(round) || round < 1 || round > MTGOA_COURSE_ROUNDS || round !== 1 || !AVAILABLE_MOVES.has(move)) notFound()

  if (move === 'wake-up') return <MovePractice kind="wake_up" courseRound={round} />
  if (move === 'open-up') return <OpenUpCheck queryString="" />
  return <MovePractice kind="clean_up" courseRound={round} />
}
