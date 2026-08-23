/**
 * The wall clock at request time.
 *
 * Async on purpose. The release gate needs the clock, and reading `Date.now()`
 * inside a component body is an impure call during render — the React compiler
 * rejects it, correctly, because a value that changes between renders of the
 * same tree is exactly what it is there to catch. Awaiting a function that reads
 * the clock is the ordinary way a Server Component gets request-time data, and
 * it keeps the impurity out of the render itself.
 *
 * The board takes the instant rather than a list of what is open, because it has
 * to say *when* the next day lands. Handing it only the open days left every
 * "opens tomorrow" falling back to the day range, so the served HTML read
 * "Days 6-10" where the hydrated page read "Day 6 opens tomorrow" — right for a
 * reader with JavaScript, wrong for the first paint and for anything that never
 * runs it.
 */
export async function currentNow(): Promise<number> {
  return Date.now()
}
