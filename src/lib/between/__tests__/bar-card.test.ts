import { describe, expect, it } from 'vitest'
import { cleanSeal, momentFields, backRows, shortDate, GIVEN_AT } from '../../../../public/between/bar-card-data.js'

describe('the BAR card, two sides', () => {
  it('keeps seal strokes inside the pad and caps them', () => {
    expect(cleanSeal([[[-1, 2], [0.5, 0.25], ['x', 1], [NaN, 0]]])).toEqual([[[0, 1], [0.5, 0.25]]])
    expect(cleanSeal('no')).toEqual([])
    expect(cleanSeal(Array.from({ length: 30 }, () => [[0.1, 0.1]])).length).toBe(12)
    expect(cleanSeal([[]])).toEqual([])
  })
  it('reads reaches, by and costs from the sentence, and only what it names', () => {
    const f = momentFields('Tonight I will call my sister and ask how the move went, before I sleep. It costs me my pride.')
    expect(f).toEqual({ costs: 'my pride', by: 'before I sleep', reaches: 'my sister' })
    expect(momentFields('Tonight I will sit with it')).toEqual({})
    expect(momentFields('I will thank Maria by noon. It costs me a morning.')).toEqual({ costs: 'a morning', by: 'noon', reaches: 'Maria' })
  })
  it('prints only rows it has a value for, and always where it was given', () => {
    expect(backRows({ sentence: 'Tonight I will rest' })).toEqual([['Given at', GIVEN_AT]])
    expect(backRows({ sentence: 'I will call my sister by noon.' }).map(r => r[0])).toEqual(['Reaches', 'By', 'Given at'])
  })
  it('writes the short date, empty for none', () => {
    expect(shortDate('2026-11-21T10:00:00Z')).toBe('21 Nov')
    expect(shortDate(undefined)).toBe('')
  })
})
