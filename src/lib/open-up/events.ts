export const OPEN_UP_EVENT_NAMES = [
  'open_up_check_viewed',
  'open_up_check_started',
  'open_up_check_completed',
  'open_up_entry_mode_selected',
  'open_up_action_selected',
  'open_up_book_cta_clicked',
  'open_up_chapter_one_clicked',
  'open_up_share_copy_copied',
  'open_up_next_day_clicked',
] as const

export type OpenUpEventName = (typeof OPEN_UP_EVENT_NAMES)[number]

export type OpenUpEntryMode = 'book_share' | 'generic_allyship'
export type OpenUpActionKey =
  | 'not_my_ask'
  | 'come_back'
  | 'save_excerpt'
  | 'name_one_person'
  | 'send_personal_note'
  | 'take_personal_step'
  | 'share_publicly'
/** Validated against the canonical Open Up suit at runtime. */
export type OpenUpCardId = string
export type OpenUpShareType = 'personal_note' | 'public_share'

export type OpenUpAnalyticsEvent = {
  event: OpenUpEventName
  entryMode?: OpenUpEntryMode
  actionKey?: OpenUpActionKey
  cardId?: OpenUpCardId
  shareType?: OpenUpShareType
}

const EVENT_NAMES = new Set<string>(OPEN_UP_EVENT_NAMES)
const ENTRY_MODES = new Set<string>(['book_share', 'generic_allyship'])
const ACTION_KEYS = new Set<string>([
  'not_my_ask',
  'come_back',
  'save_excerpt',
  'name_one_person',
  'send_personal_note',
  'take_personal_step',
  'share_publicly',
])
const SHARE_TYPES = new Set<string>(['personal_note', 'public_share'])

/**
 * Parse the public Open Up Check's aggregate event envelope.
 *
 * This deliberately has no generic payload field. The Check can hold private
 * writing in the browser, but this boundary must make it impossible to pass
 * body weather, stories, protections, names, dates, or free text to logging.
 */
export function parseOpenUpAnalyticsEvent(input: unknown): OpenUpAnalyticsEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const raw = input as Record<string, unknown>
  if (typeof raw.event !== 'string' || !EVENT_NAMES.has(raw.event)) return null

  const event: OpenUpAnalyticsEvent = { event: raw.event as OpenUpEventName }

  if (typeof raw.entryMode === 'string' && ENTRY_MODES.has(raw.entryMode)) {
    event.entryMode = raw.entryMode as OpenUpEntryMode
  }
  if (typeof raw.actionKey === 'string' && ACTION_KEYS.has(raw.actionKey)) {
    event.actionKey = raw.actionKey as OpenUpActionKey
  }
  if (typeof raw.cardId === 'string' && OPEN_UP_CARD_IDS.has(raw.cardId)) {
    event.cardId = raw.cardId as OpenUpCardId
  }
  if (typeof raw.shareType === 'string' && SHARE_TYPES.has(raw.shareType)) {
    event.shareType = raw.shareType as OpenUpShareType
  }

  return event
}
import { OPEN_UP_CARD_IDS } from './check-content'
