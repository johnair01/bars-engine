import { CLEAN_UP_CARD_IDS } from './check-content'
import type { CleanUpMoveKey, CleanUpRoute } from './check-content'

export const CLEAN_UP_EVENT_NAMES = [
  'clean_up_check_viewed',
  'clean_up_check_started',
  'clean_up_check_completed',
  'clean_up_route_selected',
  'clean_up_move_selected',
  'clean_up_draft_copied',
  'clean_up_deck_cta_clicked',
  'clean_up_book_cta_clicked',
] as const

export type CleanUpEventName = (typeof CLEAN_UP_EVENT_NAMES)[number]

/** Validated against the canonical Clean Up suit at runtime. */
export type CleanUpCardId = string

export type CleanUpAnalyticsEvent = {
  event: CleanUpEventName
  route?: CleanUpRoute
  moveKey?: CleanUpMoveKey
  cardId?: CleanUpCardId
}

const EVENT_NAMES = new Set<string>(CLEAN_UP_EVENT_NAMES)
const ROUTES = new Set<string>(['book_promo', 'own_charge'])
const MOVE_KEYS = new Set<string>(['act', 'later', 'not_mine'])

/**
 * Parse the public Clean Up Check's aggregate event envelope.
 *
 * Like the Open Up Check's, this deliberately has no generic payload field. The
 * check holds private writing in the browser — the body reading, the channel,
 * the line, the 3-2-1 passes, the name given to the part, the thread, the draft
 * — and this boundary must make it impossible for any of it to reach logging.
 */
export function parseCleanUpAnalyticsEvent(input: unknown): CleanUpAnalyticsEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const raw = input as Record<string, unknown>
  if (typeof raw.event !== 'string' || !EVENT_NAMES.has(raw.event)) return null

  const event: CleanUpAnalyticsEvent = { event: raw.event as CleanUpEventName }

  if (typeof raw.route === 'string' && ROUTES.has(raw.route)) {
    event.route = raw.route as CleanUpRoute
  }
  if (typeof raw.moveKey === 'string' && MOVE_KEYS.has(raw.moveKey)) {
    event.moveKey = raw.moveKey as CleanUpMoveKey
  }
  if (typeof raw.cardId === 'string' && CLEAN_UP_CARD_IDS.has(raw.cardId)) {
    event.cardId = raw.cardId as CleanUpCardId
  }

  return event
}
