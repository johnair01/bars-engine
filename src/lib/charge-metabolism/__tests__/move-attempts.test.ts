import * as assert from 'node:assert'
import { recommendChargeMetabolismMove } from '../recommendation-service'
import {
  abandonMoveAttempt,
  chooseMoveAttempt,
  completeMoveAttempt,
  markMoveAttemptNeedsFollowup,
  practiceMoveAttempt,
  reflectMoveAttempt,
  skipMoveAttempt,
  skipMoveAttemptSet,
} from '../move-attempts'

const recommendation = recommendChargeMetabolismMove({
  sourceSurface: 'allyship_deck',
  playerId: 'player-1',
  deckCardId: 'SHOW-DIRECT-CHALLENGER',
  present: 'restlessness',
  desired: 'peace',
  blocker: 'I am scattered and need a useful next move.',
  orientation: 'external',
  subject: 'collective',
  superpower: 'storyteller',
  domain: 'RAISE_AWARENESS',
})

const draft = recommendation.attemptDraft
assert.ok(draft)
assert.strictEqual(draft.status, 'recommended')

const completeRecommended = completeMoveAttempt(draft)
assert.strictEqual(completeRecommended.success, false)
assert.match(completeRecommended.reason, /Cannot complete/)

const skipped = skipMoveAttempt(draft)
assert.strictEqual(skipped.success, true)
assert.strictEqual(skipped.attempt.status, 'skipped')

assert.ok(recommendation.metabolizeAttemptDraft)
assert.ok(recommendation.satisfactionAttemptDraft)
assert.strictEqual(recommendation.routeHandAttemptDrafts.length, 3)
const skippedSet = skipMoveAttemptSet(recommendation.routeHandAttemptDrafts)
assert.strictEqual(skippedSet.success, true)
assert.strictEqual(skippedSet.attempts.length, 3)
assert.deepStrictEqual(
  skippedSet.attempts.map((attempt) => attempt.recommendationRole),
  ['metabolize', 'translate', 'transcend'],
)
assert.deepStrictEqual(
  skippedSet.attempts.map((attempt) => attempt.status),
  ['skipped', 'skipped', 'skipped'],
)

const chooseUnknown = chooseMoveAttempt(draft, 'not_a_real_primitive')
assert.strictEqual(chooseUnknown.success, false)
assert.match(chooseUnknown.reason, /recommended primitive/)

const chosen = chooseMoveAttempt(draft)
assert.strictEqual(chosen.success, true)
assert.strictEqual(chosen.attempt.status, 'chosen')

const completeChosen = completeMoveAttempt(chosen.attempt, {
  reflectionText: 'I noticed what changed.',
})
assert.strictEqual(completeChosen.success, false)
assert.match(completeChosen.reason, /Cannot complete/)

const practiced = practiceMoveAttempt(chosen.attempt, {
  artifactText: 'Sent the clean invitation.',
})
assert.strictEqual(practiced.success, true)
assert.strictEqual(practiced.attempt.status, 'practiced')

const completedFromPractice = completeMoveAttempt(practiced.attempt)
assert.strictEqual(completedFromPractice.success, true)
assert.strictEqual(completedFromPractice.attempt.status, 'completed')
assert.strictEqual(completedFromPractice.attempt.artifactText, 'Sent the clean invitation.')

const chosenAgain = chooseMoveAttempt(draft)
assert.strictEqual(chosenAgain.success, true)
const practicedAgain = practiceMoveAttempt(chosenAgain.attempt)
assert.strictEqual(practicedAgain.success, true)
const completeWithoutTrace = completeMoveAttempt(practicedAgain.attempt)
assert.strictEqual(completeWithoutTrace.success, false)
assert.match(completeWithoutTrace.reason, /requires an artifact/)

const reflected = reflectMoveAttempt(practicedAgain.attempt, 'The charge softened after I named the ask.')
assert.strictEqual(reflected.success, true)
assert.strictEqual(reflected.attempt.status, 'reflected')
const completedFromReflection = completeMoveAttempt(reflected.attempt)
assert.strictEqual(completedFromReflection.success, true)
assert.strictEqual(completedFromReflection.attempt.status, 'completed')

const followup = markMoveAttemptNeedsFollowup(practicedAgain.attempt, 'The move revealed a second blocker.')
assert.strictEqual(followup.success, true)
assert.strictEqual(followup.attempt.status, 'needs_followup')
const repracticed = practiceMoveAttempt(followup.attempt, { outcome: 'Tried the smaller version.' })
assert.strictEqual(repracticed.success, true)
assert.strictEqual(repracticed.attempt.status, 'practiced')

const abandoned = abandonMoveAttempt(chosen.attempt, 'Not the right move today.')
assert.strictEqual(abandoned.success, true)
assert.strictEqual(abandoned.attempt.status, 'abandoned')

console.log('Charge metabolism move attempt lifecycle tests passed')
