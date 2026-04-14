/**
 * Tests for NarrativeTemplate Config Blob Validation
 *
 * Validates that TypeScript boundary validation correctly:
 * - Accepts valid configs per kind (EPIPHANY, KOTTER, ORIENTATION, CUSTOM)
 * - Rejects invalid configs per kind
 * - Rejects cross-kind config mismatches (EPIPHANY config for KOTTER kind)
 * - Narrows NarrativeTemplateRow to TypedNarrativeTemplate
 * - Round-trips through JSON serialization
 * - Provides descriptive error messages
 *
 * Pattern: node:assert + console.log (matches existing test conventions)
 * @see src/lib/cyoa-build/__tests__/schemas.test.ts — sibling test pattern
 */

import assert from 'node:assert'
import {
  parseConfigBlob,
  parseNarrativeTemplateWithConfig,
  parseCreateInput,
  epiphanyConfigSchema,
  kotterConfigSchema,
  orientationConfigSchema,
  customConfigSchema,
  narrativeTemplateKindSchema,
} from '../schemas'
import {
  narrowConfigBlob,
  narrowConfigBlobOrThrow,
  narrowNarrativeTemplate,
  narrowNarrativeTemplateOrThrow,
  isEpiphanyConfig,
  isKotterConfig,
  isOrientationConfig,
  isCustomConfig,
  isValidConfigForKind,
} from '../narrow'
import type { NarrativeTemplateRow } from '../types'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const validEpiphanyConfig = {
  beats: ['orientation', 'rising_engagement', 'tension', 'integration', 'transcendence', 'consequence'] as const,
  defaultSegment: 'player' as const,
  spineLength: 'full' as const,
  moveType: 'wakeUp' as const,
  loreGatesEnabled: true,
}

const validEpiphanyConfigMinimal = {
  beats: ['orientation'] as const,
  defaultSegment: 'player' as const,
}

const validKotterConfig = {
  beats: ['urgency', 'coalition', 'vision', 'communicate', 'obstacles', 'wins', 'build_on', 'anchor'] as const,
  defaultSegment: 'sponsor' as const,
  moveType: 'showUp' as const,
  loreGatesEnabled: false,
}

const validKotterConfigMinimal = {
  beats: ['urgency'] as const,
  defaultSegment: 'player' as const,
}

const validOrientationConfig = {
  faces: ['shaman', 'challenger', 'diplomat'] as const,
  subPackets: [
    { face: 'shaman' as const, label: 'Meet the Shaman', passageKey: 'shaman-intro' },
    { face: 'challenger' as const, label: 'Face the Challenger' },
    { face: 'diplomat' as const, label: 'The Diplomat Speaks', prompt: 'How do you connect?' },
  ],
  showFaceLore: true,
  introPassageKey: 'welcome-orientation',
}

const validOrientationConfigMinimal = {
  faces: ['sage'] as const,
  subPackets: [{ face: 'sage' as const, label: 'Sage Wisdom' }],
}

const validCustomConfig = {
  customField1: 'hello',
  customField2: 42,
  nested: { deep: true },
}

const validCustomConfigEmpty = {}

function makeRow(kind: string, configBlob: unknown): NarrativeTemplateRow {
  return {
    id: 'tmpl_test_1',
    key: `test-${kind.toLowerCase()}`,
    name: `Test ${kind}`,
    description: null,
    kind: kind as NarrativeTemplateRow['kind'],
    stepCount: 6,
    faceAffinities: [],
    questModel: 'personal',
    configBlob,
    status: 'active',
    sortOrder: 0,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
  }
}

// ===========================================================================
// 1. parseConfigBlob — discriminated config validation per kind
// ===========================================================================

console.log('=== parseConfigBlob ===')

// --- EPIPHANY ---

console.log('--- EPIPHANY config validation ---')

{
  const r = parseConfigBlob('EPIPHANY', validEpiphanyConfig)
  assert.ok(r.success, 'full EPIPHANY config passes')
}

{
  const r = parseConfigBlob('EPIPHANY', validEpiphanyConfigMinimal)
  assert.ok(r.success, 'minimal EPIPHANY config passes (only required fields)')
}

