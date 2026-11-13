import { describe, expect, it } from 'vitest'
// public/between/growth.js, the two names slice 2 builds (Six-faces-council spec friendcraft-deck-2 FR-009).
import { bowls, isFeed } from '../../../../public/between/growth.js'

const kept = (n: number) => ({ kind: 'turn', by: 'a', owner: 'b', status: 'kept', keptAt: n })
const cast = (n: number) => ({ kind: 'cast', by: 'a', answer: { b: { card: 'x', depth: 'easy', at: n } } })

describe('growth.js isFeed', () => {
  it('feeds on a cast the other friend answered and on a kept turn', () => {
    expect(isFeed(cast(5))).toEqual({ kind: 'answer', by: ['a', 'b'], at: 5 })
    expect(isFeed(kept(9))).toEqual({ kind: 'turn', by: ['a', 'b'], at: 9 })
  })
  it('does not feed on a cast unanswered, its own tosser\'s answer, an unkept turn or a cup', () => {
    expect(isFeed({ kind: 'cast', by: 'a' })).toBeNull()
    expect(isFeed({ kind: 'cast', by: 'a', answer: { a: { at: 1 } } })).toBeNull()
    expect(isFeed({ kind: 'turn', status: 'open' })).toBeNull()
    expect(isFeed({ kind: 'cup' })).toBeNull()
    expect(isFeed(null)).toBeNull()
  })
})

describe('growth.js bowls', () => {
  it('reads tea from the items alone, up to three', () => {
    expect(bowls({})).toBe(0)
    expect(bowls({ a: cast(1), b: kept(2) })).toBe(2)
    expect(bowls({ a: cast(1), b: kept(2), c: kept(3), d: kept(4), e: kept(5) })).toBe(3)
  })
  it('takes a spend out and gives it back when the spend is gone', () => {
    const items: Record<string, any> = { a: cast(1), b: kept(2), c: kept(3), s: { kind: 'spend', by: 'a', turn: 't', bowls: 2 } }
    expect(bowls(items)).toBe(1)
    delete items.s
    expect(bowls(items)).toBe(3)
  })
  it('never goes below none and also reads a list', () => {
    expect(bowls({ s: { kind: 'spend', bowls: 2 } })).toBe(0)
    expect(bowls([{ id: 'a', data: kept(1) }])).toBe(1)
  })
})
