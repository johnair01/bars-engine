/**
 * Reflection Validation Layer — Unit Tests
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/reflection-validation.test.ts
 *
 * Tests the validation layer that ensures generated suggestions conform to
 * channel-typed BAR requirements and epiphany artifact structure.
 *
 * Key invariants tested:
 *   - Individual suggestion shape validation (Zod schema)
 *   - Key↔framing consistency (channel_aligned=direct, adjacent=generative, cross=challenging)
 *   - Channel↔element consistency (Wuxing mapping)
 *   - Completion set structural invariants (3 unique keys, 3 unique channels)
 *   - Wuxing cycle compliance (shēng/kè neighbor channels)
 *   - BAR conformance (isEpiphany: true, correct regulation, nation matching)
 *   - Sanitization of malformed AI output
 *   - All 5 channels produce valid suggestions through full pipeline
 *
 * Non-AI first-class: tests exercise static suggestion generation through validation.
 */

import assert from 'node:assert'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import {
  validateSuggestion,
  validateCompletionSet,
  validateSuggestionBarConformance,
  validateCompletionSetWithBarConformance,
  assertValidSuggestion,
  assertValidCompletionSet,
  sanitizeSuggestion,
  explainValidation,
  isValidChannel,
  isValidSuggestionKey,
  isValidFraming,
  KEY_FRAMING_MAP,
  CHANNEL_ELEMENT_MAP,
  SHENG_NEIGHBOR,
  KE_NEIGHBOR,
  VALID_CHANNELS,
  type ValidationResult,
} from '../reflection-validation'
import { buildStaticCompletionSuggestions, type ReflectionCompletionSuggestion, type ReflectionCompletionSet } from '../reflection-generation'
import type { ReflectionContext } from '../reflection-aggregator'

// ═══════════════════════════════════════════════════════════════════════════
// Test helpers
// ═══════════════════════════════════════════════════════════════════════════

let passed = 0
let failed = 0

