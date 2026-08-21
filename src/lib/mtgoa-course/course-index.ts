/**
 * The course index — the view model behind `/course`.
 *
 * The spine (`course-days.ts`) knows all thirty days and which ones resolve. This
 * module turns that into something a visitor arriving cold from a link can read:
 * six weeks, each with its domain and day range, and per day the headline that
 * day's own page opens with.
 *
 * Everything here is derived. A day becomes linkable on this page the moment its
 * status flips to `shipped` in the spine, so the index can never advertise a
 * route that 404s and can never lag behind a day that has actually shipped.
 *
 * @see src/lib/mtgoa-course/course-days.ts — the spine
 * @see src/lib/mtgoa-course/round-two.ts — week 2's authored titles
 */

import { MOVE_LABELS, DOMAIN_LABELS } from '@/lib/allyship-deck/card-visuals'
import {
  MTGOA_COURSE_DAYS,
  MTGOA_COURSE_LENGTH,
  MTGOA_COURSE_ROUNDS,
  MTGOA_MOVES_PER_ROUND,
  linkableRoute,
} from './course-days'
import type { MtgoaCourseDay, MtgoaCourseDayStatus, MtgoaCourseMove } from './course-days'
import { roundTwoDayByMove } from './round-two'

/**
 * Week 1's headlines, quoted from each day's own entry screen.
 *
 * Week 2 authors a title per day in `round-two.ts`, so it needs no table here.
 * Week 1's five days shipped as five separate components and carry their
 * headline inline, which is why these are transcribed rather than imported —
 * lifting them into a shared module would mean editing five shipped flows.
 * If a day's entry screen is reworded, reword it here too.
 *
 * @see src/components/wake-up/WakeUpCheck.tsx and its four siblings
 */
const WEEK_ONE_HEADLINES: Record<MtgoaCourseMove, string> = {
  wake_up: 'Before you decide whether to act, notice what comes alive.',
  open_up: 'There is energy here to work with.',
  clean_up: 'Something has your attention. Until you work it, it works you.',
  grow_up: 'Choose a capacity to practise.',
  show_up: 'A handoff leaves your hands.',
}

export type CourseIndexDay = {
  number: number
  round: number
  move: MtgoaCourseMove
  /** "Wake Up". */
  moveLabel: string
  /** The day's own headline where one is authored, else the move's name. */
  headline: string
  /** What the day leaves you holding. */
  output: string
  /** Where the card goes, or null while the day is still being written. */
  route: string | null
  status: MtgoaCourseDayStatus
}

export type CourseIndexWeek = {
  round: number
  /** "Week 1". */
  label: string
  /** "Raise Awareness", or null for the weeks whose field is undecided. */
  domainLabel: string | null
  /** "Days 1–5". */
  range: string
  days: CourseIndexDay[]
  /** True once any day in the week resolves. Drives whether cards or a strip render. */
  written: boolean
}

function toIndexDay(day: MtgoaCourseDay): CourseIndexDay {
  const authored = day.round === 2 ? roundTwoDayByMove(day.move) : null
  const headline =
    day.round === 1 ? WEEK_ONE_HEADLINES[day.move] : authored?.title ?? MOVE_LABELS[day.move]
  return {
    number: day.number,
    round: day.round,
    move: day.move,
    moveLabel: MOVE_LABELS[day.move],
    headline,
    output: day.output,
    route: linkableRoute(day),
    status: day.status,
  }
}

/** The whole course, grouped the way the page reads it. */
export function courseIndexWeeks(): CourseIndexWeek[] {
  return Array.from({ length: MTGOA_COURSE_ROUNDS }, (_, i) => i + 1).map((round) => {
    const days = MTGOA_COURSE_DAYS.filter((day) => day.round === round).map(toIndexDay)
    const first = (round - 1) * MTGOA_MOVES_PER_ROUND + 1
    const domain = MTGOA_COURSE_DAYS.find((day) => day.round === round)?.domain ?? null
    return {
      round,
      label: `Week ${round}`,
      domainLabel: domain ? DOMAIN_LABELS[domain] : null,
      range: `Days ${first}–${first + MTGOA_MOVES_PER_ROUND - 1}`,
      days,
      written: days.some((day) => day.status === 'shipped'),
    }
  })
}

/** Where "start at the beginning" goes. Null would mean day 1 itself is unbuilt. */
export function courseStartRoute(): string | null {
  return courseIndexWeeks()[0]?.days[0]?.route ?? null
}

/** How many of the thirty a visitor can walk today. */
export function writtenDayCount(): number {
  return MTGOA_COURSE_DAYS.filter((day) => day.status === 'shipped').length
}

/** Spelled out, because the state line reads as a sentence rather than a stat. */
const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five',
  'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty',
] as const

function spell(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

/**
 * The state line above the board.
 *
 * Counted from the spine so it cannot drift: the day a week ships, this sentence
 * counts it. A visitor who arrives from a link deserves to know how much of the
 * thirty is actually here before they start.
 */
export function writtenStateLine(): string {
  const written = writtenDayCount()
  const remaining = MTGOA_COURSE_LENGTH - written
  if (remaining === 0) return `All ${spell(MTGOA_COURSE_LENGTH)} days are written.`
  const head = `${spell(written)} of the ${spell(MTGOA_COURSE_LENGTH)} days are written`
  return `${head.charAt(0).toUpperCase()}${head.slice(1)}. The other ${spell(remaining)} are on the board below.`
}
