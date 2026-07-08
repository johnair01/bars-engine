import * as assert from 'node:assert'
import { recommendChargeMetabolismMove } from '../recommendation-service'

const full = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  playerId: 'player-1',
  deckCardId: 'SHOW-DIRECT-CHALLENGER',
  present: 'restlessness',
  desired: 'peace',
  blocker: 'My energy is scattered and I do not know where to aim it.',
  orientation: 'external',
  subject: 'collective',
  superpower: 'storyteller',
  domain: 'RAISE_AWARENESS',
  cardContext: {
    deckCardId: 'SHOW-DIRECT-CHALLENGER',
    cardFamily: 'show_up',
    operation: 'challenger',
  },
})

assert.strictEqual(full.vectorStatus, 'full')
assert.deepStrictEqual(full.missingFields, [])
assert.strictEqual(full.nextQuestion, null)
assert.ok(full.routes.length > 0)
assert.ok(full.primaryRecommendation)
assert.ok(full.metabolizeRecommendation)
assert.ok(full.satisfactionRecommendation)
assert.ok(full.attemptDraft)
assert.ok(full.metabolizeAttemptDraft)
assert.ok(full.satisfactionAttemptDraft)
assert.strictEqual(full.routeHandRecommendations.length, 3)
assert.strictEqual(full.routeHandAttemptDrafts.length, 3)
assert.deepStrictEqual(
  full.routes[0].moves.map((move) => move.vector),
  [
    'joy:dissatisfied->joy:neutral',
    'joy:neutral->neutrality:neutral',
    'neutrality:neutral->neutrality:satisfied',
  ],
)
assert.deepStrictEqual(
  full.routeHandAttemptDrafts.map((draft) => draft.recommendationRole),
  ['metabolize', 'translate', 'transcend'],
)
assert.strictEqual(full.attemptDraft?.status, 'recommended')
assert.strictEqual(full.attemptDraft, full.metabolizeAttemptDraft)
assert.strictEqual(full.metabolizeAttemptDraft?.recommendationRole, 'metabolize')
assert.strictEqual(full.satisfactionAttemptDraft?.recommendationRole, 'transcend')
assert.strictEqual(full.attemptDraft?.context.sourceSurface, 'allyship_deck')
assert.strictEqual(full.attemptDraft?.context.deckCardId, 'SHOW-DIRECT-CHALLENGER')
assert.ok(full.attemptDraft?.recommendedPrimitiveIds.length)
assert.strictEqual(full.attemptDraft?.chosenPrimitiveId, full.metabolizeRecommendation?.primitiveMatch.primitive.id)
assert.strictEqual(
  full.satisfactionAttemptDraft?.chosenPrimitiveId,
  full.satisfactionRecommendation?.primitiveMatch.primitive.id,
)

const guidedDissatisfaction = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  deckCardId: 'WAKE-GATHER-RESOURCES',
  present: { channel: 'anger', altitude: 'dissatisfied' },
  desired: { channel: 'anger', altitude: 'satisfied' },
  orientation: 'internal',
  subject: 'self',
  superpower: 'coach',
  domain: 'GATHERING_RESOURCES',
  cardContext: {
    deckCardId: 'WAKE-GATHER-RESOURCES',
    cardFamily: 'wake_up',
    operation: 'gather_resources',
  },
})

assert.strictEqual(guidedDissatisfaction.vectorStatus, 'full')
assert.deepStrictEqual(guidedDissatisfaction.missingFields, [])
assert.deepStrictEqual(guidedDissatisfaction.presentState, { channel: 'anger', altitude: 'dissatisfied' })
assert.deepStrictEqual(guidedDissatisfaction.desiredState, { channel: 'anger', altitude: 'satisfied' })
assert.ok(guidedDissatisfaction.primaryRecommendation)
assert.ok(guidedDissatisfaction.attemptDraft)
assert.ok(guidedDissatisfaction.metabolizeRecommendation)
assert.ok(guidedDissatisfaction.satisfactionRecommendation)
assert.strictEqual(guidedDissatisfaction.metabolizeAttemptDraft?.recommendationRole, 'metabolize')
assert.strictEqual(guidedDissatisfaction.satisfactionAttemptDraft?.recommendationRole, 'transcend')
assert.strictEqual(guidedDissatisfaction.routeHandRecommendations.length, 2)
assert.deepStrictEqual(
  guidedDissatisfaction.routeHandAttemptDrafts.map((draft) => draft.recommendationRole),
  ['metabolize', 'transcend'],
)
assert.notStrictEqual(
  guidedDissatisfaction.metabolizeRecommendation?.edge.vector,
  guidedDissatisfaction.satisfactionRecommendation?.edge.vector,
)
assert.match(guidedDissatisfaction.attemptDraft?.vectorSnapshot?.blocker ?? '', /not been named/)

