/**
 * Face Context Index — Tests
 *
 * Verifies structural completeness and internal consistency of
 * FACE_CONTEXT_INDEX static data object.
 *
 * Run with: npx tsx src/lib/orientation-quest/__tests__/face-context-index.test.ts
 */

import {
  FACE_CONTEXT_INDEX,
  ORDERED_FACES,
  getPrimaryFieldKeys,
  getAllOwnedFieldKeys,
  scoreFacesByText,
  getFaceForField,
  validateFieldSlotCoverage,
} from '../face-context-index'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// ---------------------------------------------------------------------------
// Test: all 6 canonical faces defined
// ---------------------------------------------------------------------------
function testAllFacesDefined() {
  const keys = Object.keys(FACE_CONTEXT_INDEX).sort()
  assert(keys.length === 6, 'Should have exactly 6 faces')
  assert(
    JSON.stringify(keys) ===
      JSON.stringify(['architect', 'challenger', 'diplomat', 'regent', 'sage', 'shaman']),
    'Face keys must be the 6 canonical faces',
  )
}

// ---------------------------------------------------------------------------
// Test: each entry has required top-level keys
// ---------------------------------------------------------------------------
function testEntryShape() {
  for (const face of ORDERED_FACES) {
    const entry = FACE_CONTEXT_INDEX[face]
    assert(entry.face === face, `face.face should equal "${face}"`)
    assert(typeof entry.label === 'string' && entry.label.length > 0, `${face}: label required`)
    assert(typeof entry.role === 'string' && entry.role.length > 0, `${face}: role required`)
    assert(typeof entry.mission === 'string' && entry.mission.length > 0, `${face}: mission required`)
    assert(typeof entry.color === 'string' && entry.color.length > 0, `${face}: color required`)
    assert(typeof entry.trigram === 'string' && entry.trigram.length > 0, `${face}: trigram required`)
    assert(entry.semantic_intent != null, `${face}: semantic_intent required`)
    assert(Array.isArray(entry.field_slots) && entry.field_slots.length > 0, `${face}: field_slots required`)
    assert(entry.mapping_cues != null, `${face}: mapping_cues required`)
  }
}

// ---------------------------------------------------------------------------
// Test: trigram assignments match iching-faces.ts
// ---------------------------------------------------------------------------
function testTrigramAssignments() {
  const expected: Record<string, string> = {
    shaman: 'Earth',
    challenger: 'Fire',
    regent: 'Lake',
    architect: 'Heaven',
    diplomat: 'Wind',
    sage: 'Mountain',
  }
  for (const face of ORDERED_FACES) {
    assert(
      FACE_CONTEXT_INDEX[face].trigram === expected[face],
      `${face}: trigram should be "${expected[face]}"`,
    )
  }
}

// ---------------------------------------------------------------------------
// Test: entry sentences match face-sentences.ts FACE_SENTENCES
// ---------------------------------------------------------------------------
function testEntrySentences() {
  const expected: Record<string, string> = {
    shaman:
      "Enter through the mythic threshold: the residency as ritual space, Wendell's technology as a bridge between worlds. Your journey begins in belonging.",
    challenger:
      "Enter through the edge: the residency as a proving ground, Wendell's technology as a lever. Your journey begins in action.",
    regent:
      "Enter through the order: the residency as a house with roles and rules, Wendell's technology as a tool for the collective. Your journey begins in structure.",
    architect:
      "Enter through the blueprint: the residency as a project to build, Wendell's technology as an advantage. Your journey begins in strategy.",
    diplomat:
      "Enter through the weave: the residency as a relational field, Wendell's technology as a connector. Your journey begins in care.",
    sage:
      "Enter through the whole: the residency as one expression of emergence, Wendell's technology as part of the flow. Your journey begins in integration.",
  }
  for (const face of ORDERED_FACES) {
    assert(
      FACE_CONTEXT_INDEX[face].semantic_intent.entry_sentence === expected[face],
      `${face}: entry_sentence must match FACE_SENTENCES`,
    )
  }
}

