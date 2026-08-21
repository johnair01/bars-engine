import { describe, expect, it } from 'vitest'
import {
  SHOW_UP_BLOCKS,
  SHOW_UP_CARD_IDS,
  SHOW_UP_CARD_PROMPTS,
  SHOW_UP_PRACTICES,
  SHOW_UP_REASONS,
  SHOW_UP_RECEIPT,
  canClaimHandoff,
  showUpEvidence,
} from '../check-content'
import { parseShowUpAnalyticsEvent } from '../events'
import { showUpBookHref, showUpEarlierMoveHref, showUpNextDayHref } from '../outbound'

describe('Show Up Check content', () => {
  it('draws from the six Show Up × Raise Awareness cards, one per Game Master', () => {
    expect(SHOW_UP_PRACTICES).toHaveLength(6)
    expect(SHOW_UP_PRACTICES.map((card) => card.id).sort()).toEqual([
      'SHOW-RA-ARCHITECT', 'SHOW-RA-CHALLENGER', 'SHOW-RA-DIPLOMAT',
      'SHOW-RA-REGENT', 'SHOW-RA-SAGE', 'SHOW-RA-SHAMAN',
    ])
  })

  it('gives every card its own handoff prompt', () => {
    for (const id of SHOW_UP_CARD_IDS) expect(SHOW_UP_CARD_PROMPTS[id]).toBeTruthy()
  })

  it('keeps the Diplomat card from borrowing anyone’s testimony', () => {
    // The review's failure risk 3: a promoter cannot claim the authority of people
    // affected by a harm to make a recommendation land.
    const diplomat = SHOW_UP_CARD_PROMPTS['SHOW-RA-DIPLOMAT']
    expect(diplomat).toMatch(/consent/i)
    expect(diplomat).toMatch(/your own experience/i)
  })

  it('offers only recipient-centered reasons — none of them a sale', () => {
    expect(SHOW_UP_REASONS).toHaveLength(6)
    for (const reason of SHOW_UP_REASONS) {
      expect(reason.label).not.toMatch(/\b(buy|purchase|sale|sell)\b/i)
    }
  })

  it('never calls prepared completed', () => {
    // The distinction is carried affirmatively — "still waiting on you" rather than
    // "not the same as sent" — per .claude/skills/no-ai-slop.
    expect(SHOW_UP_RECEIPT.prepared.title).not.toMatch(/complete|done|finished/i)
    expect(SHOW_UP_RECEIPT.prepared.body).toMatch(/still waiting on you/i)
    expect(SHOW_UP_RECEIPT.put_down.body).not.toMatch(/fail|should have|excuse/i)
  })

  it('forks no-send into two readings, neither of them resistance', () => {
    expect(SHOW_UP_BLOCKS.map((block) => block.key)).toEqual(['inside_me', 'not_this_hand'])
    // Neither branch blames the reader. "Not the right hand" validates the reading
    // affirmatively — the review's decision 2, written per no-ai-slop.
    for (const block of SHOW_UP_BLOCKS) expect(block.body).not.toMatch(/you failed|excuse|should have/i)
    expect(SHOW_UP_BLOCKS[0].body).toMatch(/the practice working/i)
    expect(SHOW_UP_BLOCKS[1].body).toMatch(/a real reading of the field/i)
  })

  it('gates the handoff claim on a recipient-centered reason, and nothing else', () => {
    expect(canClaimHandoff(false)).toBe(false)
    expect(canClaimHandoff(true)).toBe(true)
  })

  it('reports only what the reader actually did', () => {
    expect(showUpEvidence({ aimed: false, carried: false, hasReason: false, state: null, returned: false }))
      .toEqual(['showed up to Day 5'])
    expect(showUpEvidence({ aimed: true, carried: true, hasReason: true, state: 'prepared', returned: true }))
      .toEqual(['showed up to Day 5', 'aimed it at one room', 'carried a Show Up card', 'named what it gives them', 'prepared it', 'named what happened'])
  })
})

describe('Show Up Check analytics boundary', () => {
  it('records the self-reported state as a claim', () => {
    expect(parseShowUpAnalyticsEvent({ event: 'show_up_state_chosen', state: 'shown_up' }))
      .toEqual({ event: 'show_up_state_chosen', state: 'shown_up' })
  })

  it('drops the sentence, the room and every other free field', () => {
    const parsed = parseShowUpAnalyticsEvent({
      event: 'show_up_aimed',
      room: 'my sister Priya',
      sentence: 'This made me think of you',
      happened: 'she said she would read it',
    })
    expect(parsed).toEqual({ event: 'show_up_aimed' })
  })

  it('accepts a return only to a real earlier day', () => {
    expect(parseShowUpAnalyticsEvent({ event: 'show_up_returned_to_move', returnedToDay: 3 }))
      .toEqual({ event: 'show_up_returned_to_move', returnedToDay: 3 })
    // Day 5 cannot route "back" to itself or past the loop.
    expect(parseShowUpAnalyticsEvent({ event: 'show_up_returned_to_move', returnedToDay: 5 }))
      .toEqual({ event: 'show_up_returned_to_move' })
  })

  it('rejects unknown events and non-canonical card ids', () => {
    expect(parseShowUpAnalyticsEvent({ event: 'show_up_sale_attributed' })).toBeNull()
    expect(parseShowUpAnalyticsEvent({ event: 'show_up_card_carried', cardId: 'GROW-RA-SAGE' }))
      .toEqual({ event: 'show_up_card_carried' })
  })
})

describe('Show Up Check outbound links', () => {
  it('forwards attribution and never the handoff itself', () => {
    const search = new URLSearchParams({ utm_source: 'ig', room: 'my sister', sentence: 'private' })
    for (const href of [showUpBookHref(search), showUpEarlierMoveHref(search, '/clean-up'), showUpNextDayHref(search, '/wake-up')]) {
      expect(href).toContain('utm_source=ig')
      expect(href).not.toContain('room')
      expect(href).not.toContain('sister')
      expect(href).not.toContain('private')
    }
  })
})
