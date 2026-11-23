import { describe, expect, it } from 'vitest'
// The Infinite Arcade hall's engine (council spec .specify/specs/infinite-arcade-hall/, FR-012, task T004).
import {
  answer, canDrop, drop, glimpse, keep, letGo, melted, newVisit, returnFrom, save, sit, ticketAt, weight,
} from '../../../../public/between/arcade/hall.js'
import { CABINETS, TYPES, todaysCabinet } from '../../../../public/between/arcade/cabinets.js'

describe('the arcade hall (arcade/hall.js)', () => {
  it('opens a visit with three coins and every cabinet unknown', () => {
    const h = newVisit()
    expect(h.coins).toBe(3)
    expect(weight(h)).toBe(1)
    for (const c of CABINETS) expect(h.known[c.id]).toBe('unknown')
    expect(glimpse(h, 'ask').known.ask).toBe('glimpsed')
  })

  it('takes a coin only with the pass, a coin and a route (an unbuilt game takes none)', () => {
    const h = newVisit()
    expect(canDrop(h, 'between', true)).toBe(true)
    expect(canDrop(h, 'between', false)).toBe(false)
    expect(canDrop(h, 'lantern', true)).toBe(false)
    expect(canDrop(h, 'chapter-1', true)).toBe(false)
    expect(drop(h, 'lantern')).toBe(h)
    expect(canDrop({ ...h, coins: 0 }, 'between')).toBe(false)
  })

  it('a round spends a coin and always pays a ticket, a round left early too', () => {
    let h = drop(newVisit(), 'between')
    expect(h.coins).toBe(2)
    expect(h.inside).toBe('between')
    expect(h.known.between).toBe('known')
    expect(canDrop(h, 'ask')).toBe(false) // inside a game already
    h = returnFrom(h, 'between', { early: true })
    expect(h.inside).toBe(null)
    expect(ticketAt(h, 'between')).toEqual({ cabinet: 'between' })
    // walking on is free: coming back from a cabinet you were not inside pays nothing
    expect(returnFrom(h, 'ask')).toBe(h)
  })

  it('keeps a ticket on the line with one optional word, or lets it go leaving only a count', () => {
    let h = returnFrom(drop(newVisit(), 'between'), 'between')
    h = keep(h, 'between', '  tender and slow ')
    expect(h.line).toEqual([{ cabinet: 'between', colour: '#3fd6c4', word: 'tender' }])
    expect(h.tray.between).toBeUndefined()
    h = returnFrom(drop(h, 'between'), 'between')
    h = letGo(h, 'between')
    expect(h.letGo).toBe(1)
    expect(h.line).toHaveLength(1)
  })

  it('holds the ask ticket until the player says what came back, and every answer pays the same', () => {
    for (const a of ['yes', 'no', 'silence']) {
      let h = returnFrom(drop(newVisit(), 'ask'), 'ask', { ask: { to: 'Sam', what: 'Will you read my draft?' } })
      expect(h.tray.ask.waiting).toBe(true)
      expect(ticketAt(h, 'ask')).toBe(null)
      expect(keep(h, 'ask')).toBe(h)
      expect(canDrop(h, 'ask')).toBe(false) // the waiting ticket holds the cabinet
      h = answer(h, a as 'yes' | 'no' | 'silence')
      expect(ticketAt(h, 'ask')).toEqual({ cabinet: 'ask', answer: a })
      h = keep(h, 'ask')
      expect(h.line[0].colour).toBe('#e0569a')
    }
  })

  it('refills an empty purse by sitting (a coin each 20 s) or melting a block, the same three either way', () => {
    let h = { ...newVisit(), coins: 0 }
    expect(weight(h)).toBe(0)
    h = sit(h, 19)
    expect(h.coins).toBe(0)
    h = sit(h, 1)
    expect(h.coins).toBe(1)
    h = sit(h, 100)
    expect(h.coins).toBe(3)
    expect(melted({ ...newVisit(), coins: 0 }).coins).toBe(3)
  })

  it('saves a record with no running time in it, and reads it back', () => {
    let h = keep(returnFrom(drop(newVisit(), 'between'), 'between'), 'between', 'warm')
    h = sit({ ...h, coins: 1 }, 5)
    const s = save(h)
    expect(s).not.toMatch(/seated/)
    const back = newVisit(s)
    expect(back.coins).toBe(1)
    expect(back.line).toEqual(h.line)
    expect(back.known.between).toBe('known')
    expect(newVisit('not json').coins).toBe(3)
  })

  it("ports arrival.py's six heights and points today's lamp only at a cabinet that takes a coin", () => {
    expect(Object.keys(TYPES).sort()).toEqual(['cabaret', 'candy', 'cocktail', 'deluxe', 'upright', 'vertical'])
    for (let d = 0; d < 7; d++) expect(todaysCabinet(new Date(Date.UTC(2026, 10, 3 + d))).route).toBeTruthy()
  })
})
