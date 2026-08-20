import { describe, expect, it } from 'vitest'

import { CLEAN_UP_PRACTICES } from '../check-content'
import { parseCleanUpAnalyticsEvent } from '../events'

const CARD_ID = CLEAN_UP_PRACTICES[0].id

describe('parseCleanUpAnalyticsEvent', () => {
  it('accepts a well-formed aggregate event', () => {
    expect(
      parseCleanUpAnalyticsEvent({ event: 'clean_up_move_selected', route: 'book_promo', moveKey: 'act', cardId: CARD_ID }),
    ).toEqual({ event: 'clean_up_move_selected', route: 'book_promo', moveKey: 'act', cardId: CARD_ID })
  })

  it('rejects anything without a known event name', () => {
    expect(parseCleanUpAnalyticsEvent(null)).toBeNull()
    expect(parseCleanUpAnalyticsEvent([])).toBeNull()
    expect(parseCleanUpAnalyticsEvent({})).toBeNull()
    expect(parseCleanUpAnalyticsEvent({ event: 'clean_up_something_else' })).toBeNull()
  })

  it('drops unknown enum values rather than passing them through', () => {
    expect(parseCleanUpAnalyticsEvent({ event: 'clean_up_check_started', route: 'sideways' })).toEqual({
      event: 'clean_up_check_started',
    })
    expect(parseCleanUpAnalyticsEvent({ event: 'clean_up_move_selected', moveKey: 'quit' })).toEqual({
      event: 'clean_up_move_selected',
    })
    expect(parseCleanUpAnalyticsEvent({ event: 'clean_up_move_selected', cardId: 'OPEN-RA-SAGE' })).toEqual({
      event: 'clean_up_move_selected',
    })
  })

  it('cannot carry the visitor’s private writing', () => {
    const parsed = parseCleanUpAnalyticsEvent({
      event: 'clean_up_check_completed',
      route: 'own_charge',
      moveKey: 'later',
      bodyReading: 'foggy',
      maskName: 'The Cynic',
      thread: [{ from: 'me', text: 'private' }],
      postText: 'the whole draft',
      payload: { anything: 'at all' },
    })
    expect(parsed).toEqual({ event: 'clean_up_check_completed', route: 'own_charge', moveKey: 'later' })
  })
})
