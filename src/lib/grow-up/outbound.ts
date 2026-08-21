import { withOpenUpAttribution } from '@/lib/open-up/outbound'

/**
 * Outbound links from the Grow Up Check.
 *
 * Attribution forwarding is shared with every other check: only standard UTM
 * fields and a valid existing ally referral id may leave the page.
 */
export function growUpAttribution(url: string, search: URLSearchParams): string {
  return withOpenUpAttribution(url, search)
}

/** The book's sales page. */
export function growUpBookHref(search: URLSearchParams): string {
  return growUpAttribution('/mastering-allyship', search)
}

/** The deck's sales page — the warm handoff after the draw. */
export function growUpDeckHref(search: URLSearchParams): string {
  return growUpAttribution('/deck/sales', search)
}

/**
 * Day 1, for a reader whose honest starting-hand answer is "I am not sure yet".
 * The route comes from the spine, so this cannot point at an unbuilt day.
 */
export function growUpDayOneHref(search: URLSearchParams, route: string): string {
  return growUpAttribution(route, search)
}

/** The next course day. The route comes from `nextCourseDay()`, never a literal. */
export function growUpNextDayHref(search: URLSearchParams, route: string): string {
  return growUpAttribution(route, search)
}
