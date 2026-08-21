import { describe, expect, it } from 'vitest'
import {
  GROW_UP_BELIEFS,
  GROW_UP_BOUNDARIES,
  GROW_UP_CARD_IDS,
  GROW_UP_CARD_PROMPTS,
  GROW_UP_PRACTICES,
  GROW_UP_REPS,
  GROW_UP_SCOPES,
  composeGrowUpReminder,
  growUpEvidence,
  growUpRepsFor,
} from '../check-content'
import { parseGrowUpAnalyticsEvent } from '../events'
import { growUpBookHref, growUpDayOneHref, growUpNextDayHref } from '../outbound'

describe('Grow Up Check content', () => {
  it('draws from the six Grow Up × Raise Awareness cards, one per Game Master', () => {
    expect(GROW_UP_PRACTICES).toHaveLength(6)
    expect(GROW_UP_PRACTICES.map((card) => card.id).sort()).toEqual([
      'GROW-RA-ARCHITECT', 'GROW-RA-CHALLENGER', 'GROW-RA-DIPLOMAT',
      'GROW-RA-REGENT', 'GROW-RA-SAGE', 'GROW-RA-SHAMAN',
    ])
    for (const id of GROW_UP_CARD_IDS) expect(GROW_UP_CARD_PROMPTS[id]).toBeTruthy()
  })

  it('offers three equal starting hands, one of which is not knowing', () => {
    // Review failure risk 1: "people already trust your taste" reads as flattery to
    // one reader and as an accusation of insignificance to another.
    expect(GROW_UP_SCOPES.map((scope) => scope.key)).toEqual(['one_person', 'small_room', 'not_sure'])
    expect(GROW_UP_SCOPES[2].body).toMatch(/real answer/i)
    for (const scope of GROW_UP_SCOPES) expect(scope.body).not.toMatch(/fail|should|excuse/i)
  })

  it('keeps a boundary that names fuel, so a clean “not today” stays available', () => {
    // Review failure risk 2: Grow Up collapses into emotional courage unless the
    // practice names capability, support and boundary together.
    expect(GROW_UP_BOUNDARIES).toContain('I don’t have the fuel today')
    expect(GROW_UP_BOUNDARIES).toContain('I’m doing it to be seen')
  })

  it('pairs every reservation with the capacity on the other side of it', () => {
    expect(GROW_UP_BELIEFS).toHaveLength(6)
    for (const belief of GROW_UP_BELIEFS) {
      expect(belief.capacity).toBeTruthy()
      expect(belief.voice).toMatch(/[“"]/)
    }
  })

  it('suggests reps from the carried card without ever hiding the rest', () => {
    const { suggested, rest } = growUpRepsFor('challenger')
    expect(suggested.length).toBeGreaterThan(0)
    expect(suggested.length + rest.length).toBe(GROW_UP_REPS.length)
    // A card interrupts a habitual answer; it does not narrow the menu to one.
    const none = growUpRepsFor(null)
    expect(none.suggested).toHaveLength(0)
    expect(none.rest).toHaveLength(GROW_UP_REPS.length)
  })

  it('reports only what the reader actually did', () => {
    expect(growUpEvidence({ scope: null, handoffs: 0, namedBelief: false, carried: false, hasRep: false, hasBoundary: false, container: false }))
      .toEqual(['showed up to Day 4'])
    // "Not sure yet" is honest, and is not reported as having named a hand.
    expect(growUpEvidence({ scope: 'not_sure', handoffs: 0, namedBelief: false, carried: false, hasRep: false, hasBoundary: false, container: false }))
      .toEqual(['showed up to Day 4'])
    expect(growUpEvidence({ scope: 'one_person', handoffs: 2, namedBelief: true, carried: true, hasRep: true, hasBoundary: true, container: true }))
      .toEqual(['showed up to Day 4', 'named the hand I have', 'named the handoffs', 'named the line in the way', 'carried a Grow Up card', 'chose one rep', 'set a boundary', 'gave it a place to land'])
  })
})

describe('Grow Up Check reminder composer', () => {
  it('builds from canonical strings only', () => {
    const text = composeGrowUpReminder({
      repKey: 'avoided', where: 'in person', when: 'this week',
      boundary: 'I notice I’m pushing', origin: 'https://masteringallyship.com',
    })
    expect(text).toContain('saying the sentence I’ve been avoiding')
    expect(text).toContain('in person')
    expect(text).toContain('https://masteringallyship.com/grow-up')
  })

  it('degrades to a sentence when nothing was chosen', () => {
    const text = composeGrowUpReminder({ repKey: null, where: null, when: null, boundary: null, origin: 'https://x.test' })
    expect(text).toBe('Day 4 rep — I will practise the capacity I chose. · https://x.test/grow-up')
  })
})

describe('Grow Up Check analytics boundary', () => {
  it('records the starting-hand scope, because routing back to Day 1 is a funnel fact', () => {
    expect(parseGrowUpAnalyticsEvent({ event: 'grow_up_returned_to_day_one', scope: 'not_sure' }))
      .toEqual({ event: 'grow_up_returned_to_day_one', scope: 'not_sure' })
  })

  it('never records which reservation or boundary a reader picked', () => {
    // Deliberate: the belief a reader recognises in themselves and where they said
    // they would have to stop are the most revealing things on the page.
    const parsed = parseGrowUpAnalyticsEvent({
      event: 'grow_up_belief_named',
      beliefKey: 'insig',
      repKey: 'avoided',
      boundary: 'I don’t have the fuel today',
      extra: 'my sister has been asking about this',
    })
    expect(parsed).toEqual({ event: 'grow_up_belief_named' })
  })

  it('rejects unknown events and non-canonical card ids', () => {
    expect(parseGrowUpAnalyticsEvent({ event: 'grow_up_names_entered' })).toBeNull()
    expect(parseGrowUpAnalyticsEvent({ event: 'grow_up_card_carried', cardId: 'SHOW-RA-SAGE' }))
      .toEqual({ event: 'grow_up_card_carried' })
  })
})

describe('Grow Up Check outbound links', () => {
  it('forwards attribution and never a private answer', () => {
    const search = new URLSearchParams({ utm_source: 'ig', belief: 'insig', extra: 'private' })
    for (const href of [growUpBookHref(search), growUpDayOneHref(search, '/wake-up'), growUpNextDayHref(search, '/show-up')]) {
      expect(href).toContain('utm_source=ig')
      expect(href).not.toContain('belief')
      expect(href).not.toContain('private')
    }
  })
})
