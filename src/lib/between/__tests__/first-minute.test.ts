import { describe, expect, it } from 'vitest'
// The first minute (public/calrunia/first-minute.js, Still C): the rules learned by doing them, three vines on the doorway.
import { ACTS, BEATS, beatAt, CAPTIONS, inviteDoorway, minuteState, minuteWrite, STEPS } from '../../../../public/calrunia/first-minute.js'
import { homeWrite, merge, type Doc } from '@/lib/between/rules'

describe('first minute: where it stands', () => {
  it('a new homeroom wakes cold, three vines on the doorway, nothing given', () => {
    const s = minuteState({})
    expect(s.step).toBe('ember')
    expect(s.vinesLeft).toBe(3)
    expect(s.hearthLit).toBe(false)
    expect(s.emberGlows).toBe(true)
    expect(s.mirrorGiven).toBe(false)
    expect(s.scrollGiven).toBe(false)
    expect(s.oriented).toBe(false)
  })
  it('walks the steps in order, each act a vine but the hope', () => {
    let home: Doc = {}
    const seen: [string, number][] = []
    for (const [i, step] of ACTS.entries()) {
      expect(minuteState(home).step).toBe(step)
      home = merge(home, minuteWrite(step as 'ember', 'done', 10 + i) as Doc)
      expect(homeWrite(home).ok).toBe(true)
      seen.push([step, minuteState(home).vinesLeft])
    }
    expect(seen).toEqual([['ember', 2], ['mirror', 1], ['hope', 1], ['vine', 0]])
    const s = minuteState(home)
    expect(s.step).toBe('open')
    expect(s.oriented).toBe(true)
    expect(home.oriented).toBe(13)
    expect(s.hearthLit && s.mirrorGiven && s.scrollGiven).toBe(true)
    expect(s.glows).toEqual([])
  })
  it('the ember lit gives the mirror; skipping it does too, and leaves the ember glowing', () => {
    expect(minuteState({ minute: { ember: 1 } }).mirrorGiven).toBe(true)
    const s = minuteState({ minute: { skip: { ember: 1 } } })
    expect(s.step).toBe('mirror')
    expect(s.mirrorGiven).toBe(true)
    expect(s.hearthLit).toBe(false)
    expect(s.emberGlows).toBe(true)
    expect(s.fallen).toEqual([true, false, false])
    expect(s.glows).toEqual(['ember'])
  })
  it('a skipped step stays a glow after the doorway opens, until it is done', () => {
    const home = { oriented: 9, minute: { ember: 1, skip: { mirror: 2, hope: 3 }, vine: 9 } }
    const s = minuteState(home)
    expect(s.step).toBe('open')
    expect(s.glows).toEqual(['mirror', 'hope'])
    expect(s.mirrorGlows).toBe(true)
    const later = minuteState(merge(home, { minute: { hope: 20 } }))
    expect(later.glows).toEqual(['mirror'])
    expect(later.mirrorGlows).toBe(false)
  })
  it('the last vine cannot be skipped', () => {
    expect(minuteWrite('vine', 'skip', 1)).toBeNull()
    expect(minuteWrite('hope', 'skip', 1)).toEqual({ minute: { skip: { hope: 1 } } })
    expect(minuteWrite('vine', 'done', 4)).toEqual({ minute: { vine: 4 }, oriented: 4 })
  })
  it('a homeroom oriented before the minute existed counts as done, nothing to come back to', () => {
    const s = minuteState({ oriented: 5 })
    expect(s.step).toBe('open')
    expect(s.hearthLit).toBe(true)
    expect(s.glows).toEqual([])
    expect(s.vinesLeft).toBe(0)
  })
})

describe('first minute: beats at reading pace', () => {
  const captionMs = (s: string) => (CAPTIONS as Record<string, string>)[s] ? 3000 : 0
  it('no beat sooner than the still times it', () => {
    expect(STEPS.map(s => (BEATS as Record<string, number>)[s])).toEqual([0, 10, 22, 35, 48, 60])
    expect(beatAt('ember', { t0: 0, resolvedAt: {}, captionMs })).toBe(10000)
    expect(beatAt('mirror', { t0: 0, resolvedAt: { ember: 11000 }, captionMs })).toBe(22000)
  })
  it('never before the last caption has been read, and not at all while the step before waits', () => {
    expect(beatAt('mirror', { t0: 0, resolvedAt: { ember: 21000 }, captionMs })).toBe(21000 + 3000 + 1200)
    expect(beatAt('hope', { t0: 0, resolvedAt: { ember: 1 }, captionMs })).toBe(Infinity)
  })
})

describe('first minute: the invitation doorway (br-orient-each-invite, 2026-10-24)', () => {
  it('anyone who has done the first minute finds an invitation doorway open, with no orientation', () => {
    expect(inviteDoorway({ oriented: 3 }, false)).toBe('open')
  })
  it('a member of the room always finds it open', () => {
    expect(inviteDoorway({}, true)).toBe('open')
  })
  it('only a guest who has not done the first minute goes through it first', () => {
    expect(inviteDoorway({}, false)).toBe('minute')
    expect(inviteDoorway(null, false)).toBe('minute')
    expect(inviteDoorway({ minute: { ember: 1, mirror: 2 } }, false)).toBe('minute')
  })
})
