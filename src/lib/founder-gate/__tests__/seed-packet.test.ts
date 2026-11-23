import { describe, expect, it } from 'vitest'
import { UNPACKING_QUESTIONS } from '@/lib/quest-grammar/unpacking-constants'
import { DISSATISFACTIONS } from '@/lib/coaching/unpacking-walk'
import { CHANNELS } from '@/lib/between/crops'
import { EMPTY_PACKET, cropOf, packetLabels, pathFor, stuckStart, waterOptions, weatherChannel } from '../seed-packet'
import { SEEDS, SOIL, STUCK_OBJECTS, FRUIT_TO } from '../content'

describe('the seed packet', () => {
  it('uses the six unpacking labels word for word', () => {
    const l = packetLabels()
    for (const q of UNPACKING_QUESTIONS) expect(l[q.key]).toBe(q.label)
  })
  it('offers four seeds, one per kind of help, and three soils', () => {
    expect(SEEDS.map((s) => s.domain)).toEqual(['Gather Resource', 'Skillful Organizing', 'Raise Awareness', 'Direct Action'])
    expect(SOIL.map((s) => s.id)).toEqual(['Flowing', 'Stalled', 'Stuck'])
    for (const s of SEEDS) expect(s.nextStep).toMatch(/^Your next step is to choose /)
  })
  it('gives a crop only once a family is set', () => {
    expect(cropOf({ ...EMPTY_PACKET, seed: 'own' })).toBeUndefined()
    expect(cropOf({ ...EMPTY_PACKET, seed: 'own', family: 'sadness' })).toEqual({ family: 'sadness', form: 'own' })
    expect(cropOf({ ...EMPTY_PACKET, seed: 'Raise Awareness', family: 'joy' })).toEqual({ family: 'joy', form: 'Raise Awareness' })
  })
  it('starts the stuck path at the first weather pick', () => {
    const p = { ...EMPTY_PACKET, weather: ['heavy', 'anxious'] }
    expect(stuckStart(p)).toBe('sadness')
    expect(stuckStart({ ...EMPTY_PACKET })).toBeNull()
    for (const d of DISSATISFACTIONS) expect(weatherChannel(d.state)).toBe(d.channel)
  })
  it('ends the stuck path on the target’s transcend move for all 25 pairs', () => {
    for (const from of CHANNELS) for (const to of CHANNELS) {
      const path = pathFor(from, { ...EMPTY_PACKET, family: to })
      expect(path.length).toBeGreaterThan(0)
      const last = path[path.length - 1]
      expect(last.from).toBe(to); expect(last.to).toBe(to)
      expect(path[0].from).toBe(from)
    }
  })
  it('has one object per channel and three choices for the fruit', () => {
    for (const c of CHANNELS) expect(STUCK_OBJECTS[c].verb.length).toBeGreaterThan(0)
    expect(FRUIT_TO.map((f) => f.id)).toEqual(['him', 'other', 'keep'])
  })
  it('offers the job of each picked feeling as a pencil answer', () => {
    const w = waterOptions({ ...EMPTY_PACKET, weather: ['anxious', 'heavy'] })
    expect(w.length).toBe(2)
    expect(w[0]).toMatch(/Fear/)
  })
  it('never shows the words domain or satisfaction in the player copy', () => {
    const copy = JSON.stringify([SEEDS.map(({ domain, ...rest }) => rest), SOIL, STUCK_OBJECTS, FRUIT_TO])
    expect(copy).not.toMatch(/domain\b|satisfaction/i)
  })
})
