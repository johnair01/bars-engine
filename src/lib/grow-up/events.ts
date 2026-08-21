import { GROW_UP_CARD_IDS } from './check-content'
import type { GrowUpScope } from './check-content'

export const GROW_UP_EVENT_NAMES = [
  'grow_up_check_viewed',
  'grow_up_check_started',
  'grow_up_check_completed',
  'grow_up_scope_chosen',
  'grow_up_returned_to_day_one',
  'grow_up_belief_named',
  'grow_up_card_carried',
  'grow_up_draw_skipped',
  'grow_up_rep_chosen',
  'grow_up_container_chosen',
  'grow_up_reminder_copied',
  'grow_up_deck_cta_clicked',
  'grow_up_book_cta_clicked',
  'grow_up_next_day_clicked',
] as const

export type GrowUpEventName = (typeof GROW_UP_EVENT_NAMES)[number]

/** Validated against the canonical Grow Up × Raise Awareness six at runtime. */
export type GrowUpCardId = string

export type GrowUpAnalyticsEvent = {
  event: GrowUpEventName
  scope?: GrowUpScope
  cardId?: GrowUpCardId
}

const EVENT_NAMES = new Set<string>(GROW_UP_EVENT_NAMES)
const SCOPES = new Set<string>(['one_person', 'small_room', 'not_sure'])

/**
 * Parse the public Grow Up Check's aggregate event envelope.
 *
 * No generic payload field, like every other day. Note what is deliberately
 * absent: there is no `repKey`, no `beliefKey` and no `boundary`. Which
 * self-sabotaging belief a reader recognised in themselves, and where they said
 * they would have to stop, are the most revealing things on the page — knowing
 * the aggregate distribution of them is not worth the shape of that record.
 * `scope` is here because "I am not sure yet" routing back to Day 1 is a funnel
 * fact the course needs to see working.
 */
export function parseGrowUpAnalyticsEvent(input: unknown): GrowUpAnalyticsEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const raw = input as Record<string, unknown>
  if (typeof raw.event !== 'string' || !EVENT_NAMES.has(raw.event)) return null

  const event: GrowUpAnalyticsEvent = { event: raw.event as GrowUpEventName }

  if (typeof raw.scope === 'string' && SCOPES.has(raw.scope)) {
    event.scope = raw.scope as GrowUpScope
  }
  if (typeof raw.cardId === 'string' && GROW_UP_CARD_IDS.has(raw.cardId)) {
    event.cardId = raw.cardId as GrowUpCardId
  }

  return event
}
