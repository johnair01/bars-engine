/**
 * Where a reader has got to — the day-by-day unlock.
 *
 * The real course opens the next day when you finish the one before it, and this
 * page should feel the same while it is still being built. That needs one bit
 * per day, and nothing else.
 *
 * **What is stored: day numbers.** Never an answer, never a name, never a card.
 * The course's standing promise is that what a reader writes stays in their
 * browser and is never sent, and this keeps that promise — a completion marker
 * is strictly less than the outreach list Open Up already keeps
 * (`src/components/open-up/OpenUpCheck.tsx`), and it is still local-only.
 *
 * The gate paces a free public page; it is not an entitlement. It lives in one
 * browser, it resets when storage is cleared, and it is trivially bypassable on
 * purpose — which is why every locked day carries its own way through.
 *
 * Pure functions here; the browser lives in `useCourseProgress`.
 *
 * @see src/lib/mtgoa-course/course-release.ts — which weeks are open at all
 */

import { MTGOA_MOVES_PER_ROUND } from './course-days'

export const COURSE_PROGRESS_STORAGE_KEY = 'mtgoa-course-progress-v1'
export const COURSE_PROGRESS_VERSION = 1 as const

export type CourseProgress = {
  version: typeof COURSE_PROGRESS_VERSION
  /** Day numbers the reader has finished, ascending and deduplicated. */
  completed: number[]
}

export const EMPTY_COURSE_PROGRESS: CourseProgress = { version: COURSE_PROGRESS_VERSION, completed: [] }

function cleanDays(input: unknown): number[] {
  if (!Array.isArray(input)) return []
  const days = input.filter(
    (day): day is number => typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 30,
  )
  return [...new Set(days)].sort((a, b) => a - b)
}

/**
 * Read whatever is in storage without trusting any of it.
 *
 * Anything unparseable, wrong-versioned, or hand-edited degrades to "no progress
 * yet" rather than throwing. The worst case is a reader re-opening a day they
 * had already finished, which the page survives.
 */
export function parseCourseProgress(raw: string | null): CourseProgress {
  if (!raw) return EMPTY_COURSE_PROGRESS
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return EMPTY_COURSE_PROGRESS
    const record = value as { version?: unknown; completed?: unknown }
    if (record.version !== COURSE_PROGRESS_VERSION) return EMPTY_COURSE_PROGRESS
    return { version: COURSE_PROGRESS_VERSION, completed: cleanDays(record.completed) }
  } catch {
    return EMPTY_COURSE_PROGRESS
  }
}

export function serializeCourseProgress(progress: CourseProgress): string {
  return JSON.stringify({ version: COURSE_PROGRESS_VERSION, completed: cleanDays(progress.completed) })
}

/** Record a finished day. Returns the same object when nothing changed. */
export function withDayCompleted(progress: CourseProgress, day: number): CourseProgress {
  if (!Number.isInteger(day) || day < 1 || day > 30) return progress
  if (progress.completed.includes(day)) return progress
  return { version: COURSE_PROGRESS_VERSION, completed: cleanDays([...progress.completed, day]) }
}

export function isDayCompleted(progress: CourseProgress, day: number): boolean {
  return progress.completed.includes(day)
}

/** The first day of a round — 1, 6, 11, … */
export function isFirstDayOfRound(day: number): boolean {
  return (day - 1) % MTGOA_MOVES_PER_ROUND === 0
}

export type DayGate =
  /** Open: the reader can walk it now. */
  | { state: 'open' }
  /** Already finished. Still open — a day can be walked again. */
  | { state: 'done' }
  /** The week it belongs to has yet to open. */
  | { state: 'unreleased' }
  /** The week is open, but the day before it is unfinished. */
  | { state: 'locked'; needsDay: number }
  /** Written by nobody yet. */
  | { state: 'unwritten' }

/**
 * Whether a reader can open a given day, and why not when they cannot.
 *
 * Three gates in order, because they answer different questions and the reader
 * deserves the most useful reason:
 *
 *   1. Has anyone written it? (the spine)
 *   2. Has its week opened? (the calendar)
 *   3. Has the reader finished the day before? (their own progress)
 *
 * **The first day of a released round is always open.** When week 2 opens on
 * Sunday, Day 6 opens with it — a reader who never finished week 1 joins the new
 * week rather than being locked out of a release they were told was coming. The
 * sequence gate then applies inside the week: day 7 waits on day 6.
 */
export function dayGate(input: {
  day: number
  round: number
  shipped: boolean
  roundReleased: boolean
  progress: CourseProgress
}): DayGate {
  const { day, shipped, roundReleased, progress } = input
  if (!shipped) return { state: 'unwritten' }
  if (!roundReleased) return { state: 'unreleased' }
  if (isDayCompleted(progress, day)) return { state: 'done' }
  if (isFirstDayOfRound(day)) return { state: 'open' }
  if (isDayCompleted(progress, day - 1)) return { state: 'open' }
  return { state: 'locked', needsDay: day - 1 }
}

/** Can a reader click through to this day? */
export function isDayReachable(gate: DayGate): boolean {
  return gate.state === 'open' || gate.state === 'done'
}

/**
 * The day the board's main button should send someone to.
 *
 * The *earliest* open day, so a first visit lands on day 1 and a reader who has
 * finished two days lands on day 3. Taking the latest open day instead would
 * send a first-time visitor to day 6 the moment week 2 released, since the first
 * day of every released round is open.
 *
 * Falls back to the last day they finished when nothing is open — the state a
 * reader is in when they have finished everything released so far.
 */
export function resumeDay(days: { number: number; gate: DayGate }[]): number | null {
  const ordered = [...days].sort((a, b) => a.number - b.number)
  const open = ordered.find((day) => day.gate.state === 'open')
  if (open) return open.number
  const done = ordered.filter((day) => day.gate.state === 'done')
  return done.length > 0 ? done[done.length - 1].number : null
}
