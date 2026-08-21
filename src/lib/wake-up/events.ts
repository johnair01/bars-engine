import { WAKE_UP_CARD_IDS } from './check-content'
import type { WakeUpRoute } from './check-content'

export const WAKE_UP_EVENT_NAMES = [
  'wake_up_check_viewed',
  'wake_up_check_started',
  'wake_up_check_completed',
  'wake_up_route_selected',
  'wake_up_question_advanced',
  'wake_up_card_carried',
  'wake_up_draw_skipped',
  'wake_up_deck_cta_clicked',
  'wake_up_book_cta_clicked',
  'wake_up_next_day_clicked',
] as const

export type WakeUpEventName = (typeof WAKE_UP_EVENT_NAMES)[number]

/** Validated against the canonical Wake Up suit at runtime. */
export type WakeUpCardId = string

export type WakeUpAnalyticsEvent = {
  event: WakeUpEventName
  route?: WakeUpRoute
  /** Which of the six the visitor moved past. A position, never an answer. */
  questionNumber?: number
  cardId?: WakeUpCardId
}

const EVENT_NAMES = new Set<string>(WAKE_UP_EVENT_NAMES)
const ROUTES = new Set<string>(['book_promo', 'own_practice'])

/**
 * Parse the public Wake Up Check's aggregate event envelope.
 *
 * Like the Open Up and Clean Up parsers, this deliberately has no generic
 * payload field. Day 1 holds six pieces of private writing — the creation, the
 * satisfaction, the felt state, the worldview — and this boundary must make it
 * impossible for any of it to reach logging. `questionNumber` is a position in
 * the sequence, so it says how far someone got and nothing about what they said.
 */
export function parseWakeUpAnalyticsEvent(input: unknown): WakeUpAnalyticsEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const raw = input as Record<string, unknown>
  if (typeof raw.event !== 'string' || !EVENT_NAMES.has(raw.event)) return null

  const event: WakeUpAnalyticsEvent = { event: raw.event as WakeUpEventName }

  if (typeof raw.route === 'string' && ROUTES.has(raw.route)) {
    event.route = raw.route as WakeUpRoute
  }
  if (
    typeof raw.questionNumber === 'number' &&
    Number.isInteger(raw.questionNumber) &&
    raw.questionNumber >= 1 &&
    raw.questionNumber <= 6
  ) {
    event.questionNumber = raw.questionNumber
  }
  if (typeof raw.cardId === 'string' && WAKE_UP_CARD_IDS.has(raw.cardId)) {
    event.cardId = raw.cardId as WakeUpCardId
  }

  return event
}
