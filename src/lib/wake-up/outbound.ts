import { withOpenUpAttribution } from '@/lib/open-up/outbound'

/**
 * Outbound links from the Wake Up Check.
 *
 * Attribution forwarding is shared with the Open Up and Clean Up checks: only
 * standard UTM fields and a valid existing ally referral id may leave the page.
 * Nothing the visitor writes or selects inside the check is ever appended to a URL.
 */
export function wakeUpAttribution(url: string, search: URLSearchParams): string {
  return withOpenUpAttribution(url, search)
}

/** The book's sales page — the only book surface this flow points at. */
export function wakeUpBookHref(search: URLSearchParams): string {
  return wakeUpAttribution('/mastering-allyship', search)
}

/** The deck's sales page — the warm handoff after the draw. */
export function wakeUpDeckHref(search: URLSearchParams): string {
  return wakeUpAttribution('/deck/sales', search)
}

/**
 * The next course day. The route comes from `nextCourseDay()`, never a literal,
 * so this cannot outlive the day it points at. Attribution is carried forward so
 * the course walks as one journey.
 */
export function wakeUpNextDayHref(search: URLSearchParams, route: string): string {
  return wakeUpAttribution(route, search)
}
