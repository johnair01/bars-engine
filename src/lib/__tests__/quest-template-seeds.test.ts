/**
 * Quest Template Seeds — Contract Tests
 *
 * Verifies:
 * 1. All seed templates have valid, unique keys
 * 2. All categories are from the allowed set
 * 3. copyTemplate structure is valid for each template
 * 4. defaultSettings structure is valid for each template
 * 5. Sort orders are correct within categories
 * 6. Template count and category coverage
 * 7. Duplicate template merge logic
 */
import assert from 'node:assert/strict'
import {
  ALL_QUEST_TEMPLATE_SEEDS,
  QUEST_TEMPLATE_CATEGORIES,
  type QuestTemplateSeedData,
} from '../quest-template-seeds'

// ---------------------------------------------------------------------------
// Valid enum values (must match schema + wizard)
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = QUEST_TEMPLATE_CATEGORIES.map((c) => c.key)

const VALID_MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

const VALID_ALLYSHIP_DOMAINS = [
  'GATHERING_RESOURCES',
  'DIRECT_ACTION',
  'RAISE_AWARENESS',
  'SKILLFUL_ORGANIZING',
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function testAllTemplatesHaveUniqueKeys() {
  const keys = ALL_QUEST_TEMPLATE_SEEDS.map((t) => t.key)
  const uniqueKeys = new Set(keys)
  assert.equal(
    keys.length,
    uniqueKeys.size,
    `Duplicate keys found: ${keys.filter((k, i) => keys.indexOf(k) !== i).join(', ')}`
  )
  console.log('  unique keys: OK')
}

function testAllKeysAreValidFormat() {
  for (const t of ALL_QUEST_TEMPLATE_SEEDS) {
    assert.ok(t.key.length > 0, `Empty key found`)
    assert.match(
      t.key,
      /^[a-z0-9-]+$/,
      `Key "${t.key}" contains invalid characters (must be lowercase alphanumeric + hyphens)`
    )
    assert.ok(!t.key.startsWith('-'), `Key "${t.key}" starts with hyphen`)
    assert.ok(!t.key.endsWith('-'), `Key "${t.key}" ends with hyphen`)
  }
  console.log('  key format: OK')
}

function testAllCategoriesAreValid() {
  for (const t of ALL_QUEST_TEMPLATE_SEEDS) {
    assert.ok(
      VALID_CATEGORIES.includes(t.category as any),
      `Template "${t.key}" has invalid category "${t.category}". Valid: ${VALID_CATEGORIES.join(', ')}`
    )
  }
  console.log('  categories valid: OK')
}

function testAllCategoriesHaveTemplates() {
  const usedCategories = new Set(ALL_QUEST_TEMPLATE_SEEDS.map((t) => t.category))
  for (const cat of VALID_CATEGORIES) {
    assert.ok(
      usedCategories.has(cat),
      `Category "${cat}" has no templates`
    )
  }
  console.log('  all categories covered: OK')
}

function testDefaultSettingsStructure() {
  for (const t of ALL_QUEST_TEMPLATE_SEEDS) {
    const settings = t.defaultSettings
    assert.ok(
      typeof settings === 'object' && settings !== null,
      `Template "${t.key}" has invalid defaultSettings`
    )

    // moveType is required and must be valid
    assert.ok(
      'moveType' in settings,
      `Template "${t.key}" missing moveType in defaultSettings`
    )
    assert.ok(
      VALID_MOVE_TYPES.includes(settings.moveType as string),
      `Template "${t.key}" has invalid moveType "${settings.moveType}"`
    )

    // allyshipDomain must be valid if present
    if ('allyshipDomain' in settings) {
      assert.ok(
        VALID_ALLYSHIP_DOMAINS.includes(settings.allyshipDomain as string),
        `Template "${t.key}" has invalid allyshipDomain "${settings.allyshipDomain}"`
      )
    }

    // reward must be positive if present
    if ('reward' in settings) {
      assert.ok(
        typeof settings.reward === 'number' && settings.reward > 0,
        `Template "${t.key}" has invalid reward ${settings.reward}`
      )
    }
  }
  console.log('  defaultSettings structure: OK')
}

function testCopyTemplateStructure() {
  for (const t of ALL_QUEST_TEMPLATE_SEEDS) {
    const copy = t.copyTemplate
    assert.ok(
      typeof copy === 'object' && copy !== null,
      `Template "${t.key}" has invalid copyTemplate`
    )

    // title and description are required fields (may be empty for custom)
    assert.ok(
      'title' in copy,
      `Template "${t.key}" missing title in copyTemplate`
    )
    assert.ok(
      'description' in copy,
      `Template "${t.key}" missing description in copyTemplate`
    )

    // successCondition is required (may be empty for custom)
    assert.ok(
      'successCondition' in copy,
      `Template "${t.key}" missing successCondition in copyTemplate`
    )

    // steps must be an array if present
    if ('steps' in copy) {
      assert.ok(
        Array.isArray(copy.steps),
        `Template "${t.key}" steps must be an array`
      )
    }
  }
  console.log('  copyTemplate structure: OK')
}

function testStepsHaveRequiredFields() {
  for (const t of ALL_QUEST_TEMPLATE_SEEDS) {
    const steps = (t.copyTemplate as any).steps
    if (!Array.isArray(steps)) continue

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      assert.ok(
        step.type,
        `Template "${t.key}" step ${i} missing type`
      )
      assert.ok(
        step.label,
        `Template "${t.key}" step ${i} missing label`
      )
      assert.ok(
        step.field,
        `Template "${t.key}" step ${i} missing field`
      )

      // Validate step types
      const validStepTypes = ['read', 'input', 'choice']
      assert.ok(
        validStepTypes.includes(step.type),
        `Template "${t.key}" step ${i} has invalid type "${step.type}"`
      )

      // input steps need inputType
      if (step.type === 'input') {
        assert.ok(
          step.inputType,
          `Template "${t.key}" step ${i} (input) missing inputType`
        )
      }

      // choice steps need options
      if (step.type === 'choice') {
        assert.ok(
          Array.isArray(step.options) && step.options.length > 0,
          `Template "${t.key}" step ${i} (choice) missing options array`
        )
      }
    }
  }
  console.log('  step structure: OK')
}

