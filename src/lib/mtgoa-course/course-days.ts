/**
 * MTGOA 30-day self-paced course — the spine.
 *
 * The course runs the Five Move Form six times: 6 rounds × Wake Up → Open Up →
 * Clean Up → Grow Up → Show Up = 30 days. This module is the canonical structure,
 * not a claim that all 30 days have been authored. Each day carries an explicit
 * `status`, so a page can link forward without ever pointing at a route that does
 * not resolve.
 *
 * Route convention (stable, from the course foundation note):
 *   /mastering-allyship/course/{round}/{move-slug}
 *
 * Round 1 days that have shipped also answer on a short public alias (`/open-up`,
 * `/clean-up`) because they double as campaign landing pages. `publicRoute` is that
 * alias; `courseRoute` is always the canonical form.
 *
 * @see 04 Quests/.../MTGOA_30_DAY_COURSE_FOUNDATION_DAYS_1_TO_3_2026-08-19.md
 * @see .specify/specs/mtgoa-clean-up-check/design_handoff/README.md
 * @see .specify/specs/mtgoa-grow-up-check/design_handoff/README.md
 */

import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { AllyshipDomain, MoveCard } from '@/lib/allyship-deck/types'

export type MtgoaCourseDayId = `day-${number}`
export type MtgoaCourseMove = 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'

/**
 * How far a day has actually gotten. Only `shipped` days may be linked to.
 *
 * - `shipped`    — a route resolves in this repo today.
 * - `designed`   — a design handoff is vendored under `.specify/specs/`, no route yet.
 * - `unauthored` — structure only; nothing written.
 */
export type MtgoaCourseDayStatus = 'shipped' | 'designed' | 'unauthored'

export type MtgoaCourseDay = {
  id: MtgoaCourseDayId
  number: number
  round: number
  move: MtgoaCourseMove
  title: string
  /**
   * The core question this day asks. A round re-runs the same five moves against a
   * different field, so the question is per-round, not per-move: Day 1 asks "what is
   * happening?" of your own allyship, Day 6 asks it of the structure running the work.
   * Unauthored rounds fall back to the move's generic question.
   */
  question: string
  /** What the learner leaves with. */
  output: string
  /** The Deck domain this round narrows to. Null until the round is authored. */
  domain: AllyshipDomain | null
  courseRoute: string
  /** Short campaign alias, only where one is actually served. */
  publicRoute: string | null
  status: MtgoaCourseDayStatus
}

export const MTGOA_COURSE_ROUNDS = 6 as const
export const MTGOA_MOVES_PER_ROUND = 5 as const
export const MTGOA_COURSE_LENGTH = MTGOA_COURSE_ROUNDS * MTGOA_MOVES_PER_ROUND

/** Move order inside a round. This ordering is the course; do not reorder. */
export const MTGOA_MOVE_ORDER: readonly MtgoaCourseMove[] = [
  'wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up',
] as const

const COURSE_MOVE_SLUGS: Record<MtgoaCourseMove, string> = {
  wake_up: 'wake-up', open_up: 'open-up', clean_up: 'clean-up', grow_up: 'grow-up', show_up: 'show-up',
}

/** The move's generic question. Used by rounds that have not been authored yet. */
const MOVE_DEFINITION: Record<MtgoaCourseMove, { title: string; question: string; output: string }> = {
  wake_up:  { title: 'Wake Up',  question: 'What is happening?',                        output: 'awareness' },
  open_up:  { title: 'Open Up',  question: 'What energy is trying to get through?',     output: 'experience' },
  clean_up: { title: 'Clean Up', question: 'What move is missing?',                     output: 'insight' },
  grow_up:  { title: 'Grow Up',  question: 'Which capacity am I willing to practice?',  output: 'capacity' },
  show_up:  { title: 'Show Up',  question: 'What can another person actually act on?',  output: 'contribution' },
}

type RoundAuthoring = {
  domain: AllyshipDomain
  days: Partial<Record<MtgoaCourseMove, { question: string; output: string }>>
}

