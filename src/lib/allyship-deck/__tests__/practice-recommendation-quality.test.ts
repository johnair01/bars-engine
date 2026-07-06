import * as assert from 'node:assert'
import type { EmotionalAlchemyToolId } from '@/lib/alchemy/tool-registry'
import { getMoveCardById } from '../assemble'
import {
  recommendDeckCardPractice,
  type DeckPracticeRecommendation,
} from '../practice-recommendations'

const requiredCardIds = [
  'OPEN-GR-CHALLENGER',
  'OPEN-GR-SHAMAN',
  'OPEN-GR-DIPLOMAT',
  'OPEN-GR-SAGE',
  'CLEAN-RA-SAGE',
  'SHOW-DA-CHALLENGER',
] as const

for (const cardId of requiredCardIds) {
  assert.ok(getMoveCardById(cardId), `fixture card ${cardId} exists`)
}

function card(cardId: (typeof requiredCardIds)[number]) {
  const moveCard = getMoveCardById(cardId)
  assert.ok(moveCard, `fixture card ${cardId} exists`)
  return moveCard
}

function deepSameChannel(cardId: (typeof requiredCardIds)[number], channel: 'anger' | 'sadness' | 'fear' | 'joy' | 'neutrality') {
  return recommendDeckCardPractice({
    card: card(cardId),
    mode: 'deep',
    orientation: 'internal',
    subject: 'self',
    present: { channel, altitude: 'dissatisfied' },
    desired: { channel, altitude: 'satisfied' },
  })
}

function rankedTool(recommendation: DeckPracticeRecommendation, toolId: EmotionalAlchemyToolId) {
  const found = recommendation.rankedTools.find((ranked) => ranked.tool.id === toolId)
  assert.ok(found, `ranked tool ${toolId} exists`)
  return found
}

function assertVectorReason(recommendation: DeckPracticeRecommendation, channel: string) {
  assert.ok(
    recommendation.reasons.some((reason) => reason.includes(`${channel}:dissatisfied -> ${channel}:satisfied`)),
    `${channel} vector is visible in recommendation reasons`,
  )
}

const goldenCards = ['OPEN-GR-CHALLENGER', 'CLEAN-RA-SAGE', 'SHOW-DA-CHALLENGER'] as const
const channels = ['sadness', 'anger', 'fear', 'joy', 'neutrality'] as const

for (const cardId of goldenCards) {
  const winners = new Set<EmotionalAlchemyToolId>()
  for (const channel of channels) {
    const recommendation = deepSameChannel(cardId, channel)
    winners.add(recommendation.selectedTool.id)
    assertVectorReason(recommendation, channel)
    assert.strictEqual(recommendation.selectedPracticeLens, 'clean_up', `${cardId} ${channel} starts by stabilizing the charge`)
    assert.ok(recommendation.rankedTools.length >= 3, `${cardId} ${channel} returns top candidates`)
    assert.ok(recommendation.expectedOutputKinds.length > 0, `${cardId} ${channel} returns inspectable output kinds`)
    assert.ok(recommendation.protocol.length >= 3, `${cardId} ${channel} returns executable protocol`)
  }
  assert.ok(winners.size >= 3, `${cardId} vector matrix should not collapse into one tool`)
}

const quickOpenChallenger = recommendDeckCardPractice({
  card: card('OPEN-GR-CHALLENGER'),
  mode: 'quick',
  orientation: 'external',
  subject: 'other',
})

assert.strictEqual(quickOpenChallenger.selectedPracticeLens, 'show_up')
assert.strictEqual(quickOpenChallenger.selectedTool.id, 'clean_line')
assert.notStrictEqual(quickOpenChallenger.selectedTool.id, 'happy_apples', 'quick action should not default to appreciation just because the card is Open/Gather')
assert.ok(
  quickOpenChallenger.expectedOutputKinds.some((kind) => ['clean_line', 'next_action', 'field_map', 'quest_seed', 'internal_commitment'].includes(kind)),
  'quick mode produces action-shaped or commitment-shaped output',
)

const fearShaman = deepSameChannel('OPEN-GR-SHAMAN', 'fear')
const fearChallenger = deepSameChannel('OPEN-GR-CHALLENGER', 'fear')
const fearDiplomat = deepSameChannel('OPEN-GR-DIPLOMAT', 'fear')
const fearSage = deepSameChannel('OPEN-GR-SAGE', 'fear')