{
  const r = parseConfigBlob('EPIPHANY', {
    ...validEpiphanyConfig,
    beatOverrides: {
      '0': { choiceType: 'altitudinal', enabledFaces: ['shaman', 'sage'] },
      '3': { choiceType: 'horizontal', enabledHorizontal: ['wakeUp', 'growUp'] },
    },
  })
  assert.ok(r.success, 'EPIPHANY config with beatOverrides passes')
}

{
  const r = parseConfigBlob('EPIPHANY', {
    beats: ['invalid_beat'],
    defaultSegment: 'player',
  })
  assert.ok(!r.success, 'EPIPHANY rejects invalid beat type')
}

{
  const r = parseConfigBlob('EPIPHANY', {
    beats: [],
    defaultSegment: 'player',
  })
  assert.ok(!r.success, 'EPIPHANY rejects empty beats array (min 1)')
}

{
  const r = parseConfigBlob('EPIPHANY', {
    beats: ['orientation', 'rising_engagement', 'tension', 'integration', 'transcendence', 'consequence', 'orientation'],
    defaultSegment: 'player',
  })
  assert.ok(!r.success, 'EPIPHANY rejects >6 beats (max 6)')
}

{
  const r = parseConfigBlob('EPIPHANY', {
    beats: ['orientation'],
    // missing defaultSegment
  })
  assert.ok(!r.success, 'EPIPHANY rejects missing defaultSegment')
}

{
  const r = parseConfigBlob('EPIPHANY', {
    beats: ['orientation'],
    defaultSegment: 'invalid_segment',
  })
  assert.ok(!r.success, 'EPIPHANY rejects invalid segment variant')
}

{
  const r = parseConfigBlob('EPIPHANY', {
    beats: ['orientation'],
    defaultSegment: 'player',
    spineLength: 'medium', // invalid
  })
  assert.ok(!r.success, 'EPIPHANY rejects invalid spineLength')
}

{
  const r = parseConfigBlob('EPIPHANY', {
    beats: ['orientation'],
    defaultSegment: 'player',
    moveType: 'invalidMove',
  })
  assert.ok(!r.success, 'EPIPHANY rejects invalid moveType')
}

console.log('  PASS: EPIPHANY config validation')

// --- KOTTER ---

console.log('--- KOTTER config validation ---')

{
  const r = parseConfigBlob('KOTTER', validKotterConfig)
  assert.ok(r.success, 'full KOTTER config passes')
}

{
  const r = parseConfigBlob('KOTTER', validKotterConfigMinimal)
  assert.ok(r.success, 'minimal KOTTER config passes')
}

{
  const r = parseConfigBlob('KOTTER', {
    beats: ['urgency', 'coalition', 'vision', 'communicate', 'obstacles', 'wins', 'build_on', 'anchor', 'urgency'],
    defaultSegment: 'player',
  })
  assert.ok(!r.success, 'KOTTER rejects >8 beats (max 8)')
}

{
  const r = parseConfigBlob('KOTTER', {
    beats: ['orientation'], // Epiphany beat, not Kotter
    defaultSegment: 'player',
  })
  assert.ok(!r.success, 'KOTTER rejects Epiphany beat types')
}

{
  const r = parseConfigBlob('KOTTER', {
    beats: [],
    defaultSegment: 'sponsor',
  })
  assert.ok(!r.success, 'KOTTER rejects empty beats')
}

console.log('  PASS: KOTTER config validation')

// --- ORIENTATION ---

console.log('--- ORIENTATION config validation ---')

{
  const r = parseConfigBlob('ORIENTATION', validOrientationConfig)
  assert.ok(r.success, 'full ORIENTATION config passes')
}

{
  const r = parseConfigBlob('ORIENTATION', validOrientationConfigMinimal)
  assert.ok(r.success, 'minimal ORIENTATION config passes')
}

{
  const r = parseConfigBlob('ORIENTATION', {
    faces: [],
    subPackets: [{ face: 'sage', label: 'Test' }],
  })
  assert.ok(!r.success, 'ORIENTATION rejects empty faces (min 1)')
}

{
  const r = parseConfigBlob('ORIENTATION', {
    faces: ['shaman'],
    subPackets: [],
  })
  assert.ok(!r.success, 'ORIENTATION rejects empty subPackets (min 1)')
}

{
  const r = parseConfigBlob('ORIENTATION', {
    faces: ['invalid_face'],
    subPackets: [{ face: 'sage', label: 'Test' }],
  })
  assert.ok(!r.success, 'ORIENTATION rejects invalid face in faces array')
}

