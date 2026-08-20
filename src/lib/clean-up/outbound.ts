import { withOpenUpAttribution } from '@/lib/open-up/outbound'

/**
 * Outbound links from the Clean Up Check.
 *
 * Attribution forwarding is shared with the Open Up Check: only standard UTM
 * fields and a valid existing ally referral id may leave the page. Nothing the
 * visitor writes or selects inside the check is ever appended to a URL.
 */
export function cleanUpAttribution(url: string, search: URLSearchParams): string {
  return withOpenUpAttribution(url, search)
}

/** The book's sales page — the only book surface this flow points at. */
export function cleanUpBookHref(search: URLSearchParams): string {
  return cleanUpAttribution('/mastering-allyship', search)
}

/** The deck's sales page — the warm handoff after the draw. */
export function cleanUpDeckHref(search: URLSearchParams): string {
  return cleanUpAttribution('/deck/sales', search)
}
