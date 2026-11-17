import { describe, expect, it } from 'vitest'
import { TTV_FACES, TTV_FEELINGS, TTV_PATHS, takeSignature, pathLitBy } from '../paths'
import { takeText } from '../path-take'

describe('the six paths', () => {
  it('has one path per face and one feeling per ribbon', () => {
    expect(TTV_PATHS.map((p) => p.face).sort()).toEqual([...TTV_FACES].sort())
    expect(TTV_PATHS.map((p) => p.lights).sort()).toEqual([...TTV_FEELINGS].sort())
  })
  it('lights the council’s ribbon for each feeling', () => {
    expect(pathLitBy('anger')?.face).toBe('challenger')
    expect(pathLitBy('fear')?.face).toBe('architect')
    expect(pathLitBy('sadness')?.face).toBe('shaman')
    expect(pathLitBy('joy')?.face).toBe('diplomat')
    expect(pathLitBy('flat')?.face).toBe('regent')
    expect(pathLitBy('unsure')?.face).toBe('sage')
  })
  it('merge test: no two Takes write the same record', () => {
    const sigs = TTV_PATHS.map(takeSignature)
    expect(new Set(sigs).size).toBe(sigs.length)
  })
  it('names its path on the stored line', () => {
    const regent = TTV_PATHS.find((p) => p.face === 'regent')!
    expect(takeText(regent, '  the lease, Friday ')).toBe('Carry: the lease, Friday')
  })
})