{
  const r = parseConfigBlob('ORIENTATION', {
    faces: ['shaman'],
    subPackets: [{ face: 'shaman', label: '' }], // empty label
  })
  assert.ok(!r.success, 'ORIENTATION rejects empty label in subPacket')
}

{
  const r = parseConfigBlob('ORIENTATION', {
    faces: ['shaman'],
    subPackets: [{ face: 'invalid_face', label: 'Test' }],
  })
  assert.ok(!r.success, 'ORIENTATION rejects invalid face in subPacket')
}

console.log('  PASS: ORIENTATION config validation')

// --- CUSTOM ---

console.log('--- CUSTOM config validation ---')

{
  const r = parseConfigBlob('CUSTOM', validCustomConfig)
  assert.ok(r.success, 'CUSTOM config with arbitrary fields passes')
}

{
  const r = parseConfigBlob('CUSTOM', validCustomConfigEmpty)
  assert.ok(r.success, 'CUSTOM config with empty object passes')
}

{
  const r = parseConfigBlob('CUSTOM', { nested: { deep: { very: true } } })
  assert.ok(r.success, 'CUSTOM config with deeply nested object passes')
}

console.log('  PASS: CUSTOM config validation')

// ===========================================================================
// 2. Cross-kind validation (wrong config for kind)
// ===========================================================================

console.log('=== Cross-kind config rejection ===')

{
  // Epiphany config applied to KOTTER kind — should fail (Epiphany beats are invalid for Kotter)
  const r = parseConfigBlob('KOTTER', validEpiphanyConfig)
  assert.ok(!r.success, 'Epiphany config rejected when parsed as KOTTER')
}

{
  // Kotter config applied to EPIPHANY kind — should fail (Kotter beats are invalid for Epiphany)
  const r = parseConfigBlob('EPIPHANY', validKotterConfig)
  assert.ok(!r.success, 'Kotter config rejected when parsed as EPIPHANY')
}

{
  // Orientation config applied to EPIPHANY kind — should fail (no beats field)
  const r = parseConfigBlob('EPIPHANY', validOrientationConfig)
  assert.ok(!r.success, 'Orientation config rejected when parsed as EPIPHANY')
}

{
  // Epiphany config applied to ORIENTATION kind — should fail (no faces/subPackets)
  const r = parseConfigBlob('ORIENTATION', validEpiphanyConfig)
  assert.ok(!r.success, 'Epiphany config rejected when parsed as ORIENTATION')
}

{
  // Note: CUSTOM accepts any object, so cross-kind tests are N/A for CUSTOM target
  const r = parseConfigBlob('CUSTOM', validEpiphanyConfig)
  assert.ok(r.success, 'Any config passes as CUSTOM (freeform)')
}

console.log('  PASS: Cross-kind config rejection')

// ===========================================================================
// 3. narrowConfigBlob — type-safe narrowing
// ===========================================================================

console.log('=== narrowConfigBlob ===')

{
  const config = narrowConfigBlob('EPIPHANY', validEpiphanyConfig)
  assert.ok(config !== null, 'narrowConfigBlob returns typed config for valid EPIPHANY')
  assert.deepStrictEqual(config!.beats, validEpiphanyConfig.beats)
  assert.strictEqual(config!.defaultSegment, 'player')
}

{
  const config = narrowConfigBlob('KOTTER', validKotterConfig)
  assert.ok(config !== null, 'narrowConfigBlob returns typed config for valid KOTTER')
  assert.deepStrictEqual(config!.beats, validKotterConfig.beats)
}

{
  const config = narrowConfigBlob('ORIENTATION', validOrientationConfig)
  assert.ok(config !== null, 'narrowConfigBlob returns typed config for valid ORIENTATION')
  assert.deepStrictEqual(config!.faces, validOrientationConfig.faces)
}

{
  const config = narrowConfigBlob('EPIPHANY', { invalid: true })
  assert.strictEqual(config, null, 'narrowConfigBlob returns null for invalid config')
}

{
  const config = narrowConfigBlob('KOTTER', validEpiphanyConfig)
  assert.strictEqual(config, null, 'narrowConfigBlob returns null for cross-kind mismatch')
}

console.log('  PASS: narrowConfigBlob')

// ===========================================================================
// 4. narrowConfigBlobOrThrow
// ===========================================================================

