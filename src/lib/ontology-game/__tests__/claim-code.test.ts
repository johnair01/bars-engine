import { describe, expect, it } from 'vitest'
import { decodeClaimCode, encodeClaimCode } from '../claim-code'
import { measureClaims } from '../claim-measure'

const good = {
  v: 2, build: 'b1',
  s: { totalCycles: 4, channelCounts: { anger: 2 }, channelsSatisfied: { anger: true } },
  k: [[1763350000000, 'anger', 'orange', 'orange', 'my words']],
}

describe('decodeClaimCode', () => {
  it('decodes a good code', () => {
    const r = decodeClaimCode(encodeClaimCode(good))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.claims[0]).toMatchObject({ channel: 'anger', named: 'orange', words: 'my words' })
      expect(r.counts.channelCounts.anger).toBe(2)
    }
  })
  const reason = (c: string) => { const r = decodeClaimCode(c); return r.ok ? 'ok' : r.reason }
  it('refuses each bad case', () => {
    expect(reason('OAG1.abc')).toBe('wrong prefix')
    expect(reason('OAG2.abc')).toBe('missing checksum')
    expect(reason('OAG2.a b.12345678')).toBe('bad base64')
    expect(reason(encodeClaimCode(good).replace(/.$/, (c) => (c === '0' ? '1' : '0')))).toBe('checksum mismatch')
    expect(reason(encodeClaimCode({ ...good, k: [[1, 'rage', 'red', 'red', '']] }))).toBe('unknown channel')
    expect(reason(encodeClaimCode({ ...good, k: [[1, 'anger', 'blue', 'red', '']] }))).toBe('unknown altitude')
    expect(reason(encodeClaimCode({ ...good, k: [[1, 'anger', 'red', 'red', '', 'neutral']] }))).toBe('polarity other than satisfied')
    expect(reason(encodeClaimCode({ ...good, k: Array(31).fill([1, 'anger', 'red', 'red', '']) }))).toBe('too many claims')
    expect(reason(encodeClaimCode({ ...good, k: [[1, 'anger', 'red', 'red', 'x'.repeat(281)]] }))).toBe('words too long')
  })
})

describe('measureClaims', () => {
  it('gives fixed rates', () => {
    const base = { channel: 'anger' as const, cyclesInChannel: 4 }
    const m = measureClaims([
      { ...base, at: 1, lens: 'orange', named: 'orange', codeHash: 'a', carriedAt: 1 },
      { ...base, at: 2, lens: 'red', named: 'teal', codeHash: 'b', carriedAt: 2 },
    ]).find((r) => r.channel === 'anger')!
    expect(m.claims).toBe(2)
    expect(m.namedRate).toBe(0.5)
    expect(m.lensAgreement).toBe(0.5)
    expect(m.recurrence).toBe(1)
  })
})
