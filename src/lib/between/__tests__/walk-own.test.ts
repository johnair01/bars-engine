'use client' // the manifest check reads sessionStorage below as client code; this test only stubs it
import { describe, expect, it, beforeEach } from 'vitest'
import { WALLS, cardFor, own, keep, drawWall, PROMPT } from '../../../../public/between/walk-own.js'
import { wordsFor } from '../../../../public/between/walk-hollow.js'
import { OBSTACLE } from '../../../../public/calrunia/episode-sheet.js'

const store: Record<string, string> = {}
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k]
  ;(globalThis as any).sessionStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v } }
})

/* The newcomer's own walk (hdw-oix-4 A): one want, one wall, Mara's card answers the wall. */
describe("the newcomer's own walk", () => {
  it('offers the seven walls of the obstacle table', () => {
    expect(WALLS.map(w => w.key)).toEqual(Object.keys(OBSTACLE))
  })
  it('writes one card and one line back for every wall, short and with no digit', () => {
    for (const w of WALLS) {
      const c = cardFor(w.key, 'a garage studio')!
      expect(c).toBeTruthy()
      for (const t of [c.words, c.back]) { expect(t.length).toBeLessThan(140); expect(t).not.toMatch(/\d/) }
      expect(c.goalText).toBe('a garage studio')
    }
  })
  it('words every card in the deck grammar: one ask in the first person, then a plain answer with thanks', () => {
    for (const w of WALLS) {
      const c = cardFor(w.key, 'x')!
      expect(c.words).toMatch(/^Ask me .*, then listen to the whole answer\.$/)
      expect(c.back).toMatch(/Thank you for asking\.$/)
    }
    expect(PROMPT).toBe('What do you want, and what is in the way?')
  })
  it('draws a terrain piece for every wall and nothing for an unknown one', () => {
    for (const w of WALLS) {
      const calls: string[] = []
      const x = new Proxy({}, { get: (_t, k) => (k === 'fillText' ? (t: string) => calls.push('text:' + t) : () => { calls.push(String(k)) }), set: () => true }) as any
      drawWall(x, w.key)
      expect(calls.length).toBeGreaterThan(8)
      expect(calls).toContain('text:' + w.terrain)
    }
    const none: string[] = []
    drawWall(new Proxy({}, { get: (_t, k) => () => { none.push(String(k)) }, set: () => true }) as any, 'nonsense')
    expect(none).toEqual([])
  })
  it('gives no card for an unknown wall, so the walk falls back to today’s card', () => {
    expect(cardFor('nonsense', 'x')).toBeNull()
    expect(own()).toBeNull()
  })
  it('keeps a want and wall in the tab, and refuses an empty want or unknown wall', () => {
    expect(keep('', 'money')).toBeNull()
    expect(keep('a quiet room', 'bogus')).toBeNull()
    expect(keep('  a quiet   room ', 'money')).toEqual({ want: 'a quiet room', wall: 'money' })
    expect(own()).toEqual({ want: 'a quiet room', wall: 'money' })
  })
  it('echoes the want in the table step and falls back without one', () => {
    expect(wordsFor('table', 'a quiet room')).toContain('a quiet room')
    expect(wordsFor('table', '')).toMatch(/Mara sits across/)
    expect(wordsFor('table', 'a quiet room')).not.toMatch(/\d/)
  })
})