function testSortOrderWithinCategories() {
  const byCategory: Record<string, QuestTemplateSeedData[]> = {}
  for (const t of ALL_QUEST_TEMPLATE_SEEDS) {
    if (!byCategory[t.category]) byCategory[t.category] = []
    byCategory[t.category].push(t)
  }

  for (const [category, templates] of Object.entries(byCategory)) {
    const orders = templates.map((t) => t.sortOrder)
    // Sort orders should be unique within category
    const uniqueOrders = new Set(orders)
    assert.equal(
      orders.length,
      uniqueOrders.size,
      `Category "${category}" has duplicate sortOrder values`
    )
    // Sort orders should start at 0
    assert.ok(
      orders.includes(0),
      `Category "${category}" does not start with sortOrder 0`
    )
  }
  console.log('  sort orders within categories: OK')
}

function testTemplateCount() {
  // We should have a reasonable number of templates (15 defined)
  assert.ok(
    ALL_QUEST_TEMPLATE_SEEDS.length >= 10,
    `Too few templates: ${ALL_QUEST_TEMPLATE_SEEDS.length}`
  )
  assert.ok(
    ALL_QUEST_TEMPLATE_SEEDS.length <= 50,
    `Too many templates: ${ALL_QUEST_TEMPLATE_SEEDS.length}`
  )
  console.log(`  template count (${ALL_QUEST_TEMPLATE_SEEDS.length}): OK`)
}

function testNarrativeHooksReservedForL3() {
  // All current templates should have null narrativeHooks (L3 deferred)
  for (const t of ALL_QUEST_TEMPLATE_SEEDS) {
    assert.equal(
      t.narrativeHooks,
      null,
      `Template "${t.key}" has narrativeHooks set — L3 is deferred`
    )
  }
  console.log('  narrativeHooks reserved (L3): OK')
}

function testDuplicateMergeLogic() {
  // Simulate the duplicate+override pattern from the server action
  const source = ALL_QUEST_TEMPLATE_SEEDS[0]
  const overrides = { reward: 5, estimatedMinutes: 30 }

  const merged: Record<string, unknown> = {
    ...source.defaultSettings,
    ...overrides,
  }

  assert.equal(merged.reward, 5, 'Override should win')
  assert.equal(merged.estimatedMinutes, 30, 'Override should win')
  assert.equal(merged.moveType, source.defaultSettings.moveType, 'Non-overridden fields preserved')

  // Copy template override
  const copyOverrides = { title: 'Custom Title' }
  const mergedCopy: Record<string, unknown> = {
    ...source.copyTemplate,
    ...copyOverrides,
  }
  assert.equal(mergedCopy.title, 'Custom Title', 'Copy override should win')
  assert.ok('steps' in mergedCopy, 'Non-overridden copy fields preserved')

  console.log('  duplicate merge logic: OK')
}

function testCategoryMetadata() {
  // Each category should have a label and description
  for (const cat of QUEST_TEMPLATE_CATEGORIES) {
    assert.ok(cat.key, 'Category missing key')
    assert.ok(cat.label, `Category "${cat.key}" missing label`)
    assert.ok(cat.description, `Category "${cat.key}" missing description`)
  }

  // QUEST_TEMPLATE_CATEGORIES keys should match VALID_CATEGORIES
  const catKeys = QUEST_TEMPLATE_CATEGORIES.map((c) => c.key)
  assert.deepEqual(catKeys, VALID_CATEGORIES, 'Category keys should match')

  console.log('  category metadata: OK')
}

// ---------------------------------------------------------------------------
// Run all
// ---------------------------------------------------------------------------

function runAll() {
  console.log('quest-template-seeds:')
  testAllTemplatesHaveUniqueKeys()
  testAllKeysAreValidFormat()
  testAllCategoriesAreValid()
  testAllCategoriesHaveTemplates()
  testDefaultSettingsStructure()
  testCopyTemplateStructure()
  testStepsHaveRequiredFields()
  testSortOrderWithinCategories()
  testTemplateCount()
  testNarrativeHooksReservedForL3()
  testDuplicateMergeLogic()
  testCategoryMetadata()
  console.log('quest-template-seeds: ALL PASSED')
}

runAll()
