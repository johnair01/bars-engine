import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
// Wendell's rule lt-idle-default: any figure not moving or sitting plays a real standing idle (public/between/stance.js),
// and the files it plays from: average-dusk.glb carries an 'Idle' beside the unchanged 'Walk', and the idle robe bake is
// the walk bake's own mesh, so the figure crossfades between them.
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
  it('average-dusk.glb has Walk first (wardrobe and the walk bake read it) and a looping Idle of a few seconds', () => {
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
  it('the idle robe bake is the walk bake\'s mesh, with an Idle weights animation', () => {
    const walk = glbJson('robe-baked.glb'), idle = glbJson('robe-baked-idle.glb')
    const count = (j: { meshes: { primitives: { attributes: { POSITION: number } }[] }[]; accessors: { count: number }[] }) => j.accessors[j.meshes[0].primitives[0].attributes.POSITION].count
    expect(count(idle)).toBe(count(walk))
    expect(idle.animations[0].name).toBe('Idle')
    expect(idle.meshes[0].primitives[0].targets.length).toBeGreaterThan(8)
  })
})
