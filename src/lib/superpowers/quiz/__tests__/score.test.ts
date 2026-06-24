/**
 * Superpower Quiz scorer + item-bank tests (superpower-quiz-design Phase 1, FR4).
 * Run: npx tsx src/lib/superpowers/quiz/__tests__/score.test.ts
 */
import assert from 'node:assert/strict'
import { SUPERPOWERS, type Superpower } from '../../types'
import { QUIZ_ITEMS, ORIENTATION_ITEM } from '../items'
import { scoreQuiz, CONFIDENCE_THRESHOLD, TIE_ORDER } from '../score'
import type { QuizAnswer } from '../types'

/** Pick the option that MAXIMIZES `sp` in every item where one exists. */
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

function testItemBankStructure() {
  const ids = new Set<string>()
  for (const item of QUIZ_ITEMS) {
    assert.ok(item.options.length >= 2, `${item.id} has >= 2 options`)
    for (const opt of item.options) {
      assert.ok(!ids.has(opt.id), `option id unique: ${opt.id}`)
      ids.add(opt.id)
      const keys = Object.keys(opt.weights) as Superpower[]
      assert.ok(keys.length > 0, `${opt.id} has weights`)
      for (const k of keys) {
        assert.ok(SUPERPOWERS.includes(k), `${opt.id} weight key valid: ${k}`)
        assert.ok((opt.weights[k] ?? 0) > 0, `${opt.id} weight positive`)
      }
    }
  }
  // orientation item is well-formed and separate from scoring
  assert.equal(ORIENTATION_ITEM.options.length, 2)
  assert.deepEqual(
    ORIENTATION_ITEM.options.map((o) => o.orientation).sort(),
    ['external', 'internal'],
  )
}

function testEverySuperpowerGetsEnoughSignal() {
  // ≥3 primary appearances per superpower (research floor ≥3–4).
  const count = Object.fromEntries(SUPERPOWERS.map((s) => [s, 0])) as Record<Superpower, number>
  for (const item of QUIZ_ITEMS) {
    for (const opt of item.options) {
      for (const sp of SUPERPOWERS) if ((opt.weights[sp] ?? 0) >= 2) count[sp] += 1
    }
  }
  for (const sp of SUPERPOWERS) {
    assert.ok(count[sp] >= 3, `${sp} has >= 3 signals (has ${count[sp]})`)
  }
}

function testDeterminism() {
  const a = answersFor('strategist')
  const r1 = scoreQuiz(a, 'internal')
  const r2 = scoreQuiz(a, 'internal')
  assert.deepEqual(r1, r2, 'same input → identical result')
}

function testEverySuperpowerReachableAsPrimary() {
  for (const sp of SUPERPOWERS) {
    const r = scoreQuiz(answersFor(sp))
    assert.equal(r.primary, sp, `${sp} reachable as primary`)
    assert.equal(r.ranked.length, SUPERPOWERS.length, 'all seven ranked')
    assert.equal(r.ranked[0].pct, 1, `${sp} maxes percent-of-max`)
    assert.notEqual(r.primary, r.secondary, 'primary ≠ secondary')
  }
}

function testEmptyAnswersUseTieOrderDeterministically() {
  const r = scoreQuiz([])
  assert.equal(r.margin, 0, 'all-zero → margin 0')
  assert.equal(r.confident, false, 'all-zero → not confident')
  assert.equal(r.primary, TIE_ORDER[0], 'tie → TIE_ORDER[0] primary')
  assert.equal(r.secondary, TIE_ORDER[1], 'tie → TIE_ORDER[1] secondary')
  // pure tie ⇒ ranking equals TIE_ORDER exactly
  assert.deepEqual(r.ranked.map((x) => x.superpower), [...TIE_ORDER])
}

function testNearTieNotConfident() {
  // Injected mini-bank: 20 items, each offering connector/storyteller/strategist.
  // Answer connector×8, storyteller×7, strategist×5 → margin = (8−7)/20 = 0.05 < θ.
  const mini = Array.from({ length: 20 }, (_, i) => ({
    id: `m${i}`,
    situation: 's',
    options: [
      { id: `m${i}-con`, label: 'c', weights: { connector: 2 } },
      { id: `m${i}-sto`, label: 's', weights: { storyteller: 2 } },
      { id: `m${i}-str`, label: 't', weights: { strategist: 2 } },
    ],
  }))
  const answers: QuizAnswer[] = mini.map((item, i) => ({
    itemId: item.id,
    optionId: i < 8 ? `${item.id}-con` : i < 15 ? `${item.id}-sto` : `${item.id}-str`,
  }))
  const r = scoreQuiz(answers, null, mini)
  assert.equal(r.primary, 'connector', 'connector edges it')
  assert.equal(r.secondary, 'storyteller', 'storyteller second')
  assert.ok(Math.abs(r.margin - 0.05) < 1e-9, `margin ≈ 0.05 (got ${r.margin})`)
  assert.equal(r.confident, false, 'near-tie below threshold → not confident')
}

function testClearWinnerIsConfident() {
  const r = scoreQuiz(answersFor('alchemist'))
  assert.equal(r.primary, 'alchemist')
  assert.ok(r.margin >= CONFIDENCE_THRESHOLD, `clear winner confident (margin ${r.margin})`)
  assert.equal(r.confident, true)
}

function testNormalizationAcrossUnequalItemCounts() {
  // disruptor & coach appear in different numbers of items; picking each
  // everywhere should still yield pct 1.0 for that type (percent-of-max).
  for (const sp of ['disruptor', 'coach', 'escape_artist'] as Superpower[]) {
    const top = scoreQuiz(answersFor(sp)).ranked.find((x) => x.superpower === sp)!
    assert.equal(top.pct, 1, `${sp} normalizes to 1.0 regardless of item count`)
  }
}

function testDuplicateAnswersDoNotExceedMax() {
  const a = answersFor('coach')
  const dup = [...a, ...a] // answer everything twice
  const r = scoreQuiz(dup)
  const coach = r.ranked.find((x) => x.superpower === 'coach')!
  assert.ok(coach.pct <= 1, 'dedupe keeps pct ≤ 1')
}

function testOrientationPassthrough() {
  assert.equal(scoreQuiz([], 'external').orientation, 'external')
  assert.equal(scoreQuiz([]).orientation, null)
}

const tests = [
  testItemBankStructure,
  testEverySuperpowerGetsEnoughSignal,
  testDeterminism,
  testEverySuperpowerReachableAsPrimary,
  testEmptyAnswersUseTieOrderDeterministically,
  testNearTieNotConfident,
  testClearWinnerIsConfident,
  testNormalizationAcrossUnequalItemCounts,
  testDuplicateAnswersDoNotExceedMax,
  testOrientationPassthrough,
]

let passed = 0
for (const t of tests) {
  t()
  passed += 1
}
console.log(`✓ superpower quiz scorer: ${passed}/${tests.length} tests passed`)
