import * as assert from 'node:assert'
import {
  allAlchemyStates,
  allGrowthPracticeEdges,
  allMasteryPracticeEdges,
  directPracticeMovesFrom,
  explainPracticeRouteUnreachable,
  getAlchemyCombinationCounts,
  planBeginnerRouteHand,
  planAlchemyMoves,
  planPracticeRoutes,
  resolveFeelingState,
  stateKey,
} from '../move-planner'
import { resolveMoveDestination } from '../wuxing'

const counts = getAlchemyCombinationCounts()

assert.strictEqual(counts.channels, 5)
assert.strictEqual(counts.altitudes, 3)
assert.strictEqual(counts.states, 15)
assert.strictEqual(counts.orderedStatePairsIncludingSelf, 225)
assert.strictEqual(counts.orderedStatePairsExcludingSelf, 210)
assert.strictEqual(counts.theoreticalChannelPairs, 25)
assert.strictEqual(counts.canonicalChannelMoveFamilies, 15)
assert.strictEqual(counts.currentSceneResolutionVectors, 30)
assert.strictEqual(counts.growthPracticeDirectEdges, 40)
assert.strictEqual(counts.masteryPracticeDirectEdges, 50)

assert.strictEqual(allAlchemyStates().length, 15)
assert.strictEqual(allGrowthPracticeEdges().length, counts.growthPracticeDirectEdges)
assert.strictEqual(allMasteryPracticeEdges().length, counts.masteryPracticeDirectEdges)

const restless = resolveFeelingState('restless')
assert.ok(restless)
assert.strictEqual(restless.key, 'joy:dissatisfied')
assert.strictEqual(restless.label, 'restlessness')

const cleanJoy = resolveFeelingState('Joy')
assert.ok(cleanJoy)
assert.strictEqual(cleanJoy.key, 'joy:neutral')
assert.strictEqual(cleanJoy.label, 'Joy')

const peaceful = resolveFeelingState('peaceful')
assert.ok(peaceful)
assert.strictEqual(peaceful.key, 'neutrality:satisfied')
assert.strictEqual(peaceful.label, 'peace')

const joyStabilize = directPracticeMovesFrom({ channel: 'joy', altitude: 'dissatisfied' })
  .find((move) => move.operation === 'stabilize')

assert.ok(joyStabilize)
assert.strictEqual(joyStabilize.vector, 'joy:dissatisfied->joy:neutral')
assert.strictEqual(joyStabilize.moveId, 'joy_stabilize')
assert.strictEqual(joyStabilize.moveName, 'Settle Joy')
assert.strictEqual(joyStabilize.doctrineLineageId, 'wood_transcend')
assert.notStrictEqual(joyStabilize.moveId, joyStabilize.doctrineLineageId)

const restlessnessToPeace = planPracticeRoutes(
  { channel: 'joy', altitude: 'dissatisfied' },
  { channel: 'neutrality', altitude: 'satisfied' },
  { mode: 'growth', maxPaths: 3 },
)

assert.strictEqual(restlessnessToPeace.length, 3)
assert.strictEqual(restlessnessToPeace[0].mode, 'growth')
assert.strictEqual(restlessnessToPeace[0].targetIntent, 'satisfaction')
assert.strictEqual(restlessnessToPeace[0].routeType, 'completion')

assert.deepStrictEqual(
  restlessnessToPeace[0].moves.map((move) => move.vector),
  [
    'joy:dissatisfied->joy:neutral',
    'joy:neutral->neutrality:neutral',
    'neutrality:neutral->neutrality:satisfied',
  ],
)

assert.deepStrictEqual(
  restlessnessToPeace[0].moves.map((move) => move.operation),
  ['stabilize', 'control', 'transcend'],
)

const beginnerAngerToPoignance = planBeginnerRouteHand(
  { channel: 'anger', altitude: 'dissatisfied' },
  { channel: 'sadness', altitude: 'satisfied' },
)
assert.deepStrictEqual(
  beginnerAngerToPoignance.moves.map((move) => move.vector),
  [
    'anger:dissatisfied->anger:neutral',
    'anger:neutral->sadness:neutral',
    'sadness:neutral->sadness:satisfied',
  ],
)
assert.deepStrictEqual(
  beginnerAngerToPoignance.moves.map((move) => move.operation),
  ['stabilize', 'translate', 'transcend'],
)
assert.deepStrictEqual(beginnerAngerToPoignance.roles, ['metabolize', 'translate', 'transcend'])

const beginnerSadnessToPoignance = planBeginnerRouteHand(
  { channel: 'sadness', altitude: 'dissatisfied' },
  { channel: 'sadness', altitude: 'satisfied' },
)
assert.deepStrictEqual(
  beginnerSadnessToPoignance.moves.map((move) => move.vector),
  [
    'sadness:dissatisfied->sadness:neutral',
    'sadness:neutral->sadness:satisfied',
  ],
)
assert.deepStrictEqual(beginnerSadnessToPoignance.roles, ['metabolize', 'transcend'])

