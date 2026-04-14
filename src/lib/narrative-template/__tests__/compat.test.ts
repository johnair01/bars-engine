/**
 * Tests for NarrativeTemplate Backwards-Compatibility Shims
 *
 * Validates that adapter functions correctly convert NarrativeTemplate rows
 * into legacy QuestTemplate and AdventureTemplate shapes for existing consumers.
 *
 * Pattern: node:assert + console.log (matches existing test conventions)
 * @see src/lib/narrative-template/__tests__/config-validation.test.ts — sibling test
 */

import assert from 'node:assert'
import {
  toAdventureTemplateView,
  toAdventureTemplateViews,
  toQuestTemplateSeedView,
  toQuestTemplateSeedViews,
  toQuestWizardTemplate,
  toQuestWizardTemplates,
  extractComposerStepOverrides,
  isMigratedFromQuestTemplate,
  isMigratedFromAdventureTemplate,
  stripMigrationPrefix,
} from '../compat'
import type { NarrativeTemplateRow } from '../types'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const NOW = new Date()

function makeRow(overrides: Partial<NarrativeTemplateRow> = {}): NarrativeTemplateRow {
  return {
    id: 'test-id',
    key: 'test-key',
    name: 'Test Template',
    description: 'A test template',
    kind: 'CUSTOM',
    stepCount: 3,
    faceAffinities: [],
    questModel: 'personal',
    configBlob: {},
    status: 'active',
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

/** Migrated AdventureTemplate fixture */
function makeMigratedAdventure(): NarrativeTemplateRow {
  return makeRow({
    key: 'at-five-beat-coaster',
    name: 'Five Beat Coaster',
    kind: 'CUSTOM',
    configBlob: {
      sourceType: 'AdventureTemplate',
      passageSlots: [
        { nodeId: 'context_1', label: 'Context', order: 0 },
        { nodeId: 'anomaly_1', label: 'Anomaly', order: 1 },
        { nodeId: 'choice_1', label: 'Choice', order: 2 },
      ],
      startNodeId: 'context_1',
      ownership: 'system',
      composerStepOverrides: { face: { priority: 1, enabled: true } },
    },
  })
}

/** Migrated QuestTemplate fixture */
function makeMigratedQuest(): NarrativeTemplateRow {
  return makeRow({
    key: 'qt-onboarding-welcome',
    name: 'Welcome Quest',
    kind: 'ORIENTATION',
    stepCount: 6,
    faceAffinities: ['sage', 'diplomat'],
    questModel: 'personal',
    configBlob: {
      faces: ['sage', 'diplomat'],
      subPackets: [
        { face: 'sage', label: 'Sage' },
        { face: 'diplomat', label: 'Diplomat' },
      ],
    },
  })
}

/** Epiphany NarrativeTemplate fixture */
function makeEpiphanyTemplate(): NarrativeTemplateRow {
  return makeRow({
    key: 'personal-growth',
    name: 'Personal Growth Arc',
    kind: 'EPIPHANY',
    stepCount: 6,
    faceAffinities: ['shaman', 'diplomat'],
    questModel: 'personal',
    configBlob: {
      beats: ['orientation', 'rising_engagement', 'tension', 'integration', 'transcendence', 'consequence'],
      defaultSegment: 'player',
      moveType: 'growUp',
      spineLength: 'full',
    },
  })
}

/** Kotter NarrativeTemplate fixture */
function makeKotterTemplate(): NarrativeTemplateRow {
  return makeRow({
    key: 'community-action',
    name: 'Community Action Campaign',
    kind: 'KOTTER',
    stepCount: 8,
    faceAffinities: ['diplomat', 'regent'],
    questModel: 'communal',
    configBlob: {
      beats: ['urgency', 'coalition', 'vision', 'communicate', 'obstacles', 'wins', 'build_on', 'anchor'],
      defaultSegment: 'player',
    },
  })
}

// ---------------------------------------------------------------------------
// Tests: toAdventureTemplateView
// ---------------------------------------------------------------------------

function testAdventureTemplateViewFromMigratedAT() {
  const row = makeMigratedAdventure()
  const view = toAdventureTemplateView(row)

  assert.ok(view, 'Should produce a view for migrated AT')
  assert.strictEqual(view.key, 'five-beat-coaster', 'Should strip at- prefix')
  assert.strictEqual(view.name, 'Five Beat Coaster')
  assert.strictEqual(view.startNodeId, 'context_1')
  assert.strictEqual(view.ownership, 'system')

  // passageSlots should be a JSON string
  const slots = JSON.parse(view.passageSlots)
  assert.strictEqual(slots.length, 3)
  assert.strictEqual(slots[0].nodeId, 'context_1')

  // composerStepOverrides should be preserved
  const overrides = view.composerStepOverrides as Record<string, unknown>
  assert.ok(overrides.face, 'composerStepOverrides should contain face key')

  console.log('  toAdventureTemplateView (migrated AT): OK')
}

function testAdventureTemplateViewFromCustomNative() {
  const row = makeRow({ stepCount: 4 })
  const view = toAdventureTemplateView(row)

  assert.ok(view, 'Should produce a view for native CUSTOM template')
  assert.strictEqual(view.key, 'test-key', 'Should keep key as-is for native templates')
  assert.strictEqual(view.startNodeId, 'step_1')
  assert.strictEqual(view.ownership, 'system')

  const slots = JSON.parse(view.passageSlots)
  assert.strictEqual(slots.length, 4, 'Should generate slots from stepCount')

  console.log('  toAdventureTemplateView (native CUSTOM): OK')
}

function testAdventureTemplateViewReturnsNullForEpiphany() {
  const row = makeEpiphanyTemplate()
  const view = toAdventureTemplateView(row)
  assert.strictEqual(view, null, 'EPIPHANY templates should not adapt to AT shape')
  console.log('  toAdventureTemplateView (EPIPHANY → null): OK')
}

function testAdventureTemplateViewReturnsNullForKotter() {
  const row = makeKotterTemplate()
  const view = toAdventureTemplateView(row)
  assert.strictEqual(view, null, 'KOTTER templates should not adapt to AT shape')
  console.log('  toAdventureTemplateView (KOTTER → null): OK')
}

// ---------------------------------------------------------------------------
// Tests: toQuestTemplateSeedView
// ---------------------------------------------------------------------------

function testQuestTemplateSeedViewFromMigratedQT() {
  const row = makeMigratedQuest()
  const seed = toQuestTemplateSeedView(row)

  assert.strictEqual(seed.key, 'onboarding-welcome', 'Should strip qt- prefix')
  assert.strictEqual(seed.name, 'Welcome Quest')
  assert.strictEqual(seed.category, 'onboarding', 'ORIENTATION → onboarding')
  assert.strictEqual(seed.sortOrder, 0)
  assert.ok(seed.defaultSettings, 'defaultSettings should be present')
  assert.ok(seed.copyTemplate, 'copyTemplate should be present')

  console.log('  toQuestTemplateSeedView (migrated QT): OK')
}

function testQuestTemplateSeedViewFromEpiphany() {
  const row = makeEpiphanyTemplate()
  const seed = toQuestTemplateSeedView(row)

  // shaman + diplomat → awareness category
  assert.strictEqual(seed.category, 'awareness', 'EPIPHANY + shaman/diplomat → awareness')
  assert.strictEqual(seed.key, 'personal-growth')
  assert.strictEqual(seed.defaultSettings.questModel, 'personal')
  assert.strictEqual(seed.defaultSettings.moveType, 'growUp')
  assert.strictEqual(seed.defaultSettings.segment, 'player')
  assert.strictEqual(seed.defaultSettings.spineLength, 'full')

  console.log('  toQuestTemplateSeedView (EPIPHANY): OK')
}

function testQuestTemplateSeedViewFromKotter() {
  const row = makeKotterTemplate()
  const seed = toQuestTemplateSeedView(row)

  // diplomat + regent → community category
  assert.strictEqual(seed.category, 'community', 'KOTTER + diplomat/regent → community')
  assert.strictEqual(seed.defaultSettings.questModel, 'communal')

  console.log('  toQuestTemplateSeedView (KOTTER): OK')
}

// ---------------------------------------------------------------------------
// Tests: toQuestWizardTemplate
// ---------------------------------------------------------------------------

function testQuestWizardTemplateFromEpiphany() {
  const row = makeEpiphanyTemplate()
  const wizard = toQuestWizardTemplate(row)

  assert.strictEqual(wizard.id, 'personal-growth')
  assert.strictEqual(wizard.title, 'Personal Growth Arc')
  assert.strictEqual(wizard.category, 'awareness')
  assert.strictEqual(wizard.lifecycleFraming, true, 'EPIPHANY should enable lifecycle framing')
  assert.ok(wizard.inputs.length > 0, 'Should have wizard inputs')

  const framingInput = wizard.inputs.find(i => i.key === 'framing')
  assert.ok(framingInput, 'Should have framing select input')
  assert.strictEqual(framingInput?.type, 'select')
  assert.ok(framingInput?.optional, 'Framing should be optional')

  console.log('  toQuestWizardTemplate (EPIPHANY): OK')
}

function testQuestWizardTemplateFromKotter() {
  const row = makeKotterTemplate()
  const wizard = toQuestWizardTemplate(row)

  assert.ok(wizard.approaches, 'KOTTER should provide approaches')
  assert.ok(wizard.approaches!.includes('Kotter Framework'))

  const kotterInput = wizard.inputs.find(i => i.key === 'kotterStage')
  assert.ok(kotterInput, 'Should have Kotter stage input')
  assert.ok(kotterInput?.optional, 'Kotter stage should be optional')

  console.log('  toQuestWizardTemplate (KOTTER): OK')
}

function testQuestWizardTemplateFromCustom() {
  const row = makeRow()
  const wizard = toQuestWizardTemplate(row)

  assert.strictEqual(wizard.category, 'custom')
  assert.strictEqual(wizard.inputs.length, 1)
  assert.strictEqual(wizard.inputs[0].key, 'goal')

  console.log('  toQuestWizardTemplate (CUSTOM): OK')
}

// ---------------------------------------------------------------------------
// Tests: extractComposerStepOverrides
// ---------------------------------------------------------------------------

function testExtractComposerStepOverrides() {
  const row = makeMigratedAdventure()
  const overrides = extractComposerStepOverrides(row) as Record<string, unknown>
  assert.ok(overrides, 'Should extract overrides from migrated AT')
  assert.ok(overrides.face, 'Should contain face override')

  // Test with no overrides
  const plain = makeRow()
  const noOverrides = extractComposerStepOverrides(plain)
  assert.strictEqual(noOverrides, null, 'Should return null when no overrides present')

  console.log('  extractComposerStepOverrides: OK')
}

// ---------------------------------------------------------------------------
// Tests: batch adapters
// ---------------------------------------------------------------------------

function testBatchAdapters() {
  const rows = [makeMigratedAdventure(), makeEpiphanyTemplate(), makeKotterTemplate(), makeRow()]

  const atViews = toAdventureTemplateViews(rows)
  // Only migrated AT and native CUSTOM should produce views (2 out of 4)
  assert.strictEqual(atViews.length, 2, 'Should filter to AT-compatible rows')

  const seedViews = toQuestTemplateSeedViews(rows)
  assert.strictEqual(seedViews.length, 4, 'All rows should produce seed views')

  const wizardViews = toQuestWizardTemplates(rows)
  assert.strictEqual(wizardViews.length, 4, 'All rows should produce wizard views')

  console.log('  Batch adapters: OK')
}

// ---------------------------------------------------------------------------
// Tests: utility helpers
// ---------------------------------------------------------------------------

function testMigrationPrefixHelpers() {
  assert.strictEqual(isMigratedFromQuestTemplate('qt-welcome'), true)
  assert.strictEqual(isMigratedFromQuestTemplate('at-coaster'), false)
  assert.strictEqual(isMigratedFromQuestTemplate('native'), false)

  assert.strictEqual(isMigratedFromAdventureTemplate('at-coaster'), true)
  assert.strictEqual(isMigratedFromAdventureTemplate('qt-welcome'), false)
  assert.strictEqual(isMigratedFromAdventureTemplate('native'), false)

  assert.strictEqual(stripMigrationPrefix('qt-welcome'), 'welcome')
  assert.strictEqual(stripMigrationPrefix('at-coaster'), 'coaster')
  assert.strictEqual(stripMigrationPrefix('native-key'), 'native-key')

  console.log('  Migration prefix helpers: OK')
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

console.log('\n=== NarrativeTemplate Compat Shim Tests ===\n')

testAdventureTemplateViewFromMigratedAT()
testAdventureTemplateViewFromCustomNative()
testAdventureTemplateViewReturnsNullForEpiphany()
testAdventureTemplateViewReturnsNullForKotter()

testQuestTemplateSeedViewFromMigratedQT()
testQuestTemplateSeedViewFromEpiphany()
testQuestTemplateSeedViewFromKotter()

testQuestWizardTemplateFromEpiphany()
testQuestWizardTemplateFromKotter()
testQuestWizardTemplateFromCustom()

testExtractComposerStepOverrides()

testBatchAdapters()

testMigrationPrefixHelpers()

console.log('\n✓ All NarrativeTemplate compat shim tests passed\n')