/**
 * What each round is actually about.
 *
 * A round is the Five Move Form run against one Deck domain. Round 1 asks whether you
 * can make one useful handoff of this book; round 2 asks whether that work can be made
 * legible and repeatable. Same five moves, different field — so the questions differ.
 *
 * Rounds 3–6 are undecided and deliberately absent. Do not invent domains for them.
 *
 * @see MTGOA_30_DAY_COURSE_FOUNDATION_DAYS_1_TO_3_2026-08-19.md — round 1
 * @see MTGOA_WEEK_2_SKILLFUL_ORGANIZING_DAYS_6_TO_10_DRAFT_2026-08-21.md — round 2
 */
const ROUND_AUTHORING: Record<number, RoundAuthoring> = {
  1: {
    domain: 'RAISE_AWARENESS',
    days: {
      wake_up:  { question: 'What is happening?',                                        output: 'awareness' },
      open_up:  { question: 'What energy is trying to get through?',                     output: 'experience' },
      clean_up: { question: 'What move is missing?',                                     output: 'insight' },
      grow_up:  { question: 'Which capacity am I willing to practice?',                  output: 'capacity' },
      show_up:  { question: 'What can I hand someone that is useful whether or not they buy?', output: 'a useful handoff' },
    },
  },
  2: {
    domain: 'SKILLFUL_ORGANIZING',
    days: {
      wake_up:  { question: 'What structure is actually running this work now?',         output: 'a campaign map and one friction point' },
      open_up:  { question: 'What is it like to be inside that structure — or its absence?', output: 'experience' },
      clean_up: { question: 'What story or strain is being designed into the campaign?', output: 'one clean design principle' },
      grow_up:  { question: 'What organizing capacity needs a deliberate rep?',          output: 'a capacity practice' },
      show_up:  { question: 'What small structure can another person actually use?',     output: 'a usable campaign artifact' },
    },
  },
}

/**
 * What round 1 has actually built. Everything not named here is `unauthored`.
 * Keep this table honest — `nextLinkableDay` reads it to decide whether a
 * forward handoff renders as a link or as "coming next".
 */
const ROUND_ONE_STATUS: Partial<Record<MtgoaCourseMove, { status: MtgoaCourseDayStatus; publicRoute: string | null }>> = {
  // Day 1. src/components/wake-up/WakeUpCheck.tsx
  wake_up:  { status: 'shipped',  publicRoute: '/wake-up' },
  // Day 2. src/components/open-up/OpenUpCheck.tsx
  open_up:  { status: 'shipped',  publicRoute: '/open-up' },
  // Day 3. src/components/clean-up/CleanUpCheck.tsx
  clean_up: { status: 'shipped',  publicRoute: '/clean-up' },
  // Day 4. src/components/grow-up/GrowUpCheck.tsx
  grow_up:  { status: 'shipped',  publicRoute: '/grow-up' },
  // Day 5. src/components/show-up/ShowUpCheck.tsx
  show_up:  { status: 'shipped',  publicRoute: '/show-up' },
}

/** Stable route convention for six five-move rounds. */
export function mtgoaCourseRoute(round: number, move: MtgoaCourseMove): string {
  if (!Number.isInteger(round) || round < 1 || round > MTGOA_COURSE_ROUNDS) {
    throw new Error('MTGOA course round must be between 1 and 6.')
  }
  return `/mastering-allyship/course/${round}/${COURSE_MOVE_SLUGS[move]}`
}

export function mtgoaCourseDayNumber(round: number, move: MtgoaCourseMove): number {
  const moveIndex = MTGOA_MOVE_ORDER.indexOf(move)
  if (moveIndex < 0) throw new Error('Unknown MTGOA course move.')
  if (!Number.isInteger(round) || round < 1 || round > MTGOA_COURSE_ROUNDS) {
    throw new Error('MTGOA course round must be between 1 and 6.')
  }
  return (round - 1) * MTGOA_MOVES_PER_ROUND + moveIndex + 1
}

function buildDay(round: number, move: MtgoaCourseMove): MtgoaCourseDay {
  const number = mtgoaCourseDayNumber(round, move)
  const def = MOVE_DEFINITION[move]
  const authoredRound = ROUND_AUTHORING[round]
  const authoredDay = authoredRound?.days[move]
  const shipped = round === 1 ? ROUND_ONE_STATUS[move] : undefined
  return {
    id: `day-${number}`,
    number,
    round,
    move,
    title: def.title,
    question: authoredDay?.question ?? def.question,
    output: authoredDay?.output ?? def.output,
    domain: authoredRound?.domain ?? null,
    courseRoute: mtgoaCourseRoute(round, move),
    publicRoute: shipped?.publicRoute ?? null,
    status: shipped?.status ?? 'unauthored',
  }
}

