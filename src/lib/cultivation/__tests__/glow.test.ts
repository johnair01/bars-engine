import { describe, expect, it } from 'vitest'
import { glowChange, glowForLayer, LAYERS } from '../glow'
import * as pageGlow from '../../../../public/between/cult/glow.js'

describe('glow by layer', () => {
  it('brightens with every layer, stays within 0..1', () => {
    let last = -1
    for (let n = 1; n <= LAYERS; n++) {
      const b = glowForLayer(n)
      expect(b).toBeGreaterThan(last)
      expect(b).toBeGreaterThan(0)
      expect(b).toBeLessThanOrEqual(1)
      last = b
    }
    expect(glowForLayer(LAYERS)).toBeCloseTo(1)
  })
  it('clamps layers outside 1..9', () => {
    expect(glowForLayer(0)).toBe(glowForLayer(1))
    expect(glowForLayer(40)).toBe(glowForLayer(LAYERS))
    expect(glowForLayer(NaN)).toBe(glowForLayer(1))
  })
  it('pulses only when a layer opens', () => {
    expect(glowChange(null, 3).pulse).toBe(false)
    expect(glowChange(3, 3).pulse).toBe(false)
    expect(glowChange(4, 3).pulse).toBe(false)
    expect(glowChange(3, 4).pulse).toBe(true)
  })
  it('matches the module the page loads', () => {
    for (let n = 0; n <= 10; n++) expect(pageGlow.glowForLayer(n)).toBe(glowForLayer(n))
    expect(pageGlow.glowChange(2, 3)).toEqual(glowChange(2, 3))
  })
})