const guidedDomainNeed = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  deckCardId: 'WAKE-GATHER-RESOURCES',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'neutrality', altitude: 'satisfied' },
  blocker: 'The work needs awareness: something true, possible, or important needs to become visible.',
  orientation: 'external',
  subject: 'collective',
  superpower: 'storyteller',
  domain: 'RAISE_AWARENESS',
})

assert.strictEqual(guidedDomainNeed.vectorStatus, 'full')
assert.deepStrictEqual(guidedDomainNeed.missingFields, [])
assert.strictEqual(guidedDomainNeed.primaryRecommendation?.move.domain, 'RAISE_AWARENESS')
assert.match(guidedDomainNeed.primaryRecommendation?.move.blocker ?? '', /needs awareness/)

const partial = recommendChargeMetabolismMove({
  sourceSurface: 'daily_charge',
  present: 'grief',
  blocker: 'I know something matters but cannot tell what movement wants to happen.',
})

assert.strictEqual(partial.vectorStatus, 'partial')
assert.deepStrictEqual(partial.missingFields, ['desired'])
assert.strictEqual(partial.nextQuestion, 'What would resolution feel like?')
assert.strictEqual(partial.primaryRecommendation, null)
assert.deepStrictEqual(partial.routeHandRecommendations, [])
assert.deepStrictEqual(partial.routeHandAttemptDrafts, [])
assert.strictEqual(partial.metabolizeRecommendation, null)
assert.strictEqual(partial.satisfactionRecommendation, null)
assert.strictEqual(partial.attemptDraft, null)
assert.strictEqual(partial.metabolizeAttemptDraft, null)
assert.strictEqual(partial.satisfactionAttemptDraft, null)

const noVectorCampaign = recommendChargeMetabolismMove({
  sourceSurface: 'campaign_support',
  campaignRef: 'the-crossing',
  domain: 'GATHERING_RESOURCES',
  blocker: 'I want to help but do not know the useful role yet.',
})

assert.strictEqual(noVectorCampaign.vectorStatus, 'none')
assert.deepStrictEqual(noVectorCampaign.missingFields, ['present', 'desired'])
assert.strictEqual(noVectorCampaign.nextQuestion, 'What charge is alive right now?')
assert.strictEqual(noVectorCampaign.primaryRecommendation, null)
assert.deepStrictEqual(noVectorCampaign.routeHandRecommendations, [])
assert.deepStrictEqual(noVectorCampaign.routeHandAttemptDrafts, [])
assert.strictEqual(noVectorCampaign.metabolizeRecommendation, null)
assert.strictEqual(noVectorCampaign.satisfactionRecommendation, null)
assert.strictEqual(noVectorCampaign.attemptDraft, null)
assert.strictEqual(noVectorCampaign.metabolizeAttemptDraft, null)
assert.strictEqual(noVectorCampaign.satisfactionAttemptDraft, null)

const fullWithoutBlocker = recommendChargeMetabolismMove({
  sourceSurface: 'bar_tune',
  barId: 'bar-1',
  present: { channel: 'fear', altitude: 'dissatisfied' },
  desired: { channel: 'fear', altitude: 'neutral' },
  superpower: 'strategist',
  domain: 'GATHERING_RESOURCES',
})

assert.strictEqual(fullWithoutBlocker.vectorStatus, 'full')
assert.deepStrictEqual(fullWithoutBlocker.missingFields, [])
assert.ok(fullWithoutBlocker.primaryRecommendation)
assert.match(fullWithoutBlocker.primaryRecommendation?.move.blocker ?? '', /not been named/)

const oneCardRouteHand = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  present: { channel: 'sadness', altitude: 'neutral' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
})

assert.strictEqual(oneCardRouteHand.routeHandRecommendations.length, 1)
assert.strictEqual(oneCardRouteHand.routeHandAttemptDrafts.length, 1)
assert.deepStrictEqual(
  oneCardRouteHand.routes[0].moves.map((move) => move.vector),
  ['sadness:neutral->sadness:satisfied'],
)
assert.deepStrictEqual(
  oneCardRouteHand.routeHandAttemptDrafts.map((draft) => draft.recommendationRole),
  ['single'],
)

const twoCardRouteHand = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  present: { channel: 'fear', altitude: 'neutral' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
})

