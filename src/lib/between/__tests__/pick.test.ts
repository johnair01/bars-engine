import { describe, expect, it } from 'vitest'
import { isSeat, pickTap } from '../../../../public/between/pick.js'

// The cushion takes the tap ahead of the spark over it (Six-faces-council pt1-cushion-first, playtest 1 of 2026-10-28: the
// player tried to sit and the taps landed on the spark).
describe('what a tap lands on', () => {
  it('takes the nearest thing when no seat is hit', () => {
    expect(pickTap([{ key: 'hearth', along: 4 }, { key: 'between', along: 2.5 }])!.key).toBe('between')
    expect(pickTap([])).toBeNull()
  })
  it('gives a seat the tap ahead of the spark, a spirit or an item in front of it', () => {
    const hits = [{ key: 'between', along: 2.1 }, { key: 'w:s1', along: 2.4 }, { key: 'seat:0', along: 3.2 }, { key: 'item:i1', along: 1.9 }]
    expect(pickTap(hits)!.key).toBe('seat:0')
    expect(pickTap([...hits].reverse())!.key).toBe('seat:0')
  })
  it('takes the nearer of two seats', () => {
    expect(pickTap([{ key: 'seat:1', along: 3 }, { key: 'seat:hearth', along: 2 }])!.key).toBe('seat:hearth')
  })
  it('knows a seat by its key', () => {
    expect([isSeat('seat:0'), isSeat('seat:spot:a1'), isSeat('between'), isSeat(undefined)]).toEqual([true, true, false, false])
  })
})
