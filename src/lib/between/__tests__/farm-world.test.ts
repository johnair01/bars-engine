import { describe, it, expect } from 'vitest'
import { newWorld, change, forPlayer, revert, attachAfter } from '../farm-world'

const t0 = '2026-11-14T20:00:00.000Z'
const live = (o: ReturnType<typeof change>) => { if (!o.ok) throw new Error(o.why); return o }

describe('farm world: data at once, rules to Wendell', () => {
  it('applies a sign at once and shows it to the player without the lane', () => {
    const o = live(change(newWorld(), { slot: 17, kind: 'sign', text: 'The bench by the stream', captureId: 'bar-1', lane: 'claude-code', before: 'https://x.test/before.jpg' }, t0))
    const p = forPlayer(o.doc)
    expect(p.changes).toHaveLength(1)
    expect(p.changes[0]).toMatchObject({ slot: 17, kind: 'sign', text: 'The bench by the stream', before: 'https://x.test/before.jpg' })
    expect(JSON.stringify(p)).not.toContain('claude-code')
  })
  it('a second sign on a slot replaces the first', () => {
    let d = live(change(newWorld(), { slot: 3, kind: 'sign', text: 'one', captureId: 'a' }, t0)).doc
    d = live(change(d, { slot: 3, kind: 'sign', text: 'two', captureId: 'b' }, t0)).doc
    expect(forPlayer(d).changes.map(c => c.text)).toEqual(['two'])
  })
  it('places a listed object and keeps a rule request as a not-yet with its reason', () => {
    const o = live(change(newWorld(), { slot: 9, kind: 'object', object: 'lantern', captureId: 'a' }, t0))
    expect(o.change.object).toBe('lantern')
    const r = change(o.doc, { ask: 'water should cost no mana', captureId: 'b' }, t0)
    expect(r.ok).toBe(false)
    expect(r.tier).toBe('rule')
    if (r.tier === 'rule') { expect(r.why).toMatch(/cost/); expect(r.doc.notYet).toHaveLength(1); expect(r.doc.changes).toHaveLength(1) }
  })
  it('a capture becomes a barseed in the inventory: no slot, not drawn on the land', () => {
    const o = live(change(newWorld(), { kind: 'barseed', text: 'Call Dana about the van', captureId: 'bar-9', lane: 'claude-code' }, t0))
    const p = forPlayer(o.doc)
    expect(p.changes).toHaveLength(0)
    expect(p.seeds).toHaveLength(1)
    expect(p.seeds[0]).toMatchObject({ kind: 'barseed', text: 'Call Dana about the van', captureId: 'bar-9' })
    expect(JSON.stringify(p)).not.toContain('claude-code')
    expect(change(newWorld(), { kind: 'barseed', captureId: 'bar-9' }, t0).tier).toBe('invalid')
  })
  it('an unknown object is a rule request, never drawn', () => {
    const r = change(newWorld(), { slot: 1, kind: 'object', object: 'windmill', captureId: 'a' }, t0)
    expect(r.tier).toBe('rule')
  })
  it('refuses malformed data and a capture-less change', () => {
    expect(change(newWorld(), { slot: 999, kind: 'sign', text: 'x', captureId: 'a' }, t0).tier).toBe('invalid')
    expect(change(newWorld(), { slot: 1, kind: 'sign', text: 'x' }, t0).tier).toBe('invalid')
    expect(change(newWorld(), { slot: 1, kind: 'note', text: '', captureId: 'a' }, t0).tier).toBe('invalid')
  })
  it('strips markup, attaches an after picture and reverts', () => {
    const o = live(change(newWorld(), { slot: 2, kind: 'note', text: '<b>hi</b>', captureId: 'a' }, t0))
    expect(o.change.text).not.toMatch(/</)
    const a = attachAfter(o.doc, o.change.id, 'https://x.test/after.jpg', t0)
    expect(a.doc.changes[0].after).toBe('https://x.test/after.jpg')
    expect(forPlayer(revert(a.doc, o.change.id, 'x', t0).doc).changes).toHaveLength(0)
  })
})
