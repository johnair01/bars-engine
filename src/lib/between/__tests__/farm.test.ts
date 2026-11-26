import { describe, it, expect } from 'vitest'
import { newFarm, till, plant, water, ripen, reclear, pick, settle, enter, plantByMark, markShipped, ripenByMark, TILL_COST, STARTING_MANA, type Farm } from '../farm'

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

describe('the game master\'s mark on the farm (H-till-mana, H-marks)', () => {
  const gift = { ref: 'venmo-1', barId: 'gift-1', line: 'ship a book', crop: { family: 'joy', form: 'own' }, now: 'n', today: day(0) }
  it('plants on the first bare slot without spending the player\'s mana, and records the gift mark', () => {
    const r = plantByMark(newFarm(), gift)
    expect(r.why).toBeUndefined()
    expect(r.farm.mana).toBe(STARTING_MANA)
    expect(r.slot).toBe(0)
    expect(r.farm.slots['0'].plant!.marks).toEqual([{ kind: 'gift', ref: 'venmo-1', on: day(0) }])
    expect(r.farm.slots['0'].plant!.crop).toEqual({ family: 'joy', form: 'own' })
  })
  it('skips slots the player already tilled', () => {
    const f = ok(till(newFarm(), 0, 'n'))
    expect(plantByMark(f, gift).slot).toBe(1)
  })
  it('the same ref twice plants once', () => {
    const a = plantByMark(newFarm(), gift)
    const b = plantByMark(a.farm, { ...gift, barId: 'gift-2' })
    expect(b.ok).toBe(true)
    expect(Object.keys(b.farm.slots)).toHaveLength(1)
  })
  it('the shipped mark lands on the same crop once', () => {
    const a = plantByMark(newFarm(), gift)
    const s = markShipped(a.farm, { barId: 'gift-1', ref: 'ship-1', today: day(3) })
    expect(s.farm.slots['0'].plant!.marks!.map(m => m.kind)).toEqual(['gift', 'shipped'])
    expect(markShipped(s.farm, { barId: 'gift-1', ref: 'ship-1', today: day(4) }).farm.slots['0'].plant!.marks).toHaveLength(2)
    expect(markShipped(a.farm, { barId: 'nope', ref: 'ship-2', today: day(3) }).ok).toBe(false)
  })
  it('refuses a mark with no reference, no line or a full field', () => {
    expect(plantByMark(newFarm(), { ...gift, ref: '' }).ok).toBe(false)
    expect(plantByMark(newFarm(), { ...gift, line: ' ' }).ok).toBe(false)
  })
  it('his mark ripens the crop at once, without a line from the player, and lands once (H-ripen-by-mark)', () => {
    const a = plantByMark(newFarm(), gift)
    const r = ripenByMark(a.farm, { barId: 'gift-1', ref: 'ripe-1', today: day(1) })
    const p = r.farm.slots['0'].plant!
    expect(r.ok).toBe(true)
    expect(p.ripe).toBe(true)
    expect(p.notes).toEqual([{ on: day(1), line: 'Marked by the game master' }])
    expect(p.marks!.map(m => m.kind)).toEqual(['gift', 'ripe'])
    expect(ripenByMark(r.farm, { barId: 'gift-1', ref: 'ripe-1', today: day(2) }).farm).toEqual(r.farm)
    expect(ripenByMark(a.farm, { barId: 'nope', ref: 'ripe-2', today: day(1) }).ok).toBe(false)
    expect(ripenByMark(a.farm, { barId: 'gift-1', ref: '', today: day(1) }).ok).toBe(false)
  })
  it('clears weeds when it ripens a crop the weeds had covered', () => {
    const a = plantByMark(newFarm(), gift)
    const weeded = settle(a.farm, day(5))
    expect(weeded.slots['0'].state).toBe('weeded')
    expect(ripenByMark(weeded, { barId: 'gift-1', ref: 'ripe-1', today: day(5) }).farm.slots['0'].state).toBe('planted')
  })
  it('a picked crop keeps its family, form and marks, and still takes the shipped mark (H-harvest-crop)', () => {
    const a = plantByMark(newFarm(), gift)
    const r = ripenByMark(a.farm, { barId: 'gift-1', ref: 'ripe-1', today: day(1) })
    const h = pick(r.farm, 0, day(2))
    expect(h.harvest!.crop).toEqual({ family: 'joy', form: 'own' })
    expect(h.harvest!.marks!.map(m => m.kind)).toEqual(['gift', 'ripe'])
    const s = markShipped(h.farm, { barId: 'gift-1', ref: 'ship-1', today: day(3) })
    expect(s.ok).toBe(true)
    expect(s.farm.harvests[0].marks!.map(m => m.kind)).toEqual(['gift', 'ripe', 'shipped'])
    expect(markShipped(s.farm, { barId: 'gift-1', ref: 'ship-1', today: day(4) }).farm.harvests[0].marks).toHaveLength(3)
  })
  it('a plain pick has no crop or marks to carry', () => {
    const h = pick(ok(ripen(planted(), 5, 'sent it', day(1))), 5, day(1))
    expect(h.harvest!.crop).toBeUndefined()
    expect(h.harvest!.marks).toBeUndefined()
  })
})
