import { describe, expect, it } from 'vitest'
import { parseCents, parseMark, sayMark } from '../mark-input'

describe('the game master mark input', () => {
  it('reads amounts in the forms a feed shows', () => {
    expect(parseCents('$11')).toBe(1100)
    expect(parseCents('11.5')).toBe(1150)
    expect(parseCents('$1,100.07')).toBe(110007)
    expect(parseCents('none')).toBeNull()
  })
  it('takes the amount from the paste when none is given', () => {
    const r = parseMark({ note: 'Venmo: J. Doe paid you $11.00 for fern-07' })
    expect(r).toMatchObject({ ok: true, cents: 1100 })
  })
  it('lets an explicit amount and reference win', () => {
    expect(parseMark({ note: 'fern-07', amount: '25', ref: 'venmo 11-21 Doe' })).toEqual({ ok: true, ref: 'venmo 11-21 Doe', note: 'fern-07', cents: 2500 })
  })
  it('gives the same paste the same reference, spacing aside', () => {
    const a = parseMark({ note: 'fern-07  thanks', amount: 11 })
    const b = parseMark({ note: ' fern-07 thanks ', amount: '$11' })
    expect(a.ok && b.ok && a.ref === b.ref).toBe(true)
  })
  it('refuses an empty note, a missing amount and a zero amount', () => {
    expect(parseMark({ note: '  ' }).ok).toBe(false)
    expect(parseMark({ note: 'fern-07' }).ok).toBe(false)
    expect(parseMark({ note: 'fern-07', amount: 0 }).ok).toBe(false)
  })
  it('says each result in a sentence', () => {
    expect(sayMark({ kind: 'no-word' })).toMatch(/no payment word/)
    expect(sayMark({ kind: 'unknown-word', word: 'moss-42' })).toMatch(/moss-42/)
  })
})