assert.ok(fearShaman.reasons.some((reason) => reason.includes('shaman operation')), 'Shaman lens is visible')
assert.ok(fearChallenger.reasons.some((reason) => reason.includes('challenger operation')), 'Challenger lens is visible')
assert.ok(fearDiplomat.reasons.some((reason) => reason.includes('diplomat operation')), 'Diplomat lens is visible')
assert.ok(fearSage.reasons.some((reason) => reason.includes('sage operation')), 'Sage lens is visible')
assert.notStrictEqual(fearShaman.rankedTools[0].score, fearChallenger.rankedTools[0].score, 'operation lens changes ranking strength without overpowering vector')
assert.notStrictEqual(fearChallenger.reasons.join('|'), fearSage.reasons.join('|'), 'operation lens changes reasoning')

const sadnessBase = deepSameChannel('OPEN-GR-CHALLENGER', 'sadness')
const sadnessBelief = recommendDeckCardPractice({
  card: card('OPEN-GR-CHALLENGER'),
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
  blocker: 'I have a belief that I am not enough unless this is perfect.',
})
const sadnessBoundary = recommendDeckCardPractice({
  card: card('OPEN-GR-CHALLENGER'),
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
  blocker: 'I need to send an ask and set a clean boundary in the message.',
})
const sadnessBody = recommendDeckCardPractice({
  card: card('OPEN-GR-CHALLENGER'),
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
  blocker: 'My body feels heavy and tight.',
})
const sadnessMap = recommendDeckCardPractice({
  card: card('OPEN-GR-CHALLENGER'),
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
  blocker: 'The roles and resources are unclear and I cannot see the sequence.',
})
const sadnessPart = recommendDeckCardPractice({
  card: card('OPEN-GR-CHALLENGER'),
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
  blocker: 'A triggered part wants to disappear.',
})

assert.strictEqual(sadnessBelief.selectedTool.id, 'felt_thread', 'belief hint should not dominate sadness vector')
assert.ok(rankedTool(sadnessBelief, 'story_turnaround').score > rankedTool(sadnessBase, 'story_turnaround').score, 'belief hint raises Story Turnaround')
assert.ok(rankedTool(sadnessBelief, 'story_turnaround').reasons.some((reason) => reason.includes('belief work')))
assert.ok(rankedTool(sadnessBoundary, 'clean_line').score > rankedTool(sadnessBase, 'clean_line').score, 'ask/boundary hint raises Clean Line')
assert.ok(rankedTool(sadnessBoundary, 'clean_line').reasons.some((reason) => reason.includes('ask or boundary')))
assert.strictEqual(sadnessBody.selectedTool.id, 'felt_thread', 'body hint reinforces felt-sense work')
assert.strictEqual(sadnessPart.selectedTool.id, 'charge_dialogue_321', 'part hint can select 321 when sadness needs a speaking part')
assert.ok(rankedTool(sadnessMap, 'put_it_on_the_board').score > rankedTool(sadnessBase, 'put_it_on_the_board').score, 'field hint raises mapping')
assert.ok(rankedTool(sadnessMap, 'put_it_on_the_board').reasons.some((reason) => reason.includes('mapping the field')))

const deepSadness = deepSameChannel('OPEN-GR-CHALLENGER', 'sadness')
const deepAnger = deepSameChannel('OPEN-GR-CHALLENGER', 'anger')
const deepJoy = deepSameChannel('CLEAN-RA-SAGE', 'joy')

assert.strictEqual(deepSadness.selectedTool.id, 'felt_thread')
assert.strictEqual(deepAnger.selectedTool.id, 'charge_dialogue_321')
assert.strictEqual(deepJoy.selectedTool.id, 'make_it_a_game')
assert.notStrictEqual(quickOpenChallenger.selectedTool.id, deepSadness.selectedTool.id, 'quick and deep should not collapse')
assert.notStrictEqual(deepSadness.selectedTool.id, deepAnger.selectedTool.id, 'different vectors should produce different tools')

const joyTooManyOptions = recommendDeckCardPractice({
  card: card('CLEAN-RA-SAGE'),
  mode: 'deep',
  orientation: 'internal',
  subject: 'self',
  present: { channel: 'joy', altitude: 'dissatisfied' },
  desired: { channel: 'joy', altitude: 'satisfied' },
  blocker: 'There are too many options and I keep overpromising because every path sounds exciting.',
})
assert.strictEqual(joyTooManyOptions.selectedTool.id, 'make_it_a_game')
assert.ok(rankedTool(joyTooManyOptions, 'make_it_a_game').reasons.some((reason) => reason.includes('bounded game')))

console.log('✓ allyship-deck practice recommendation quality tests OK')
