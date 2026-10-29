import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
// Wendell's rule lt-idle-default: any figure not moving or sitting plays a real standing idle (public/between/stance.js),
// and the files it plays from: average-dusk.glb carries an 'Idle' beside the unchanged 'Walk'. The robe is skinned, so it
// follows either clip (public/between/figure-robe.js).
import { clipWeights, FADE, stance, STANCES } from '../../../../public/between/stance.js'

const DUSK = path.resolve(__dirname, '../../../../public/between/m/dusk')
function glbJson(name: string) {
  const b = readFileSync(path.join(DUSK, name))
  const len = b.readUInt32LE(12)
  return JSON.parse(b.subarray(20, 20 + len).toString('utf8'))
}

describe('stance: a figure that is not moving or sitting stands in the idle', () => {
  it('standing still is the idle, never the walk', () => {
    expect(stance({ moving: false, sitting: false })).toBe('idle')
    expect(stance({})).toBe('idle')
    expect(clipWeights('idle')).toEqual({ Walk: 0, Idle: 1 })
  })
  it('moving is the walk; sitting wins over both', () => {
    expect(stance({ moving: true })).toBe('walk')
    expect(clipWeights('walk')).toEqual({ Walk: 1, Idle: 0 })
    expect(stance({ moving: true, sitting: true })).toBe('sit')
    expect(stance({ sitting: true })).toBe('sit')
    expect(clipWeights('sit')).toEqual({ Walk: 0, Idle: 0 })
  })
  it('every stance has a fade', () => {
    for (const s of STANCES) expect(FADE[s as keyof typeof FADE]).toBeGreaterThan(0)
  })
})

describe('the idle files', () => {
  it('average-dusk.glb has Walk first and a looping Idle of a few seconds', () => {
    const j = glbJson('average-dusk.glb')
    const names = j.animations.map((a: { name: string }) => a.name)
    expect(names[0]).toBe('Walk')
    expect(names).toContain('Idle')
    const idle = j.animations.find((a: { name: string }) => a.name === 'Idle')
    const t = j.accessors[idle.samplers[0].input]
    expect(t.max[0]).toBeGreaterThanOrEqual(2)
    expect(t.max[0]).toBeLessThanOrEqual(8)
    // every joint of the skin is keyed, so nothing is left in the walk's pose
    const keyed = new Set(idle.channels.filter((c: { target: { path: string } }) => c.target.path === 'rotation').map((c: { target: { node: number } }) => c.target.node))
    for (const n of j.skins[0].joints) expect(keyed.has(n)).toBe(true)
  })
})

describe('the robe (robe-slit build): skinned, no bake', () => {
  it('robe.glb is skinned to the skirt bones hemF and hemB, which both clips key', () => {
    const j = glbJson('robe.glb'), dusk = glbJson('average-dusk.glb')
    const names = j.skins[0].joints.map((n: number) => j.nodes[n].name)
    expect(names).toContain('hemF')
    expect(names).toContain('hemB')
    for (const a of dusk.animations) {
      const keyed = new Set(a.channels.map((c: { target: { node: number } }) => dusk.nodes[c.target.node].name))
      expect(keyed.has('hemF') && keyed.has('hemB')).toBe(true)
    }
  })
  it('the robe bakes are gone, and every cut has a cover', () => {
    expect(existsSync(path.join(DUSK, 'robe-baked.glb'))).toBe(false)
    expect(existsSync(path.join(DUSK, 'robe-baked-idle.glb'))).toBe(false)
    const cover = JSON.parse(readFileSync(path.join(DUSK, 'robe-cover.json'), 'utf8'))
    for (const c of ['jacket', 'dress', 'coat']) expect(cover.cuts[c].length).toBeGreaterThan(50)
  })
})

// Wendell, 2026-10-24: "When asked to sit down the player should walk to a cushion and actually sit instead of having a card
// modal open up." The hips rest SEAT_PAD over a seat's top (as the caves' seatAvatar, #434), and the hearth moment opens only
// once sat: every way into the hearth sheet walks to the hearth's seat first, and the wake is a seat in the same list.
describe('sitting on a seat', () => {
  const garden = readFileSync(path.resolve(__dirname, '../../../../public/between/garden.js'), 'utf8')
  it('rests the hips just over the seat top', async () => {
    const { SEAT_PAD } = await import('../../../../public/between/stance.js')
    expect(SEAT_PAD).toBeGreaterThan(0.05)
    expect(SEAT_PAD).toBeLessThan(0.15)
  })
  it('walks to the hearth cushion before the hearth sheet opens', () => {
    expect(garden).toContain('if (name === "hearth" && !seatedAtHearth()) { sitAtHearth(); return; }')
    expect(garden).toContain('data-act="sitHearth">Sit at the hearth</button>')
    expect(garden).not.toContain('data-open="hearth">Sit at the hearth')
  })
  it('wakes the first minute sat on a seat from the same list', () => {
    expect(garden).toMatch(/seatsNow\(hollow\.handles\.spots\)\.concat\(wake\.on \? \[\{ id: "wake"/)
    expect(garden).toContain('meState.seatWant = "wake"; meState.sitting = true;')
  })
})
