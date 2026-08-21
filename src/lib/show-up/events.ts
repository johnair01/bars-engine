import { SHOW_UP_CARD_IDS } from './check-content'
import type { ShowUpBlockKind, ShowUpState } from './check-content'

export const SHOW_UP_EVENT_NAMES = [
  'show_up_check_viewed',
  'show_up_check_started',
  'show_up_reentry_chosen',
  'show_up_aimed',
  'show_up_card_carried',
  'show_up_draw_skipped',
  'show_up_reason_named',
  'show_up_state_chosen',
  'show_up_block_named',
  'show_up_returned_to_move',
  'show_up_put_down',
  'show_up_came_back',
  'show_up_deck_cta_clicked',
  'show_up_book_cta_clicked',
  'show_up_next_day_clicked',
] as const

export type ShowUpEventName = (typeof SHOW_UP_EVENT_NAMES)[number]

/** Validated against the canonical Show Up × Raise Awareness six at runtime. */
export type ShowUpCardId = string

export type ShowUpAnalyticsEvent = {
  event: ShowUpEventName
  /**
   * The self-reported state. The review is explicit that the site should not and
   * need not verify a private action — so this is a claim, recorded as a claim.
   */
  state?: ShowUpState
  blockKind?: ShowUpBlockKind
  /** Which earlier day a blocked reader routed to. A day number, not a diagnosis. */
  returnedToDay?: number
  cardId?: ShowUpCardId
}

const EVENT_NAMES = new Set<string>(SHOW_UP_EVENT_NAMES)
const STATES = new Set<string>(['prepared', 'shown_up', 'put_down'])
const BLOCK_KINDS = new Set<string>(['inside_me', 'not_this_hand'])

/**
 * Parse the public Show Up Check's aggregate event envelope.
 *
 * Like every other day's parser, this has no generic payload field. Day 5 holds
 * the most sensitive writing in the course — who the reader is thinking of, what
 * they would say to them — and this boundary must make it impossible for any of
 * it to reach logging.
 *
 * The review also requires that four things stay measured *separately*: action
 * made (self-reported), book CTA click, purchase when attributable, and the
 * qualitative return signal. Nothing here combines them, and nothing here scores
 * a reader — a sale is a campaign outcome, not evidence about a person.
 */
export function parseShowUpAnalyticsEvent(input: unknown): ShowUpAnalyticsEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const raw = input as Record<string, unknown>
  if (typeof raw.event !== 'string' || !EVENT_NAMES.has(raw.event)) return null

  const event: ShowUpAnalyticsEvent = { event: raw.event as ShowUpEventName }

  if (typeof raw.state === 'string' && STATES.has(raw.state)) {
    event.state = raw.state as ShowUpState
  }
  if (typeof raw.blockKind === 'string' && BLOCK_KINDS.has(raw.blockKind)) {
    event.blockKind = raw.blockKind as ShowUpBlockKind
  }
  if (
    typeof raw.returnedToDay === 'number' &&
    Number.isInteger(raw.returnedToDay) &&
    raw.returnedToDay >= 1 &&
    raw.returnedToDay <= 4
  ) {
    event.returnedToDay = raw.returnedToDay
  }
  if (typeof raw.cardId === 'string' && SHOW_UP_CARD_IDS.has(raw.cardId)) {
    event.cardId = raw.cardId as ShowUpCardId
  }

  return event
}
