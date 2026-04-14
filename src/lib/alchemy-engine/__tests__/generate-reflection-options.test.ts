/**
 * Generate Reflection Options — Unit Tests
 *
 * Tests for the generateReflectionOptions server action endpoint.
 *
 * Since generateReflectionOptions is a server action requiring auth + DB,
 * these tests validate the pure logic components it orchestrates:
 *   1. Aggregation → generation → validation pipeline
 *   2. Static (non-AI) path produces valid, validated suggestions
 *   3. Validation catches invalid completion sets
 *   4. Result type contract matches expected shape
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/generate-reflection-options.test.ts
 */

import assert from 'node:assert'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import { buildStaticCompletionSuggestions } from '../reflection-generation'
import { buildReflectionContextFromData } from '../reflection-aggregator'
import {
  validateCompletionSetWithBarConformance,
  validateCompletionSet,
} from '../reflection-validation'
import type { IntakePhaseData, ActionPhaseData, ReflectionContext } from '../reflection-aggregator'
import type { ReflectionCompletionSet } from '../reflection-generation'

// ═══════════════════════════════════════════════════════════════════════════
// Test fixtures
// ═══════════════════════════════════════════════════════════════════════════

function makeIntakeData(channel: EmotionalChannel = 'Fear'): IntakePhaseData {
  return {
    barId: 'bar-intake-test',
    title: `Wake Up — ${channel} Intake`,
    content: 'I have been avoiding a difficult conversation with my partner.',
    channel: channel.toLowerCase(),
    regulationFrom: 'dissatisfied',
    regulationTo: 'neutral',
    createdAt: new Date('2026-04-07T10:00:00Z'),
  }
}

function makeActionData(channel: EmotionalChannel = 'Fear'): ActionPhaseData {
  return {
    barId: 'bar-action-test',
    title: 'Issue Challenge — Fear Action',
    content: 'I commit to having that conversation this week. No more hiding.',
    moveId: 'issue_challenge',
    moveTitle: 'Issue Challenge',
    canonicalMoveId: 'fire_transcend',
    energyDelta: 2,
    moveNarrative: 'Anger → boundary honored',
    channel: channel.toLowerCase(),
    regulationFrom: 'neutral',
    regulationTo: 'neutral',
    createdAt: new Date('2026-04-07T10:05:00Z'),
  }
}

