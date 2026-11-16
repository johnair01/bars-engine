import { beforeEach, describe, expect, it, vi } from 'vitest'

const held = new Map<string, unknown>()
const pushed: unknown[] = []

vi.mock('@/lib/board/store', () => ({
  latestDoc: async (_b: string, _c: string, id: string) => (held.has(id) ? { kind: 'ledger', body: JSON.stringify(held.get(id)) } : null),
}))
vi.mock('@/lib/board/session-write', () => ({
  sessionWrite: async (_db: unknown, docs: { docId: string; data: { body: string } }[]) => {
    for (const d of docs) held.set(d.docId, JSON.parse(d.data.body))
    return { written: docs.map(d => d.docId), same: 0, refused: [] }
  },
}))
vi.mock('@/lib/work/queue', () => ({ pushTicket: async (_db: unknown, t: unknown) => { pushed.push(t) } }))

import { closeRead, closeSay } from '../chat'
import { loadClose, saveClose, openClose, collectDay } from '../store'
import { morningSeed } from '../seed'
import { newClose, type CloseRecord } from '../types'
import { skippedLine } from '../render'

const ok = { reversible: true, oneLane: true, endsInPrOrRow: true, merges: false, spend: false, outreach: false, touchesFaces: false, nextOwner: true }
const fakeDb = (rows: unknown[] = []) => ({ workTicket: { findMany: async () => rows }, boardSave: {} }) as never

function withTicket(safety: typeof ok | undefined): CloseRecord {
  const r = newClose('2026-11-14', [], '2026-11-14T02:00:00Z')
  r.move = 'lever'
  r.plan.tickets = [{ id: '1', title: 'Draw the harbour', hull: 'zo', source: 'unpacking 1', minutes: 30, lane: 'zo', released: false, safety }]
  return r
}

beforeEach(() => { held.clear(); pushed.length = 0 })

describe('close store', () => {
  it('round-trips a record and opens one from the day tickets', async () => {
    const rows = [{ id: 'w1', title: 'Ship it', state: 'done', result: 'https://github.com/x/y/pull/9', brief: 'Next owner + wake: Wendell' }]
    expect(await collectDay(fakeDb(rows), '2026-11-14')).toMatchObject([{ id: 'w1', stage: 'done', nextOwner: true }])
    const r = await openClose(fakeDb(rows), '2026-11-14')
    expect(r.items).toHaveLength(1)
    expect(await loadClose('2026-11-14')).toMatchObject({ date: '2026-11-14' })
    expect(await loadClose('2026-11-13')).toBeNull()
    expect(await saveClose(fakeDb(), r)).toBeNull()
  })
})

describe('close chat', () => {
  it('reads without sending anything', async () => {
    const out = await closeRead(fakeDb(), '2026-11-14')
    expect(out.status).toBe('open')
    expect(pushed).toHaveLength(0)
  })
  it('a send without a pull of the lever never makes a ticket (keep, lantern, next)', async () => {
    await saveClose(fakeDb(), withTicket(ok))
    await closeSay(fakeDb(), 'keep 1', '2026-11-14')
    await closeSay(fakeDb(), 'lantern 1', '2026-11-14')
    expect(pushed).toHaveLength(0)
  })
  it('send makes exactly one ticket, and a second send is refused', async () => {
    await saveClose(fakeDb(), withTicket(ok))
    const first = await closeSay(fakeDb(), 'send 1', '2026-11-14')
    expect(first.error).toBeUndefined()
    expect(pushed).toHaveLength(1)
    const again = await closeSay(fakeDb(), 'send 1', '2026-11-14')
    expect(again.error).toBeTruthy()
    expect(pushed).toHaveLength(1)
  })
  it('send refuses a ticket with no safety facts', async () => {
    await saveClose(fakeDb(), withTicket(undefined))
    const out = await closeSay(fakeDb(), 'send 1', '2026-11-14')
    expect(out.error).toMatch(/safety|safe/)
    expect(pushed).toHaveLength(0)
  })
})

describe('morning seed', () => {
  const closed = (): CloseRecord => {
    const r = newClose('2026-11-13', [{ ...ok, id: 'a', title: 'Spec shipped', stage: 'done', proof: 'x' }], 'z')
    r.status = 'closed'; r.wins = { a: 4 }; r.plan.lantern = { title: 'Draw the harbour', source: 'unpacking 1' }
    return r
  }
  it('shows lit wins and the lantern after a closed night', () => {
    expect(morningSeed(closed())).toEqual({ kind: 'lanterns', wins: ['Spec shipped'], lantern: { title: 'Draw the harbour', source: 'unpacking 1' } })
  })
  it('a skipped night shows only the skipped line source, never a count', () => {
    const r = closed(); r.status = 'skipped'
    expect(morningSeed(r)).toEqual({ kind: 'skipped', wins: [] })
    expect(skippedLine()).not.toMatch(/\d|streak/i)
  })
  it('shows nothing with no record or an open one', () => {
    expect(morningSeed(null)).toBeNull()
    const r = closed(); r.status = 'open'
    expect(morningSeed(r)).toBeNull()
  })
})