function ok(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`)
    failed++
  } else {
    passed++
  }
}

function eq<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    console.error(`  FAIL: ${message} — expected '${String(expected)}', got '${String(actual)}'`)
    failed++
  } else {
    passed++
  }
}

function hasIssueCode(result: ValidationResult, code: string): boolean {
  return result.issues.some((i) => i.code === code)
}

// ═══════════════════════════════════════════════════════════════════════════
// Fixture builders
// ═══════════════════════════════════════════════════════════════════════════

function makeValidSuggestion(
  key: 'channel_aligned' | 'adjacent' | 'cross' = 'channel_aligned',
  channel: EmotionalChannel = 'Anger',
): ReflectionCompletionSuggestion {
  return {
    key,
    label: `${CHANNEL_ELEMENT_MAP[channel]} Insight — test`,
    channel,
    element: CHANNEL_ELEMENT_MAP[channel],
    title: `${channel} Epiphany — Issue Challenge (Wake Up)`,
    body: 'You named your frustration and it turned into something real. The boundary you avoided was the boundary you needed.',
    framing: KEY_FRAMING_MAP[key],
  }
}

function makeReflectionContext(channel: EmotionalChannel = 'Anger'): ReflectionContext {
  return {
    playerId: 'player-test-1',
    channel,
    face: 'challenger',
    waveMove: 'wakeUp',
    currentPhase: 'reflection',
    arcStartedAt: new Date('2026-04-07T10:00:00Z'),
    regulationTrajectory: {
      intake: { from: 'dissatisfied', to: 'neutral' },
      action: { from: 'neutral', to: 'neutral' },
      reflection: { from: 'neutral', to: 'satisfied' },
    },
    intake: {
      barId: 'bar-intake-1',
      title: 'Wake Up — Anger Intake',
      content: 'I am frustrated with how my team ignores my boundaries.',
      channel: channel.toLowerCase(),
      regulationFrom: 'dissatisfied',
      regulationTo: 'neutral',
      createdAt: new Date('2026-04-07T10:05:00Z'),
    },
    action: {
      barId: 'bar-action-1',
      title: 'Issue Challenge — Anger Action',
      content: 'I will name the boundary that keeps getting crossed.',
      moveId: 'issue_challenge',
      moveTitle: 'Issue Challenge',
      canonicalMoveId: 'fire_transcend',
      energyDelta: 2,
      moveNarrative: 'Anger → boundary honored',
      channel: channel.toLowerCase(),
      regulationFrom: 'neutral',
      regulationTo: 'neutral',
      createdAt: new Date('2026-04-07T10:15:00Z'),
    },
    narrativeSummary: 'Test narrative summary',
    reflectionPrompts: [
      { key: 'naming_impact', text: 'What shifted?', sourcePhase: 'both' },
      { key: 'action_evaluation', text: 'Did it land?', sourcePhase: 'action' },
      { key: 'epiphany', text: 'What do you see now?', sourcePhase: 'both' },
    ],
  }
}

function makeValidCompletionSet(
  primaryChannel: EmotionalChannel = 'Anger',
): ReflectionCompletionSet {
  const adjacent = SHENG_NEIGHBOR[primaryChannel]
  const cross = KE_NEIGHBOR[primaryChannel]

  return {
    suggestions: [
      makeValidSuggestion('channel_aligned', primaryChannel),
      makeValidSuggestion('adjacent', adjacent),
      makeValidSuggestion('cross', cross),
    ],
    source: 'static',
    contextSummary: {
      playerId: 'player-test-1',
      channel: primaryChannel,
      face: 'challenger',
      waveMove: 'wakeUp',
      intakeBarId: 'bar-intake-1',
      actionBarId: 'bar-action-1',
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Type guard tests
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Type guards ---')

ok(isValidChannel('Fear'), 'Fear is valid channel')
ok(isValidChannel('Anger'), 'Anger is valid channel')
ok(isValidChannel('Sadness'), 'Sadness is valid channel')
ok(isValidChannel('Joy'), 'Joy is valid channel')
ok(isValidChannel('Neutrality'), 'Neutrality is valid channel')
ok(!isValidChannel('fear'), 'lowercase "fear" invalid')
ok(!isValidChannel(''), 'empty string invalid')
ok(!isValidChannel(null), 'null invalid')
ok(!isValidChannel(42), 'number invalid')

ok(isValidSuggestionKey('channel_aligned'), 'channel_aligned is valid key')
ok(isValidSuggestionKey('adjacent'), 'adjacent is valid key')
ok(isValidSuggestionKey('cross'), 'cross is valid key')
ok(!isValidSuggestionKey('other'), '"other" invalid key')

ok(isValidFraming('direct'), 'direct is valid framing')
ok(isValidFraming('generative'), 'generative is valid framing')
ok(isValidFraming('challenging'), 'challenging is valid framing')
ok(!isValidFraming('neutral'), '"neutral" invalid framing')

// ═══════════════════════════════════════════════════════════════════════════
// 2. Individual suggestion validation — valid cases
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Individual suggestion validation (valid) ---')

{
  const result = validateSuggestion(makeValidSuggestion('channel_aligned', 'Anger'))
  ok(result.valid, 'Valid channel_aligned/Anger suggestion passes')
  eq(result.issues.length, 0, 'No issues for valid suggestion')
}

{
  const result = validateSuggestion(makeValidSuggestion('adjacent', 'Neutrality'))
  ok(result.valid, 'Valid adjacent/Neutrality suggestion passes')
}

{
  const result = validateSuggestion(makeValidSuggestion('cross', 'Fear'))
  ok(result.valid, 'Valid cross/Fear suggestion passes')
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Individual suggestion validation — invalid cases
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Individual suggestion validation (invalid) ---')

// Missing fields
{
  const result = validateSuggestion({})
  ok(!result.valid, 'Empty object fails validation')
  ok(result.issues.length > 0, 'Has issues for empty object')
  ok(hasIssueCode(result, 'SCHEMA_VIOLATION'), 'Reports schema violations')
}

// Key↔framing mismatch
{
  const bad = { ...makeValidSuggestion('channel_aligned', 'Anger'), framing: 'generative' as const }
  const result = validateSuggestion(bad)
  ok(!result.valid, 'key=channel_aligned with framing=generative fails')
  ok(hasIssueCode(result, 'KEY_FRAMING_MISMATCH'), 'Reports KEY_FRAMING_MISMATCH')
}

{
  const bad = { ...makeValidSuggestion('adjacent', 'Anger'), framing: 'direct' as const }
  const result = validateSuggestion(bad)
  ok(!result.valid, 'key=adjacent with framing=direct fails')
  ok(hasIssueCode(result, 'KEY_FRAMING_MISMATCH'), 'Reports KEY_FRAMING_MISMATCH for adjacent')
}

{
  const bad = { ...makeValidSuggestion('cross', 'Anger'), framing: 'generative' as const }
  const result = validateSuggestion(bad)
  ok(!result.valid, 'key=cross with framing=generative fails')
  ok(hasIssueCode(result, 'KEY_FRAMING_MISMATCH'), 'Reports KEY_FRAMING_MISMATCH for cross')
}

// Channel↔element mismatch
{
  const bad = { ...makeValidSuggestion('channel_aligned', 'Anger'), element: 'Water' }
  const result = validateSuggestion(bad)
  ok(!result.valid, 'Anger with element=Water fails')
  ok(hasIssueCode(result, 'CHANNEL_ELEMENT_MISMATCH'), 'Reports CHANNEL_ELEMENT_MISMATCH')
}

{
  const bad = { ...makeValidSuggestion('channel_aligned', 'Fear'), element: 'Wood' }
  const result = validateSuggestion(bad)
  ok(!result.valid, 'Fear with element=Wood fails')
  ok(hasIssueCode(result, 'CHANNEL_ELEMENT_MISMATCH'), 'Reports CHANNEL_ELEMENT_MISMATCH for Fear')
}

// Body too short
{
  const bad = { ...makeValidSuggestion('channel_aligned', 'Anger'), body: 'too short' }
  const result = validateSuggestion(bad)
  ok(!result.valid, 'Body under 20 chars fails')
  ok(hasIssueCode(result, 'SCHEMA_VIOLATION'), 'Short body is a schema violation')
}

// Title too short
{
  const bad = { ...makeValidSuggestion('channel_aligned', 'Anger'), title: 'ab' }
  const result = validateSuggestion(bad)
  ok(!result.valid, 'Title under 3 chars fails')
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Completion set validation — valid cases
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Completion set validation (valid) ---')

{
  const set = makeValidCompletionSet('Anger')
  const result = validateCompletionSet(set, 'Anger')
  ok(result.valid, 'Valid Anger completion set passes')
  eq(result.issues.length, 0, 'No issues for valid set')
}

// All 5 channels produce valid sets
for (const channel of VALID_CHANNELS) {
  const set = makeValidCompletionSet(channel)
  const result = validateCompletionSet(set, channel)
  ok(result.valid, `${channel}: valid completion set passes`)
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Completion set validation — invalid cases
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Completion set validation (invalid) ---')

// Duplicate keys
{
  const set = makeValidCompletionSet('Anger')
  set.suggestions[1] = { ...set.suggestions[1], key: 'channel_aligned' }
  const result = validateCompletionSet(set)
  ok(!result.valid, 'Duplicate keys fails')
  ok(hasIssueCode(result, 'DUPLICATE_KEYS'), 'Reports DUPLICATE_KEYS')
}

// Duplicate channels
{
  const set = makeValidCompletionSet('Anger')
  set.suggestions[1] = { ...set.suggestions[1], channel: 'Anger', element: 'Fire' }
  const result = validateCompletionSet(set)
  ok(!result.valid, 'Duplicate channels fails')
  ok(hasIssueCode(result, 'DUPLICATE_CHANNELS'), 'Reports DUPLICATE_CHANNELS')
}

// Wrong key order
{
  const set = makeValidCompletionSet('Anger')
  const [a, b, c] = set.suggestions
  set.suggestions = [b, a, c] // adjacent, channel_aligned, cross
  const result = validateCompletionSet(set)
  ok(!result.valid, 'Wrong key order fails')
  ok(hasIssueCode(result, 'KEY_ORDER'), 'Reports KEY_ORDER')
}

// Wuxing shēng mismatch
{
  const set = makeValidCompletionSet('Anger')
  // Anger shēng neighbor should be Neutrality, not Sadness
  set.suggestions[1] = makeValidSuggestion('adjacent', 'Sadness')
  const result = validateCompletionSet(set, 'Anger')
  ok(!result.valid, 'Wrong shēng neighbor fails')
  ok(hasIssueCode(result, 'WUXING_SHENG_MISMATCH'), 'Reports WUXING_SHENG_MISMATCH')
}

// Wuxing kè mismatch
{
  const set = makeValidCompletionSet('Anger')
  // Anger kè neighbor should be Fear, not Joy
  set.suggestions[2] = makeValidSuggestion('cross', 'Joy')
  const result = validateCompletionSet(set, 'Anger')
  ok(!result.valid, 'Wrong kè neighbor fails')
  ok(hasIssueCode(result, 'WUXING_KE_MISMATCH'), 'Reports WUXING_KE_MISMATCH')
}

// Channel-aligned must match primary
{
  const set = makeValidCompletionSet('Anger')
  set.suggestions[0] = makeValidSuggestion('channel_aligned', 'Joy')
  const result = validateCompletionSet(set, 'Anger')
  ok(!result.valid, 'channel_aligned != primary fails')
  ok(hasIssueCode(result, 'WUXING_ALIGNED_MISMATCH'), 'Reports WUXING_ALIGNED_MISMATCH')
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. BAR conformance validation
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- BAR conformance validation ---')

// Valid suggestion produces conformant BAR
{
  const suggestion = makeValidSuggestion('channel_aligned', 'Anger')
  const result = validateSuggestionBarConformance(suggestion, {
    playerId: 'player-1',
    intakeBarId: 'intake-1',
    actionBarId: 'action-1',
  })
  ok(result.valid, 'Valid suggestion produces conformant BAR')
  eq(result.issues.length, 0, 'No issues for conformant BAR')
}

// All 5 channels produce conformant BARs
for (const channel of VALID_CHANNELS) {
  const suggestion = makeValidSuggestion('channel_aligned', channel)
  const result = validateSuggestionBarConformance(suggestion)
  ok(result.valid, `${channel}: suggestion produces conformant BAR`)
}

// Adjacent and cross suggestions also produce conformant BARs
{
  const adj = makeValidSuggestion('adjacent', 'Neutrality')
  const adjResult = validateSuggestionBarConformance(adj)
  ok(adjResult.valid, 'Adjacent suggestion produces conformant BAR')

  const cross = makeValidSuggestion('cross', 'Fear')
  const crossResult = validateSuggestionBarConformance(cross)
  ok(crossResult.valid, 'Cross suggestion produces conformant BAR')
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. Full pipeline: static suggestions through validation
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Full pipeline: static suggestions through validation ---')

for (const channel of VALID_CHANNELS) {
  const ctx = makeReflectionContext(channel)
  const completionSet = buildStaticCompletionSuggestions(ctx)

  // Structural validation with Wuxing compliance
  const structuralResult = validateCompletionSet(completionSet, channel)
  ok(structuralResult.valid, `${channel}: static suggestions pass structural validation`)

  // BAR conformance
  const fullResult = validateCompletionSetWithBarConformance(completionSet, channel)
  ok(fullResult.valid, `${channel}: static suggestions pass full pipeline validation`)

  if (!fullResult.valid) {
    console.error(`  Issues for ${channel}:`, fullResult.issues)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. assertValidSuggestion throws on invalid
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- assertValidSuggestion throws ---')

{
  // Valid: should not throw
  let threw = false
  try {
    assertValidSuggestion(makeValidSuggestion('channel_aligned', 'Anger'))
  } catch {
    threw = true
  }
  ok(!threw, 'assertValidSuggestion does not throw for valid suggestion')
}

{
  // Invalid: should throw
  let threw = false
  try {
    assertValidSuggestion({})
  } catch (e) {
    threw = true
    ok(e instanceof Error, 'Throws an Error')
    ok((e as Error).message.includes('SCHEMA_VIOLATION'), 'Error message includes violation code')
  }
  ok(threw, 'assertValidSuggestion throws for empty object')
}

{
  // Invalid with context: error message includes context
  let threw = false
  try {
    assertValidSuggestion({}, 'completeReflection')
  } catch (e) {
    threw = true
    ok((e as Error).message.includes('completeReflection'), 'Error message includes context')
  }
  ok(threw, 'assertValidSuggestion throws with context prefix')
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. assertValidCompletionSet throws on invalid
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- assertValidCompletionSet throws ---')

{
  // Valid: should not throw
  let threw = false
  try {
    assertValidCompletionSet(makeValidCompletionSet('Anger'), 'Anger')
  } catch {
    threw = true
  }
  ok(!threw, 'assertValidCompletionSet does not throw for valid set')
}

{
  // Invalid: should throw
  let threw = false
  try {
    assertValidCompletionSet({})
  } catch (e) {
    threw = true
    ok(e instanceof Error, 'Throws an Error for invalid set')
  }
  ok(threw, 'assertValidCompletionSet throws for empty object')
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. Sanitization
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Sanitization ---')

// Sanitize fixes channel↔element mismatch
{
  const raw = {
    key: 'channel_aligned' as const,
    label: 'Test',
    channel: 'Anger' as EmotionalChannel,
    element: 'Water', // wrong!
    title: 'Test Title',
    body: 'This is a test body that is long enough to pass validation.',
    framing: 'generative' as const, // wrong!
  }
  const sanitized = sanitizeSuggestion(raw)
  eq(sanitized.element, 'Fire', 'Sanitize fixes element to Fire for Anger')
  eq(sanitized.framing, 'direct', 'Sanitize fixes framing to direct for channel_aligned')
}

// Sanitize trims whitespace
{
  const sanitized = sanitizeSuggestion({
    key: 'adjacent',
    channel: 'Fear',
    title: '  Trimmed Title  ',
    body: '  This is a body with extra whitespace that should be trimmed.  ',
    label: '  Label  ',
    element: 'wrong',
    framing: 'wrong' as any,
  })
  eq(sanitized.title, 'Trimmed Title', 'Title is trimmed')
  ok(!sanitized.body.startsWith(' '), 'Body leading whitespace trimmed')
  ok(!sanitized.body.endsWith(' '), 'Body trailing whitespace trimmed')
  eq(sanitized.element, 'Metal', 'Element derived from Fear channel')
  eq(sanitized.framing, 'generative', 'Framing derived from adjacent key')
}

// Sanitize handles missing fields gracefully
{
  const sanitized = sanitizeSuggestion({})
  eq(sanitized.key, 'channel_aligned', 'Default key is channel_aligned')
  eq(sanitized.channel, 'Neutrality', 'Default channel is Neutrality')
  eq(sanitized.element, 'Earth', 'Default element is Earth (from Neutrality)')
  eq(sanitized.framing, 'direct', 'Default framing is direct (from channel_aligned)')
  ok(sanitized.title.length > 0, 'Default title is non-empty')
  ok(sanitized.body.length > 0, 'Default body is non-empty')
}

// Sanitize then validate — should be valid
{
  const raw = {
    key: 'cross' as const,
    channel: 'Sadness' as EmotionalChannel,
    title: 'Test Cross Insight',
    body: 'A meaningful body about what was hidden underneath the surface of the experience.',
    label: 'Water Insight',
    element: 'wrong',
    framing: 'wrong' as any,
  }
  const sanitized = sanitizeSuggestion(raw)
  const result = validateSuggestion(sanitized)
  ok(result.valid, 'Sanitized suggestion passes validation')
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. explainValidation output
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- explainValidation ---')

{
  const valid: ValidationResult = { valid: true, issues: [] }
  const explanation = explainValidation(valid)
  ok(explanation.includes('passed'), 'Valid result explanation says "passed"')
}

{
  const invalid: ValidationResult = {
    valid: false,
    issues: [
      { code: 'TEST_CODE', message: 'test message', path: 'test.path' },
    ],
  }
  const explanation = explainValidation(invalid)
  ok(explanation.includes('1 issue'), 'Invalid result mentions issue count')
  ok(explanation.includes('TEST_CODE'), 'Includes error code')
  ok(explanation.includes('test.path'), 'Includes path')
  ok(explanation.includes('test message'), 'Includes message')
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. Wuxing cycle mapping consistency
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Wuxing cycle mapping consistency ---')

// Every channel has a shēng neighbor that is also a valid channel
for (const channel of VALID_CHANNELS) {
  ok(isValidChannel(SHENG_NEIGHBOR[channel]), `${channel}: shēng neighbor is valid channel`)
  ok(isValidChannel(KE_NEIGHBOR[channel]), `${channel}: kè neighbor is valid channel`)
}

// shēng and kè neighbors are always different from each other and from primary
for (const channel of VALID_CHANNELS) {
  const sheng = SHENG_NEIGHBOR[channel]
  const ke = KE_NEIGHBOR[channel]
  ok(sheng !== channel, `${channel}: shēng neighbor differs from primary`)
  ok(ke !== channel, `${channel}: kè neighbor differs from primary`)
  ok(sheng !== ke, `${channel}: shēng and kè neighbors are different`)
}

// Channel → element mapping covers all channels
for (const channel of VALID_CHANNELS) {
  ok(CHANNEL_ELEMENT_MAP[channel] !== undefined, `${channel}: has element mapping`)
}

// ═══════════════════════════════════════════════════════════════════════════
// 13. Key↔framing map is complete and consistent
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Key↔framing map ---')

eq(KEY_FRAMING_MAP.channel_aligned, 'direct', 'channel_aligned → direct')
eq(KEY_FRAMING_MAP.adjacent, 'generative', 'adjacent → generative')
eq(KEY_FRAMING_MAP.cross, 'challenging', 'cross → challenging')

// All framings are unique
{
  const framings = Object.values(KEY_FRAMING_MAP)
  const unique = new Set(framings)
  eq(unique.size, 3, 'All 3 framings are unique')
}

// ═══════════════════════════════════════════════════════════════════════════
// 14. Edge case: non-object input
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Edge cases ---')

{
  const result = validateSuggestion(null)
  ok(!result.valid, 'null fails validation')
}

{
  const result = validateSuggestion(undefined)
  ok(!result.valid, 'undefined fails validation')
}

{
  const result = validateSuggestion('string')
  ok(!result.valid, 'string fails validation')
}

{
  const result = validateSuggestion(42)
  ok(!result.valid, 'number fails validation')
}

{
  const result = validateCompletionSet(null)
  ok(!result.valid, 'null completion set fails')
}

{
  const result = validateCompletionSet({ suggestions: [] })
  ok(!result.valid, 'empty suggestions array fails')
}

// ═══════════════════════════════════════════════════════════════════════════
// 15. Epiphany invariant: Reflection BAR IS the epiphany
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- Epiphany invariant ---')

// Every valid suggestion produces a BAR with isEpiphany: true
for (const channel of VALID_CHANNELS) {
  const suggestion = makeValidSuggestion('channel_aligned', channel)
  const result = validateSuggestionBarConformance(suggestion)
  ok(result.valid, `${channel}: epiphany invariant holds`)

  // Double-check: no EPIPHANY_FLAG_MISSING error
  ok(!hasIssueCode(result, 'EPIPHANY_FLAG_MISSING'), `${channel}: no EPIPHANY_FLAG_MISSING`)
}

// ═══════════════════════════════════════════════════════════════════════════
// Report
// ═══════════════════════════════════════════════════════════════════════════

console.log('')
console.log(`reflection-validation tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
