import { withOpenUpAttribution } from '@/lib/open-up/outbound'

/**
 * Outbound links from the Show Up Check.
 *
 * Attribution forwarding is shared with every other check: only standard UTM
 * fields and a valid existing ally referral id may leave the page. Nothing the
 * visitor writes — least of all who they are thinking of handing this to — is
 * ever appended to a URL.
 */
export function showUpAttribution(url: string, search: URLSearchParams): string {
  return withOpenUpAttribution(url, search)
}

/** The book's sales page. */
export function showUpBookHref(search: URLSearchParams): string {
  return showUpAttribution('/mastering-allyship', search)
}

/** The free first chapter — the handoff that costs the recipient nothing. */
export function showUpChapterHref(search: URLSearchParams): string {
  return showUpAttribution('/kickstarter/chapter-1?audience=public', search)
}

/** The deck's sales page. */
export function showUpDeckHref(search: URLSearchParams): string {
  return showUpAttribution('/deck/sales', search)
}

/**
 * An earlier day in the loop, for a reader whose next move is unclear inside
 * them. The route comes from the spine, so this cannot point at an unbuilt day.
 */
export function showUpEarlierMoveHref(search: URLSearchParams, route: string): string {
  return showUpAttribution(route, search)
}

/**
 * The next course day. The route comes from `nextCourseDay()`, never a literal.
 */
export function showUpNextDayHref(search: URLSearchParams, route: string): string {
  return showUpAttribution(route, search)
}
