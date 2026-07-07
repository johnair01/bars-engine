import { describe, it, expect } from 'vitest'

import { allMoveCards, drawMoveCard, composerCardFromMoveCard } from '../index'

describe('Allyship-Deck draw (G13)', () => {
  it('assembles the full 120-card move deck', () => {
    const cards = allMoveCards()
    expect(cards.length).toBe(120)
    expect(cards.every((c) => c.kind === 'move')).toBe(true)
  })

  it('draws deterministically with a seeded rng and can exclude a redraw', () => {
    const first = drawMoveCard(() => 0)
    expect(first).toBe(allMoveCards()[0])
    const redraw = drawMoveCard(() => 0, first.id)
    expect(redraw.id).not.toBe(first.id)
  })

  it('the drawn card fixes submove + stance question + domain', () => {
    const card = allMoveCards().find((c) => c.id === 'CLEAN-SO-CHALLENGER')!
    const cc = composerCardFromMoveCard(card)
    expect(cc.submove).toBe('clean_up')
    expect(cc.stanceQuestion).toBe(card.primaryQuestion)
    expect(cc.domainLabel).toBe('Skillful Organizing')
    expect(cc.cardId).toBe('CLEAN-SO-CHALLENGER')
  })
})
