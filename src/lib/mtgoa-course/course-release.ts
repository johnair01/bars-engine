/**
 * When each round of the course opens.
 *
 * The course releases a week at a time, so "has this day been written" and "has
 * it been released to readers" are two different questions. The spine answers
 * the first (`status`); this module answers the second. A day needs both a
 * `shipped` status and a released round before anyone can open it.
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

import { MTGOA_COURSE_ROUNDS } from './course-days'

/** The clock the release dates are written against. */
export const MTGOA_RELEASE_TIME_ZONE = 'America/New_York'

/**
 * The instant each round opens, or null where no date has been set.
 *
 * Times are midnight in `MTGOA_RELEASE_TIME_ZONE`, expressed as UTC so the
 * constant means one instant everywhere. August is EDT (UTC-4), so midnight ET
 * is 04:00Z — a release date set in a different part of the year needs its own
 * offset worked out rather than copied from here.
 *
 * Round 1 shipped before the course had a release calendar; its date is simply
 * in the past, and only that fact matters.
 */
export const ROUND_RELEASE_ISO: Readonly<Record<number, string | null>> = {
  1: '2026-08-14T04:00:00Z',
  2: '2026-08-23T04:00:00Z',
  3: null,
  4: null,
  5: null,
  6: null,
}

function releaseMs(round: number): number | null {
  const iso = ROUND_RELEASE_ISO[round]
  if (!iso) return null
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? null : ms
}

function toMs(now: Date | number): number {
  return typeof now === 'number' ? now : now.getTime()
}

/** Has this round opened to readers? A round with no date never has. */
export function isRoundReleased(round: number, now: Date | number): boolean {
  const at = releaseMs(round)
  return at !== null && toMs(now) >= at
}

/** Every round open at `now`, ascending. */
export function releasedRounds(now: Date | number): number[] {
  return Array.from({ length: MTGOA_COURSE_ROUNDS }, (_, i) => i + 1).filter((round) =>
    isRoundReleased(round, now),
  )
}

/**
 * The next round with a date that has yet to open, or null.
 *
 * This is what lets the board say "opens Sunday" against a specific week rather
 * than hiding that the course continues.
 */
export function nextRoundRelease(now: Date | number): { round: number; at: number } | null {
  for (let round = 1; round <= MTGOA_COURSE_ROUNDS; round += 1) {
    const at = releaseMs(round)
    if (at !== null && toMs(now) < at) return { round, at }
  }
  return null
}

/** The instant a round opens, or null where no date has been set. */
export function roundReleaseAt(round: number): number | null {
  return releaseMs(round)
}

/** Does this round have a date at all? */
export function roundHasReleaseDate(round: number): boolean {
  return releaseMs(round) !== null
}

/**
 * How a pending release is named on the board — "opens Sunday, August 23".
 *
 * Deliberately takes no `now`: a label that changed shape as the date
 * approached could not be rendered on the server, because the server and the
 * browser would disagree and the reader would watch it rewrite itself on load.
 * Naming both the weekday and the date also survives being read three weeks
 * early, which a bare weekday does not.
 */
export function releaseLabel(at: number): string {
  const zone = MTGOA_RELEASE_TIME_ZONE
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: zone }).format(at)
  const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: zone }).format(at)
  return `opens ${weekday}, ${date}`
}
