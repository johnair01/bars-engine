import { describe, expect, it } from 'vitest'
import { EXPERIENCE_OPTIONS } from '@/lib/quest-grammar/unpacking-constants'
import { SATISFACTIONS } from '@/lib/coaching/unpacking-walk'
import { CHANNELS, CROP_FAMILY, CROP_FORM, isCrop, makeCrop } from '../crops'
import * as F from '../farm'

describe('satisfaction crops', () => {
  it('has five families by four forms, plus the wild bed', () => {
    expect(CHANNELS.length).toBe(5)
    for (const c of CHANNELS) {
      expect(CROP_FAMILY[c].name.length).toBeGreaterThan(0)
      for (const d of EXPERIENCE_OPTIONS) expect(isCrop({ family: c, form: d })).toBe(true)
      expect(isCrop({ family: c, form: 'own' })).toBe(true)
    }
    expect(Object.keys(CROP_FORM).sort()).toEqual([...EXPERIENCE_OPTIONS, 'own'].sort())
  })
  it('keeps the walk’s own meaning line for every family', () => {
    for (const s of SATISFACTIONS) expect(CROP_FAMILY[s.channel].means).toBe(s.means)
  })
  it('rejects a crop that is not a family and a form', () => {
    expect(isCrop({ family: 'rage', form: 'own' })).toBe(false)
    expect(isCrop({ family: 'joy', form: 'Nothing' })).toBe(false)
    expect(isCrop(null)).toBe(false)
  })
  it('gives an own seed a crop only after a picture tap', () => {
    expect(makeCrop(null, 'own')).toBeUndefined()
    expect(makeCrop('joy', 'own')).toEqual({ family: 'joy', form: 'own' })
  })
  it('still runs till, plant, water, ripen and pick on a crop-less plant', () => {
    let f = F.newFarm(); f.mana = 50
    let r = F.till(f, 3, 'n'); expect(r.ok).toBe(true)
    r = F.plant(r.farm, 3, 'bar-1', 'one line', 'n', '2026-11-16'); expect(r.ok).toBe(true)
    expect(r.farm.slots['3'].plant!.crop).toBeUndefined()
    r = F.water(r.farm, 3, 'mana', '2026-11-16'); expect(r.ok).toBe(true)
    r = F.ripen(r.farm, 3, 'did it', '2026-11-16'); expect(r.ok).toBe(true)
    r = F.pick(r.farm, 3, '2026-11-17'); expect(r.ok).toBe(true)
    expect(r.farm.harvests.length).toBe(1)
  })
  it('stores a valid crop on the plant and ignores a bad one', () => {
    let f = F.newFarm(); f.mana = 50
    let r = F.till(f, 1, 'n')
    const good = F.plant(r.farm, 1, 'b', 'x', 'n', '2026-11-16', { family: 'anger', form: 'Direct Action' })
    expect(good.farm.slots['1'].plant!.crop).toEqual({ family: 'anger', form: 'Direct Action' })
    const bad = F.plant(r.farm, 1, 'b', 'x', 'n', '2026-11-16', { family: 'x', form: 'y' })
    expect(bad.farm.slots['1'].plant!.crop).toBeUndefined()
  })
})