// ---------------------------------------------------------------------------
// Test: each face has at least one primary field slot with non-empty prompts
// ---------------------------------------------------------------------------
function testFieldSlots() {
  for (const face of ORDERED_FACES) {
    const primary = FACE_CONTEXT_INDEX[face].field_slots.filter((s) => s.is_primary)
    assert(primary.length > 0, `${face}: must have at least one primary field slot`)
    for (const slot of FACE_CONTEXT_INDEX[face].field_slots) {
      assert(slot.field_key.trim().length > 0, `${face}: field_key must not be empty`)
      assert(
        slot.elicitation_prompt.trim().length > 0,
        `${face}: elicitation_prompt must not be empty`,
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Test: mapping cues have adequate keywords and phrase patterns
// ---------------------------------------------------------------------------
function testMappingCues() {
  for (const face of ORDERED_FACES) {
    const { mapping_cues } = FACE_CONTEXT_INDEX[face]
    assert(
      mapping_cues.keywords.length >= 3,
      `${face}: must have at least 3 mapping keywords`,
    )
    assert(
      mapping_cues.phrase_patterns.length >= 3,
      `${face}: must have at least 3 phrase patterns`,
    )
    assert(
      mapping_cues.dominant_channels.length >= 1,
      `${face}: must have at least 1 dominant channel`,
    )
  }
}

// ---------------------------------------------------------------------------
// Test: getPrimaryFieldKeys
// ---------------------------------------------------------------------------
function testGetPrimaryFieldKeys() {
  const shaman = getPrimaryFieldKeys('shaman')
  assert(shaman.includes('description'), 'shaman: must own description')
  assert(shaman.includes('safety_notes'), 'shaman: must own safety_notes')
  assert(shaman.includes('compatible_emotion_channels'), 'shaman: must own compatible_emotion_channels')

  const challenger = getPrimaryFieldKeys('challenger')
  assert(challenger.includes('target_effect'), 'challenger: must own target_effect')
  assert(challenger.includes('typical_output_type'), 'challenger: must own typical_output_type')
  assert(challenger.includes('compatible_lock_types'), 'challenger: must own compatible_lock_types')

  const regent = getPrimaryFieldKeys('regent')
  assert(regent.includes('wcgs_stage'), 'regent: must own wcgs_stage')
  assert(regent.includes('quest_usage'), 'regent: must own quest_usage')
  assert(regent.includes('bar_integration'), 'regent: must own bar_integration')

  const architect = getPrimaryFieldKeys('architect')
  assert(architect.includes('move_category'), 'architect: must own move_category')
  assert(architect.includes('prompt_templates'), 'architect: must own prompt_templates')
  assert(architect.includes('purpose'), 'architect: must own purpose')

  const diplomat = getPrimaryFieldKeys('diplomat')
  assert(diplomat.includes('compatible_nations'), 'diplomat: must own compatible_nations')
  assert(diplomat.includes('compatible_archetypes'), 'diplomat: must own compatible_archetypes')

  const sage = getPrimaryFieldKeys('sage')
  assert(sage.includes('move_name'), 'sage: must own move_name')
  assert(
    sage.includes('quest_usage.suggested_follow_up_moves'),
    'sage: must own quest_usage.suggested_follow_up_moves',
  )
}

// ---------------------------------------------------------------------------
// Test: getAllOwnedFieldKeys covers all TransformationMove required fields
// ---------------------------------------------------------------------------
function testAllOwnedFieldKeys() {
  const owned = getAllOwnedFieldKeys()
  const required = [
    'description',
    'target_effect',
    'typical_output_type',
    'compatible_lock_types',
    'compatible_emotion_channels',
    'wcgs_stage',
    'quest_usage',
    'bar_integration',
    'move_category',
    'prompt_templates',
    'purpose',
    'compatible_nations',
    'compatible_archetypes',
    'move_name',
    'safety_notes',
  ]
  for (const key of required) {
    assert(owned.includes(key), `getAllOwnedFieldKeys must include "${key}"`)
  }
  // No duplicates
  const unique = new Set(owned)
  assert(owned.length === unique.size, 'getAllOwnedFieldKeys must have no duplicates')
}

// ---------------------------------------------------------------------------
// Test: scoreFacesByText routing
// ---------------------------------------------------------------------------
function testScoreFacesByText() {
  const scores = scoreFacesByText('some text')
  assert(scores.length === 6, 'scoreFacesByText should return 6 entries')

  // Results sorted descending
  for (let i = 1; i < scores.length; i++) {
    assert(
      scores[i - 1].score >= scores[i].score,
      'scoreFacesByText results must be sorted descending',
    )
  }

  // Challenger wins for action/obstacle text
  const challengerScores = scoreFacesByText(
    'need to push through this barrier and prove that it works, facing obstacle',
  )
  assert(challengerScores[0].face === 'challenger', 'challenger should win for action/barrier text')

  // Shaman wins for ritual/belonging text
  const shamanScores = scoreFacesByText(
    'crossing a threshold into sacred ritual belonging, bridge between worlds',
  )
  assert(shamanScores[0].face === 'shaman', 'shaman should win for ritual/threshold text')

  // Sage wins for integration/whole text
  const sageScores = scoreFacesByText(
    'seeing the whole picture and how does this all fit together in integration and emergence',
  )
  assert(sageScores[0].face === 'sage', 'sage should win for integration/whole text')
}

// ---------------------------------------------------------------------------
// Test: getFaceForField
// ---------------------------------------------------------------------------
function testGetFaceForField() {
  assert(getFaceForField('description')?.face === 'shaman', 'description owned by shaman')
  assert(getFaceForField('target_effect')?.face === 'challenger', 'target_effect owned by challenger')
  assert(getFaceForField('wcgs_stage')?.face === 'regent', 'wcgs_stage owned by regent')
  assert(getFaceForField('prompt_templates')?.face === 'architect', 'prompt_templates owned by architect')
  assert(getFaceForField('compatible_nations')?.face === 'diplomat', 'compatible_nations owned by diplomat')
  assert(getFaceForField('move_name')?.face === 'sage', 'move_name owned by sage')
  assert(getFaceForField('nonexistent_field') === undefined, 'unknown field returns undefined')
}

// ---------------------------------------------------------------------------
// Test: validateFieldSlotCoverage reports no unknown field keys
// ---------------------------------------------------------------------------
function testFieldSlotCoverage() {
  const unknown = validateFieldSlotCoverage()
  assert(
    unknown.length === 0,
    `All field slot keys must be valid TransformationMove keys; unknown: ${unknown.join(', ')}`,
  )
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
const tests = [
  testAllFacesDefined,
  testEntryShape,
  testTrigramAssignments,
  testEntrySentences,
  testFieldSlots,
  testMappingCues,
  testGetPrimaryFieldKeys,
  testAllOwnedFieldKeys,
  testScoreFacesByText,
  testGetFaceForField,
  testFieldSlotCoverage,
]

let passed = 0
for (const test of tests) {
  try {
    test()
    passed++
    console.log(`✓ ${test.name}`)
  } catch (e) {
    console.error(`✗ ${test.name}:`, (e as Error).message)
    process.exit(1)
  }
}
console.log(`\n${passed}/${tests.length} tests passed`)
