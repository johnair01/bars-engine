import { describe, expect, it } from 'vitest'

import { parseOpenUpAnalyticsEvent } from '../events'

describe('parseOpenUpAnalyticsEvent', () => {
  it('keeps only allow-listed aggregate fields', () => {
    expect(
      parseOpenUpAnalyticsEvent({
        event: 'open_up_action_selected',
        entryMode: 'generic_allyship',
        actionKey: 'take_personal_step',
        cardId: 'OPEN-RA-SAGE',
        story: 'I do not want to be seen',
        bodyWeather: 'tight',
        name: 'A person the visitor knows',
      }),
    ).toEqual({
      event: 'open_up_action_selected',
      entryMode: 'generic_allyship',
      actionKey: 'take_personal_step',
      cardId: 'OPEN-RA-SAGE',
    })
  })

  it('rejects an unknown event', () => {
    expect(parseOpenUpAnalyticsEvent({ event: 'open_up_private_story', text: 'nope' })).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(parseOpenUpAnalyticsEvent(null)).toBeNull()
    expect(parseOpenUpAnalyticsEvent('open_up_check_viewed')).toBeNull()
  })
})
