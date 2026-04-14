/**
 * Reflection BAR Channel Typing — Tests
 *
 * Verifies that the Reflection BAR (the epiphany artifact) is correctly
 * channel-typed to the emotional channel the player stabilized through.
 *
 * Key invariants tested:
 *   1. Reflection BAR nation field matches the stabilized channel (lowercase)
 *   2. Reflection BAR emotionalAlchemyTag matches nation
 *   3. strandMetadata.channel matches the stabilized channel (title-case)
 *   4. strandMetadata.isEpiphany is always true
 *   5. Channel resolution prioritizes BAR evidence over current state
 *   6. All 5 emotional channels produce correctly typed Reflection BARs
 *
 * Run: npx tsx src/lib/alchemy-engine/__tests__/reflection-bar-channel-typing.test.ts
 */

import { buildReflectionBarData, type ReflectionBarContext, type ReflectionBarMetadata } from '../bar-production'
import { resolveChannelFromEvidence, isValidChannel } from '../channel-resolution'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Assertion helper
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`)
    failed++
  } else {
    passed++
  }
}

function assertEq<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    console.error(`  FAIL: ${message} — expected '${expected}', got '${actual}'`)
    failed++
  } else {
    passed++
  }
}

// ---------------------------------------------------------------------------
// Test: buildReflectionBarData channel-types correctly for each channel
// ---------------------------------------------------------------------------

console.log('--- Reflection BAR channel-typing per emotional channel ---')

const ALL_CHANNELS: { channel: EmotionalChannel; dbName: string }[] = [
  { channel: 'Fear', dbName: 'fear' },
  { channel: 'Anger', dbName: 'anger' },
  { channel: 'Sadness', dbName: 'sadness' },
  { channel: 'Joy', dbName: 'joy' },
  { channel: 'Neutrality', dbName: 'neutrality' },
]

for (const { channel, dbName } of ALL_CHANNELS) {
  const ctx: ReflectionBarContext = {
    playerId: 'test-player-1',
    channel,
    content: `My ${channel} epiphany text`,
    title: undefined, // use generated title
    intakeBarId: 'intake-bar-1',
    actionBarId: 'action-bar-1',
  }

  const bar = buildReflectionBarData(ctx)

  // BAR nation matches the channel (lowercase)
  assertEq(bar.nation, dbName, `${channel}: nation should be '${dbName}'`)

  // BAR emotionalAlchemyTag matches nation
  assertEq(bar.emotionalAlchemyTag, dbName, `${channel}: emotionalAlchemyTag should be '${dbName}'`)

  // BAR type is 'reflection'
  assertEq(bar.type, 'reflection', `${channel}: type should be 'reflection'`)

  // BAR moveType defaults to wakeUp
  assertEq(bar.moveType, 'wakeUp', `${channel}: moveType should be 'wakeUp'`)

  // BAR gameMasterFace defaults to challenger
  assertEq(bar.gameMasterFace, 'challenger', `${channel}: gameMasterFace should be 'challenger'`)

  // Parse strandMetadata and verify
  const meta: ReflectionBarMetadata = JSON.parse(bar.strandMetadata)

  assertEq(meta.alchemyEngine, true, `${channel}: strandMetadata.alchemyEngine should be true`)
  assertEq(meta.arcPhase, 'reflection', `${channel}: strandMetadata.arcPhase should be 'reflection'`)
  assertEq(meta.channel, channel, `${channel}: strandMetadata.channel should be '${channel}'`)
  assertEq(meta.isEpiphany, true, `${channel}: strandMetadata.isEpiphany MUST be true`)
  assertEq(meta.intakeBarId, 'intake-bar-1', `${channel}: strandMetadata.intakeBarId`)
  assertEq(meta.actionBarId, 'action-bar-1', `${channel}: strandMetadata.actionBarId`)

  // Regulation trajectory: from neutral → to satisfied
  assertEq(meta.regulation.from, 'neutral', `${channel}: regulation.from should be 'neutral'`)
  assertEq(meta.regulation.to, 'satisfied', `${channel}: regulation.to should be 'satisfied'`)
}

// ---------------------------------------------------------------------------
// Test: generated title includes channel name
// ---------------------------------------------------------------------------

console.log('--- Reflection BAR title generation ---')

const titleCtx: ReflectionBarContext = {
  playerId: 'test-player-2',
  channel: 'Anger',
  content: 'The fire showed me what boundary I had been avoiding.',
}
const titleBar = buildReflectionBarData(titleCtx)

assert(titleBar.title.includes('Anger'), 'Generated title should include the channel name')
assert(titleBar.title.includes('Epiphany'), 'Generated title should include "Epiphany"')

// Custom title override
const customTitleBar = buildReflectionBarData({ ...titleCtx, title: 'My Custom Epiphany' })
assertEq(customTitleBar.title, 'My Custom Epiphany', 'Custom title should override generated title')

// Channel typing still correct with custom title
assertEq(customTitleBar.nation, 'anger', 'Custom-titled BAR should still be channel-typed to anger')

// ---------------------------------------------------------------------------
// Test: resolveChannelFromEvidence priority logic
// ---------------------------------------------------------------------------

console.log('--- Channel resolution priority ---')

// Priority 1: Both BARs agree
assertEq(
  resolveChannelFromEvidence('fear', 'fear', 'joy'),
  'Fear',
  'Both BARs agree on fear → Fear (overrides state)'
)

// Priority 1 variant: BARs disagree — intake wins (created first)
assertEq(
  resolveChannelFromEvidence('anger', 'joy', 'sadness'),
  'Anger',
  'BARs disagree → intake channel (Anger) takes priority'
)

// Priority 2: Only intake exists
assertEq(
  resolveChannelFromEvidence('sadness', null, 'joy'),
  'Sadness',
  'Only intake BAR → its channel (Sadness)'
)

// Priority 3: Only action exists
assertEq(
  resolveChannelFromEvidence(null, 'joy', 'fear'),
  'Joy',
  'Only action BAR → its channel (Joy)'
)

// Priority 4: No BARs, use state
assertEq(
  resolveChannelFromEvidence(null, null, 'neutrality'),
  'Neutrality',
  'No BARs → state channel (Neutrality)'
)

// Priority 5: Nothing at all → Neutrality fallback
assertEq(
  resolveChannelFromEvidence(null, null, null),
  'Neutrality',
  'No evidence → Neutrality fallback'
)

// Edge case: invalid channel string → Neutrality fallback
assertEq(
  resolveChannelFromEvidence('invalid', null, null),
  'Neutrality',
  'Invalid channel string → Neutrality fallback'
)

// ---------------------------------------------------------------------------
// Test: isValidChannel guard
// ---------------------------------------------------------------------------

console.log('--- isValidChannel guard ---')

assert(isValidChannel('Fear'), 'Fear is valid')
assert(isValidChannel('Anger'), 'Anger is valid')
assert(isValidChannel('Sadness'), 'Sadness is valid')
assert(isValidChannel('Joy'), 'Joy is valid')
assert(isValidChannel('Neutrality'), 'Neutrality is valid')
assert(!isValidChannel('fear'), 'lowercase "fear" is not valid (wrong case)')
assert(!isValidChannel('excitement'), '"excitement" is not a valid channel')
assert(!isValidChannel(''), 'empty string is not valid')

// ---------------------------------------------------------------------------
// Test: Reflection BAR content handling
// ---------------------------------------------------------------------------

console.log('--- Reflection BAR content handling ---')

const emptyContentBar = buildReflectionBarData({
  playerId: 'test-player-3',
  channel: 'Joy',
  content: '   ',
})
assertEq(
  emptyContentBar.description,
  'Reflection phase completed.',
  'Whitespace-only content should use default description'
)

const richContentBar = buildReflectionBarData({
  playerId: 'test-player-3',
  channel: 'Sadness',
  content: 'The deep current showed me what I was holding onto.',
})
assertEq(
  richContentBar.description,
  'The deep current showed me what I was holding onto.',
  'Content should be trimmed and preserved'
)

// Channel typing is correct regardless of content
assertEq(richContentBar.nation, 'sadness', 'Sad content BAR should be typed to sadness')

// ---------------------------------------------------------------------------
// Test: BAR status is always 'seed' for Reflection phase
// ---------------------------------------------------------------------------

console.log('--- Reflection BAR status ---')

const statusBar = buildReflectionBarData({
  playerId: 'test-player-4',
  channel: 'Fear',
  content: 'Epiphany content',
})
assertEq(statusBar.status, 'seed', 'Reflection BAR status should be "seed"')

// ---------------------------------------------------------------------------
// Test: Provenance chain (intakeBarId + actionBarId in metadata)
// ---------------------------------------------------------------------------

console.log('--- Reflection BAR provenance chain ---')

const provenanceBar = buildReflectionBarData({
  playerId: 'test-player-5',
  channel: 'Anger',
  content: 'Provenance test',
  intakeBarId: 'intake-abc-123',
  actionBarId: 'action-xyz-456',
})
const provenanceMeta: ReflectionBarMetadata = JSON.parse(provenanceBar.strandMetadata)

assertEq(provenanceMeta.intakeBarId, 'intake-abc-123', 'intakeBarId in metadata')
assertEq(provenanceMeta.actionBarId, 'action-xyz-456', 'actionBarId in metadata')

// Without provenance IDs
const noProvenanceBar = buildReflectionBarData({
  playerId: 'test-player-5',
  channel: 'Fear',
  content: 'No provenance test',
})
const noProvenanceMeta: ReflectionBarMetadata = JSON.parse(noProvenanceBar.strandMetadata)

assertEq(noProvenanceMeta.intakeBarId, undefined, 'No intakeBarId when not provided')
assertEq(noProvenanceMeta.actionBarId, undefined, 'No actionBarId when not provided')

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log('')
console.log(`reflection-bar-channel-typing tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
