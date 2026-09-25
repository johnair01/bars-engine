/**
 * The build-in-public log, and the rule that keeps it honest.
 *
 * The site handoff attaches one condition to this whole surface: *"One post a
 * week minimum or don't launch it — this must not become the next unpaid
 * promise."*
 *
 * A condition like that usually survives as a line in a doc and dies the first
 * busy month, because nothing on the page notices. So the cadence is computed
 * here instead: the page reads its own posting history and tells the truth
 * about it, including when the truth is that the cadence lapsed. When it has,
 * **the join button does not render**. A page cannot sell a weekly promise it
 * is visibly not keeping.
 *
 * Add a post by putting it at the top of BUILD_LOG_POSTS. Remove nothing.
 */

export interface BuildLogPost {
  /** ISO date, YYYY-MM-DD. */
  date: string
  title: string
  /** Where the post lives. Usually Patreon. */
  href?: string
  /** One line on what actually happened, in plain words. */
  summary?: string
}

/**
 * Newest first. Empty is the correct state today: nothing has been posted, so
 * the page says so and offers no subscription.
 */
export const BUILD_LOG_POSTS: readonly BuildLogPost[] = []

/**
 * Weekly means seven days. Ten is the grace: a post landing on a Tuesday and
 * then the following Thursday has kept the promise in every sense a reader
 * cares about. Past ten, it has not.
 */
export const WEEKLY_GRACE_DAYS = 10

export type BuildLogState =
  | { kind: 'unstarted' }
  | {
      kind: 'holding' | 'lapsed'
      daysSinceLast: number
      latest: BuildLogPost
      postCount: number
    }

function toUtcDays(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.floor(Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86_400_000)
}

/**
 * `today` is passed in rather than read from the clock, so the rule is testable
 * and so the page renders deterministically on the server.
 */
export function buildLogState(
  posts: readonly BuildLogPost[],
  todayIso: string,
): BuildLogState {
  if (posts.length === 0) return { kind: 'unstarted' }

  const latest = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  const daysSinceLast = Math.max(0, toUtcDays(todayIso) - toUtcDays(latest.date))

  return {
    kind: daysSinceLast <= WEEKLY_GRACE_DAYS ? 'holding' : 'lapsed',
    daysSinceLast,
    latest,
    postCount: posts.length,
  }
}

/** "eleven days" reads better than "11 days" in running prose. */
export function daysInWords(days: number): string {
  const WORDS = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
  ]
  return WORDS[days] ?? String(days)
}
