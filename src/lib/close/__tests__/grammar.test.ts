import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parse, step } from '../grammar'
import { pullLever } from '../lever'
import { newClose, type CloseRecord } from '../types'

const ok = { reversible: true, oneLane: true, endsInPrOrRow: true, merges: false, spend: false, outreach: false, touchesFaces: false, nextOwner: true }
const withPick = (): CloseRecord => {
  const r = newClose('2026-11-14', [{ ...ok, id: 'a', title: 'A', stage: 'done', proof: 'p', check: 'green' }])
  r.picks = [{ ...ok, face: 'Shaman', text: 'Walk', minutes: 30 }]
  return r
}

describe('grammar', () => {
  it('reads the commands', () => {
    expect(parse('p4 t3 w5', 'glass')).toEqual({ do: 'rate', ratings: { peace: 4, triumph: 3, wonder: 5 } })
    expect(parse('push 2: too big', 'pushback')).toEqual({ do: 'push', n: 2, reason: 'too big' })
    expect(parse('Tired but lit', 'glass')).toEqual({ do: 'sentence', text: 'Tired but lit' })
    expect(parse('a\nb\nc', 'unpacking')).toEqual({ do: 'unpack', lines: ['a', 'b', 'c'] })
    expect(parse('a\nb', 'unpacking').do).toBe('error')
  })
  it('does not fill a rating he did not give', () => {
    expect(step(withPick(), parse('p4', 'glass')).record.after).toEqual({ peace: { n: 4, about: '' } })
  })
  it('walks to closed and a skipped step costs nothing', () => {
    let r = withPick()
    for (let i = 0; i < 5; i++) r = step(r, { do: 'skip' }).record
    expect(r.status).toBe('closed'); expect(r.skipped).toHaveLength(5)
  })
  it('keeps a pick into a zo ticket at the plan move, and the lever pushes once', async () => {
    let r = withPick(); r.move = 'plan'
    r = step(r, { do: 'keep', n: 1 }).record
    expect(r.plan.tickets[0].hull).toBe('zo')
    r.move = 'lever'
    const s = step(r, { do: 'send', n: 1 }); expect(s.send).toBe('1')
    const db = { workLane: { findMany: vi.fn(async () => []) }, workTicket: { findUnique: vi.fn(async () => null), create: vi.fn(async (a: unknown) => a) } }
    const out = await pullLever(db as never, r, '1')
    expect(out.error).toBeUndefined(); expect(db.workTicket.create).toHaveBeenCalledTimes(1)
    expect(out.record.sent).toEqual(['1'])
    expect((await pullLever(db as never, out.record, '1')).error).toMatch(/already went/)
  })
  it('a red day refuses the lever', async () => {
    let r = withPick(); r.move = 'plan'; r = step(r, { do: 'keep', n: 1 }).record
    r.items[0].check = 'red'
    const db = { workLane: { findMany: vi.fn() }, workTicket: { create: vi.fn() } }
    expect((await pullLever(db as never, r, '1')).error).toMatch(/red/)
    expect(db.workTicket.create).not.toHaveBeenCalled()
  })
  it('no other close file calls pushTicket', () => {
    const dir = path.resolve(__dirname, '..')
    const users = fs.readdirSync(dir).filter(f => f.endsWith('.ts')).filter(f => /pushTicket/.test(fs.readFileSync(path.join(dir, f), 'utf8')))
    expect(users).toEqual(['lever.ts'])
  })
})
