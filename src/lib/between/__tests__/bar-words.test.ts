import { describe, expect, it } from 'vitest'
import { BAR, RETURN, ENDING_KEY, MAX_SENTENCE, sentence, reportLine, barCardFor } from '../../../../public/sect/heaven/bar-words.js'

describe('Heaven quest BAR words', () => {
  it('cleans the sentence to one capped line', () => {
    expect(sentence('  Tonight\n I will   call my sister ')).toBe('Tonight I will call my sister')
    expect(sentence('x'.repeat(500)).length).toBe(MAX_SENTENCE)
    expect(sentence(null)).toBe('')
  })
  it('names four endings and a thank-you for each, none scolding', () => {
    expect(Object.values(ENDING_KEY).sort()).toEqual(['chose-not', 'nothing-changed', 'smaller', 'tried'])
    for (const k of Object.values(ENDING_KEY) as string[]) expect((RETURN.thanks as Record<string, string>)[k]).toBeTruthy()
    for (const t of Object.values(RETURN.thanks) as string[]) expect(t).not.toMatch(/should|fail|only/i)
  })
  it('needs a line only for "tried"; a smaller move may be blank', () => {
    expect(reportLine('tried', '  ').ok).toBe(false)
    expect(reportLine('smaller', '').ok).toBe(true)
    expect(reportLine('tried', 'I called her').line).toBe('I called her')
  })
  it('picks the card: offer after met, held for a guest, return when signed in, none for a fresh errand', () => {
    expect(barCardFor('met', false)).toBe('offer')
    expect(barCardFor('taken', false)).toBe('held')
    expect(barCardFor('taken', true)).toBe('return')
    expect(barCardFor('tried', true)).toBe('done')
    expect(barCardFor('none', false)).toBeNull()
  })
  it('says plainly that tomorrow needs sign-in and that only the sentence is saved', () => {
    expect(BAR.heldGuest).toMatch(/sign in/)
    expect(BAR.local).toMatch(/Only this sentence/)
  })
})