console.log('=== narrowConfigBlobOrThrow ===')

{
  const config = narrowConfigBlobOrThrow('EPIPHANY', validEpiphanyConfig)
  assert.deepStrictEqual(config.beats, validEpiphanyConfig.beats)
}

{
  let threw = false
  try {
    narrowConfigBlobOrThrow('EPIPHANY', { invalid: true })
  } catch (e) {
    threw = true
    assert.ok(e instanceof Error)
    assert.ok(e.message.includes('EPIPHANY'), 'error message includes kind')
  }
  assert.ok(threw, 'narrowConfigBlobOrThrow throws for invalid config')
}

{
  let threw = false
  try {
    narrowConfigBlobOrThrow('KOTTER', validEpiphanyConfig)
  } catch (e) {
    threw = true
    assert.ok(e instanceof Error)
    assert.ok(e.message.includes('KOTTER'), 'cross-kind error message includes target kind')
  }
  assert.ok(threw, 'narrowConfigBlobOrThrow throws for cross-kind mismatch')
}

console.log('  PASS: narrowConfigBlobOrThrow')

// ===========================================================================
// 5. narrowNarrativeTemplate — full row narrowing
// ===========================================================================

console.log('=== narrowNarrativeTemplate ===')

{
  const row = makeRow('EPIPHANY', validEpiphanyConfig)
  const typed = narrowNarrativeTemplate(row)
  assert.ok(typed !== null, 'narrows EPIPHANY row to TypedNarrativeTemplate')
  assert.strictEqual(typed!.kind, 'EPIPHANY')
  // TypeScript narrowing: accessing typed configBlob
  if (typed!.kind === 'EPIPHANY') {
    assert.deepStrictEqual(typed!.configBlob.beats, validEpiphanyConfig.beats)
    assert.strictEqual(typed!.configBlob.defaultSegment, 'player')
  }
}

{
  const row = makeRow('KOTTER', validKotterConfig)
  const typed = narrowNarrativeTemplate(row)
  assert.ok(typed !== null, 'narrows KOTTER row to TypedNarrativeTemplate')
  if (typed!.kind === 'KOTTER') {
    assert.deepStrictEqual(typed!.configBlob.beats, validKotterConfig.beats)
  }
}

{
  const row = makeRow('ORIENTATION', validOrientationConfig)
  const typed = narrowNarrativeTemplate(row)
  assert.ok(typed !== null, 'narrows ORIENTATION row to TypedNarrativeTemplate')
  if (typed!.kind === 'ORIENTATION') {
    assert.deepStrictEqual(typed!.configBlob.faces, validOrientationConfig.faces)
    assert.strictEqual(typed!.configBlob.subPackets.length, 3)
  }
}

{
  const row = makeRow('CUSTOM', validCustomConfig)
  const typed = narrowNarrativeTemplate(row)
  assert.ok(typed !== null, 'narrows CUSTOM row to TypedNarrativeTemplate')
}

{
  const row = makeRow('EPIPHANY', { invalid: true })
  const typed = narrowNarrativeTemplate(row)
  assert.strictEqual(typed, null, 'returns null for row with invalid configBlob')
}

{
  const row = makeRow('KOTTER', validEpiphanyConfig)
  const typed = narrowNarrativeTemplate(row)
  assert.strictEqual(typed, null, 'returns null for cross-kind configBlob mismatch')
}

console.log('  PASS: narrowNarrativeTemplate')

// ===========================================================================
// 6. narrowNarrativeTemplateOrThrow
// ===========================================================================

console.log('=== narrowNarrativeTemplateOrThrow ===')

{
  const row = makeRow('EPIPHANY', validEpiphanyConfig)
  const typed = narrowNarrativeTemplateOrThrow(row)
  assert.strictEqual(typed.kind, 'EPIPHANY')
}

{
  const row = makeRow('EPIPHANY', { invalid: true })
  let threw = false
  try {
    narrowNarrativeTemplateOrThrow(row)
  } catch (e) {
    threw = true
    assert.ok(e instanceof Error)
  }
  assert.ok(threw, 'throws for row with invalid configBlob')
}

console.log('  PASS: narrowNarrativeTemplateOrThrow')

// ===========================================================================
// 7. Type guard utilities
// ===========================================================================

console.log('=== Type guard utilities ===')

