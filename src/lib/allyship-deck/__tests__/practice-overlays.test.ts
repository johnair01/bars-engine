import * as assert from 'node:assert'
import { getMoveCardById } from '../assemble'
import {
  buildCardPracticeOverlay,
  buildPilotCardPracticeOverlays,
  getCardPracticeOverlay,
  PILOT_CARD_PRACTICE_OVERLAY_IDS,
} from '../practice-overlays'

const overlays = buildPilotCardPracticeOverlays()

assert.strictEqual(PILOT_CARD_PRACTICE_OVERLAY_IDS.length, 10)
assert.strictEqual(overlays.length, 10)

for (const cardId of PILOT_CARD_PRACTICE_OVERLAY_IDS) {
  assert.ok(getMoveCardById(cardId), `pilot card ${cardId} exists`)
  assert.ok(getCardPracticeOverlay(cardId), `pilot card ${cardId} has overlay`)
}

assert.strictEqual(getCardPracticeOverlay('NOT-A-CARD'), null)
assert.throws(() => buildCardPracticeOverlay('NOT-A-CARD'), /was not found/)

const moves = new Set(overlays.map((overlay) => overlay.stableCardLens.move))
assert.deepStrictEqual(
  [...moves].sort(),
  ['clean_up', 'grow_up', 'open_up', 'show_up', 'wake_up'].sort(),
  'pilot covers all five WAVE moves',
)