function makeContext(channel: EmotionalChannel = 'Fear'): ReflectionContext {
  return buildReflectionContextFromData({
    playerId: 'player-test-options',
    channel,
    intake: makeIntakeData(channel),
    action: makeActionData(channel),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${err instanceof Error ? err.message : String(err)}`)
    failed++
  }
}

// ---------------------------------------------------------------------------
// Pipeline: aggregation → generation → validation (non-AI path)
// ---------------------------------------------------------------------------

console.log('\n=== generateReflectionOptions pipeline (non-AI path) ===')

test('static generation produces 3 suggestions for each channel', () => {
  const channels: EmotionalChannel[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']
  for (const channel of channels) {
    const ctx = makeContext(channel)
    const completions = buildStaticCompletionSuggestions(ctx)
    assert.strictEqual(completions.suggestions.length, 3, `${channel}: expected 3 suggestions`)
    assert.strictEqual(completions.source, 'static', `${channel}: source should be 'static'`)
  }
})

test('static suggestions pass full validation with BAR conformance', () => {
  const channels: EmotionalChannel[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']
  for (const channel of channels) {
    const ctx = makeContext(channel)
    const completions = buildStaticCompletionSuggestions(ctx)
    const result = validateCompletionSetWithBarConformance(completions, channel)
    assert.ok(
      result.valid,
      `${channel}: validation failed: ${result.issues.map(i => `[${i.code}] ${i.message}`).join('; ')}`,
    )
  }
})

test('context summary carries correct provenance', () => {
  const ctx = makeContext('Anger')
  const completions = buildStaticCompletionSuggestions(ctx)
  assert.strictEqual(completions.contextSummary.playerId, 'player-test-options')
  assert.strictEqual(completions.contextSummary.channel, 'Anger')
  assert.strictEqual(completions.contextSummary.face, 'challenger')
  assert.strictEqual(completions.contextSummary.waveMove, 'wakeUp')
  assert.strictEqual(completions.contextSummary.intakeBarId, 'bar-intake-test')
  assert.strictEqual(completions.contextSummary.actionBarId, 'bar-action-test')
})

// ---------------------------------------------------------------------------
// Suggestion shape + channel typing
// ---------------------------------------------------------------------------

console.log('\n=== Suggestion shape and channel typing ===')

test('3 suggestions have correct keys in canonical order', () => {
  const completions = buildStaticCompletionSuggestions(makeContext('Joy'))
  const keys = completions.suggestions.map(s => s.key)
  assert.deepStrictEqual(keys, ['channel_aligned', 'adjacent', 'cross'])
})

test('3 suggestions have correct framings', () => {
  const completions = buildStaticCompletionSuggestions(makeContext('Joy'))
  const framings = completions.suggestions.map(s => s.framing)
  assert.deepStrictEqual(framings, ['direct', 'generative', 'challenging'])
})

test('channel_aligned suggestion uses primary channel', () => {
  const channel: EmotionalChannel = 'Sadness'
  const completions = buildStaticCompletionSuggestions(makeContext(channel))
  const aligned = completions.suggestions[0]
  assert.strictEqual(aligned.channel, channel)
  assert.strictEqual(aligned.key, 'channel_aligned')
  assert.strictEqual(aligned.framing, 'direct')
})

test('adjacent suggestion uses shēng neighbor channel', () => {
  // Sadness (Water) → shēng neighbor is Joy (Wood)
  const completions = buildStaticCompletionSuggestions(makeContext('Sadness'))
  const adjacent = completions.suggestions[1]
  assert.strictEqual(adjacent.channel, 'Joy')
  assert.strictEqual(adjacent.key, 'adjacent')
  assert.strictEqual(adjacent.framing, 'generative')
})

test('cross suggestion uses kè neighbor channel', () => {
  // Sadness (Water) → kè neighbor is Anger (Fire)
  const completions = buildStaticCompletionSuggestions(makeContext('Sadness'))
  const cross = completions.suggestions[2]
  assert.strictEqual(cross.channel, 'Anger')
  assert.strictEqual(cross.key, 'cross')
  assert.strictEqual(cross.framing, 'challenging')
})

test('all 3 suggestions have unique channels', () => {
  const channels: EmotionalChannel[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']
  for (const channel of channels) {
    const completions = buildStaticCompletionSuggestions(makeContext(channel))
    const suggestionChannels = completions.suggestions.map(s => s.channel)
    const unique = new Set(suggestionChannels)
    assert.strictEqual(unique.size, 3, `${channel}: expected 3 unique channels, got ${unique.size}`)
  }
})

// ---------------------------------------------------------------------------
// Suggestion content references player's actual data
// ---------------------------------------------------------------------------

console.log('\n=== Content references player data (behavior over self-report) ===')

test('channel_aligned body references intake content', () => {
  const ctx = makeContext('Fear')
  const completions = buildStaticCompletionSuggestions(ctx)
  const body = completions.suggestions[0].body
  // The body should reference the truncated intake content
  assert.ok(body.includes('avoiding'), `Body should reference intake content, got: ${body}`)
})

test('all suggestions have non-empty title and body', () => {
  const completions = buildStaticCompletionSuggestions(makeContext('Anger'))
  for (const s of completions.suggestions) {
    assert.ok(s.title.length >= 3, `Title too short: "${s.title}"`)
    assert.ok(s.body.length >= 20, `Body too short: "${s.body}"`)
  }
})

// ---------------------------------------------------------------------------
// Validation catches invalid sets
// ---------------------------------------------------------------------------

console.log('\n=== Validation catches invalid completion sets ===')

test('validation rejects set with missing suggestions', () => {
  const result = validateCompletionSet({ suggestions: [], source: 'static', contextSummary: {} })
  assert.ok(!result.valid, 'Should reject empty suggestions array')
})

test('validation rejects set with wrong channel for adjacent', () => {
  const ctx = makeContext('Fear')
  const completions = buildStaticCompletionSuggestions(ctx)
  // Tamper: change adjacent channel to wrong value
  const tampered = {
    ...completions,
    suggestions: [
      completions.suggestions[0],
      { ...completions.suggestions[1], channel: 'Fear' as EmotionalChannel }, // wrong: should be Sadness
      completions.suggestions[2],
    ] as ReflectionCompletionSet['suggestions'],
  }
  const result = validateCompletionSet(tampered, 'Fear')
  assert.ok(!result.valid, 'Should reject wrong adjacent channel')
  const codes = result.issues.map(i => i.code)
  assert.ok(
    codes.includes('WUXING_SHENG_MISMATCH') || codes.includes('DUPLICATE_CHANNELS'),
    `Expected Wuxing or duplicate channel error, got: ${codes.join(', ')}`,
  )
})

// ---------------------------------------------------------------------------
// Result type contract
// ---------------------------------------------------------------------------

console.log('\n=== Result type contract ===')

test('successful pipeline returns completions + narrativeSummary + channel', () => {
  const ctx = makeContext('Joy')
  const completions = buildStaticCompletionSuggestions(ctx)
  const validation = validateCompletionSetWithBarConformance(completions, 'Joy')

  // Simulate the successful result shape
  const result = {
    success: true as const,
    completions,
    narrativeSummary: ctx.narrativeSummary,
    channel: ctx.channel,
  }

  assert.ok(result.success)
  assert.ok(result.completions)
  assert.strictEqual(result.completions.suggestions.length, 3)
  assert.ok(result.narrativeSummary.length > 0)
  assert.strictEqual(result.channel, 'Joy')
  assert.ok(validation.valid)
})

test('narrative summary includes arc context', () => {
  const ctx = makeContext('Anger')
  assert.ok(ctx.narrativeSummary.includes('Anger'), 'Should include channel')
  assert.ok(ctx.narrativeSummary.includes('challenger'), 'Should include face')
  assert.ok(ctx.narrativeSummary.includes('Intake'), 'Should include intake section')
  assert.ok(ctx.narrativeSummary.includes('Action'), 'Should include action section')
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total`)
if (failed > 0) process.exit(1)
