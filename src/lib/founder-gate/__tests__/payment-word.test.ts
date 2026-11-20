import { describe, expect, it } from 'vitest'
import { findWord, isWord, makeWord } from '../payment-word'

describe('the payment word', () => {
  it('makes words that pass isWord, and the same source makes the same word', () => {
    let a = 0.1
    const src = () => ((a = (a * 7.3 + 0.13) % 1), a)
    for (let i = 0; i < 50; i++) expect(isWord(makeWord(src))).toBe(true)
    expect(makeWord(() => 0.5)).toBe(makeWord(() => 0.5))
  })
  it('finds the word in a note however it was typed', () => {
    expect(findWord('for the book, Fern-07 thanks')).toBe('fern-07')
    expect(findWord('FERN 07')).toBe('fern-07')
    expect(findWord('fern07')).toBe('fern-07')
  })
  it('finds nothing in a note without one of our words', () => {
    expect(findWord('thanks for the book')).toBeNull()
    expect(findWord('lunch 12')).toBeNull()
  })
  it('rejects malformed words', () => {
    expect(isWord('fern')).toBe(false)
    expect(isWord('Fern-07')).toBe(false)
    expect(isWord(3)).toBe(false)
  })
})
