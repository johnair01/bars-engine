import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { decodeClaimCode } from '../claim-code'
import { measureClaims } from '../claim-measure'

const make = (payload: unknown, tamper = false) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sum = createHash('sha256').update(body).digest('hex').slice(0, 8)
  return 'OAG2.' + body + '.' + (tamper ? '00000000' : sum)
}
const good = { v: 2, build: 'b', s: { totalCycles: 4, channelCounts: { anger: 2 }, channelsSatisfied: {} }, k: [[1763350000000, 'anger', 'orange', 'orange', 'hi']] }

describe('decodeClaimCode', () => {
  it('decodes a good code', () => {
    const r = decodeClaimCode(make(good))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.claims[0]).toEqual({ at: 1763350000000, channel: 'anger', lens: 'orange', named: 'orange', words: 'hi' })
      expect(r.counts.channelCounts.anger).toBe(2)
    }
  })
  const reason = (c: string) => { const r = decodeClaimCode(c); return r.ok ? 'ok' : r.reason }
  it('refuses each bad shape once', () => {
    expect(reason('OAG1.abc')).toBe('wrong prefix')
    expect(reason('OAG2.!!!.deadbeef')).toBe('bad base64')
    expect(reason(make(good, true))).toBe('checksum mismatch')
    expect(reason(make({ ...good, k: [[1, 'rage', 'orange', 'orange']] }))).toBe('unknown channel')
    expect(reason(make({ ...good, k: [[1, 'anger', 'purple', 'orange']] }))).toBe('unknown altitude')
    expect(reason(make({ ...good, k: [[1, 'anger', 'orange', 'orange', 'x'.repeat(281)]] }))).toBe('words too long')
    expect(reason(make({ ...good, k: Array(31).fill([1, 'anger', 'orange', 'orange']) }))).toBe('too many claims')
  })
})

describe('measureClaims', () => {
  it('gives fixed numbers for fixed claims', () => {
    const m = measureClaims([
      { at: 1, channel: 'anger', lens: 'orange', named: 'orange', cyclesInChannel: 2, totalCycles: 3 },
      { at: 2, channel: 'anger', lens: 'red', named: 'amber', cyclesInChannel: 4, totalCycles: 6 },
    ])
    expect(m).toEqual([{ channel: 'anger', claims: 2, namedRate: 0.5, recurrence: 1, lensAgreement: 0.5 }])
  })
})
