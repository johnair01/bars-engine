import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { emberWarmth, focusMinutes, focusOnReturn, focusProgress, FOCUS_MINUTES } from '../../../../public/between/focus.js'

// The focus sit at the hearth (council pass integral-octalysis2; his yes on io-focus-sit-look-1, 2026-10-25): the sticks you
// lay on the fire are the clock, back early banks the fire at no cost, a full sit raises the ember one state.
describe('the focus sit', () => {
  it('reads its length from the sticks laid, one to three', () => {
    expect(FOCUS_MINUTES).toEqual([10, 25, 45])
    expect([0, 1, 2, 3, 4].map(focusMinutes)).toEqual([0, 10, 25, 45, 45])
  })
  it('runs on the wall clock, so a phone put down still counts', () => {
    const sit = { step: 'sit', sticks: 1, t0: 0 }
    expect(focusProgress(sit, 5 * 60000).k).toBeCloseTo(0.5)
    expect(focusProgress(sit, 10 * 60000).done).toBe(true)
    expect(focusOnReturn(sit, 3 * 60000)).toBe('banked')
    expect(focusOnReturn(sit, 11 * 60000)).toBe('done')
  })
  it('warms the ember toward satisfied, the last step only at the end', () => {
    const sit = { step: 'sit', sticks: 2, t0: 0 }
    expect(emberWarmth(sit, 0)).toBe(0)
    expect(emberWarmth(sit, 24 * 60000)).toBeLessThan(0.85)
    expect(emberWarmth(sit, 25 * 60000)).toBe(1)
    expect(emberWarmth(sit, 0, 60000, true)).toBe(1)
  })
  it('lives in the seated hearth moment, with no counts or timer shown', () => {
    const garden = readFileSync(path.resolve(__dirname, '../../../../public/between/garden.js'), 'utf8')
    for (const fn of ['function fsLay(', 'function fsChoose(', 'function fsSettle(', 'function fsBank(', 'function fsStay(', 'function fsDone(', 'function fsTick('])
      expect(garden).toContain(fn)
    const block = garden.slice(garden.indexOf('function fsLay('), garden.indexOf('function fsTick('))
    expect(block).not.toMatch(/toast\(|minutes? left|:\d\d/)
    expect(garden).toMatch(/risen: true/) // only a sit run its length writes, and only that
  })
})
