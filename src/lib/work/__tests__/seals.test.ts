import { describe, expect, it } from 'vitest'
import { nextPickup, rowOf, sealsFrom, type SealTicket } from '../seals'

const now = new Date('2026-11-02T10:20:00Z')
const t = (over: Partial<SealTicket>): SealTicket => ({
  sourceKey: 'council/questions/rs1-look-1@B', basis: { rows: ['rs1-look-1'] }, lane: 'claude', lanes: ['claude', 'freebuff'],
  state: 'ready', result: null, createdAt: new Date('2026-11-02T10:00:00Z'), updatedAt: new Date('2026-11-02T10:00:00Z'),
  doneAt: null, ...over,
})

describe('rowOf', () => {
  it('reads the row from the basis, else from the source key', () => {
    expect(rowOf(t({}))).toBe('rs1-look-1')
    expect(rowOf(t({ basis: {}, sourceKey: 'council/questions/wq-look-3@A+abcd1234' }))).toBe('wq-look-3')
    expect(rowOf(t({ basis: null, sourceKey: 'council/gates/x@A' }))).toBeNull()
  })
})

describe('nextPickup', () => {
  it('is the coming :12 of the hour', () => {
    expect(nextPickup(new Date('2026-11-02T10:05:00Z')).toISOString()).toBe('2026-11-02T10:12:00.000Z')
    expect(nextPickup(new Date('2026-11-02T10:12:00Z')).toISOString()).toBe('2026-11-02T11:12:00.000Z')
    expect(nextPickup(new Date('2026-11-02T23:40:00Z')).toISOString()).toBe('2026-11-03T00:12:00.000Z')
  })
})

describe('sealsFrom', () => {
  it('maps the four states', () => {
    const s = sealsFrom([
      t({ basis: { rows: ['a'] } }),
      t({ basis: { rows: ['b'] }, state: 'claimed', updatedAt: new Date('2026-11-02T10:12:30Z') }),
      t({ basis: { rows: ['c'] }, state: 'done', result: 'Drafted the note to Vince.', doneAt: new Date('2026-11-02T10:18:00Z') }),
      t({ basis: { rows: ['d'] }, state: 'failed', result: 'The Zoom link is not in the transcript.' }),
    ], [], now)
    const by = Object.fromEntries(s.map(x => [x.row, x]))
    expect(by.a).toMatchObject({ state: 'sent', lane: 'Claude', pickedAt: null, result: null })
    expect(by.b).toMatchObject({ state: 'picked', pickedAt: '2026-11-02T10:12:30.000Z' })
    expect(by.c).toMatchObject({ state: 'done', result: 'Drafted the note to Vince.', doneAt: '2026-11-02T10:18:00.000Z' })
    expect(by.d).toMatchObject({ state: 'waiting', result: 'The Zoom link is not in the transcript.' })
  })
  it('waits when every lane in its order is dry, naming when the first lamp relights', () => {
    const until = new Date('2026-11-02T15:00:00Z')
    const ticket = t({ lane: 'freebuff' })
    expect(sealsFrom([ticket], [{ lane: 'freebuff', dryUntil: until }, { lane: 'claude', dryUntil: new Date('2026-11-02T16:00:00Z') }], now)[0])
      .toMatchObject({ state: 'waiting', movesAt: until.toISOString() })
    // a lit lane after it in its order: still sent (the next dry call passes it on)
    expect(sealsFrom([t({})], [{ lane: 'claude', dryUntil: until }], now)[0].state).toBe('sent')
  })
  it('keeps the newest ticket per card and lets a day-old Done leave the table', () => {
    const s = sealsFrom([
      t({ state: 'done', doneAt: new Date('2026-11-01T09:00:00Z'), basis: { rows: ['old'] } }),
      t({ state: 'done', createdAt: new Date('2026-11-02T09:00:00Z') }),
      t({ state: 'claimed', createdAt: new Date('2026-11-02T10:05:00Z') }),
    ], [], now)
    expect(s.map(x => [x.row, x.state])).toEqual([['rs1-look-1', 'picked']])
  })
})
