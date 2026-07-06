import * as assert from 'node:assert'
import { getMoveCardById } from '../assemble'
import { composeDeckPracticeCopy, inferSatisfactionSpirit } from '../practice-copy'
import { recommendDeckCardPractice, type DeckPracticeRecommendationInput } from '../practice-recommendations'

assert.strictEqual(inferSatisfactionSpirit({ channel: 'neutrality', altitude: 'satisfied' }), 'peace')
assert.strictEqual(inferSatisfactionSpirit({ channel: 'anger', altitude: 'satisfied' }), 'triumph')
assert.strictEqual(inferSatisfactionSpirit({ channel: 'sadness', altitude: 'satisfied' }), 'poignance')
assert.strictEqual(inferSatisfactionSpirit({ channel: 'joy', altitude: 'satisfied' }), 'bliss')
assert.strictEqual(inferSatisfactionSpirit({ channel: 'fear', altitude: 'satisfied' }), 'wonder')
assert.strictEqual(inferSatisfactionSpirit({ channel: 'fear', altitude: 'neutral' }), null)

const quickInput: DeckPracticeRecommendationInput = {
  card: getMoveCardById('OPEN-GR-CHALLENGER')!,
  mode: 'quick',
  orientation: 'external',
  subject: 'other',
  blocker: 'I need to ask for help without overexplaining.',
}
const quickRecommendation = recommendDeckCardPractice(quickInput)
const quickCopy = composeDeckPracticeCopy(quickInput, quickRecommendation)

assert.strictEqual(quickCopy.version, 'deck-practice-copy-v0')
assert.strictEqual(quickCopy.cardId, 'OPEN-GR-CHALLENGER')
assert.strictEqual(quickCopy.emotionalVector, null)
assert.ok(quickCopy.reviewFlags.includes('missing_vector'), 'quick copy can honestly flag missing vector')
assert.ok(quickCopy.reviewFlags.includes('external_show_up'), 'quick external Show Up is visible for review')
assert.match(quickCopy.protocolIntro, /show up rep/)
assert.ok(quickCopy.expectedOutput.includes('clean ask') || quickCopy.expectedOutput.includes('next action'))
assert.ok(quickCopy.stepCopy.length >= 3)
assert.ok(quickCopy.stepCopy.every((step) => step.instruction.trim() && step.expectedOutput.trim()), 'every protocol step has an inspectable output')
assert.match(quickCopy.saveOrShareSummary, /OPEN-GR-CHALLENGER/)

const sadnessInput: DeckPracticeRecommendationInput = {
  card: getMoveCardById('OPEN-GR-CHALLENGER')!,
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
  blocker: 'I feel the distance from what I care about.',
}
const sadnessRecommendation = recommendDeckCardPractice(sadnessInput)
const sadnessCopy = composeDeckPracticeCopy(sadnessInput, sadnessRecommendation)

assert.strictEqual(sadnessCopy.satisfactionSpirit, 'poignance')
assert.strictEqual(sadnessCopy.emotionalVector, 'sadness:dissatisfied -> sadness:satisfied')
assert.match(sadnessCopy.protocolIntro, /spirit of poignance/)
assert.ok(!sadnessCopy.reviewFlags.includes('missing_vector'))
assert.ok(!sadnessCopy.reviewFlags.includes('missing_blocker_context'))
assert.ok(sadnessCopy.whyThisTool.includes(sadnessRecommendation.selectedTool.barsName))

const joyInput: DeckPracticeRecommendationInput = {
  card: getMoveCardById('CLEAN-RA-SAGE')!,
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'joy', altitude: 'dissatisfied' },
  desired: { channel: 'joy', altitude: 'satisfied' },
  blocker: 'The joy feels hard to trust.',
}
const joyRecommendation = recommendDeckCardPractice(joyInput)
const joyCopy = composeDeckPracticeCopy(joyInput, joyRecommendation)

assert.strictEqual(joyRecommendation.selectedTool.id, 'make_it_a_game')
assert.strictEqual(joyCopy.satisfactionSpirit, 'bliss')
assert.strictEqual(joyCopy.emotionalVector, 'joy:dissatisfied -> joy:satisfied')
assert.strictEqual(joyRecommendation.selectedTool.tier, 'mvp')
assert.ok(!joyCopy.reviewFlags.includes('next_tier_tool'), 'MVP joy recommendations should not be flagged as next-tier')

console.log('✓ allyship-deck practice copy contract tests OK')
