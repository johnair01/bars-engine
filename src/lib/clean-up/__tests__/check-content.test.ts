import { describe, expect, it } from 'vitest'

import {
  CLEAN_UP_BODY_READINGS,
  CLEAN_UP_BOOK_PRACTICES,
  CLEAN_UP_CARD_IDS,
  CLEAN_UP_CHANNELS,
  CLEAN_UP_LINES,
  CLEAN_UP_BOOK_LINES,
  CLEAN_UP_PRACTICES,
  cleanUpBodyTakeaway,
  cleanUpEvidence,
  cleanUpLineTakeaway,
  cleanUpLinesFor,
  cleanUpPoolFor,
  cleanUpReceipt,
  composeCleanUpDraft,
  findCleanUpChannel,
  findCleanUpLine,
} from '../check-content'
import type { CleanUpDraftInput } from '../check-content'

const ORIGIN = 'https://masteringallyship.com'

function draftInput(overrides: Partial<CleanUpDraftInput> = {}): CleanUpDraftInput {
  return {
    route: 'own_charge',
    bodyReading: null,
    channel: null,
    line: null,
    cardQuestion: null,
    facedIt: false,
    namedIt: false,
    threadTurns: 0,
    spokeAsIt: false,
    noticedShift: false,
    origin: ORIGIN,
    ...overrides,
  }
}

describe('the Clean Up suit', () => {
  it('is the full 24-card suit, six of them in Raise Awareness', () => {
    expect(CLEAN_UP_PRACTICES).toHaveLength(24)
    expect(CLEAN_UP_PRACTICES.every((card) => card.move === 'clean_up')).toBe(true)
    expect(CLEAN_UP_BOOK_PRACTICES).toHaveLength(6)
    expect(CLEAN_UP_BOOK_PRACTICES.every((card) => card.domain === 'RAISE_AWARENESS')).toBe(true)
  })

  it('narrows the pool on the book route and opens it on the practice route', () => {
    expect(cleanUpPoolFor('book_promo')).toHaveLength(6)
    expect(cleanUpPoolFor('own_charge')).toHaveLength(24)
  })

  it('indexes every card id for the analytics boundary', () => {
    expect(CLEAN_UP_CARD_IDS.size).toBe(24)
    expect(CLEAN_UP_CARD_IDS.has(CLEAN_UP_PRACTICES[0].id)).toBe(true)
    expect(CLEAN_UP_CARD_IDS.has('OPEN-RA-SAGE')).toBe(false)
  })
})

describe('the lines', () => {
  it('offers six per route, each with a belief, an overcoming question and a reframe', () => {
    for (const route of ['book_promo', 'own_charge'] as const) {
      const lines = cleanUpLinesFor(route)
      expect(lines).toHaveLength(6)
      for (const line of lines) {
        expect(line.belief.length).toBeGreaterThan(0)
        expect(line.overcome.length).toBeGreaterThan(0)
        expect(line.reframe.length).toBeGreaterThan(0)
      }
    }
    expect(cleanUpLinesFor('book_promo')).toBe(CLEAN_UP_BOOK_LINES)
    expect(cleanUpLinesFor('own_charge')).toBe(CLEAN_UP_LINES)
  })

  it('resolves by key within the active route only', () => {
    expect(findCleanUpLine('own_charge', 'insignificant')?.belief).toBe('I’m insignificant')
    expect(findCleanUpLine('own_charge', 'nope')).toBeNull()
    expect(findCleanUpLine('own_charge', null)).toBeNull()
    // Same key, different voice per route.
    expect(findCleanUpLine('book_promo', 'insignificant')?.voice).not.toBe(
      findCleanUpLine('own_charge', 'insignificant')?.voice,
    )
  })

  it('resolves channels by key', () => {
    expect(findCleanUpChannel('metal')?.label).toBe('sadness')
    expect(findCleanUpChannel('plasma')).toBeNull()
    expect(CLEAN_UP_CHANNELS).toHaveLength(5)
  })
})

