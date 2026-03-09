/**
 * Transformation Encounter Geometry v0 — Tests
 * Spec: .specify/specs/transformation-encounter-geometry/spec.md
 *
 * Run with: npx tsx src/lib/transformation-encounter-geometry/__tests__/encounter-geometry.test.ts
 */

import {
  ENCOUNTER_TYPES,
  getAllEncounterTypes,
  getEncounterByCoordinate,
  getEncounterById,
  getEncountersForMove,
  getMoveGeometryAlignment,
  getNationGeometryBias,
  getArchetypeGeometryTendency,
  getEncountersByNationArchetypeMatch,
  interpretCoordinate,
} from '../index'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testEncounterTypes() {
  assert(ENCOUNTER_TYPES.length === 8, 'Should have exactly 8 encounter types')

  const ids = new Set(ENCOUNTER_TYPES.map((e) => e.encounter_id))
  assert(ids.size === 8, 'All encounter IDs should be unique')

  const coords = new Set(ENCOUNTER_TYPES.map((e) => JSON.stringify(e.coordinate)))
  assert(coords.size === 8, 'All coordinates should be unique')
}

function testCoordinateLookup() {
  const courageous = getEncounterByCoordinate({
    hide_seek: 'seek',
    truth_dare: 'dare',
    interior_exterior: 'exterior',
  })
  assert(courageous != null, 'Should find Courageous Action')
  assert(courageous!.encounter_id === 'courageous_action', 'Should be courageous_action')
}

function testEncounterById() {
  const hidden = getEncounterById('hidden_truth')
  assert(hidden != null, 'Should find Hidden Truth')
  assert(hidden!.coordinate.hide_seek === 'hide', 'Hidden Truth should be hide')
  assert(hidden!.coordinate.truth_dare === 'truth', 'Hidden Truth should be truth')
  assert(hidden!.coordinate.interior_exterior === 'interior', 'Hidden Truth should be interior')
}

function testMoveAlignment() {
  const experiment = getMoveGeometryAlignment('experiment')
  assert(experiment != null, 'Experiment should have alignment')
  assert(experiment!.hide_seek === 'seek', 'Experiment should be seek')
  assert(experiment!.truth_dare === 'dare', 'Experiment should be dare')
  assert(experiment!.interior_exterior === 'exterior', 'Experiment should be exterior')
}

function testEncountersForMove() {
  const forExperiment = getEncountersForMove('experiment')
  assert(forExperiment.length >= 1, 'Experiment should appear in at least one encounter')
  assert(
    forExperiment.some((e) => e.encounter_id === 'courageous_action'),
    'Courageous Action should include experiment'
  )
}

function testNationBias() {
  const argyra = getNationGeometryBias('Argyra')
  assert(argyra.hide_seek === 'seek', 'Argyra should bias Seek')
  assert(argyra.truth_dare === 'truth', 'Argyra should bias Truth')

  const lamenth = getNationGeometryBias('Lamenth')
  assert(lamenth.hide_seek === 'hide', 'Lamenth should bias Hide')
  assert(lamenth.interior_exterior === 'interior', 'Lamenth should bias Interior')
}

function testArchetypeTendency() {
  const boldHeart = getArchetypeGeometryTendency('bold-heart')
  assert(boldHeart.hide_seek === 'seek', 'Bold Heart should tend Seek')
  assert(boldHeart.truth_dare === 'dare', 'Bold Heart should tend Dare')
  assert(boldHeart.interior_exterior === 'exterior', 'Bold Heart should tend Exterior')
}

function testNationArchetypeMatch() {
  const forPyrakanth = getEncountersByNationArchetypeMatch('Pyrakanth')
  assert(forPyrakanth.length === 8, 'Should return all 8 types')
  // Pyrakanth biases Dare + Exterior; Courageous Action (seek/dare/exterior) should rank high
  const courageousIndex = forPyrakanth.findIndex((e) => e.encounter_id === 'courageous_action')
  assert(courageousIndex >= 0 && courageousIndex < 4, 'Courageous Action should rank in top half for Pyrakanth')
}

function testInterpretCoordinate() {
  const result = interpretCoordinate({
    hide_seek: 'seek',
    truth_dare: 'dare',
    interior_exterior: 'exterior',
  })
  assert(result.includes('external') || result.length > 0, 'Should produce interpretation')
}

// Run all tests
const tests = [
  testEncounterTypes,
  testCoordinateLookup,
  testEncounterById,
  testMoveAlignment,
  testEncountersForMove,
  testNationBias,
  testArchetypeTendency,
  testNationArchetypeMatch,
  testInterpretCoordinate,
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
