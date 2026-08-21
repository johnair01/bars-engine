import { ROUND_TWO_DAYS, roundTwoCardsFor } from './round-two'
import type { RoundTwoLane, RoundTwoState } from './round-two'

export const ROUND_TWO_EVENT_NAMES = [
  'week_two_viewed',
  'week_two_started',
  'week_two_card_carried',
  'week_two_draw_skipped',
  'week_two_redraw',
  'week_two_lane_chosen',
  'week_two_state_chosen',
  'week_two_returned_to_day',
  'week_two_artifact_copied',
  'week_two_state_panel_opened',
  'week_two_campaign_state_clicked',
  'week_two_next_day_clicked',
  'week_two_completed',
] as const

export type RoundTwoEventName = (typeof ROUND_TWO_EVENT_NAMES)[number]

export type RoundTwoAnalyticsEvent = {
  event: RoundTwoEventName
  /** Which of days 6–10. A position in the course, never an answer. */
  day?: number
  cardId?: string
  lane?: RoundTwoLane
  state?: RoundTwoState
  /** Which earlier day a blocked reader routed to. */
  returnedToDay?: number
}

const EVENT_NAMES = new Set<string>(ROUND_TWO_EVENT_NAMES)
const LANES = new Set<string>(['personal', 'local_team'])
const STATES = new Set<string>(['prepared', 'made', 'returning'])
const DAYS = new Set<number>(ROUND_TWO_DAYS.map((d) => d.day))

/** Every canonical Skillful Organizing card id across the five Week 2 moves. */
const CARD_IDS = new Set<string>(
  ROUND_TWO_DAYS.flatMap((d) => roundTwoCardsFor(d.move).map((c) => c.id)),
)

/**
 * Parse the Week 2 aggregate event envelope.
 *
 * The spec allows exactly this much: route view, card id, redraw/skip, public
 * link clicks, and the receipt-state choice. It has no generic payload field, so
 * the campaign map, the load check, the 3-2-1 and the artifact are structurally
 * unable to reach logging — the same boundary every Week 1 day holds.
 */
export function parseRoundTwoAnalyticsEvent(input: unknown): RoundTwoAnalyticsEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const raw = input as Record<string, unknown>
  if (typeof raw.event !== 'string' || !EVENT_NAMES.has(raw.event)) return null

  const event: RoundTwoAnalyticsEvent = { event: raw.event as RoundTwoEventName }

  if (typeof raw.day === 'number' && DAYS.has(raw.day)) event.day = raw.day
  if (typeof raw.cardId === 'string' && CARD_IDS.has(raw.cardId)) event.cardId = raw.cardId
  if (typeof raw.lane === 'string' && LANES.has(raw.lane)) event.lane = raw.lane as RoundTwoLane
  if (typeof raw.state === 'string' && STATES.has(raw.state)) event.state = raw.state as RoundTwoState
  if (
    typeof raw.returnedToDay === 'number' &&
    Number.isInteger(raw.returnedToDay) &&
    raw.returnedToDay >= 1 &&
    raw.returnedToDay <= 10
  ) {
    event.returnedToDay = raw.returnedToDay
  }

  return event
}
