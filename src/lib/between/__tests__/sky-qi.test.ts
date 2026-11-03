import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { makeQiSky, qiOf, skyAt, QI } from '../../../../public/between/sky-qi.js'

// The Between keeps its own time (his A on uu-between-clock, 2026-11-02): one sky for both players, lit by its health.
const DUSK = { sky: { top: [0.17, 0.12, 0.36], mid: [0.52, 0.33, 0.62], low: [0.98, 0.56, 0.4], hor: [1, 0.74, 0.48] }, stars: 0.7, sunY: 3.4, sunDir: [0.18, 0.05, -1], dusk: 0.9 }

describe('the Between sky', () => {
  it('reads qi from its health: stale dims it, agreements and offerings raise it', () => {
    expect(qiOf({ stale: true, phase: 'open', sat: 10 })).toBe(QI.stale)
    expect(qiOf({ phase: 'open', sat: 1 })).toBe(QI.low)
    expect(qiOf({ phase: 'open', sat: 10 })).toBe(QI.high)
    expect(qiOf({ phase: 'open', sat: 6 })).toBeGreaterThan(qiOf({ phase: 'open', sat: 3 }))
  })
  it('gives the drawn style back at the middle, brighter above and darker below', () => {
    expect(skyAt(DUSK, 0.5).sky).toEqual(DUSK.sky)
    expect(skyAt(DUSK, 0.5).sunY).toBeCloseTo(3.4)
    expect(skyAt(DUSK, 1).sky.top[2]).toBeGreaterThan(DUSK.sky.top[2])
    expect(skyAt(DUSK, 0.1).sky.top[2]).toBeLessThan(DUSK.sky.top[2])
    expect(skyAt(DUSK, 0.1).stars).toBeGreaterThan(skyAt(DUSK, 1).stars)
    expect(skyAt(DUSK, 1).sunY).toBeGreaterThan(skyAt(DUSK, 0.1).sunY)
    expect(skyAt({ ...DUSK, stars: 0 }, 0).stars).toBe(0) // a morning style keeps no stars
    for (const c of Object.values(skyAt(DUSK, 1).sky)) for (const v of c) expect(v).toBeLessThanOrEqual(1)
  })
  it('eases toward a change of health rather than snapping', () => {
    const v = (a: number[]) => { const o = { value: { a: [...a], toArray: () => [...o.value.a], set: (...n: number[]) => { o.value.a = n } } }; return o }
    const h = { sky: { uniforms: { uTop: v(DUSK.sky.top), uMid: v(DUSK.sky.mid), uLow: v(DUSK.sky.low), uHor: v(DUSK.sky.hor) } }, stars: { opacity: 0.7, visible: true }, sun: { position: { y: 3.4 }, lookAt() {} }, lights: { dusk: { intensity: 0.9 } } }
    const s = makeQiSky(h)
    expect(s.step(0.016, 0.5)).toBe(0.5)
    const k = s.step(1, 1)
    expect(k).toBeGreaterThan(0.5); expect(k).toBeLessThan(1)
    expect(h.sun.position.y).toBeGreaterThan(3.4)
  })
  it('reads no clock', () => {
    const src = readFileSync(path.join(__dirname, '../../../../public/between/sky-qi.js'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    expect(src).not.toMatch(/Date|getHours|performance\.now|Intl/)
  })
})
