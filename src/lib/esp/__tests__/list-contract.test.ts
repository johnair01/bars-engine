/**
 * The list contract's promises, tested as results rather than as mechanisms.
 *
 * "Did we call decideSequenceTags" is the mechanism. "Can a Kickstarter backer
 * end up in a sequence" is the result, and only the second one is the check.
 * Every case below is phrased as the second.
 */
import assert from 'node:assert/strict'
import {
  buildMythsReadTags,
  buildSuperpowerTags,
  crossQuizTags,
  decideSequenceTags,
  sourceTag,
  WELCOME_SEQUENCE_TAG,
} from '../list-contract'

function applied(input: Parameters<typeof decideSequenceTags>[0]): string[] {
  return decideSequenceTags(input).tags
}

// ── The promise to the 371 backers ───────────────────────────────────────────

// A backer taking a quiz later is still a backer.
assert.equal(
  applied({
    desiredTags: [sourceTag('myths-read'), WELCOME_SEQUENCE_TAG],
    existingTags: [sourceTag('kickstarter')],
    isNewSubscriber: false,
  }).includes(WELCOME_SEQUENCE_TAG),
  false,
  'a backer must not enter the welcome sequence by taking a quiz',
)

// A backer arriving for the first time from the update email.
assert.equal(
  applied({
    desiredTags: [sourceTag('kickstarter'), WELCOME_SEQUENCE_TAG],
    existingTags: [],
    isNewSubscriber: true,
  }).includes(WELCOME_SEQUENCE_TAG),
  false,
  'a new backer must not enter the welcome sequence',
)

// The data tags still land — exclusion is from sequences, not from the list.
assert.deepEqual(
  applied({
    desiredTags: [sourceTag('kickstarter'), 'myth:M5', WELCOME_SEQUENCE_TAG],
    existingTags: [],
    isNewSubscriber: true,
  }),
  [sourceTag('kickstarter'), 'myth:M5'],
  'an excluded source still gets its data tags',
)

// The withheld list explains itself, so a log line can say why.
assert.deepEqual(
  decideSequenceTags({
    desiredTags: [WELCOME_SEQUENCE_TAG],
    existingTags: [sourceTag('kickstarter')],
    isNewSubscriber: true,
  }).withheld,
  [{ tag: WELCOME_SEQUENCE_TAG, reason: 'excluded_source' }],
)

// ── Retaking is normal ───────────────────────────────────────────────────────

// Retaking updates the data tags and does not re-enter the sequence.
{
  const decision = decideSequenceTags({
    desiredTags: [sourceTag('myths-read'), 'myth:M8', WELCOME_SEQUENCE_TAG],
    existingTags: [sourceTag('myths-read'), 'myth:M5'],
    isNewSubscriber: false,
  })
  assert.equal(decision.tags.includes('myth:M8'), true, 'a retake records the new top myth')
  assert.equal(
    decision.tags.includes(WELCOME_SEQUENCE_TAG),
    false,
    'a retake must not re-enter the sequence',
  )
  assert.deepEqual(decision.withheld, [
    { tag: WELCOME_SEQUENCE_TAG, reason: 'already_subscribed' },
  ])
}

// A genuinely new subscriber from an allowed source does enter it.
assert.equal(
  applied({
    desiredTags: [sourceTag('myths-read'), WELCOME_SEQUENCE_TAG],
    existingTags: [],
    isNewSubscriber: true,
  }).includes(WELCOME_SEQUENCE_TAG),
  true,
  'a new non-backer enters the welcome sequence',
)

// ── quiz:both ────────────────────────────────────────────────────────────────

assert.deepEqual(
  crossQuizTags({
    desiredTags: [sourceTag('superpower')],
    existingTags: [sourceTag('myths-read')],
  }),
  ['quiz:both'],
  'taking the second quiz marks the pair',
)

assert.deepEqual(
  crossQuizTags({ desiredTags: [sourceTag('superpower')], existingTags: [] }),
  [],
  'one quiz alone is not both',
)

// ── Tag shapes ───────────────────────────────────────────────────────────────

assert.deepEqual(
  buildMythsReadTags({ topMyth: 'M5', secondMyth: 'M8', strength: 'Loud' }),
  ['source:myths-read', 'myth:M5', 'quiz:taken', 'strength:loud'],
)

assert.deepEqual(
  buildMythsReadTags({ topMyth: 'M1', strength: null }),
  ['source:myths-read', 'myth:M1', 'quiz:taken'],
  'a missing strength drops the tag rather than emitting strength:null',
)

// The avoided Face is captured, and multi-word Faces slug cleanly.
assert.deepEqual(
  buildSuperpowerTags({ homeFace: 'Regent', avoidedFace: 'The Shaman' }),
  ['source:superpower', 'face:regent', 'quiz:taken', 'avoids:the-shaman'],
)

console.log('✓ list-contract: sequence exclusions, retakes and tag shapes hold')
