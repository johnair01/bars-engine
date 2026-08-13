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
])

/** Public route families. */
const FOOTER_PREFIXES: readonly string[] = [
  '/mastering-allyship/',
  '/deck/sales',
  '/campaign/the-crossing',
]

export function hasFooter(pathname: string, isAuthenticated: boolean): boolean {
  // `/` serves two pages from one route: the marketing doors when logged out,
  // and the player's NOW dashboard when logged in. The footer belongs to the
  // first, and under the second it is chrome in the wrong place.
  if (pathname === '/') return !isAuthenticated
  if (FOOTER_EXACT.has(pathname)) return true
  return FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
