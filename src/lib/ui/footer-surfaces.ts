/**
 * Which surfaces carry the public footer.
 *
 * Pure and separate from `Chrome` so the rule can be tested without rendering
 * anything. The rule is easy to get wrong in a way nobody notices until a
 * player sees speaking fees under her private vault.
 *
 * An allowlist rather than "everywhere except the app", because those two are
 * not the same list and the wrong one is worse. Adding a marketing route means
 * adding it here, which is a visible decision rather than an accident of URL
 * shape.
 */

/** Exact public routes. */
const FOOTER_EXACT: ReadonlySet<string> = new Set([
  '/mastering-allyship',
  '/support',
  '/nonprofit',
  '/speaking',
  '/succession',
  '/podcasts',
  '/campaigns',
  '/launch',
  '/awaken',
  '/kickstarter',
  '/superpower',
  '/igniting-joy',
  '/build-log',
  '/introductions',
])

/** Public route families. */
const FOOTER_PREFIXES: readonly string[] = [
  '/mastering-allyship/',
  '/deck/sales',
  '/campaign/the-crossing',
]

/**
 * Exceptions carved out of the `/mastering-allyship/` family. Both checks end by
 * naming the doors that are actually open — the deck, the book, another pass,
 * and closing the tab. A site-wide link tree directly under that turns a
 * deliberate ending into a menu.
 */
const FOOTER_EXCLUDE_EXACT: ReadonlySet<string> = new Set([
  '/mastering-allyship/clean-up',
  '/mastering-allyship/open-up',
  '/mastering-allyship/wake-up',
  '/mastering-allyship/show-up',
  '/mastering-allyship/grow-up',
])

export function hasFooter(pathname: string, isAuthenticated: boolean): boolean {
  if (FOOTER_EXCLUDE_EXACT.has(pathname)) return false
  // `/` serves two pages from one route: the marketing doors when logged out,
  // and the player's NOW dashboard when logged in. The footer belongs to the
  // first, and under the second it is chrome in the wrong place.
  if (pathname === '/') return !isAuthenticated
  if (FOOTER_EXACT.has(pathname)) return true
  return FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
