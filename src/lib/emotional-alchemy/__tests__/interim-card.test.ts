import { describe, it, expect } from 'vitest'

import { SUBMOVE_META, interimComposerCard } from '../index'

describe('interim composer-card seam', () => {
  it('exposes the five WAVE moves in order', () => {
    expect(SUBMOVE_META.map((m) => m.key)).toEqual(['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up'])
  })

  it('supplies a canonical stance question from MOVES (not invented)', () => {
    expect(interimComposerCard('clean_up')).toEqual({ submove: 'clean_up', stanceQuestion: 'What move is missing?' })
    expect(interimComposerCard('show_up').stanceQuestion).toBe('What shall I create?')
  })
})
