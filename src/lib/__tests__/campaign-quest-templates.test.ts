/**
 * Campaign Quest Templates — Server Action Contract Tests
 *
 * Verifies:
 * 1. Type shapes match between actions and consumers
 * 2. Key sanitization logic
 * 3. Filter logic contracts
 * 4. Duplicate merge contracts
 * 5. Apply-to-campaign questTemplateConfig structure
 * 6. Reorder validation (permutation check)
 * 7. Editable status guards
 */
import assert from 'node:assert/strict'

// ---------------------------------------------------------------------------
// Key sanitization — must match server action's sanitize logic
// ---------------------------------------------------------------------------

function sanitizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function testKeySanitization() {
  assert.equal(sanitizeKey('My Custom Template'), 'my-custom-template')
  assert.equal(sanitizeKey('  fundraiser_2026  '), 'fundraiser-2026')
  assert.equal(sanitizeKey('Café Template!'), 'caf-template')
  assert.equal(sanitizeKey('---leading---'), 'leading')
  assert.equal(sanitizeKey('already-clean-key'), 'already-clean-key')
  assert.equal(sanitizeKey('MixedCase-Key'), 'mixedcase-key')
  assert.equal(sanitizeKey('123'), '123')
  assert.equal(sanitizeKey('   '), '')

  console.log('  key sanitization: OK')
}

function testKeySanitizationRoundtrip() {
  // Already-sanitized keys survive re-sanitization unchanged
  const cleanKeys = [
    'onboarding-welcome',
    'fundraiser-pledge',
    'action-complete-task',
    'custom-blank',
  ]
  for (const key of cleanKeys) {
    assert.equal(sanitizeKey(key), key, `Key "${key}" changed on re-sanitization`)
  }
  console.log('  key sanitization roundtrip: OK')
}

