import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { emberWarmth, focusMinutes, focusOnReturn, focusProgress, FOCUS_MINUTES, FRAGMENT_ORDER, fragmentFor, hearthRecord } from '../../../../public/between/focus.js'
import { FRAGMENTS, FRAGMENT_SECONDS, pictureDots } from '../../../../public/between/fragments.js'

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

// The hearth spirit's story (spec focus-sit-world-growth): five fragments, one per channel, told once by a finished sit.
describe('the hearth spirit\'s fragments', () => {
  it('tells the channel of the ember sat with, once, and a sit with no ember is earth', () => {
    expect(FRAGMENT_ORDER).toEqual(['earth', 'fire', 'wood', 'metal', 'water'])
    expect(fragmentFor('wood', {})).toBe('wood')
    expect(fragmentFor(null, {})).toBe('earth')
    expect(fragmentFor('wood', { wood: 5 })).toBeNull()
    expect(fragmentFor('joy', { earth: 1 })).toBeNull() // an unknown feeling is earth, already told
  })
  it('records one more sit and the fragment it told, and nothing else', () => {
    expect(hearthRecord(undefined, 'earth', 9)).toEqual({ sits: 1, at: 9, told: { earth: 9 } })
    expect(hearthRecord({ sits: 4, told: { earth: 1 } }, null, 20)).toEqual({ sits: 5, at: 20 })
  })
  it('holds his five lines: one short line each, no digit, no stand-in, and a picture that draws', () => {
    expect(FRAGMENT_SECONDS).toBe(6)
    for (const c of FRAGMENT_ORDER) {
      const f = (FRAGMENTS as Record<string, { line: string }>)[c]
      expect(f.line.length).toBeLessThanOrEqual(90)
      expect(f.line).not.toMatch(/\d|stand-?in/i)
      expect(f.line).not.toMatch(/, and |\. And /) // his editorial note on look-1: no dangling "and" clauses
      const dots = pictureDots(c)
      expect(dots.length).toBeGreaterThan(20)
      expect(dots.some(d => d[2] === 1)).toBe(true) // the spirit's glow is in every picture
      for (const [x, y] of dots) { expect(Math.abs(x)).toBeLessThanOrEqual(1.2); expect(Math.abs(y)).toBeLessThanOrEqual(1.2) }
    }
    expect(FRAGMENTS.water.line).toBe('It kept this fire for every keeper before you. Tonight, you are the keeper.')
  })
  it('is written by a finished sit at your own hearth only, and drawn with no count or blank', () => {
    const garden = readFileSync(path.resolve(__dirname, '../../../../public/between/garden.js'), 'utf8')
    for (const fn of ['function fsKeep(', 'function fragStart(', 'function fragTick(', 'function fireTouch(']) expect(garden).toContain(fn)
    expect(garden).toMatch(/fsOwn\(\) \? await fsKeep/) // a Between's hearth writes nothing
    const block = garden.slice(garden.indexOf('function fragStart('), garden.indexOf('function fireTouch('))
    expect(block).not.toMatch(/toast\(|of 5|locked|sits/)
  })
})
