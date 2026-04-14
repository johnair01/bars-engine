/**
 * Tests for CYOA Build — Zod Validation Schemas
 *
 * Validates: schema parsing, round-trip serialization, rejection of
 * invalid data, and type alignment between Zod schemas and TS types.
 */

import assert from 'node:assert'
import {
  parseCyoaBuild,
  parseCyoaBuildInput,
  parseCyoaBuildDraft,
  parseCyoaBuildLedgerEntry,
  parseCyoaBuildLedgerEntries,
  parseCyoaBuildState,
  parseCyoaBuildReceipt,
  parseCyoaBuildCheckpoint,
  emotionalVectorSchema,
  cyoaBuildSchema,
  cyoaBuildInputSchema,
} from '../schemas'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const validEmotionalVector = {
  channelFrom: 'Fear',
  altitudeFrom: 'dissatisfied',
  channelTo: 'Joy',
  altitudeTo: 'satisfied',
}

const validWaveMoveSpine = {
  primary: 'wakeUp',
  sequence: ['wakeUp', 'cleanUp'],
}

const validCampaignSnapshot = {
  campaignRef: 'camp_abc',
  spokeIndex: 0,
  kotterStage: 1,
  instanceName: 'Spring 2026',
}

const validBuildInput = {
  id: 'build_123',
  playerId: 'player_xyz',
  face: 'shaman',
  emotionalVector: validEmotionalVector,
  waveMoveSpine: validWaveMoveSpine,
  narrativeTemplateKey: 'hero-journey-basic',
  campaignSnapshot: validCampaignSnapshot,
}

