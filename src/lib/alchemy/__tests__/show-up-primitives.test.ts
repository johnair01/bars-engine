import * as assert from 'node:assert'
import {
  allShowUpPrimitives,
  getShowUpPrimitive,
  recommendShowUpMoveForEdge,
  recommendShowUpMovesForEdges,
  selectPrimaryShowUpPrimitiveForVector,
  selectPracticeLens,
  selectShowUpPrimitivesForVector,
  translateShowUpPrimitive,
  validateShowUpPrimitiveDefinitions,
} from '../show-up-primitives'
import { planPracticeRoutes } from '../move-planner'

const primitives = allShowUpPrimitives()

assert.strictEqual(primitives.length, 10)
assert.deepStrictEqual(validateShowUpPrimitiveDefinitions(), [])

const ids = primitives.map((primitive) => primitive.id)
assert.strictEqual(new Set(ids).size, ids.length)

for (const primitive of primitives) {
  assert.ok(primitive.innerArtifactFamilies.length > 0, `${primitive.id} has internal outputs`)
  assert.ok(primitive.outerActFamilies.length > 0, `${primitive.id} has external outputs`)
  assert.ok(primitive.completionLogic.length > 0, `${primitive.id} has completion logic`)
  assert.ok(primitive.driftReflection.length > 0, `${primitive.id} has reflection prompt`)
}

const boundTheAsk = getShowUpPrimitive('bound_the_ask')
assert.ok(boundTheAsk.sourceChannels?.includes('fear'))
assert.ok(boundTheAsk.proofPrototypeIds.includes('MP02-internal'))
assert.ok(boundTheAsk.proofPrototypeIds.includes('MP02-external'))

const cleanExit = getShowUpPrimitive('clean_exit')
assert.ok(cleanExit.sourceChannels?.includes('fear'))
assert.ok(cleanExit.innerArtifactFamilies.includes('inner exit'))
assert.ok(cleanExit.outerActFamilies.includes('off-ramp message'))

const createHandoff = getShowUpPrimitive('create_handoff')
assert.ok(createHandoff.proofPrototypeIds.includes('MP19-internal'))
assert.ok(createHandoff.proofPrototypeIds.includes('MP19-external'))

const interruptPattern = getShowUpPrimitive('interrupt_pattern')
assert.ok(interruptPattern.sourceChannels?.includes('anger'))
assert.ok(interruptPattern.proofPrototypeIds.includes('MP05-external'))
assert.ok(interruptPattern.proofPrototypeIds.includes('MP12-external'))

const fearStabilizeMatches = selectShowUpPrimitivesForVector({
  from: { channel: 'fear', altitude: 'dissatisfied' },
  to: { channel: 'fear', altitude: 'neutral' },
  operation: 'stabilize',
})
assert.strictEqual(fearStabilizeMatches[0].primitive.id, 'bound_the_ask')
assert.ok(fearStabilizeMatches.some((match) => match.primitive.id === 'identify_signal'))
assert.ok(fearStabilizeMatches[0].reasons.includes('supports stabilize'))

const fearToWonderPrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'fear', altitude: 'neutral' },
  to: { channel: 'fear', altitude: 'satisfied' },
  operation: 'transcend',
})
assert.strictEqual(fearToWonderPrimary?.id, 'create_sequence')

const sadnessStabilizePrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'sadness', altitude: 'dissatisfied' },
  to: { channel: 'sadness', altitude: 'neutral' },
  operation: 'stabilize',
})
assert.strictEqual(sadnessStabilizePrimary?.id, 'name_care_distance')

const sadnessTranscendPrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'sadness', altitude: 'neutral' },
  to: { channel: 'sadness', altitude: 'satisfied' },
  operation: 'transcend',
})
assert.strictEqual(sadnessTranscendPrimary?.id, 'restore_flow')
const sadnessTranscendMatches = selectShowUpPrimitivesForVector({
  from: { channel: 'sadness', altitude: 'neutral' },
  to: { channel: 'sadness', altitude: 'satisfied' },
  operation: 'transcend',
})
assert.ok(sadnessTranscendMatches[0].reasons.some((reason) => reason.includes('preferred by vector family')))

const neutralityStabilizePrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'neutrality', altitude: 'dissatisfied' },
  to: { channel: 'neutrality', altitude: 'neutral' },
  operation: 'stabilize',
})
assert.strictEqual(neutralityStabilizePrimary?.id, 'create_sequence')

const cleanAngerToCleanSadnessPrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'anger', altitude: 'neutral' },
  to: { channel: 'sadness', altitude: 'neutral' },
  operation: 'translate',
})
assert.strictEqual(cleanAngerToCleanSadnessPrimary?.id, 'repair_without_performance')
const cleanAngerToCleanSadnessMatches = selectShowUpPrimitivesForVector({
  from: { channel: 'anger', altitude: 'neutral' },
  to: { channel: 'sadness', altitude: 'neutral' },
  operation: 'translate',
})
assert.ok(cleanAngerToCleanSadnessMatches[0].reasons.some((reason) => reason.includes('preferred by vector family')))

const cleanFearToCleanSadnessPrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'fear', altitude: 'neutral' },
  to: { channel: 'sadness', altitude: 'neutral' },
  operation: 'translate',
})
assert.strictEqual(cleanFearToCleanSadnessPrimary?.id, 'repair_without_performance')

const cleanJoyToCleanSadnessPrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'joy', altitude: 'neutral' },
  to: { channel: 'sadness', altitude: 'neutral' },
  operation: 'translate',
})
assert.strictEqual(cleanJoyToCleanSadnessPrimary?.id, 'name_care_distance')

const glueRolePrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'sadness', altitude: 'dissatisfied' },
  to: { channel: 'neutrality', altitude: 'neutral' },
  operation: 'control',
})
assert.strictEqual(glueRolePrimary?.id, 'create_handoff')

const angerStabilizePrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'anger', altitude: 'dissatisfied' },
  to: { channel: 'anger', altitude: 'neutral' },
  operation: 'stabilize',
})
assert.strictEqual(angerStabilizePrimary?.id, 'interrupt_pattern')

const angerTranscendPrimary = selectPrimaryShowUpPrimitiveForVector({
  from: { channel: 'anger', altitude: 'neutral' },
  to: { channel: 'anger', altitude: 'satisfied' },
  operation: 'transcend',
})
assert.strictEqual(angerTranscendPrimary?.id, 'interrupt_pattern')

const mp02Internal = translateShowUpPrimitive({
  primitiveId: 'bound_the_ask',
  stateVector: 'fear:dissatisfied->fear:neutral',
  orientation: 'internal',
  subject: 'self',
  superpower: 'strategist',
  domain: 'GATHERING_RESOURCES',
  blocker: 'The ask is too vague.',
})

assert.strictEqual(mp02Internal.title, 'Inner Bound The Ask')
assert.strictEqual(mp02Internal.domainOutput, 'ask constraint')
assert.match(mp02Internal.instruction, /personal ask constraint/)
assert.match(mp02Internal.completion, /use trigger/)

const mp02External = translateShowUpPrimitive({
  primitiveId: 'bound_the_ask',
  stateVector: 'fear:dissatisfied->fear:neutral',
  orientation: 'external',
  subject: 'collective',
  superpower: 'strategist',
  domain: 'GATHERING_RESOURCES',
  blocker: 'The ask is too vague.',
})

assert.strictEqual(mp02External.title, 'Outer Bound The Ask')
assert.strictEqual(mp02External.domainOutput, 'resource movement / sent ask')
assert.match(mp02External.instruction, /Send or schedule one bounded ask/)
assert.match(mp02External.completion, /named recipient/)

const mp08Internal = translateShowUpPrimitive({
  primitiveId: 'clean_exit',
  stateVector: 'fear:dissatisfied->fear:neutral->fear:satisfied',
  orientation: 'internal',
  subject: 'self',
  superpower: 'escape_artist',
  domain: 'DIRECT_ACTION',
  blocker: 'Leaving may disappoint people.',
})

assert.match(mp08Internal.instruction, /clean inner exit/)
assert.match(mp08Internal.completion, /inner exit commitment/)

const mp08External = translateShowUpPrimitive({
  primitiveId: 'clean_exit',
  stateVector: 'fear:dissatisfied->fear:neutral->fear:satisfied',
  orientation: 'external',
  subject: 'other',
  superpower: 'escape_artist',
  domain: 'DIRECT_ACTION',
  blocker: 'Leaving may disappoint people.',
})

assert.strictEqual(mp08External.domainOutput, 'intervention / off-ramp message')
assert.match(mp08External.instruction, /Communicate one clean off-ramp/)

const mp19Internal = translateShowUpPrimitive({
  primitiveId: 'create_handoff',
  stateVector: 'sadness:dissatisfied+anger:dissatisfied->neutrality:neutral',
  orientation: 'internal',
  subject: 'self',
  superpower: 'connector',
  domain: 'SKILLFUL_ORGANIZING',
  blocker: 'If I stop holding it, things may fall apart.',
})