{
  assert.ok(isEpiphanyConfig(validEpiphanyConfig), 'isEpiphanyConfig recognizes valid config')
  assert.ok(!isEpiphanyConfig(validKotterConfig), 'isEpiphanyConfig rejects Kotter config')
  assert.ok(!isEpiphanyConfig(null), 'isEpiphanyConfig rejects null')
  assert.ok(!isEpiphanyConfig(undefined), 'isEpiphanyConfig rejects undefined')
}

{
  assert.ok(isKotterConfig(validKotterConfig), 'isKotterConfig recognizes valid config')
  assert.ok(!isKotterConfig(validEpiphanyConfig), 'isKotterConfig rejects Epiphany config')
}

{
  assert.ok(isOrientationConfig(validOrientationConfig), 'isOrientationConfig recognizes valid config')
  assert.ok(!isOrientationConfig(validEpiphanyConfig), 'isOrientationConfig rejects Epiphany config')
}

{
  assert.ok(isCustomConfig(validCustomConfig), 'isCustomConfig recognizes valid config')
  assert.ok(isCustomConfig({}), 'isCustomConfig accepts empty object')
  // Note: Custom accepts any Record<string, unknown>, so all objects pass
  assert.ok(isCustomConfig(validEpiphanyConfig), 'isCustomConfig accepts any object')
}

{
  assert.ok(isValidConfigForKind('EPIPHANY', validEpiphanyConfig), 'isValidConfigForKind validates matching pair')
  assert.ok(!isValidConfigForKind('EPIPHANY', validKotterConfig), 'isValidConfigForKind rejects cross-kind')
  assert.ok(isValidConfigForKind('KOTTER', validKotterConfig), 'isValidConfigForKind validates KOTTER')
  assert.ok(isValidConfigForKind('ORIENTATION', validOrientationConfig), 'isValidConfigForKind validates ORIENTATION')
  assert.ok(isValidConfigForKind('CUSTOM', {}), 'isValidConfigForKind validates CUSTOM')
}

console.log('  PASS: Type guard utilities')

// ===========================================================================
// 8. parseNarrativeTemplateWithConfig — full spine + config validation
// ===========================================================================

console.log('=== parseNarrativeTemplateWithConfig ===')

{
  const fullRow = {
    id: 'tmpl_1',
    key: 'epiphany-default',
    name: 'Default Epiphany',
    description: null,
    kind: 'EPIPHANY',
    stepCount: 6,
    faceAffinities: ['shaman', 'sage'],
    questModel: 'personal',
    configBlob: validEpiphanyConfig,
    status: 'active',
    sortOrder: 0,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
  }
  const r = parseNarrativeTemplateWithConfig(fullRow)
  assert.ok(r.success, 'full spine + valid EPIPHANY config passes')
  if (r.success) {
    assert.strictEqual(r.data.kind, 'EPIPHANY')
    const cfg = r.data.configBlob as { beats: string[] }
    assert.deepStrictEqual(cfg.beats, validEpiphanyConfig.beats)
  }
}

{
  const fullRow = {
    id: 'tmpl_2',
    key: 'kotter-default',
    name: 'Default Kotter',
    description: 'Communal arc',
    kind: 'KOTTER',
    stepCount: 8,
    faceAffinities: [],
    questModel: 'communal',
    configBlob: validKotterConfig,
    status: 'active',
    sortOrder: 1,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
  }
  const r = parseNarrativeTemplateWithConfig(fullRow)
  assert.ok(r.success, 'full spine + valid KOTTER config passes')
}

{
  // Valid spine but invalid configBlob for the declared kind
  const fullRow = {
    id: 'tmpl_3',
    key: 'bad-config',
    name: 'Bad Config',
    description: null,
    kind: 'EPIPHANY',
    stepCount: 6,
    faceAffinities: [],
    questModel: 'personal',
    configBlob: validKotterConfig, // Wrong kind config!
    status: 'active',
    sortOrder: 0,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
  }
  const r = parseNarrativeTemplateWithConfig(fullRow)
  assert.ok(!r.success, 'valid spine + cross-kind configBlob fails')
  assert.ok(!r.success && r.configError !== null, 'config error is present')
}

{
  // Invalid spine (missing required fields)
  const r = parseNarrativeTemplateWithConfig({ id: 'x' })
  assert.ok(!r.success, 'invalid spine fails')
  assert.ok(!r.success && r.spineError !== null, 'spine error is present')
}