assert.strictEqual(twoCardRouteHand.routeHandRecommendations.length, 2)
assert.deepStrictEqual(
  twoCardRouteHand.routes[0].moves.map((move) => move.vector),
  [
    'fear:neutral->sadness:neutral',
    'sadness:neutral->sadness:satisfied',
  ],
)
assert.deepStrictEqual(
  twoCardRouteHand.routeHandAttemptDrafts.map((draft) => draft.recommendationRole),
  ['translate', 'transcend'],
)
assert.strictEqual(
  twoCardRouteHand.routeHandRecommendations[1].primitiveMatch.primitive.id,
  'restore_flow',
)

const operationPayload = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  present: { channel: 'joy', altitude: 'neutral' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
  blocker: 'I cannot receive the care inside this joy yet.',
})

assert.strictEqual(operationPayload.routeHandRecommendations.length, 2)
assert.strictEqual(operationPayload.routeHandRecommendations[0].edge.vector, 'joy:neutral->sadness:neutral')
assert.strictEqual(operationPayload.routeHandRecommendations[0].mechanicOperation?.title, 'Find The Care In The Joy')
assert.strictEqual(operationPayload.routeHandRecommendations[0].selectedPracticeLens, 'open_up')
assert.strictEqual(operationPayload.routeHandRecommendations[0].selectedPracticeVariant?.role, 'processing')
assert.match(operationPayload.routeHandRecommendations[0].practiceLensSelection?.reason ?? '', /availability/)
assert.strictEqual(operationPayload.routeHandAttemptDrafts[0].mechanicOperationSnapshot?.title, 'Find The Care In The Joy')
assert.strictEqual(operationPayload.routeHandAttemptDrafts[0].selectedPracticeLens, 'open_up')
assert.strictEqual(operationPayload.routeHandAttemptDrafts[0].selectedPracticeVariant?.role, 'processing')

const actionPayload = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  present: { channel: 'neutrality', altitude: 'neutral' },
  desired: { channel: 'joy', altitude: 'satisfied' },
  blocker: 'I know what is true and need to act.',
})

assert.strictEqual(actionPayload.routeHandRecommendations[0].mechanicOperation?.title, 'Find The Live Part')
assert.strictEqual(actionPayload.routeHandRecommendations[0].selectedPracticeLens, 'show_up')
assert.strictEqual(actionPayload.routeHandRecommendations[0].selectedPracticeVariant?.role, 'action')

const sadnessToPoignanceQuality = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  present: { channel: 'sadness', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
})
assert.deepStrictEqual(
  sadnessToPoignanceQuality.routeHandRecommendations.map((recommendation) => recommendation.primitiveMatch.primitive.id),
  ['name_care_distance', 'restore_flow'],
)

const neutralityToPeaceQuality = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  present: { channel: 'neutrality', altitude: 'dissatisfied' },
  desired: { channel: 'neutrality', altitude: 'satisfied' },
})
assert.deepStrictEqual(
  neutralityToPeaceQuality.routeHandRecommendations.map((recommendation) => recommendation.primitiveMatch.primitive.id),
  ['create_sequence', 'create_sequence'],
)

const angerToPoignanceQuality = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  present: { channel: 'anger', altitude: 'dissatisfied' },
  desired: { channel: 'sadness', altitude: 'satisfied' },
})
assert.strictEqual(
  angerToPoignanceQuality.routeHandRecommendations[1].primitiveMatch.primitive.id,
  'repair_without_performance',
)
assert.strictEqual(
  angerToPoignanceQuality.routeHandRecommendations[2].primitiveMatch.primitive.id,
  'restore_flow',
)

const channels = ['anger', 'sadness', 'fear', 'joy', 'neutrality'] as const
for (const presentChannel of channels) {
  for (const desiredChannel of channels) {
    const result = recommendChargeMetabolismMove({
      sourceSurface: 'allyship_deck',
      present: { channel: presentChannel, altitude: 'dissatisfied' },
      desired: { channel: desiredChannel, altitude: 'satisfied' },
    })
    const expectedLength = presentChannel === desiredChannel ? 2 : 3
    assert.strictEqual(result.routeHandRecommendations.length, expectedLength)
    assert.strictEqual(result.routeHandAttemptDrafts.length, expectedLength)
    assert.strictEqual(result.routes[0].moves[0].vector, `${presentChannel}:dissatisfied->${presentChannel}:neutral`)
    assert.strictEqual(
      result.routes[0].moves[result.routes[0].moves.length - 1].vector,
      `${desiredChannel}:neutral->${desiredChannel}:satisfied`,
    )
  }
}

console.log('Charge metabolism recommendation service tests passed')
