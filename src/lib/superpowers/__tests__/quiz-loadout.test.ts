/**
 * Mapping M1: quiz result → {inner, outer} loadout.
 * Spec: .specify/specs/superpower-system-reconciliation/reconciliation.md
 */
import { describe, it, expect } from 'vitest'
import { quizResultToLoadout } from '../quiz-loadout'
import type { QuizResult } from '../quiz/types'

function result(over: Partial<QuizResult>): QuizResult {
  return {
    ranked: [],
    primary: 'strategist',
    secondary: 'connector',
    margin: 0.2,
    confident: true,
    orientation: null,
    ...over,
  }
}

describe('quizResultToLoadout (M1)', () => {
  it('internal: leads inner with the primary superpower', () => {
    expect(quizResultToLoadout(result({ orientation: 'internal' }))).toEqual({
      inner: 'strategist',
      outer: 'connector',
    })
  })

  it('external: leads outer with the primary superpower', () => {
    expect(quizResultToLoadout(result({ orientation: 'external' }))).toEqual({
      inner: 'connector',
      outer: 'strategist',
    })
  })

  it('null orientation defaults to the internal reading', () => {
    expect(quizResultToLoadout(result({ orientation: null }))).toEqual({
      inner: 'strategist',
      outer: 'connector',
    })
  })

  it('accepts the routing shape (superpower instead of primary)', () => {
    const routing = {
      superpower: 'coach' as const,
      secondary: 'disruptor' as const,
      orientation: 'external' as const,
      margin: 0.1,
      confident: false,
      ranked: [],
    }
    expect(quizResultToLoadout(routing)).toEqual({ inner: 'disruptor', outer: 'coach' })
  })

  it('throws when the ranking is incomplete', () => {
    // @ts-expect-error — deliberately malformed
    expect(() => quizResultToLoadout({ orientation: null })).toThrow()
  })
})