const validBuild = {
  ...validBuildInput,
  blueprintKey: 'cyoa_build_shaman_wakeUp',
  createdAt: '2026-04-01T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// EmotionalVector
// ---------------------------------------------------------------------------

console.log('--- emotionalVectorSchema ---')

{
  const r = emotionalVectorSchema.safeParse(validEmotionalVector)
  assert.ok(r.success, 'valid emotional vector passes')
}

{
  const r = emotionalVectorSchema.safeParse({
    channelFrom: 'NotAChannel',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  })
  assert.ok(!r.success, 'invalid channel rejected')
}

{
  const r = emotionalVectorSchema.safeParse({
    channelFrom: 'Fear',
    altitudeFrom: 'very_high',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  })
  assert.ok(!r.success, 'invalid altitude rejected')
}

console.log('  PASS: emotionalVectorSchema')

// ---------------------------------------------------------------------------
// CyoaBuildInput
// ---------------------------------------------------------------------------

console.log('--- cyoaBuildInputSchema ---')

{
  const r = parseCyoaBuildInput(validBuildInput)
  assert.ok(r.success, 'valid input passes')
}

{
  const r = parseCyoaBuildInput({ ...validBuildInput, face: 'ninja' })
  assert.ok(!r.success, 'invalid face rejected')
}

{
  const r = parseCyoaBuildInput({ ...validBuildInput, id: '' })
  assert.ok(!r.success, 'empty id rejected')
}

{
  const r = parseCyoaBuildInput({
    ...validBuildInput,
    waveMoveSpine: { primary: 'wakeUp', sequence: [] },
  })
  assert.ok(!r.success, 'empty sequence rejected (min 1)')
}

{
  const r = parseCyoaBuildInput({
    ...validBuildInput,
    campaignSnapshot: { ...validCampaignSnapshot, spokeIndex: -1 },
  })
  assert.ok(!r.success, 'negative spokeIndex rejected')
}

console.log('  PASS: cyoaBuildInputSchema')

// ---------------------------------------------------------------------------
// CyoaBuild (frozen receipt)
// ---------------------------------------------------------------------------

console.log('--- cyoaBuildSchema ---')

{
  const r = parseCyoaBuild(validBuild)
  assert.ok(r.success, 'valid build passes')
}

{
  const r = parseCyoaBuild({ ...validBuild, createdAt: 'not-a-date' })
  assert.ok(!r.success, 'invalid ISO datetime rejected')
}

{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { blueprintKey: _, ...noBlueprintKey } = validBuild
  const r = parseCyoaBuild(noBlueprintKey)
  assert.ok(!r.success, 'missing blueprintKey rejected')
}

console.log('  PASS: cyoaBuildSchema')

// ---------------------------------------------------------------------------
// CyoaBuildDraft
// ---------------------------------------------------------------------------

console.log('--- cyoaBuildDraftSchema ---')

{
  // Completely empty draft is valid (all fields optional)
  const r = parseCyoaBuildDraft({})
  assert.ok(r.success, 'empty draft passes (all optional)')
}

{
  // Partial draft
  const r = parseCyoaBuildDraft({ face: 'diplomat' })
  assert.ok(r.success, 'partial draft with face passes')
}

{
  const r = parseCyoaBuildDraft({ face: 'invalid_face' })
  assert.ok(!r.success, 'draft with invalid face rejected')
}

{
  const r = parseCyoaBuildDraft({
    face: 'sage',
    emotionalVector: validEmotionalVector,
    waveMoveSpine: { primary: 'growUp' },
    narrativeTemplateKey: 'template-1',
    campaignSnapshot: validCampaignSnapshot,
    savedAt: '2026-04-01T12:00:00.000Z',
    needsRevalidation: true,
  })
  assert.ok(r.success, 'full draft passes')
}

console.log('  PASS: cyoaBuildDraftSchema')

// ---------------------------------------------------------------------------
// CyoaBuildLedgerEntry
// ---------------------------------------------------------------------------

console.log('--- cyoaBuildLedgerEntrySchema ---')

{
  const entry = {
    spokeIndex: 2,
    build: validBuild,
    recordedAt: '2026-04-01T01:00:00.000Z',
  }
  const r = parseCyoaBuildLedgerEntry(entry)
  assert.ok(r.success, 'valid ledger entry passes')
}

{
  const entries = [
    { spokeIndex: 0, build: validBuild, recordedAt: '2026-04-01T01:00:00.000Z' },
    { spokeIndex: 1, build: { ...validBuild, id: 'build_456' }, recordedAt: '2026-04-02T01:00:00.000Z' },
  ]
  const r = parseCyoaBuildLedgerEntries(entries)
  assert.ok(r.success, 'valid ledger entries array passes')
  assert.strictEqual(r.data!.length, 2, 'parsed 2 entries')
}

console.log('  PASS: cyoaBuildLedgerEntrySchema')

// ---------------------------------------------------------------------------
// CyoaBuildState (locked-choice model)
// ---------------------------------------------------------------------------

console.log('--- cyoaBuildStateSchema ---')

{
  const state = {
    v: 1,
    buildId: 'build_789',
    campaignRef: 'camp_abc',
    spokeIndex: 0,
    face: { status: 'unlocked', value: null },
    emotionalVector: { status: 'unlocked', value: null },
    narrativeTemplate: null,
    stepOrder: null,
    extras: {},
    status: 'drafting',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  }
  const r = parseCyoaBuildState(state)
  assert.ok(r.success, 'valid drafting state passes')
}

{
  const state = {
    v: 1,
    buildId: 'build_789',
    campaignRef: 'camp_abc',
    spokeIndex: 0,
    face: { status: 'locked', value: 'architect', lockedAt: '2026-04-01T00:01:00.000Z' },
    emotionalVector: { status: 'locked', value: validEmotionalVector, lockedAt: '2026-04-01T00:02:00.000Z' },
    narrativeTemplate: { templateId: 'tmpl_1', templateKind: 'quest' },
    stepOrder: ['face', 'emotion', 'template', 'confirm'],
    extras: { note: 'test' },
    status: 'locked',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:03:00.000Z',
  }
  const r = parseCyoaBuildState(state)
  assert.ok(r.success, 'valid locked state passes')
}

{
  const r = parseCyoaBuildState({ v: 2, buildId: 'x' })
  assert.ok(!r.success, 'wrong version rejected')
}

{
  const state = {
    v: 1,
    buildId: 'build_789',
    campaignRef: 'camp_abc',
    spokeIndex: 0,
    face: { status: 'locked', value: 'architect' }, // missing lockedAt
    emotionalVector: { status: 'unlocked', value: null },
    narrativeTemplate: null,
    stepOrder: null,
    extras: {},
    status: 'drafting',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  }
  const r = parseCyoaBuildState(state)
  assert.ok(!r.success, 'locked choice without lockedAt rejected')
}

console.log('  PASS: cyoaBuildStateSchema')

// ---------------------------------------------------------------------------
// CyoaBuildReceipt
// ---------------------------------------------------------------------------

console.log('--- cyoaBuildReceiptSchema ---')

{
  const receipt = {
    v: 1,
    buildId: 'build_789',
    campaignRef: 'camp_abc',
    spokeIndex: 0,
    face: 'shaman',
    emotionalVector: validEmotionalVector,
    narrativeTemplate: { templateId: 'tmpl_1', templateKind: 'quest' },
    extras: {},
    createdAt: '2026-04-01T00:00:00.000Z',
  }
  const r = parseCyoaBuildReceipt(receipt)
  assert.ok(r.success, 'valid receipt passes')
}

console.log('  PASS: cyoaBuildReceiptSchema')

// ---------------------------------------------------------------------------
// CyoaBuildCheckpoint
// ---------------------------------------------------------------------------

console.log('--- cyoaBuildCheckpointSchema ---')

{
  const checkpoint = {
    v: 1,
    buildState: {
      v: 1,
      buildId: 'build_789',
      campaignRef: 'camp_abc',
      spokeIndex: 0,
      face: { status: 'locked', value: 'diplomat', lockedAt: '2026-04-01T00:01:00.000Z' },
      emotionalVector: { status: 'unlocked', value: null },
      narrativeTemplate: null,
      stepOrder: null,
      extras: {},
      status: 'drafting',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:02:00.000Z',
    },
    savedAt: '2026-04-01T00:02:00.000Z',
    needsRevalidation: true,
  }
  const r = parseCyoaBuildCheckpoint(checkpoint)
  assert.ok(r.success, 'valid checkpoint passes')
}

{
  const r = parseCyoaBuildCheckpoint({
    v: 1,
    buildState: { v: 1 }, // incomplete state
    savedAt: '2026-04-01T00:00:00.000Z',
    needsRevalidation: false,
  })
  assert.ok(!r.success, 'checkpoint with invalid buildState rejected')
}

console.log('  PASS: cyoaBuildCheckpointSchema')

// ---------------------------------------------------------------------------
// Round-trip: serialize → parse
// ---------------------------------------------------------------------------

console.log('--- Round-trip serialization ---')

{
  const original = validBuild
  const json = JSON.stringify(original)
  const parsed = JSON.parse(json)
  const r = parseCyoaBuild(parsed)
  assert.ok(r.success, 'CyoaBuild round-trips through JSON')
  assert.deepStrictEqual(r.data, original, 'round-trip preserves all fields')
}

{
  const state = {
    v: 1,
    buildId: 'build_rt',
    campaignRef: 'camp_rt',
    spokeIndex: 3,
    face: { status: 'locked', value: 'sage', lockedAt: '2026-04-01T00:00:00.000Z' },
    emotionalVector: { status: 'unlocked', value: null },
    narrativeTemplate: null,
    stepOrder: ['face', 'emotion'],
    extras: { key: 'value' },
    status: 'drafting',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  }
  const json = JSON.stringify(state)
  const parsed = JSON.parse(json)
  const r = parseCyoaBuildState(parsed)
  assert.ok(r.success, 'CyoaBuildState round-trips through JSON')
  assert.deepStrictEqual(r.data, state, 'state round-trip preserves all fields')
}

console.log('  PASS: Round-trip serialization')

// ---------------------------------------------------------------------------
// Optional fields on CampaignSnapshot
// ---------------------------------------------------------------------------

console.log('--- CampaignSnapshot optional fields ---')

{
  const withOptionals = {
    ...validBuild,
    campaignSnapshot: {
      ...validCampaignSnapshot,
      hexagramId: 42,
      changingLines: [1, 3, 5],
    },
  }
  const r = parseCyoaBuild(withOptionals)
  assert.ok(r.success, 'build with optional hexagramId + changingLines passes')
  assert.strictEqual(r.data!.campaignSnapshot.hexagramId, 42)
  assert.deepStrictEqual(r.data!.campaignSnapshot.changingLines, [1, 3, 5])
}

console.log('  PASS: CampaignSnapshot optional fields')

// ---------------------------------------------------------------------------

console.log('\nAll CyoaBuild Zod schema tests passed.')