console.log('  PASS: parseNarrativeTemplateWithConfig')

// ===========================================================================
// 9. parseCreateInput — admin mutation boundary validation
// ===========================================================================

console.log('=== parseCreateInput ===')

{
  const input = {
    key: 'epiphany-new',
    name: 'New Epiphany Template',
    kind: 'EPIPHANY',
    stepCount: 6,
    faceAffinities: ['shaman'],
    questModel: 'personal',
    configBlob: validEpiphanyConfig,
  }
  const r = parseCreateInput(input)
  assert.ok(r.success, 'valid create input passes')
  if (r.success) {
    assert.strictEqual(r.data.key, 'epiphany-new')
    assert.strictEqual(r.data.kind, 'EPIPHANY')
  }
}

{
  const input = {
    key: 'Invalid Key With Spaces',
    name: 'Test',
    kind: 'EPIPHANY',
    stepCount: 6,
    configBlob: validEpiphanyConfig,
  }
  const r = parseCreateInput(input)
  assert.ok(!r.success, 'invalid key format rejected')
  assert.ok(!r.success && r.inputError !== null, 'input error present for bad key')
}

{
  const input = {
    key: 'kotter-wrong-config',
    name: 'Test',
    kind: 'KOTTER',
    stepCount: 8,
    configBlob: validEpiphanyConfig, // Wrong config for KOTTER kind
  }
  const r = parseCreateInput(input)
  assert.ok(!r.success, 'create input with cross-kind configBlob rejected')
  assert.ok(!r.success && r.configError !== null, 'config error present for cross-kind')
}

{
  const input = {
    key: 'orientation-test',
    name: 'Orientation Test',
    kind: 'ORIENTATION',
    stepCount: 3,
    questModel: 'personal',
    configBlob: validOrientationConfig,
  }
  const r = parseCreateInput(input)
  assert.ok(r.success, 'ORIENTATION create input passes')
}

{
  const input = {
    key: 'custom-freeform',
    name: 'Custom Template',
    kind: 'CUSTOM',
    stepCount: 1,
    configBlob: { anything: 'goes', nested: { ok: true } },
  }
  const r = parseCreateInput(input)
  assert.ok(r.success, 'CUSTOM create input passes with freeform configBlob')
}

console.log('  PASS: parseCreateInput')

// ===========================================================================
// 10. Round-trip: JSON serialization preserves validation
// ===========================================================================

console.log('=== Round-trip serialization ===')

{
  const original = validEpiphanyConfig
  const json = JSON.stringify(original)
  const parsed = JSON.parse(json)
  const r = parseConfigBlob('EPIPHANY', parsed)
  assert.ok(r.success, 'EPIPHANY config round-trips through JSON')
  assert.deepStrictEqual(r.data, original)
}

{
  const original = validKotterConfig
  const json = JSON.stringify(original)
  const parsed = JSON.parse(json)
  const r = parseConfigBlob('KOTTER', parsed)
  assert.ok(r.success, 'KOTTER config round-trips through JSON')
  assert.deepStrictEqual(r.data, original)
}

{
  const original = validOrientationConfig
  const json = JSON.stringify(original)
  const parsed = JSON.parse(json)
  const r = parseConfigBlob('ORIENTATION', parsed)
  assert.ok(r.success, 'ORIENTATION config round-trips through JSON')
  assert.deepStrictEqual(r.data, original)
}

{
  const row = makeRow('EPIPHANY', validEpiphanyConfig)
  const json = JSON.stringify(row)
  const deserialized = JSON.parse(json)
  // Re-hydrate dates (JSON.parse loses Date objects)
  deserialized.createdAt = new Date(deserialized.createdAt)
  deserialized.updatedAt = new Date(deserialized.updatedAt)
  const typed = narrowNarrativeTemplate(deserialized as NarrativeTemplateRow)
  assert.ok(typed !== null, 'full row round-trips through JSON + narrowing')
  assert.strictEqual(typed!.kind, 'EPIPHANY')
}

console.log('  PASS: Round-trip serialization')

// ===========================================================================
// 11. Edge cases
// ===========================================================================

console.log('=== Edge cases ===')

