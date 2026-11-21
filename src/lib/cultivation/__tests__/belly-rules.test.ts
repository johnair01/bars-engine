import { describe, expect, it } from 'vitest'
import { glowStrength, layersFrom, shouldPulse } from '../../../../public/between/cult/belly-rules.js'
import { layers, QI_PER_MOVE } from '../sheet'

describe('belly glow rules (T008) match the sheet', () => {
  it('reads the same layers as sheet.ts on the lower floor, the ninth held', () => {
    for (let moves = 0; moves <= 60; moves++) {
      const qi = moves * QI_PER_MOVE
      expect(layersFrom(qi)).toBe(layers({ qi, breakthroughs: 0 }))
    }
  })
  it('brightens with each layer and never draws dark', () => {
    expect(glowStrength(0)).toBeGreaterThan(0)
    for (let n = 1; n <= 9; n++) expect(glowStrength(n)).toBeGreaterThan(glowStrength(n - 1))
    expect(glowStrength(9)).toBeCloseTo(1)
  })
  it('pulses only when a layer opened since the last visit', () => {
    expect(shouldPulse(null, 3)).toBe(false)
    expect(shouldPulse(2, 3)).toBe(true)
    expect(shouldPulse(3, 3)).toBe(false)
  })
})