/** All 30 days. Structure is complete; `status` says what actually exists. */
export const MTGOA_COURSE_DAYS: MtgoaCourseDay[] = Array.from(
  { length: MTGOA_COURSE_ROUNDS },
  (_, r) => r + 1,
).flatMap((round) => MTGOA_MOVE_ORDER.map((move) => buildDay(round, move)))

export function mtgoaCourseDay(number: number): MtgoaCourseDay | null {
  return MTGOA_COURSE_DAYS.find((day) => day.number === number) ?? null
}

/** The route a visitor can actually reach today, or null if the day is not built. */
export function linkableRoute(day: MtgoaCourseDay): string | null {
  if (day.status !== 'shipped') return null
  return day.publicRoute ?? day.courseRoute
}

/**
 * The forward handoff for a receipt. Returns the next day always — so a page can
 * name tomorrow's question — plus the route, which is null until that day ships.
 * This is what keeps a receipt from linking at an unfinished page.
 */
export function nextCourseDay(number: number): { day: MtgoaCourseDay; route: string | null } | null {
  const next = mtgoaCourseDay(number + 1)
  if (!next) return null
  return { day: next, route: linkableRoute(next) }
}

/**
 * Tomorrow's question as the tail of "Grow Up asks: …".
 *
 * Only the first character is lowered — lowercasing the whole string turns the
 * standalone "I" in "Which capacity am I willing to practice?" into "i".
 */
export function askingLine(day: MtgoaCourseDay): string {
  return `${day.title} asks: ${day.question.charAt(0).toLowerCase()}${day.question.slice(1)}`
}

/**
 * The design rule days 4 and 5 must state rather than assume.
 *
 * A reader may reasonably ask why days 1–3 draw from all 24 cards of a move and
 * days 4–5 from six. Left unsaid it looks arbitrary — or like the course quietly
 * turning into a book funnel halfway through.
 *
 * @see MTGOA_DAYS_1_TO_5_HOSTILE_REVIEW_2026-08-21.md — decision 5
 */
export const MTGOA_DOMAIN_RULE =
  'The first three days helped you read your own situation. The last two narrow to one field: helping the right person encounter this book.'

/** Days a visitor can walk right now, in order. */
export function shippedCourseDays(): MtgoaCourseDay[] {
  return MTGOA_COURSE_DAYS.filter((day) => day.status === 'shipped')
}

function practicesFor(move: MtgoaCourseMove): MoveCard[] {
  return assembleDeck('mtgoa-course').cards.filter(
    (card): card is MoveCard => card.kind === 'move' && card.move === move,
  )
}

/** All 24 canonical cards for a move — every course day draws from the real suit. */
export const WAKE_UP_PRACTICES = practicesFor('wake_up')
export const OPEN_UP_PRACTICES = practicesFor('open_up')
export const CLEAN_UP_PRACTICES = practicesFor('clean_up')
export const GROW_UP_PRACTICES = practicesFor('grow_up')
export const SHOW_UP_PRACTICES = practicesFor('show_up')

/**
 * Days 4 and 5 narrow to round 1's domain: six cards per move, one per Game Master.
 *
 * The design rule, which the pages state rather than assume: the first three days help
 * a reader read their own live situation, and the last two narrow to this campaign's
 * field — helping the right people encounter this book.
 *
 * Both days deal a three-card hand from their six. Never present a Game Master gate and
 * then "reveal" its only card; that is a selection wearing a draw's clothes.
 */
export const GROW_UP_RAISE_AWARENESS_PRACTICES = GROW_UP_PRACTICES.filter(
  (card) => card.domain === 'RAISE_AWARENESS',
)

export const SHOW_UP_RAISE_AWARENESS_PRACTICES = SHOW_UP_PRACTICES.filter(
  (card) => card.domain === 'RAISE_AWARENESS',
)
