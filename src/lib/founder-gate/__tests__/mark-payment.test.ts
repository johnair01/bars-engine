import { describe, expect, it } from 'vitest'
import { isCents, isRef, readNote } from '../mark-payment'

const owners: Record<string, string> = { 'fern-07': 'npc-11' }
const owner = (w: string) => owners[w] ?? null

describe('reading a payment note for the game master', () => {
  it('names the player when the note carries a word the register owns', () => {
    expect(readNote('for the book, FERN 07 thanks', owner)).toEqual({ kind: 'marked', word: 'fern-07', playerId: 'npc-11' })
  })
  it('marks nothing on a note with no word, and says so', () => {
    expect(readNote('thanks for the book', owner)).toEqual({ kind: 'no-word' })
  })
  it('marks nothing on a word nobody owns, and returns the word so he can ask', () => {
    expect(readNote('moss-42', owner)).toEqual({ kind: 'unknown-word', word: 'moss-42' })
  })
  it('accepts only a sane reference and amount', () => {
    expect(isRef('venmo 2026-11-21 J. Doe')).toBe(true)
    expect(isRef('')).toBe(false)
    expect(isRef(' padded')).toBe(false)
    expect(isCents(1100)).toBe(true)
    expect(isCents(11.5)).toBe(false)
    expect(isCents(0)).toBe(false)
  })
})
