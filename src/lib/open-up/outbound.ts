import { BOOK_DIGITAL_GUMROAD_URL } from '@/lib/launch/book-offer'
import { readAllyParam, withAllyParam } from '@/lib/ally-campaign/referral'

const ALLOWED_QUERY_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const MAX_QUERY_VALUE_LENGTH = 200

/**
 * Carry campaign attribution across an Open Up Check handoff without forwarding
 * any private practice fields. Only standard UTM fields and a valid existing
 * ally referral id may leave the page.
 */
export function withOpenUpAttribution(url: string, search: URLSearchParams): string {
  if (!url.trim()) return url

  const withReferral = withAllyParam(url, readAllyParam(search))
  try {
    const parsed = new URL(withReferral, 'https://placeholder.invalid')
    for (const key of ALLOWED_QUERY_KEYS) {
      const value = search.get(key)
      if (value && value.length <= MAX_QUERY_VALUE_LENGTH) parsed.searchParams.set(key, value)
    }
    return /^https?:\/\//i.test(withReferral)
      ? parsed.toString()
      : `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return withReferral
  }
}

export function openUpBookHref(search: URLSearchParams): string {
  return withOpenUpAttribution(BOOK_DIGITAL_GUMROAD_URL, search)
}

export function openUpSalesHref(search: URLSearchParams): string {
  return withOpenUpAttribution('/mastering-allyship', search)
}

export function openUpChapterOneHref(search: URLSearchParams): string {
  return withOpenUpAttribution('/kickstarter/chapter-1?audience=public', search)
}

/**
 * The next course day. The route comes from `nextCourseDay()`, never a literal,
 * so this cannot outlive the day it points at.
 */
export function openUpNextDayHref(search: URLSearchParams, route: string): string {
  return withOpenUpAttribution(route, search)
}