{
  // null configBlob
  const r = parseConfigBlob('EPIPHANY', null)
  assert.ok(!r.success, 'null configBlob rejected')
}

{
  // undefined configBlob
  const r = parseConfigBlob('EPIPHANY', undefined)
  assert.ok(!r.success, 'undefined configBlob rejected')
}

{
  // string configBlob (not an object)
  const r = parseConfigBlob('EPIPHANY', 'not an object')
  assert.ok(!r.success, 'string configBlob rejected')
}

{
  // number configBlob
  const r = parseConfigBlob('KOTTER', 42)
  assert.ok(!r.success, 'number configBlob rejected')
}

{
  // array configBlob
  const r = parseConfigBlob('ORIENTATION', [1, 2, 3])
  assert.ok(!r.success, 'array configBlob rejected for ORIENTATION')
}

{
  // Extra fields are stripped (Zod default behavior)
  const withExtra = {
    ...validEpiphanyConfig,
    extraFieldNotInSchema: 'should be stripped',
  }
  const r = parseConfigBlob('EPIPHANY', withExtra)
  assert.ok(r.success, 'extra fields do not cause rejection')
  assert.strictEqual(
    (r.data as Record<string, unknown>)['extraFieldNotInSchema'],
    undefined,
    'extra fields are stripped from parsed output',
  )
}

{
  // BeatOverride with invalid choiceType
  const r = parseConfigBlob('EPIPHANY', {
    beats: ['orientation'],
    defaultSegment: 'player',
    beatOverrides: {
      '0': { choiceType: 'invalid_type' },
    },
  })
  assert.ok(!r.success, 'EPIPHANY rejects invalid choiceType in beatOverrides')
}

{
  // BeatOverride with invalid face in enabledFaces
  const r = parseConfigBlob('EPIPHANY', {
    beats: ['orientation'],
    defaultSegment: 'player',
    beatOverrides: {
      '0': { enabledFaces: ['not_a_face'] },
    },
  })
  assert.ok(!r.success, 'EPIPHANY rejects invalid face in beatOverrides.enabledFaces')
}

{
  // Orientation with >6 faces (max 6)
  const r = parseConfigBlob('ORIENTATION', {
    faces: ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage', 'shaman'],
    subPackets: [{ face: 'sage', label: 'Test' }],
  })
  assert.ok(!r.success, 'ORIENTATION rejects >6 faces')
}

console.log('  PASS: Edge cases')

// ===========================================================================
// 12. narrativeTemplateKindSchema
// ===========================================================================

console.log('=== narrativeTemplateKindSchema ===')

{
  assert.ok(narrativeTemplateKindSchema.safeParse('EPIPHANY').success, 'EPIPHANY valid kind')
  assert.ok(narrativeTemplateKindSchema.safeParse('KOTTER').success, 'KOTTER valid kind')
  assert.ok(narrativeTemplateKindSchema.safeParse('ORIENTATION').success, 'ORIENTATION valid kind')
  assert.ok(narrativeTemplateKindSchema.safeParse('CUSTOM').success, 'CUSTOM valid kind')
  assert.ok(!narrativeTemplateKindSchema.safeParse('INVALID').success, 'INVALID kind rejected')
  assert.ok(!narrativeTemplateKindSchema.safeParse('').success, 'empty string kind rejected')
  assert.ok(!narrativeTemplateKindSchema.safeParse(null).success, 'null kind rejected')
}

console.log('  PASS: narrativeTemplateKindSchema')

// ===========================================================================
// 13. Individual schema exports (direct schema access for advanced usage)
// ===========================================================================

console.log('=== Individual config schemas ===')

{
  const r = epiphanyConfigSchema.safeParse(validEpiphanyConfig)
  assert.ok(r.success, 'epiphanyConfigSchema direct parse works')
}

{
  const r = kotterConfigSchema.safeParse(validKotterConfig)
  assert.ok(r.success, 'kotterConfigSchema direct parse works')
}

{
  const r = orientationConfigSchema.safeParse(validOrientationConfig)
  assert.ok(r.success, 'orientationConfigSchema direct parse works')
}

{
  const r = customConfigSchema.safeParse(validCustomConfig)
  assert.ok(r.success, 'customConfigSchema direct parse works')
}

console.log('  PASS: Individual config schemas')

// ---------------------------------------------------------------------------

console.log('\nAll NarrativeTemplate config validation tests passed.')
