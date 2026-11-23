import { describe, expect, it } from 'vitest'
import { CALL_CAP_DOLLARS, callDoc, callId, callsOf, callWords, decideCall, spentThisMonth, type CallDoc } from '../gallery-call'
import { storesWorldOf } from '../stores'
import { validateSave } from '@/lib/board/save'

const now = new Date('2026-11-22T18:00:00Z')
const call = (id: string, state: CallDoc['state'], dollars: number, savedAt = '2026-11-10T18:00:00Z'): [string, CallDoc] =>
  [callId(id), { run: 'gallery', thing: id, kind: 'call', to: 'bell', state, price: { tokens: 0, dollars }, savedAt }]

describe('a call for more', () => {
  it('spends at once under the cap and holds at it, never dropping the call', () => {
    expect(decideCall({ tokens: 20000, dollars: 0 }, 29)).toBe('open')
    expect(decideCall({ tokens: 0, dollars: 5 }, 25)).toBe('open')
    expect(decideCall({ tokens: 0, dollars: 5.01 }, 25)).toBe('held_at_cap')
    expect(CALL_CAP_DOLLARS).toBe(30)
  })
  it("counts this Pacific month's open, claimed and returned calls, and not held ones or last month's", () => {
    const calls = callsOf(Object.fromEntries([call('a', 'open', 4), call('b', 'returned', 3), call('c', 'held_at_cap', 9),
      call('d', 'open', 8, '2026-10-30T18:00:00Z')]))
    expect(Object.keys(calls).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(spentThisMonth(calls, now)).toBe(7)
  })
  it('writes a placement the board store accepts, to the bell line', () => {
    const doc = callDoc({ id: 'h1', name: 'A sealed bundle', price: { tokens: 20000, dollars: 0 } }, 'open', now)
    const v = validateSave({ board: 'council', collection: 'stores', docId: callId('h1'), mode: 'set', data: doc })
    expect(v.ok).toBe(true)
    expect(doc).toMatchObject({ run: 'gallery', kind: 'call', to: 'bell', state: 'open' })
  })
  it('says what it spent, or that nothing was', () => {
    expect(callWords('open', { tokens: 0, dollars: 3 }, 4)).toContain('$7 of $30')
    expect(callWords('held_at_cap', { tokens: 0, dollars: 9 }, 28)).toContain('Nothing was spent')
  })
  it('lets a crate placement save (the Keep on a crate)', () => {
    const v = validateSave({ board: 'council', collection: 'stores', docId: 'gallery~crate-ab', mode: 'set',
      data: { run: 'gallery', thing: 'crate-ab', kind: 'crate', words: 'maker', to: 'shelf', savedAt: now.toISOString() } })
    expect(v.ok).toBe(true)
  })
  it('keeps a returned crate on the floor, flagged, until it is placed', () => {
    const crates = [{ id: 'crate-a', kind: 'crate' as const, words: 'm', title: 'a', pic: '/p' }, { id: 'crate-b', kind: 'crate' as const, words: 'm', title: 'b', pic: '/p', returned: true }]
    const w = storesWorldOf({ pulls: [], board: null, doneKeys: [], placed: {}, now, crates })
    expect(w.things.find(t => t.id === 'crate-b')?.returned).toBe(true)
  })
})
