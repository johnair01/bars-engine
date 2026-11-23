import { describe, expect, it } from 'vitest'
import { formColor, formFor, glowStrength, layersFrom, realmFrom, shouldPulse } from '../../../../public/between/cult/belly-rules.js'
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
  it('opens one ring per realm, from one to three', () => {
    expect(realmFrom(undefined)).toBe(1)
    expect(realmFrom(0)).toBe(1)
    expect(realmFrom(1)).toBe(2)
    expect(realmFrom(2)).toBe(3)
    expect(realmFrom(9)).toBe(3)
  })
  it('takes the form of the floor: motes, pearl, bead', () => {
    expect([1, 2, 3].map(formFor)).toEqual(['motes', 'pearl', 'bead'])
    expect(formFor(undefined)).toBe('motes')
    expect(formFor(9)).toBe('bead')
  })
  it('stays gold until the upper floor, where the element shows', () => {
    expect(formColor(1, '#27ae60')).toBe('#ffcf6e')
    expect(formColor(2, '#27ae60')).toBe('#ffcf6e')
    expect(formColor(3, '#27ae60')).toBe('#27ae60')
    expect(formColor(3, null)).toBe('#ffcf6e')
  })
})
