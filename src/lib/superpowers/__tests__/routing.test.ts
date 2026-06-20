/**
 * Quiz → superpower routing mapping (campaign Phase 2 FR5 / quiz-design FR7).
 * Run: npx tsx src/lib/superpowers/__tests__/routing.test.ts
 */
import assert from 'node:assert/strict'
import { SUPERPOWERS, type Superpower } from '../types'
import { QUIZ_ITEMS } from '../quiz/items'
import { scoreQuiz } from '../quiz/score'
import { quizResultToRouting, resolveSuperpowerIntake } from '../routing'
import type { QuizAnswer } from '../quiz/types'

function answersFor(sp: Superpower): QuizAnswer[] {
  const out: QuizAnswer[] = []
  for (const item of QUIZ_ITEMS) {
    let best: { id: string; w: number } | null = null
    for (const o of item.options) {
      const w = o.weights[sp] ?? 0
      if (w > 0 && (best === null || w > best.w)) best = { id: o.id, w }
    }
    if (best) out.push({ itemId: item.id, optionId: best.id })
  }
  return out
}

function testMappingMirrorsScore() {
  const result = scoreQuiz(answersFor('alchemist'), 'internal')
  const routing = quizResultToRouting(result)
  assert.equal(routing.superpower, result.primary)
  assert.equal(routing.secondary, result.secondary)
  assert.equal(routing.orientation, 'internal')
  assert.equal(routing.margin, result.margin)
  assert.equal(routing.confident, result.confident)
  assert.equal(routing.ranked.length, SUPERPOWERS.length)
}

function testOrientationNullWhenUnanswered() {
  const routing = quizResultToRouting(scoreQuiz(answersFor('coach')))
  assert.equal(routing.orientation, null)
}

function testResolveProducesRoutingAndCopy() {
  const outcome = resolveSuperpowerIntake(answersFor('disruptor'), 'external')
  assert.equal(outcome.routing.superpower, 'disruptor')
  assert.equal(outcome.routing.orientation, 'external')
  assert.equal(outcome.copy.primary.superpower, 'disruptor')
  assert.equal(outcome.copy.secondary.superpower, outcome.routing.secondary)
  assert.ok(outcome.copy.framing.length > 0, 'reveal framing present')
  assert.ok(outcome.copy.primary.shadow.length > 0, 'primary shadow present')
}

function testEveryPrimaryReachableThroughResolve() {
  for (const sp of SUPERPOWERS) {
    const outcome = resolveSuperpowerIntake(answersFor(sp))
    assert.equal(outcome.routing.superpower, sp, `${sp} routes as primary`)
  }
}

const tests = [
  testMappingMirrorsScore,
  testOrientationNullWhenUnanswered,
  testResolveProducesRoutingAndCopy,
  testEveryPrimaryReachableThroughResolve,
]

let passed = 0
for (const t of tests) {
  t()
  passed += 1
}
console.log(`✓ superpower routing: ${passed}/${tests.length} tests passed`)
