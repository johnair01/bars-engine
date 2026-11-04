import { describe, expect, it } from 'vitest'
import { answersFrom, type SavedDoc } from '../saves'
import { unworkedFrom } from '../unworked'
import { plainYes, ringsFrom, REOPEN_MS, type RingTicket } from '../rings'
import { ticketFromAnswer } from '../ticket'

const now = new Date('2026-11-05T12:00:00Z')
const save = (docId: string, data: Record<string, unknown>, at = '2026-11-04T10:00:00Z', collection = 'questions'): SavedDoc =>
  ({ collection, docId, data, receivedAt: new Date(at) })

describe('answersFrom', () => {
  it('drafts the very key a live save would have made, and skips saves that hold no answer', () => {
    const doc = { choice: 'A', steer: 'go' }
    const [a] = answersFrom([save('x-look-1', doc)], new Map())
    expect(a.draft.sourceKey).toBe(ticketFromAnswer('council', 'questions', 'x-look-1', doc, null)!.sourceKey)
    expect(answersFrom([save('empty', {})], new Map())).toEqual([])
  })
  it('reads the save time from the doc when it is a date, else the store', () => {
    const [a, b] = answersFrom([save('a', { choice: 'A', savedAt: '2026-11-03T01:00:00Z' }), save('b', { choice: 'B', savedAt: 'soon' })], new Map())
    expect([a, b].find(x => x.docId === 'a')!.savedAt.toISOString()).toBe('2026-11-03T01:00:00.000Z')
    expect([a, b].find(x => x.docId === 'b')!.savedAt.toISOString()).toBe('2026-11-04T10:00:00.000Z')
  })
  it('makes a ticket for a card sent to a face', () => {
    const [a] = answersFrom([save('s1', { do: 'Call Madi', grow: { kind: 'council', at: '2026-11-04T09:00:00Z' } }, undefined, 'steps')], new Map())
    expect(a.collection).toBe('steps')
    expect(a.draft.lanes).toEqual(['claude'])
  })
})

describe('unworkedFrom', () => {
  const answers = answersFrom([
    save('none', { choice: 'A' }), save('ready', { choice: 'A' }), save('dry', { choice: 'A' }), save('gaveup', { choice: 'A' }),
    save('claimed', { choice: 'A' }), save('done', { choice: 'A' }), save('fresh', { choice: 'A' }, '2026-11-05T11:50:00Z'),
  ], new Map())
  const keyOf = (id: string) => answers.find(a => a.docId === id)!.draft.sourceKey
  const tk = (id: string, state: string, lane = 'claude') => ({ sourceKey: keyOf(id), state, lane, lanes: ['claude', 'freebuff'] })
  const tickets = [tk('ready', 'ready'), tk('dry', 'ready'), tk('gaveup', 'failed'), tk('claimed', 'claimed'), tk('done', 'done'), tk('fresh', 'ready')]

  it('names every answer with no crew, and why', () => {
    const r = unworkedFrom(answers, tickets, new Set(['claude', 'freebuff']), now, 20)
    const by = Object.fromEntries(r.map(x => [x.row, x.why]))
    expect(by).toEqual({ none: 'no ticket', ready: 'lane dry', dry: 'lane dry', gaveup: 'worker gave up' })
  })
  it('says not picked while a lane is lit, counts claimed and done as a crew, and honours the age', () => {
    const r = unworkedFrom(answers, tickets, new Set(), now, 20)
    expect(Object.fromEntries(r.map(x => [x.row, x.why]))).toEqual({ none: 'no ticket', ready: 'not picked', dry: 'not picked', gaveup: 'worker gave up' })
    // fresh was saved ten minutes ago, so it is not yet 20 minutes old; at 5 minutes it counts
    expect(unworkedFrom(answers, tickets, new Set(), now, 5).map(x => x.row)).toContain('fresh')
  })
  it('reads the answer in his words, oldest first', () => {
    const r = unworkedFrom(answers, [], new Set(), now, 20)
    expect(r[0].answer).toBe('A')
    expect([...r].sort((a, b) => a.savedAt.localeCompare(b.savedAt))).toEqual(r)
  })
})

describe('plainYes', () => {
  const row = { options: [{ v: 'A', label: 'A. Yes, use this' }, { v: 'B', label: 'B. Redo it' }] }
  it('is his first option with no note and nothing negative', () => {
    expect(plainYes({ choice: 'A' }, row)).toBe(true)
    expect(plainYes({ choice: 'B' }, row)).toBe(false)
    expect(plainYes({ choice: 'A', steer: 'but warmer' }, row)).toBe(false)
    expect(plainYes({ choice: 'A' }, { options: [{ v: 'A', label: 'A. Not yet' }] })).toBe(false)
    expect(plainYes(null, row)).toBe(false)
  })
})

describe('ringsFrom', () => {
  const t = (row: string, over: Partial<RingTicket> = {}): RingTicket => ({
    sourceKey: `council/questions/${row}@A`, basis: { rows: [row] }, state: 'done',
    createdAt: new Date('2026-10-20T10:00:00Z'), doneAt: new Date('2026-10-21T10:00:00Z'), ...over,
  })
  it('gives a ring for a voyage whose look got a plain yes, and none when it did not', () => {
    const tickets = [t('a', { basis: { rows: ['a'], look: 'a-look-1' } }), t('b', { basis: { rows: ['b'], look: 'b-look-1' } })]
    const r = ringsFrom(tickets, new Map([['a-look-1', true], ['b-look-1', false]]), now)
    expect(r).toEqual([{ row: 'a', doneAt: '2026-10-21T10:00:00.000Z', look: 'a-look-1' }])
  })
  it('gives a lookless voyage its ring after 7 quiet days, never before, never when reopened', () => {
    const done = t('c')
    expect(ringsFrom([done], new Map(), new Date(done.doneAt!.getTime() + REOPEN_MS - 1))).toEqual([])
    expect(ringsFrom([done], new Map(), now)).toHaveLength(1)
    const reopened = t('c', { sourceKey: 'council/questions/c@B', state: 'ready', doneAt: null, createdAt: new Date('2026-10-23T10:00:00Z') })
    expect(ringsFrom([done, reopened], new Map(), now)).toEqual([])
    // a later save after the week does not take the ring away
    const late = t('c', { sourceKey: 'council/questions/c@B', state: 'ready', doneAt: null, createdAt: new Date('2026-11-04T10:00:00Z') })
    expect(ringsFrom([done, late], new Map(), now)).toHaveLength(1)
  })
  it('skips tickets that are not done and carries no count', () => {
    expect(ringsFrom([t('d', { state: 'claimed', doneAt: null })], new Map(), now)).toEqual([])
    expect(Object.keys(ringsFrom([t('c')], new Map(), now)[0]).sort()).toEqual(['doneAt', 'look', 'row'])
  })
})