describe('composeCleanUpDraft', () => {
  it('reads as a paragraph when every optional step was skipped', () => {
    const draft = composeCleanUpDraft(draftInput())
    expect(draft).toBe(
      'I ran a clean-up today on something that was still live in me. ' +
        'What was stuck as story is available as energy again. ' +
        `If you want to run it yourself, it’s here: ${ORIGIN}/clean-up`,
    )
  })

  it('drops the body clause when the reading was "not sure / skip"', () => {
    const draft = composeCleanUpDraft(draftInput({ bodyReading: 'not sure / skip' }))
    expect(draft).not.toContain('in my body')
  })

  it('includes each clause when its step was taken', () => {
    const draft = composeCleanUpDraft(
      draftInput({
        bodyReading: 'foggy',
        channel: findCleanUpChannel('water'),
        line: findCleanUpLine('own_charge', 'insignificant'),
        cardQuestion: 'Which channel is live around this?',
        facedIt: true,
        namedIt: true,
        threadTurns: 4,
        spokeAsIt: true,
        noticedShift: true,
      }),
    )
    expect(draft).toContain('The charge showed up foggy in my body.')
    expect(draft).toContain('The channel running was fear.')
    expect(draft).toContain('Underneath it was a familiar line: “I’m insignificant.”')
    expect(draft).toContain('The card I drew asked me: Which channel is live around this?')
    expect(draft).toContain('I gave it a form and a name.')
    expect(draft).toContain('Then I talked with it')
    expect(draft).toContain('Last, I spoke as it')
    expect(draft).toContain('Something shifted when I held it with awareness.')
  })

  it('says "a form" without "a name" when the part was never named', () => {
    const draft = composeCleanUpDraft(draftInput({ facedIt: true, namedIt: false }))
    expect(draft).toContain('I gave it a form.')
    expect(draft).not.toContain('a form and a name')
  })

  it('needs both sides of the thread before it claims a conversation happened', () => {
    expect(composeCleanUpDraft(draftInput({ threadTurns: 1 }))).not.toContain('Then I talked with it')
    expect(composeCleanUpDraft(draftInput({ threadTurns: 2 }))).toContain('Then I talked with it')
  })

  it('closes on the book, not the check, for the book route', () => {
    const draft = composeCleanUpDraft(draftInput({ route: 'book_promo' }))
    expect(draft.startsWith('I’ve been sitting on a book recommendation')).toBe(true)
    expect(draft).toContain(`I want you to have it too. ${ORIGIN}`)
    expect(draft).not.toContain('/clean-up')
  })
})

describe('the take-it-with-you lines', () => {
  it('appear only once there is something to take', () => {
    expect(cleanUpBodyTakeaway(null, `${ORIGIN}/clean-up`)).toBe('')
    expect(cleanUpBodyTakeaway('not sure / skip', `${ORIGIN}/clean-up`)).toBe('')
    expect(cleanUpBodyTakeaway('tight', `${ORIGIN}/clean-up`)).toContain('showed up tight in my body')
    expect(cleanUpLineTakeaway(null, `${ORIGIN}/clean-up`)).toBe('')
    expect(cleanUpLineTakeaway(findCleanUpLine('own_charge', 'ready'), `${ORIGIN}/clean-up`)).toContain('I’m not ready')
  })
})

describe('the evidence strip', () => {
  const base = {
    route: 'own_charge' as const,
    bodyReading: null,
    channel: null,
    line: null,
    cardTitle: null,
    facedIt: false,
    partName: '',
    threadTurns: 0,
    spokeAsIt: false,
    move: null,
  }

  it('lists only the steps actually taken', () => {
    expect(cleanUpEvidence(base)).toEqual(['showed up to the charge'])
  })

  it('never emits a score, a percentage, or a streak', () => {
    const chips = cleanUpEvidence({
      ...base,
      route: 'book_promo',
      bodyReading: 'heavy',
      channel: findCleanUpChannel('fire'),
      line: findCleanUpLine('book_promo', 'ready'),
      cardTitle: 'The Story About the Truth',
      facedIt: true,
      partName: '  The Cynic  ',
      threadTurns: 3,
      spokeAsIt: true,
      move: 'act',
    })
    expect(chips[0]).toBe('route · promoting the book')
    expect(chips).toContain('body reading · heavy')
    expect(chips).toContain('channel · anger')
    expect(chips).toContain('named the line')
    expect(chips).toContain('carried The Story About the Truth')
    expect(chips).toContain('named it · The Cynic')
    expect(chips).toContain('talked with it · 3 turns')
    expect(chips).toContain('chose · post it')
    expect(chips.join(' ')).not.toMatch(/score|streak|%|correct/i)
  })

  it('records both exits as first-class choices', () => {
    expect(cleanUpEvidence({ ...base, move: 'later' })).toContain('chose · let it settle')
    expect(cleanUpEvidence({ ...base, move: 'not_mine' })).toContain('chose · a clean no')
  })

  it('drops a skipped body reading', () => {
    expect(cleanUpEvidence({ ...base, bodyReading: 'not sure / skip' })).toEqual(['showed up to the charge'])
  })
})

describe('receipts', () => {
  it('gives the book route its own "act" copy and shares the rest', () => {
    expect(cleanUpReceipt('book_promo', 'act').title).toBe('The recommendation is yours to make.')
    expect(cleanUpReceipt('own_charge', 'act').title).toBe('The energy is yours to spend.')
    expect(cleanUpReceipt('book_promo', 'later')).toEqual(cleanUpReceipt('own_charge', 'later'))
  })

  it('never labels a move correct', () => {
    for (const route of ['book_promo', 'own_charge'] as const) {
      for (const move of ['act', 'later', 'not_mine'] as const) {
        const { title, body } = cleanUpReceipt(route, move)
        expect(`${title} ${body}`).not.toMatch(/verdict|correct|the right one|score|result/i)
      }
    }
  })
})

describe('body readings', () => {
  it('keeps skip as a chip in the list, not a separate link', () => {
    expect(CLEAN_UP_BODY_READINGS).toContain('not sure / skip')
    expect(CLEAN_UP_BODY_READINGS).toHaveLength(7)
  })
})