const domains = new Set(overlays.map((overlay) => overlay.stableCardLens.domain))
assert.deepStrictEqual(
  [...domains].sort(),
  ['DIRECT_ACTION', 'GATHERING_RESOURCES', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'].sort(),
  'pilot covers all four domains',
)

const operations = new Set(overlays.map((overlay) => overlay.stableCardLens.operation))
assert.deepStrictEqual(
  [...operations].sort(),
  ['architect', 'challenger', 'diplomat', 'regent', 'sage', 'shaman'].sort(),
  'pilot includes all six operations',
)

let quickExampleCount = 0
let nextTierOrJoyFlagCount = 0
const wakeCandidateTools = new Set<string>()
const cleanCandidateTools = new Set<string>()
const wakeBlockerShapes = new Set<string>()
const cleanBlockerShapes = new Set<string>()

for (const overlay of overlays) {
  const sourceCard = getMoveCardById(overlay.cardId)!
  assert.strictEqual(overlay.version, 'card-practice-overlay-v0')
  assert.strictEqual(overlay.cardTitle, sourceCard.title)
  assert.deepStrictEqual(overlay.stableCardLens, {
    move: sourceCard.move,
    operation: sourceCard.operation,
    domain: sourceCard.domain,
    outputBar: sourceCard.outputBar,
  })

  assert.match(overlay.defaultPracticeIntention, /Practice /)
  assert.ok(overlay.defaultPracticeIntention.includes(sourceCard.outputBar), `${overlay.cardId} intention names output BAR`)
  assert.ok(overlay.preferredTools.length >= 3, `${overlay.cardId} has preferred tools`)
  assert.ok(overlay.preferredTools.every((tool) => tool.toolId && tool.rating && tool.reasons.length > 0), `${overlay.cardId} preferred tools include reasons`)
  assert.ok(overlay.sampleVectors.length >= 1, `${overlay.cardId} has sample vectors`)
  assert.ok(overlay.deepPracticeExamples.length >= 1, `${overlay.cardId} has deep practice examples`)
  assert.strictEqual(overlay.sampleVectors.length, overlay.deepPracticeExamples.length, `${overlay.cardId} sample vectors match deep examples`)
  assert.ok(overlay.outputPossibilities.length > 0, `${overlay.cardId} has output possibilities`)
  assert.ok(overlay.sampleVectors.every((sample) => sample.blockerShape && sample.topCandidateToolIds.length >= 3), `${overlay.cardId} samples include blocker shape and top candidates`)

  if (overlay.quickPracticeExample) quickExampleCount++
  if (overlay.reviewFlags.includes('next_tier_tool') || overlay.reviewFlags.includes('joy_bliss_sample')) nextTierOrJoyFlagCount++
  if (overlay.stableCardLens.move === 'wake_up') {
    for (const sample of overlay.sampleVectors) {
      wakeBlockerShapes.add(sample.blockerShape)
      sample.topCandidateToolIds.forEach((toolId) => wakeCandidateTools.add(toolId))
    }
  }
  if (overlay.stableCardLens.move === 'clean_up') {
    for (const sample of overlay.sampleVectors) {
      cleanBlockerShapes.add(sample.blockerShape)
      sample.topCandidateToolIds.forEach((toolId) => cleanCandidateTools.add(toolId))
    }
  }

  for (const example of [overlay.quickPracticeExample, ...overlay.deepPracticeExamples].filter(Boolean)) {
    assert.ok(example!.stepCopy.length >= 3, `${overlay.cardId} example has steps`)
    assert.ok(example!.stepCopy.every((step) => step.instruction.trim() && step.expectedOutput.trim()), `${overlay.cardId} every step has expected output`)
    assert.ok(example!.expectedOutput.trim(), `${overlay.cardId} example has expected output summary`)
    assert.ok(example!.completionCriteria.length > 0, `${overlay.cardId} example has completion criteria`)
    assert.strictEqual(example!.cardId, overlay.cardId, `${overlay.cardId} example keeps card id`)
  }
}

assert.ok(quickExampleCount >= 4, 'at least four pilot overlays include quick examples')
assert.ok(nextTierOrJoyFlagCount >= 1, 'yellow next-tier or joy/bliss cases are flagged')
for (const shape of ['body_unclear_signal', 'field_confusion', 'part_projection', 'capture_artifact']) {
  assert.ok(wakeBlockerShapes.has(shape), `Wake diagnostic samples include ${shape}`)
}
for (const toolId of ['felt_thread', 'put_it_on_the_board', 'charge_dialogue_321', 'bar_capture']) {
  assert.ok(wakeCandidateTools.has(toolId), `Wake diagnostic candidates include ${toolId}`)
}
for (const shape of ['belief_story', 'field_confusion', 'part_projection', 'body_unclear_signal', 'capture_artifact']) {
  assert.ok(cleanBlockerShapes.has(shape), `Clean diagnostic samples include ${shape}`)
}
for (const toolId of ['story_turnaround', 'charge_dialogue_321', 'put_it_on_the_board', 'felt_thread', 'bar_capture']) {
  assert.ok(cleanCandidateTools.has(toolId), `Clean diagnostic candidates include ${toolId}`)
}

const cleanRaiseSage = overlays.find((overlay) => overlay.cardId === 'CLEAN-RA-SAGE')
assert.ok(cleanRaiseSage, 'CLEAN-RA-SAGE overlay exists')
const cleanRaiseSageJoy = cleanRaiseSage.sampleVectors.find((sample) => sample.blockerShape === 'joy_trust')
assert.ok(cleanRaiseSageJoy, 'CLEAN-RA-SAGE includes a joy/bliss diagnostic sample')
assert.strictEqual(cleanRaiseSageJoy.expectedFirstToolId, 'make_it_a_game')
assert.ok(cleanRaiseSageJoy.topCandidateToolIds.includes('make_it_a_game'), 'joy/bliss candidates include Make It A Game')
assert.ok(cleanRaiseSage.reviewFlags.includes('joy_bliss_sample'), 'joy/bliss sample remains visible for review')
assert.ok(!cleanRaiseSage.reviewFlags.includes('next_tier_tool'), 'joy/bliss sample no longer depends on a next-tier tool')
assert.strictEqual(cleanRaiseSage.reviewStatus, 'pilot')

console.log('✓ allyship-deck practice overlay tests OK')