assert.match(mp19Internal.instruction, /non-glue boundary/)
assert.match(mp19Internal.completion, /stops your body\/personality/)

const mp19External = translateShowUpPrimitive({
  primitiveId: 'create_handoff',
  stateVector: 'sadness:dissatisfied+anger:dissatisfied->neutrality:neutral',
  orientation: 'external',
  subject: 'collective',
  superpower: 'connector',
  domain: 'SKILLFUL_ORGANIZING',
  blocker: 'If I stop holding it, things may fall apart.',
})

assert.match(mp19External.instruction, /handoff agreement/)
assert.match(mp19External.completion, /named role/)

const mp05External = translateShowUpPrimitive({
  primitiveId: 'interrupt_pattern',
  stateVector: 'anger:dissatisfied->anger:neutral',
  orientation: 'external',
  subject: 'collective',
  superpower: 'disruptor',
  domain: 'RAISE_AWARENESS',
  blocker: 'Everyone is staying polite.',
})

assert.strictEqual(mp05External.domainOutput, 'truth signal / interruption question')
assert.match(mp05External.instruction, /pattern-interrupting question/)
assert.match(mp05External.completion, /question is asked/)

const mp12External = translateShowUpPrimitive({
  primitiveId: 'interrupt_pattern',
  stateVector: 'anger:neutral->anger:satisfied',
  orientation: 'external',
  subject: 'collective',
  superpower: 'disruptor',
  domain: 'DIRECT_ACTION',
  blocker: 'Politeness protects harm.',
})

assert.strictEqual(mp12External.domainOutput, 'intervention / interruption question')
assert.match(mp12External.instruction, /Stop the next repetition/)
assert.match(mp12External.completion, /next repetition is interrupted/)

const angerToTriumphRoute = planPracticeRoutes(
  { channel: 'anger', altitude: 'neutral' },
  { channel: 'anger', altitude: 'satisfied' },
  { maxPaths: 1 },
)[0]
assert.ok(angerToTriumphRoute)

const angerRecommendation = recommendShowUpMoveForEdge(angerToTriumphRoute.moves[0], {
  orientation: 'external',
  subject: 'collective',
  superpower: 'disruptor',
  domain: 'DIRECT_ACTION',
  blocker: 'Politeness protects harm.',
})

assert.ok(angerRecommendation)
assert.strictEqual(angerRecommendation.primitiveMatch.primitive.id, 'interrupt_pattern')
assert.strictEqual(angerRecommendation.move.stateVector, 'anger:neutral->anger:satisfied')
assert.match(angerRecommendation.move.instruction, /Stop the next repetition/)

const wakeLens = selectPracticeLens({
  blocker: 'I do not know what I feel yet.',
})
assert.strictEqual(wakeLens.lens, 'wake_up')
assert.strictEqual(wakeLens.role, 'processing')

const openLens = selectPracticeLens({
  blocker: 'I cannot receive this charge without shutting down.',
})
assert.strictEqual(openLens.lens, 'open_up')
assert.strictEqual(openLens.role, 'processing')

const cleanLens = selectPracticeLens({
  blocker: 'This is tangled with a self-sabotage belief.',
})
assert.strictEqual(cleanLens.lens, 'clean_up')
assert.strictEqual(cleanLens.role, 'processing')

const growLens = selectPracticeLens({
  blocker: 'I need to hold this from a more mature level.',
})
assert.strictEqual(growLens.lens, 'grow_up')
assert.strictEqual(growLens.role, 'bridge')

const showLens = selectPracticeLens({
  blocker: 'I know what is true and need to act.',
})
assert.strictEqual(showLens.lens, 'show_up')
assert.strictEqual(showLens.role, 'action')

const restlessnessToPeace = planPracticeRoutes(
  { channel: 'joy', altitude: 'dissatisfied' },
  { channel: 'neutrality', altitude: 'satisfied' },
  { maxPaths: 1 },
)[0]
assert.ok(restlessnessToPeace)

const restlessnessRecommendations = recommendShowUpMovesForEdges(restlessnessToPeace.moves, {
  orientation: 'internal',
  subject: 'self',
  superpower: 'strategist',
  domain: 'SKILLFUL_ORGANIZING',
  blocker: 'The next move feels scattered.',
})

assert.strictEqual(restlessnessRecommendations.length, restlessnessToPeace.moves.length)
assert.strictEqual(restlessnessRecommendations[0].edge.vector, 'joy:dissatisfied->joy:neutral')
assert.ok(restlessnessRecommendations.every((recommendation) => recommendation.move.orientation === 'internal'))

console.log('Show Up primitive schema tests passed')
