import { describe, it, expect } from 'vitest'
import { newWorld, change, forPlayer, revert, attachAfter, openParcel, type Seed } from '../farm-world'
import { pouchWrite } from '../rules'
import * as F from '../farm'

const t0 = '2026-11-14T20:00:00.000Z'
const live = (o: ReturnType<typeof change>) => { if (!o.ok) throw new Error(o.why); return o }
const slotted = (o: ReturnType<typeof change>) => { const r = live(o); if (!r.change) throw new Error('no change'); return { doc: r.doc, change: r.change } }

describe('farm world: data at once, rules to Wendell', () => {
  it('a seed is a sealed parcel with no slot, and the player sees it without the lane', () => {
    const o = live(change(newWorld(), { kind: 'seed', text: 'The bench by the stream', line: 'Water here', captureId: 'bar-1', lane: 'claude-code', before: 'https://x.test/before.jpg' }, t0))
    expect(o.doc.changes).toHaveLength(0)
    expect(o.doc.parcels[0]).toMatchObject({ state: 'sealed', label: 'The bench by the stream', line: 'Water here', captureId: 'bar-1' })
    expect(o.doc.parcels[0]).not.toHaveProperty('slot')
    const p = forPlayer(o.doc)
    expect(p.parcels).toHaveLength(1)
    expect(JSON.stringify(p)).not.toContain('claude-code')
  })
  it('the old kind name sign still makes a parcel', () => {
    const o = live(change(newWorld(), { kind: 'sign', text: 'water here', captureId: 'a' }, t0))
    expect(o.doc.parcels).toHaveLength(1)
  })
  it('places a listed object and keeps a rule request as a not-yet with its reason', () => {
    const o = slotted(change(newWorld(), { slot: 9, kind: 'object', object: 'lantern', captureId: 'a' }, t0))
    expect(o.change.object).toBe('lantern')
    const r = change(o.doc, { ask: 'water should cost no mana', captureId: 'b' }, t0)
    expect(r.ok).toBe(false)
    expect(r.tier).toBe('rule')
    if (r.tier === 'rule') { expect(r.why).toMatch(/cost/); expect(r.doc.notYet).toHaveLength(1); expect(r.doc.changes).toHaveLength(1) }
  })
  it('an unknown object is a rule request, never drawn', () => {
    const r = change(newWorld(), { slot: 1, kind: 'object', object: 'windmill', captureId: 'a' }, t0)
    expect(r.tier).toBe('rule')
  })
  it('refuses malformed data and a capture-less change', () => {
    expect(change(newWorld(), { slot: 999, kind: 'note', text: 'x', captureId: 'a' }, t0).tier).toBe('invalid')
    expect(change(newWorld(), { slot: 1, kind: 'seed', text: 'x' }, t0).tier).toBe('invalid')
    expect(change(newWorld(), { slot: 1, kind: 'note', text: '', captureId: 'a' }, t0).tier).toBe('invalid')
  })
  it('strips markup, attaches an after picture and reverts', () => {
    const o = slotted(change(newWorld(), { slot: 2, kind: 'note', text: '<b>hi</b>', captureId: 'a' }, t0))
    expect(o.change.text).not.toMatch(/</)
    const a = attachAfter(o.doc, o.change.id, 'https://x.test/after.jpg', t0)
    expect(a.doc.changes[0].after).toBe('https://x.test/after.jpg')
    expect(forPlayer(revert(a.doc, o.change.id, 'x', t0).doc).changes).toHaveLength(0)
  })
})

describe('farm parcels: open into the satchel, then plant', () => {
  const sealed = () => live(change(newWorld(), { kind: 'seed', text: 'A lantern wish', captureId: 'bar-9' }, t0))
  const id = (d: ReturnType<typeof newWorld>) => d.parcels[0].id
  it('take moves one seed into the satchel, and a second take adds nothing', () => {
    const d = sealed().doc
    const a = openParcel(d, [], id(d), 'take', t0)
    expect(a.seeds).toHaveLength(1)
    expect(a.seeds[0]).toMatchObject({ captureId: 'bar-9', label: 'A lantern wish' })
    const b = openParcel(a.doc, a.seeds, id(d), 'take', t0)
    expect(b.ok).toBe(true); expect(b.changed).toBe(false); expect(b.seeds).toHaveLength(1)
    expect(forPlayer(b.doc).parcels).toHaveLength(0)
  })
  it('compost adds nothing', () => {
    const d = sealed().doc
    const a = openParcel(d, [], id(d), 'compost', t0)
    expect(a.seeds).toHaveLength(0); expect(a.doc.parcels[0].state).toBe('composted')
  })
  const seed: Seed = { id: 'seed-1', parcelId: 'p', captureId: 'bar-9', label: 'A lantern wish', at: t0 }
  it('planting on untilled soil is refused, so the seed stays in the satchel', () => {
    const r = F.plant(F.newFarm(), 5, seed.captureId, seed.label, t0, '2026-11-17')
    expect(r.ok).toBe(false)
  })
  it('planting on tilled soil plants with barId = captureId', () => {
    const tilled = F.till(F.newFarm(), 5, t0).farm
    const r = F.plant(tilled, 5, seed.captureId, seed.label, t0, '2026-11-17')
    expect(r.ok).toBe(true)
    expect(r.farm.slots['5'].plant).toMatchObject({ barId: 'bar-9', line: 'A lantern wish' })
  })
  it('a page write cannot add or change seeds, and keeps the ones there', () => {
    expect(pouchWrite({ seeds: [seed] }, {}).ok).toBe(false)
    expect(pouchWrite({ seeds: [] }, { seeds: [seed] }).ok).toBe(false)
    expect(pouchWrite({ embers: {} }, { seeds: [seed] }).ok).toBe(false)
    expect(pouchWrite({ seeds: [seed] }, { seeds: [seed] }).ok).toBe(true)
    expect(pouchWrite({ embers: {} }, {}).ok).toBe(true)
  })
})
