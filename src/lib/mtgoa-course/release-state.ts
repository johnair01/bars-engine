import { latestReleasedDay, releasedDays } from './course-release'

/**
 * The release calendar resolved on the server.
 *
 * Async on purpose. The release gate needs the wall clock, and reading
 * `Date.now()` inside a component body is an impure call during render — the
 * React compiler rejects it, correctly, because a value that changes between
 * renders of the same tree is exactly what it is there to catch. Awaiting a
 * function that reads the clock is the ordinary way a Server Component gets
 * request-time data, and it keeps the impurity out of the render itself.
 *
 * Without this the server has no clock at all, and every day renders as though
 * it had yet to go live — which put a past date on week 1 and served a board
 * with no day links to crawlers and to anyone without JavaScript.
 */
export async function currentReleasedDays(): Promise<number[]> {
  return releasedDays(Date.now())
}

/** The newest day live right now — what the banner means by "day N is live". */
export async function currentLatestDay(): Promise<number | null> {
  return latestReleasedDay(Date.now())
}
