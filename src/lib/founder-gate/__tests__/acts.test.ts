import { describe, expect, it } from 'vitest'
import { ACTS, CARD_COPY, OFFERING_BANDS, PAYMENT_LINKS, WORK_QUESTIONS, actLink } from '../acts'
import { LINKS, SEEDS } from '../content'

describe('gate acts copy', () => {
  it('derives the payment links from his handles', () => {
    expect(PAYMENT_LINKS.venmo).toBe('https://venmo.com/u/wendell-britt')
    expect(PAYMENT_LINKS.cashapp).toBe('https://cash.app/$WendellBritt')
  })
  it('has the labels of the settled card backs', () => {
    expect(OFFERING_BANDS.map((b) => b.label)).toEqual(['$5', '$20', '$60', 'I’ll choose there'])
    expect(CARD_COPY.offering.keys).toEqual({ venmo: 'Open Venmo', cashapp: 'Open Cash App' })
    expect([CARD_COPY.offering.seal, CARD_COPY.intro.seal, CARD_COPY.share.seal, CARD_COPY.work.seal]).toEqual(['I left it', 'I sent it', 'I handed it on', 'Booked'])
    expect(CARD_COPY.notToday).toBe('Not today')
    expect(WORK_QUESTIONS).toEqual(['What are you building toward?', 'Where does it stall?', 'What would one good hour change?'])
    expect(CARD_COPY.share.keys.buy).toBe('Buy it on Bookshop')
  })
  it('points the book at Bookshop and the work hour at the pay-what-feels-right page', () => {
    expect(actLink('share')).toBe(LINKS.bookshop)
    expect(actLink('work')).toBe(LINKS.coachingFree)
  })
  it('shows a waiting key when a link is null', () => {
    expect(CARD_COPY.waiting).toBe('Opens once Wendell adds the link')
    expect(actLink('intro', 'work', { intro: { work: null, podcast: null } })).toBeNull()
  })
  it('leaves no placeholder act label on any seed', () => {
    for (const s of SEEDS) expect(s.actLabel).not.toMatch(/placeholder/i)
    expect(ACTS).toHaveLength(4)
  })
})
