import { describe, expect, it } from 'vitest'
import { parseLexicon, unpackRead, FEEL_NOW, FEEL_WANT } from '../unpack-read'
import { DISSATISFACTION_OPTIONS, LIFE_STATE_OPTIONS, SATISFACTION_OPTIONS } from '../../quest-grammar/unpacking-constants'

describe('the feeling hands', () => {
  it('cover every shared palette word exactly once', () => {
    expect(Object.values(FEEL_NOW).flat().sort()).toEqual([...DISSATISFACTION_OPTIONS].sort())
    expect(Object.values(FEEL_WANT).flat().sort()).toEqual([...SATISFACTION_OPTIONS].sort())
  })
  it('add Stuck to the life states and keep Neutral for old saves', () => {
    expect(LIFE_STATE_OPTIONS).toEqual(['Flowing', 'Stalled', 'Stuck', 'Neutral'])
  })
})

describe('unpackRead', () => {
  it('pencils the q4 and q2 palette words it hears, in palette order', () => {
    const r = unpackRead("I'm stuck and scared about the application, and I want to feel relieved and proud")
    expect(r.feel_now).toEqual(['stuck', 'scared'])
    expect(r.feel_want).toEqual(['proud', 'relieved'])
    expect(r.answers.q1.goal).toBeTruthy()
  })
  it('returns the readAll contract unchanged and nothing for text with no feeling', () => {
    const r = unpackRead('Send the TDT director application')
    expect(r.feel_now).toEqual([])
    expect(r.feel_want).toEqual([])
    expect(Object.keys(r.answers)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6'])
  })
  it('reads his own lexicon words as that channel\'s feeling and says it heard them', () => {
    const r = unpackRead('The inbox is a swamp', { water: ['swamp'] })
    expect(r.feel_now).toEqual(['disappointed'])
    expect(r.heard).toContain('swamp')
    expect(r.channel).toBe('water')
  })
  it('is the same on every run', () => {
    const t = 'frustrated and worried, I want to feel free'
    expect(unpackRead(t)).toEqual(unpackRead(t))
  })
})

describe('parseLexicon', () => {
  it('accepts none, a channel map, and refuses the rest', () => {
    expect(parseLexicon(undefined)).toEqual({})
    expect(parseLexicon({ fire: [' Blocked '] })).toEqual({ fire: ['blocked'] })
    expect(parseLexicon({ plasma: ['x'] })).toBeNull()
    expect(parseLexicon(['x'])).toBeNull()
    expect(parseLexicon({ fire: Array.from({ length: 201 }, (_, i) => `w${i}`) })).toBeNull()
  })
})
