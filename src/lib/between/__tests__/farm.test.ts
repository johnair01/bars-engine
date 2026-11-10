import { describe, it, expect } from 'vitest'
import { newFarm, till, plant, water, ripen, reclear, pick, settle, enter, TILL_COST, STARTING_MANA, type Farm } from '../farm'

const day = (n: number) => new Date(Date.UTC(2026, 10, 1 + n)).toISOString().slice(0, 10)
const ok = (r: { ok: boolean; why?: string; farm: Farm }) => { expect(r.why).toBeUndefined(); return r.farm }
const planted = () => {
  let f = ok(till(newFarm(), 5, 'n'))
  return ok(plant(f, 5, 'bar1', 'steady', 'n', day(0)))
}

describe('farm rules on a test clock', () => {
  it('first entry stamps once', () => {
    const f = enter(newFarm(), 'a')
    expect(f.firstEntryAt).toBe('a')
    expect(enter(f, 'b').firstEntryAt).toBe('a')
  })
  it('hoe tills any slot once for 5 mana and refuses off-grid', () => {
    const r = till(newFarm(), 0, 'n')
    expect(r.farm.mana).toBe(STARTING_MANA - TILL_COST)
    expect(till(r.farm, 0, 'n').ok).toBe(false)
    expect(till(newFarm(), 154, 'n').ok).toBe(false)
  })
  it('refuses to plant before tilling', () => expect(plant(newFarm(), 3, 'b', 'x', 'n', day(0)).ok).toBe(false))
  it('grows one stage a tended day, once a day, and is full on day seven', () => {
    let f = planted()
    for (let d = 0; d < 7; d++) {
      f = ok(water(f, 5, 'mana', day(d)))
      expect(water(f, 5, 'mana', day(d)).ok).toBe(false)
    }
    expect(f.slots['5'].plant!.tendedDays).toBe(7)
    expect(f.slots['5'].plant!.ripe).toBe(true)
  })
  it('a missed day adds no growth and takes none away; aligned action mints', () => {
    let f = planted()
    f = ok(water(f, 5, 'mana', day(0)))
    const r = water(f, 5, { aligned: 'act1' }, day(2))
    expect(r.mint).toBe(1)
    expect(r.farm.slots['5'].plant!.tendedDays).toBe(2)
  })
  it('weeds from the third untended day, seed waits, reclear notes, waters and mints', () => {
    let f = ok(water(planted(), 5, 'mana', day(0)))
    expect(settle(f, day(2)).slots['5'].state).toBe('planted')
    f = settle(f, day(3))
    expect(f.slots['5'].state).toBe('weeded')
    expect(f.slots['5'].plant!.tendedDays).toBe(1)
    expect(water(f, 5, 'mana', day(3)).ok).toBe(false)
    const r = reclear(f, 5, 'my mother was ill', day(3))
    expect(r.mint).toBe(1)
    expect(r.farm.slots['5'].state).toBe('planted')
    expect(r.farm.slots['5'].plant!.tendedDays).toBe(2)
    expect(r.farm.slots['5'].plant!.notes[0].line).toBe('my mother was ill')
    expect(reclear(f, 5, '', day(3)).ok).toBe(false)
  })
  it('ripens early with a line and picks a harvest with provenance', () => {
    let f = planted()
    expect(ripen(f, 5, '', day(1)).ok).toBe(false)
    f = ok(ripen(f, 5, 'sent it', day(1)))
    const r = pick(f, 5, day(1))
    expect(r.mint).toBe(1)
    expect(r.harvest).toMatchObject({ fromBarId: 'bar1', line: 'steady', notes: [{ on: day(1), line: 'sent it' }] })
    expect(r.farm.slots['5'].state).toBe('tilled')
    expect(pick(planted(), 5, day(1)).ok).toBe(false)
  })
})
