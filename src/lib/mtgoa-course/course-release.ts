/**
 * When each day of the challenge goes live.
 *
 * The course releases one day per day, so "has this day been written" and "has
 * it been released to readers" are two different questions. The spine answers
 * the first (`status`); this module answers the second. A day needs both a
 * `shipped` status and a past release date before anyone can open it.
 *
 * Pure functions over an injected `now`, so every boundary is testable without
 * mocking the clock — the same shape `src/lib/goodbye-party/time.ts` uses. There
 * is no cron and no scheduler: release state is derived from the clock on every
 * read, on the server and again in the browser, so a cached render cannot
 * outlive a release.
 *
 * @see src/lib/mtgoa-course/course-days.ts — what has been written
 * @see src/lib/mtgoa-course/course-progress.ts — where a reader has got to
 */

import { MTGOA_COURSE_LENGTH, MTGOA_MOVES_PER_ROUND } from './course-days'

/** The clock the release dates are written against. */
export const MTGOA_RELEASE_TIME_ZONE = 'America/New_York'

/**
 * The instant each day goes live, or null where no date has been set.
 *
 * Written out per day rather than computed from a week's start plus an offset.
 * Adding twenty-four hours five times is only correct while a week avoids a
 * daylight-saving boundary, and a week that straddles one would shift its
 * midnight into the previous day and rename the weekday on the board. Explicit
 * instants have no such failure, and authoring five strings a week is a small
 * price for a release calendar that cannot quietly drift.
 *
 * Times are midnight in `MTGOA_RELEASE_TIME_ZONE`. August is EDT (UTC-4), so
 * midnight ET is 04:00Z; a date in EST (UTC-5) is 05:00Z. Work the offset out
 * for the date rather than copying the one above.
 *
 * Days 1–5 shipped before the challenge had a release calendar, so their date is
 * simply in the past and only that fact matters.
 */
export const DAY_RELEASE_ISO: Readonly<Record<number, string | null>> = {
  // Week 1 — Raise Awareness. Long live.
  1: '2026-08-14T04:00:00Z',
  2: '2026-08-14T04:00:00Z',
  3: '2026-08-14T04:00:00Z',
  4: '2026-08-14T04:00:00Z',
  5: '2026-08-14T04:00:00Z',
  // Week 2 — Skillful Organizing. One a day, Sunday through Thursday.
  6: '2026-08-23T04:00:00Z',
  7: '2026-08-24T04:00:00Z',
  8: '2026-08-25T04:00:00Z',
  9: '2026-08-26T04:00:00Z',
  10: '2026-08-27T04:00:00Z',
  11: '2026-08-30T04:00:00Z',
  12: '2026-08-31T04:00:00Z',
  13: '2026-09-02T04:00:00Z',
  14: '2026-09-03T04:00:00Z',
}

function releaseMs(day: number): number | null {
  const iso = DAY_RELEASE_ISO[day]
  if (!iso) return null
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? null : ms
}

function toMs(now: Date | number): number {
  return typeof now === 'number' ? now : now.getTime()
}

/** Has this day gone live? A day with no date never has. */
export function isDayReleased(day: number, now: Date | number): boolean {
  const at = releaseMs(day)
  return at !== null && toMs(now) >= at
}

/** Every day live at `now`, ascending. */
export function releasedDays(now: Date | number): number[] {
  return Array.from({ length: MTGOA_COURSE_LENGTH }, (_, i) => i + 1).filter((day) =>
    isDayReleased(day, now),
  )
}

/**
 * The newest day live right now — what the banner means by "we are on day N".
 *
 * Null before anything has been released.
 */
export function latestReleasedDay(now: Date | number): number | null {
  const live = releasedDays(now)
  return live.length > 0 ? live[live.length - 1] : null
}

/** Has any day of this week gone live? Drives whether the board draws cards. */
export function isRoundStarted(round: number, now: Date | number): boolean {
  const first = (round - 1) * MTGOA_MOVES_PER_ROUND + 1
  return isDayReleased(first, now)
}

/** Weeks with at least one day live, ascending. */
export function startedRounds(now: Date | number): number[] {
  const rounds = Math.ceil(MTGOA_COURSE_LENGTH / MTGOA_MOVES_PER_ROUND)
  return Array.from({ length: rounds }, (_, i) => i + 1).filter((round) => isRoundStarted(round, now))
}

/** The next day with a date that has yet to arrive, or null. */
export function nextDayRelease(now: Date | number): { day: number; at: number } | null {
  for (let day = 1; day <= MTGOA_COURSE_LENGTH; day += 1) {
    const at = releaseMs(day)
    if (at !== null && toMs(now) < at) return { day, at }
  }
  return null
}

/** When a given day goes live, or null if it has no date. */
export function dayReleaseAt(day: number): number | null {
  return releaseMs(day)
}

/**
 * How a pending release is named.
 *
 * Inside a week of the release it reads as a weekday a reader can hold ("opens
 * Sunday"), because that is how someone thinks about a course they are waiting
 * on. Tomorrow gets its own word. Further out it takes the date, since "opens
 * Tuesday" three weeks early tells you nothing.
 */
export function releaseLabel(at: number, now: Date | number): string {
  const zone = MTGOA_RELEASE_TIME_ZONE
  const nowMs = toMs(now)
  if (at <= nowMs) return 'live'

  const dayIn = (ms: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms)
  const daysApart = Math.round(
    (Date.parse(`${dayIn(at)}T00:00:00Z`) - Date.parse(`${dayIn(nowMs)}T00:00:00Z`)) / 86_400_000,
  )

  if (daysApart <= 1) return 'opens tomorrow'
  if (daysApart < 7) {
    return `opens ${new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: zone }).format(at)}`
  }
  return `opens ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: zone }).format(at)}`
}