const beginnerFearToPoignance = planBeginnerRouteHand(
  { channel: 'fear', altitude: 'neutral' },
  { channel: 'sadness', altitude: 'satisfied' },
)
assert.deepStrictEqual(
  beginnerFearToPoignance.moves.map((move) => move.vector),
  [
    'fear:neutral->sadness:neutral',
    'sadness:neutral->sadness:satisfied',
  ],
)
assert.deepStrictEqual(beginnerFearToPoignance.roles, ['translate', 'transcend'])

const beginnerCleanSadnessToPoignance = planBeginnerRouteHand(
  { channel: 'sadness', altitude: 'neutral' },
  { channel: 'sadness', altitude: 'satisfied' },
)
assert.deepStrictEqual(
  beginnerCleanSadnessToPoignance.moves.map((move) => move.vector),
  ['sadness:neutral->sadness:satisfied'],
)
assert.deepStrictEqual(beginnerCleanSadnessToPoignance.roles, ['single'])

const directAngerToSadness = planBeginnerRouteHand(
  { channel: 'anger', altitude: 'neutral' },
  { channel: 'sadness', altitude: 'neutral' },
)
assert.deepStrictEqual(
  directAngerToSadness.moves.map((move) => move.vector),
  ['anger:neutral->sadness:neutral'],
)
assert.deepStrictEqual(directAngerToSadness.moves.map((move) => move.operation), ['translate'])

const legacyRoutes = planAlchemyMoves(
  { channel: 'joy', altitude: 'dissatisfied' },
  { channel: 'neutrality', altitude: 'satisfied' },
  { maxPaths: 1 },
)
assert.strictEqual(legacyRoutes[0].mode, 'growth')

const restlessnessToNeutral = planPracticeRoutes(
  { channel: 'joy', altitude: 'dissatisfied' },
  { channel: 'neutrality', altitude: 'neutral' },
  { mode: 'growth', maxPaths: 1 },
)

assert.strictEqual(restlessnessToNeutral[0].targetIntent, 'stabilization')
assert.strictEqual(restlessnessToNeutral[0].routeType, 'stabilization')
assert.deepStrictEqual(
  restlessnessToNeutral[0].moves.map((move) => move.vector),
  [
    'joy:dissatisfied->joy:neutral',
    'joy:neutral->neutrality:neutral',
  ],
)

const restlessnessToFrustration = planPracticeRoutes(
  { channel: 'joy', altitude: 'dissatisfied' },
  { channel: 'anger', altitude: 'dissatisfied' },
  { mode: 'growth', maxPaths: 1 },
)

assert.strictEqual(restlessnessToFrustration[0].targetIntent, 'metabolizable_dissatisfaction')
assert.strictEqual(restlessnessToFrustration[0].routeType, 'metabolization')
assert.match(restlessnessToFrustration[0].whyThisRoute, /more workable dissatisfaction/)

const growthDownshift = explainPracticeRouteUnreachable(
  { channel: 'neutrality', altitude: 'satisfied' },
  { channel: 'joy', altitude: 'neutral' },
  'growth',
)
assert.ok(growthDownshift)
assert.strictEqual(growthDownshift.targetIntent, 'stabilization')

const masteryDownshift = planPracticeRoutes(
  { channel: 'neutrality', altitude: 'satisfied' },
  { channel: 'joy', altitude: 'neutral' },
  { mode: 'mastery', maxPaths: 1 },
)
assert.strictEqual(masteryDownshift.length, 1)
assert.ok(masteryDownshift[0].moves.some((move) => move.operation === 'controlled_descent'))

const states = allAlchemyStates()
let growthReachable = 0
let growthUnreachable = 0
let masteryReachable = 0

for (const from of states) {
  for (const to of states) {
    if (stateKey(from) === stateKey(to)) continue

    const growthRoute = planPracticeRoutes(from, to, { mode: 'growth', maxPaths: 1 })
    if (growthRoute.length > 0) {
      growthReachable += 1
    } else {
      growthUnreachable += 1
      assert.ok(explainPracticeRouteUnreachable(from, to, 'growth'))
    }

    const masteryRoute = planPracticeRoutes(from, to, { mode: 'mastery', maxPaths: 1 })
    if (masteryRoute.length > 0) masteryReachable += 1
  }
}

assert.strictEqual(growthReachable + growthUnreachable, counts.orderedStatePairsExcludingSelf)
assert.ok(growthReachable > 0)
assert.ok(growthUnreachable > 0)
assert.strictEqual(masteryReachable, counts.orderedStatePairsExcludingSelf)

assert.deepStrictEqual(resolveMoveDestination('joy', 'neutral', 'generate'), {
  targetChannel: 'anger',
  targetAltitude: 'satisfied',
  vector: 'joy:neutral→anger:satisfied',
})

assert.deepStrictEqual(resolveMoveDestination('joy', 'neutral', 'control'), {
  targetChannel: 'neutrality',
  targetAltitude: 'dissatisfied',
  vector: 'joy:neutral→neutrality:dissatisfied',
})

assert.deepStrictEqual(resolveMoveDestination('joy', 'dissatisfied', 'control'), {
  targetChannel: 'neutrality',
  targetAltitude: 'dissatisfied',
  vector: 'joy:dissatisfied→neutrality:dissatisfied',
})

console.log('Alchemy move planner tests passed')
