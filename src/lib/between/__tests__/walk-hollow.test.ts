import { describe, expect, it } from 'vitest'
import { walkStep, STEP_WORDS } from '../../../../public/between/walk-hollow.js'

/* The walk's Hollow (Six-faces-council hollow-demo, his A on hdw-route): the guide names one step at a time. */
describe('the walk through the Hollow', () => {
  it('starts at the low table with Mara', () => {
    expect(walkStep({})).toBe('table')
    expect(walkStep({ turns: [{ status: 'open' }] })).toBe('table')
  })
  it('sends you to the mouth once the card is kept in both books', () => {
    expect(walkStep({ turns: [{ status: 'kept' }], lantern: { mouth: false, state: null } })).toBe('mouth')
  })
  it('names the lantern at the mouth, and ends when it lands', () => {
    expect(walkStep({ turns: [{ status: 'kept' }], lantern: { mouth: true, state: null } })).toBe('lantern')
    expect(walkStep({ turns: [{ status: 'kept' }], lantern: { mouth: false, state: 'float' } })).toBe('carry')
    expect(walkStep({ turns: [], lantern: { mouth: false, state: 'done' } })).toBe('end')
  })
  it('gives every step one short line with no number in it', () => {
    for (const w of Object.values(STEP_WORDS) as string[]) { expect(w.length).toBeLessThan(160); expect(w).not.toMatch(/\d/) }
  })
})
