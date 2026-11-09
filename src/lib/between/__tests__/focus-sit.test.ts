import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { emberWarmth, focusMinutes, focusOnReturn, focusProgress, FOCUS_MINUTES, FRAGMENT_ORDER, fragmentFor, hearthRecord, CARES, HEARTH_K, stageOf, hearthStage, careOffered, spiritWord, spiritGlow, spiritFed } from '../../../../public/between/focus.js'
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

describe('the first chapter (FR-003, FR-016 to FR-020)', () => {
  it('draws five stages from the cares done, and never falls', () => {
    expect(CARES).toEqual(['sweep', 'wood', 'log', 'turn'])
    expect(HEARTH_K).toEqual([0, 0, 0.17, 0.5, 1])
    expect(hearthStage(0)).toMatchObject({ k: 0, coal: false, woke: 0, alive: false, offer: 'sweep', sit: false })
    expect(hearthStage(1)).toMatchObject({ k: 0, coal: true, woke: 1, offer: 'wood', sit: false })
    expect(hearthStage(2)).toMatchObject({ k: 0.17, woke: 2, offer: 'log', sit: true })
    expect(hearthStage(3)).toMatchObject({ k: 0.5, woke: 3, offer: 'turn', sit: true })
    expect(hearthStage(4)).toMatchObject({ k: 1, woke: 3, alive: true, offer: null, sit: true })
    expect(hearthStage(9).care).toBe(4); expect(hearthStage(-2).care).toBe(0); expect(hearthStage(undefined).care).toBe(0)
  })
  it('reads a fire already lit as stage 4 and a new home as 0', () => {
    expect(stageOf({})).toBe(0); expect(stageOf(null)).toBe(0)
    expect(stageOf({ minute: { ember: 1 } })).toBe(4); expect(stageOf({ oriented: 1 })).toBe(4)
    expect(stageOf({ hearth: { stage: 3, care: 1 } })).toBe(3); expect(stageOf({ hearth: { stage: 0 }, oriented: 1 })).toBe(0)
    expect(stageOf({ hearth: { care: 2 } })).toBe(2); expect(stageOf({ hearth: { care: 0 }, minute: { ember: 1 } })).toBe(0)
  })
  it('dims the hearth spirit by its word and never without a feeding (FR-024, FR-025)', () => {
    expect(spiritWord({}, 5)).toBe('thriving'); expect(spiritGlow({ hearth: {} }, 5)).toBe(1)
    const at = 1e12, home = { hearth: { spirit: { sat: 7, vit: 100, at } } }
    expect(spiritWord(home, at)).toBe('thriving')
    expect(spiritWord(home, at + 10 * 864e5)).toBe('dimming')
    expect(spiritGlow(home, at + 10 * 864e5)).toBe(0.6)
    expect(spiritWord({ hearth: { spirit: { sat: 3, vit: 100, at } } }, at)).toBe('unsettled')
    expect(spiritFed({}, 'fire', at)).toEqual({ sat: 9, vit: 100, at }) // own element twice over
    expect(spiritFed({}, 'wood', at).sat).toBe(8)
  })
  it('offers one care a visit', () => {
    expect(careOffered(0, false)).toBe('sweep'); expect(careOffered(0, true)).toBe(null)
    expect(careOffered(3, false)).toBe('turn'); expect(careOffered(4, false)).toBe(null)
  })
  it('garden.js tends the hearth one care a visit and lets no sit in below the second', () => {
    const garden = readFileSync(path.resolve(__dirname, '../../../../public/between/garden.js'), 'utf8')
    for (const fn of ['function doCare(', 'const hearthCareNow =', 'const sitBlocked =']) expect(garden).toContain(fn)
    expect(garden).toMatch(/careOffered\(c, caredThisVisit\)/)
    expect(garden).toMatch(/caredThisVisit = true/)
    expect(garden).toMatch(/canSitOn = id => !seatTaken\(id\) && !\(sitBlocked\(\)/)
    expect(garden).toMatch(/function sitAtHearth\(\) \{ if \(sitBlocked\(\)\) return;/)
    expect(garden).toMatch(/if \(hm \|\| sitBlocked\(\)/)
    expect(garden).toMatch(/PREVIEW_HOST && \/\^\[0-4\]\$\/\.test\(KQ\.get\("care"\)/) // ?care= is a preview only
    const doCare = garden.slice(garden.indexOf('function doCare('), garden.indexOf('/* What a tap on the nook does'))
    expect(doCare).toContain('minuteAct("ember", "done", patch)') // care 0 and the ember beat are one write (FR-019)
    expect(doCare).not.toMatch(/care: c \+ 2|care: 4/)
  })
})