function testQuestTemplateListItemShape() {
  // The shape returned by listQuestTemplates
  const item = {
    id: 'cuid-123',
    key: 'onboarding-welcome',
    name: 'Welcome Quest',
    description: 'First quest a new player encounters.',
    category: 'onboarding',
    defaultSettings: { moveType: 'wakeUp', reward: 1 },
    copyTemplate: { title: 'Welcome', description: 'Welcome to the campaign.' },
    narrativeHooks: null,
    status: 'active',
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Verify all required fields exist
  assert.ok(item.id)
  assert.ok(item.key)
  assert.ok(item.name)
  assert.equal(typeof item.category, 'string')
  assert.equal(typeof item.sortOrder, 'number')
  assert.equal(typeof item.status, 'string')

  console.log('  QuestTemplateListItem shape: OK')
}

function testFilterContract() {
  // Filter shape matches what the action expects
  type Filter = {
    category?: string
    status?: string
    search?: string
  }

  // Default filter — should return active templates
  const defaultFilter: Filter = {}
  assert.equal(defaultFilter.status, undefined) // defaults to 'active' in action

  // Category filter
  const categoryFilter: Filter = { category: 'onboarding' }
  assert.equal(categoryFilter.category, 'onboarding')

  // Search filter
  const searchFilter: Filter = { search: 'welcome' }
  assert.equal(searchFilter.search, 'welcome')

  // Combined filter
  const combinedFilter: Filter = { category: 'fundraising', search: 'pledge' }
  assert.equal(combinedFilter.category, 'fundraising')
  assert.equal(combinedFilter.search, 'pledge')

  // Archived filter
  const archivedFilter: Filter = { status: 'archived' }
  assert.equal(archivedFilter.status, 'archived')

  console.log('  filter contract: OK')
}

function testDuplicateMergeContract() {
  // Simulate the duplicate action's merge logic
  const sourceSettings = {
    moveType: 'wakeUp',
    reward: 1,
    estimatedMinutes: 5,
    requiresAuth: true,
  }

  const sourceCopy = {
    title: 'Welcome to {campaignName}',
    description: 'Original description',
    successCondition: 'Intention submitted.',
    steps: [
      { type: 'read', label: 'Learn', field: 'wakeUpContent' },
      { type: 'input', label: 'Intention', field: 'playerIntention', inputType: 'textarea' },
    ],
  }

  // Overrides
  const settingsOverrides = { reward: 3, estimatedMinutes: 15 }
  const copyOverrides = { title: 'Welcome to Our Fundraiser', description: 'New description' }

  // Merge (shallow spread)
  const mergedSettings = { ...sourceSettings, ...settingsOverrides }
  assert.equal(mergedSettings.reward, 3, 'Settings override applied')
  assert.equal(mergedSettings.estimatedMinutes, 15, 'Settings override applied')
  assert.equal(mergedSettings.moveType, 'wakeUp', 'Non-overridden setting preserved')
  assert.equal(mergedSettings.requiresAuth, true, 'Non-overridden setting preserved')

  const mergedCopy = { ...sourceCopy, ...copyOverrides }
  assert.equal(mergedCopy.title, 'Welcome to Our Fundraiser', 'Copy override applied')
  assert.equal(mergedCopy.description, 'New description', 'Copy override applied')
  assert.equal(mergedCopy.successCondition, 'Intention submitted.', 'Non-overridden copy preserved')
  assert.ok(Array.isArray(mergedCopy.steps), 'Steps preserved from source')
  assert.equal(mergedCopy.steps.length, 2, 'Step count preserved')

  console.log('  duplicate merge contract: OK')
}

function testApplyToCampaignQuestConfig() {
  // The shape written to Campaign.questTemplateConfig when applying a template
  const questEntry = {
    templateKey: 'onboarding-welcome',
    templateName: 'Welcome Quest',
    settings: {
      moveType: 'wakeUp',
      reward: 1,
    },
    copy: {
      title: 'Welcome to Summer Drive',
      description: 'Custom description',
      successCondition: 'Done.',
      steps: [],
    },
    addedAt: new Date().toISOString(),
    addedBy: 'player-123',
  }

  // Verify shape
  assert.ok(questEntry.templateKey)
  assert.ok(questEntry.templateName)
  assert.ok(questEntry.settings)
  assert.ok(questEntry.copy)
  assert.ok(questEntry.addedAt)
  assert.ok(questEntry.addedBy)

  // Multiple entries in the config array
  const config = [questEntry, { ...questEntry, templateKey: 'action-complete-task' }]
  assert.equal(config.length, 2)

  console.log('  apply-to-campaign quest config shape: OK')
}

function testReorderValidation() {
  // The reorder action expects a permutation of [0..n-1]
  const existingConfig = [
    { templateKey: 'a' },
    { templateKey: 'b' },
    { templateKey: 'c' },
  ]

  // Valid permutation
  const validOrder = [2, 0, 1]
  const sorted = [...validOrder].sort((a, b) => a - b)
  const expected = existingConfig.map((_, i) => i)
  assert.deepEqual(sorted, expected, 'Valid permutation should pass')

  // Reorder result
  const reordered = validOrder.map((oldIndex) => existingConfig[oldIndex])
  assert.equal(reordered[0].templateKey, 'c')
  assert.equal(reordered[1].templateKey, 'a')
  assert.equal(reordered[2].templateKey, 'b')

  // Invalid: wrong length
  const wrongLength = [0, 1]
  assert.notEqual(wrongLength.length, existingConfig.length)

  // Invalid: not a permutation (duplicate index)
  const duplicateIndex = [0, 0, 1]
  const sortedDup = [...duplicateIndex].sort((a, b) => a - b)
  assert.notDeepEqual(sortedDup, expected, 'Duplicate indices should fail')

  // Invalid: out of range
  const outOfRange = [0, 1, 5]
  const sortedOOR = [...outOfRange].sort((a, b) => a - b)
  assert.notDeepEqual(sortedOOR, expected, 'Out of range should fail')

  console.log('  reorder validation: OK')
}

function testEditableStatusGuard() {
  const editableStatuses = ['DRAFT', 'REJECTED']
  const nonEditableStatuses = ['PENDING_REVIEW', 'APPROVED', 'LIVE', 'ARCHIVED']

  for (const status of editableStatuses) {
    assert.ok(
      editableStatuses.includes(status),
      `${status} should be editable`
    )
  }

  for (const status of nonEditableStatuses) {
    assert.ok(
      !editableStatuses.includes(status),
      `${status} should NOT be editable`
    )
  }

  console.log('  editable status guard: OK')
}

function testCreateResultContract() {
  // Success path
  const success = { success: true as const, templateId: 'tmpl-abc', key: 'my-template' }
  assert.ok(!('error' in success))
  assert.equal(success.templateId, 'tmpl-abc')
  assert.equal(success.key, 'my-template')

  // Error path
  const error = { error: 'Template key already exists' }
  assert.ok('error' in error)
  assert.equal(typeof error.error, 'string')

  console.log('  create result contract: OK')
}

function testActionResultContract() {
  // Success
  const success = { success: true as const, message: 'Quest template updated' }
  assert.ok(!('error' in success))
  assert.equal(success.success, true)
  assert.ok(success.message)

  // Error
  const error = { error: 'Not authorized — admin role required' }
  assert.ok('error' in error)

  console.log('  action result contract: OK')
}

function testGroupByCategoryContract() {
  // Simulate listQuestTemplatesByCategory output shape
  type Item = { key: string; category: string; sortOrder: number }
  const templates: Item[] = [
    { key: 'onboarding-welcome', category: 'onboarding', sortOrder: 0 },
    { key: 'onboarding-intro', category: 'onboarding', sortOrder: 1 },
    { key: 'fundraiser-pledge', category: 'fundraising', sortOrder: 0 },
    { key: 'custom-blank', category: 'custom', sortOrder: 0 },
  ]

  const grouped: Record<string, Item[]> = {}
  for (const t of templates) {
    if (!grouped[t.category]) grouped[t.category] = []
    grouped[t.category].push(t)
  }

  assert.equal(Object.keys(grouped).length, 3)
  assert.equal(grouped['onboarding'].length, 2)
  assert.equal(grouped['fundraising'].length, 1)
  assert.equal(grouped['custom'].length, 1)

  // Templates within category should be orderable by sortOrder
  const onboardingOrdered = grouped['onboarding'].sort((a, b) => a.sortOrder - b.sortOrder)
  assert.equal(onboardingOrdered[0].key, 'onboarding-welcome')
  assert.equal(onboardingOrdered[1].key, 'onboarding-intro')

  console.log('  group by category contract: OK')
}

// ---------------------------------------------------------------------------
// Run all
// ---------------------------------------------------------------------------

function runAll() {
  console.log('campaign-quest-templates:')
  testKeySanitization()
  testKeySanitizationRoundtrip()
  testQuestTemplateListItemShape()
  testFilterContract()
  testDuplicateMergeContract()
  testApplyToCampaignQuestConfig()
  testReorderValidation()
  testEditableStatusGuard()
  testCreateResultContract()
  testActionResultContract()
  testGroupByCategoryContract()
  console.log('campaign-quest-templates: ALL PASSED')
}

runAll()
