/**
 * Face Exploration Scoring — tests
 *
 * Run: tsx src/lib/campaign-hub/__tests__/face-exploration-scoring.test.ts
 */

import {
  countFaceExplorations,
  analyzeFaceExploration,
  analyzeFaceExplorationFromHub,
  getLeastExploredFace,
  getUnderExploredFaces,
  isFaceExplored,
  suggestFaceForComposer,
  EXPLORABLE_FACES,
  EXPLORABLE_FACE_COUNT,
} from '@/lib/campaign-hub/face-exploration-scoring'
import type { CompletedBuildReceipt, CampaignHubStateV1 } from '@/lib/campaign-hub/types'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeReceipt = (
  face: GameMasterFace,
  spokeIndex = 0,
): CompletedBuildReceipt => ({
  buildId: `build_${face}_${spokeIndex}`,
  spokeIndex,
  face,
  templateKind: 'quest',
  templateKey: `template_${face}`,
  emotionalVector: {
    channelFrom: 'Fear',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  },
  chargeText: 'test charge',
  terminalNodeId: 'terminal_1',
  blueprintKey: `cyoa_build_${face}_wakeUp`,
  barSummaries: [],
  totalVibeulons: 10,
  completedAt: new Date().toISOString(),
})

const makeSpokes = () =>
  Array.from({ length: 8 }, (_, i) => ({
    hexagramId: i + 1,
    changingLines: [1],
    primaryFace: 'shaman' as const,
  }))

const makeHubState = (
  receipts: CompletedBuildReceipt[] = [],
): CampaignHubStateV1 => ({
  v: 1,
  kotterStage: 1,
  spokes: makeSpokes(),
  completedBuilds: receipts,
  updatedAt: new Date().toISOString(),
})

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) throw new Error(msg)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

assert(EXPLORABLE_FACES.length === 5, 'EXPLORABLE_FACES should have 5 entries')
assert(!EXPLORABLE_FACES.includes('sage'), 'EXPLORABLE_FACES should not contain sage')
assert(EXPLORABLE_FACE_COUNT === 5, 'EXPLORABLE_FACE_COUNT should be 5')
assert(EXPLORABLE_FACES.includes('shaman'), 'should contain shaman')
assert(EXPLORABLE_FACES.includes('challenger'), 'should contain challenger')
assert(EXPLORABLE_FACES.includes('regent'), 'should contain regent')
assert(EXPLORABLE_FACES.includes('architect'), 'should contain architect')
assert(EXPLORABLE_FACES.includes('diplomat'), 'should contain diplomat')

// ---------------------------------------------------------------------------
// countFaceExplorations
// ---------------------------------------------------------------------------

{
  // Empty receipts → zero counts
  const counts = countFaceExplorations([])
  for (const face of EXPLORABLE_FACES) {
    assert(counts.get(face) === 0, `expected 0 for ${face} with empty receipts`)
  }
}

{
  // Tallies face counts correctly
  const receipts = [
    makeReceipt('shaman', 0),
    makeReceipt('shaman', 1),
    makeReceipt('challenger', 2),
  ]
  const counts = countFaceExplorations(receipts)
  assert(counts.get('shaman') === 2, 'shaman should have 2')
  assert(counts.get('challenger') === 1, 'challenger should have 1')
  assert(counts.get('regent') === 0, 'regent should have 0')
  assert(counts.get('architect') === 0, 'architect should have 0')
  assert(counts.get('diplomat') === 0, 'diplomat should have 0')
}

{
  // Ignores sage builds
  const receipts = [makeReceipt('sage' as GameMasterFace, 0)]
  const counts = countFaceExplorations(receipts)
  for (const face of EXPLORABLE_FACES) {
    assert(counts.get(face) === 0, `expected 0 for ${face} when only sage builds`)
  }
}

// ---------------------------------------------------------------------------
// analyzeFaceExploration
// ---------------------------------------------------------------------------

{
  // Empty receipts → zero breadth, all unexplored
  const analysis = analyzeFaceExploration([])
  assert(analysis.totalBuilds === 0, 'expected 0 total builds')
  assert(analysis.distinctFacesExplored === 0, 'expected 0 distinct faces')
  assert(analysis.breadth === 0, 'expected 0 breadth')
  assert(analysis.unexplored.length === 5, 'expected 5 unexplored')
  assert(analysis.ranked.length === 5, 'expected 5 ranked entries')
  for (const score of analysis.ranked) {
    assert(score.count === 0, `expected count 0 for ${score.face}`)
    assert(score.ratio === 0, `expected ratio 0 for ${score.face}`)
  }
}

{
  // Single face explored → breadth 0.2
  const receipts = [makeReceipt('shaman', 0)]
  const analysis = analyzeFaceExploration(receipts)
  assert(analysis.totalBuilds === 1, 'expected 1 total build')
  assert(analysis.distinctFacesExplored === 1, 'expected 1 distinct face')
  assert(Math.abs(analysis.breadth - 0.2) < 0.001, 'expected breadth ~0.2')
  assert(analysis.unexplored.length === 4, 'expected 4 unexplored')
  assert(!analysis.unexplored.includes('shaman'), 'shaman should not be unexplored')
}

{
  // All faces explored → breadth 1.0
  const receipts = [
    makeReceipt('shaman', 0),
    makeReceipt('challenger', 1),
    makeReceipt('regent', 2),
    makeReceipt('architect', 3),
    makeReceipt('diplomat', 4),
  ]
  const analysis = analyzeFaceExploration(receipts)
  assert(analysis.totalBuilds === 5, 'expected 5 total builds')
  assert(analysis.distinctFacesExplored === 5, 'expected 5 distinct faces')
  assert(analysis.breadth === 1.0, 'expected breadth 1.0')
  assert(analysis.unexplored.length === 0, 'expected 0 unexplored')
}

{
  // Ranked is sorted ascending by count (least explored first)
  const receipts = [
    makeReceipt('shaman', 0),
    makeReceipt('shaman', 1),
    makeReceipt('shaman', 2),
    makeReceipt('challenger', 3),
    makeReceipt('challenger', 4),
    makeReceipt('regent', 5),
  ]
  const analysis = analyzeFaceExploration(receipts)
  const counts = analysis.ranked.map((s) => s.count)
  for (let i = 1; i < counts.length; i++) {
    assert(counts[i]! >= counts[i - 1]!, `ranked should be ascending at index ${i}`)
  }
  assert(analysis.ranked[0]!.count === 0, 'first ranked entry should have count 0')
  assert(analysis.ranked[analysis.ranked.length - 1]!.count === 3, 'last ranked entry should have count 3')
}

{
  // Ratio is correctly computed
  const receipts = [
    makeReceipt('shaman', 0),
    makeReceipt('challenger', 1),
    makeReceipt('shaman', 2),
    makeReceipt('shaman', 3),
  ]
  const analysis = analyzeFaceExploration(receipts)
  const shamanScore = analysis.ranked.find((s) => s.face === 'shaman')!
  assert(Math.abs(shamanScore.ratio - 3 / 4) < 0.001, 'shaman ratio should be 0.75')
  const challengerScore = analysis.ranked.find((s) => s.face === 'challenger')!
  assert(Math.abs(challengerScore.ratio - 1 / 4) < 0.001, 'challenger ratio should be 0.25')
}

// ---------------------------------------------------------------------------
// analyzeFaceExplorationFromHub
// ---------------------------------------------------------------------------

{
  // Null hub state → empty analysis
  const analysis = analyzeFaceExplorationFromHub(null)
  assert(analysis.totalBuilds === 0, 'expected 0 builds for null hub')
  assert(analysis.breadth === 0, 'expected 0 breadth for null hub')
}

{
  // Undefined hub state → empty analysis
  const analysis = analyzeFaceExplorationFromHub(undefined)
  assert(analysis.totalBuilds === 0, 'expected 0 builds for undefined hub')
}

{
  // Hub state with receipts → correct analysis
  const hubState = makeHubState([
    makeReceipt('shaman', 0),
    makeReceipt('challenger', 1),
  ])
  const analysis = analyzeFaceExplorationFromHub(hubState)
  assert(analysis.totalBuilds === 2, 'expected 2 builds')
  assert(analysis.distinctFacesExplored === 2, 'expected 2 distinct faces')
}

// ---------------------------------------------------------------------------
// getLeastExploredFace
// ---------------------------------------------------------------------------

{
  // Empty receipts → null (all equally unexplored)
  assert(getLeastExploredFace([]) === null, 'expected null for empty receipts')
}

{
  // One face explored → returns an unexplored face
  const receipts = [makeReceipt('shaman', 0)]
  const result = getLeastExploredFace(receipts)
  assert(result !== null, 'expected non-null result')
  assert(result !== 'shaman', 'should not return the already-explored face')
  assert(EXPLORABLE_FACES.includes(result), 'should be an explorable face')
}

{
  // All equally explored → null
  const receipts = EXPLORABLE_FACES.map((face, i) => makeReceipt(face, i))
  assert(getLeastExploredFace(receipts) === null, 'expected null when all equally explored')
}

{
  // Uneven exploration → returns least explored
  const receipts = [
    makeReceipt('shaman', 0),
    makeReceipt('shaman', 1),
    makeReceipt('challenger', 2),
    makeReceipt('challenger', 3),
    makeReceipt('regent', 4),
    makeReceipt('architect', 5),
    makeReceipt('diplomat', 6),
  ]
  const result = getLeastExploredFace(receipts)
  assert(result !== null, 'expected non-null')
  // regent, architect, diplomat all have 1 — the first in canonical order should be chosen
  assert(
    ['regent', 'architect', 'diplomat'].includes(result),
    `expected one of regent/architect/diplomat, got ${result}`,
  )
}

// ---------------------------------------------------------------------------
// getUnderExploredFaces
// ---------------------------------------------------------------------------

{
  // Returns up to N faces sorted by ascending count
  const receipts = [
    makeReceipt('shaman', 0),
    makeReceipt('shaman', 1),
    makeReceipt('challenger', 2),
  ]
  const result = getUnderExploredFaces(receipts, 3)
  assert(result.length === 3, 'expected 3 results')
  assert(result[0]!.count === 0, 'first should have count 0')
}

{
  // Default n is 3
  const result = getUnderExploredFaces([])
  assert(result.length === 3, 'expected default 3 results')
}

{
  // n larger than face count returns all faces
  const result = getUnderExploredFaces([], 10)
  assert(result.length === 5, 'expected 5 results (max)')
}

// ---------------------------------------------------------------------------
// isFaceExplored
// ---------------------------------------------------------------------------

assert(isFaceExplored([], 'shaman') === false, 'shaman not explored in empty')
assert(
  isFaceExplored([makeReceipt('shaman', 0)], 'shaman') === true,
  'shaman should be explored',
)
assert(
  isFaceExplored([makeReceipt('shaman', 0)], 'challenger') === false,
  'challenger not explored',
)
assert(isFaceExplored([], 'sage') === false, 'sage is never explored')

// ---------------------------------------------------------------------------
// suggestFaceForComposer
// ---------------------------------------------------------------------------

{
  // Empty receipts, no spoke face → returns a valid explorable face
  const result = suggestFaceForComposer([])
  assert(result !== null, 'expected non-null suggestion')
  assert(EXPLORABLE_FACES.includes(result), 'should be an explorable face')
}

{
  // Excludes current spoke face from suggestion
  const receipts = [
    makeReceipt('challenger', 0),
    makeReceipt('regent', 1),
  ]
  const result = suggestFaceForComposer(receipts, 'shaman')
  assert(result !== null, 'expected non-null')
  assert(result !== 'shaman', 'should not suggest current spoke face')
}

{
  // Suggests least explored face excluding spoke face
  const receipts = [
    makeReceipt('shaman', 0),
    makeReceipt('shaman', 1),
    makeReceipt('challenger', 2),
    makeReceipt('regent', 3),
    makeReceipt('architect', 4),
  ]
  // diplomat has 0 builds, should be suggested
  const result = suggestFaceForComposer(receipts, 'shaman')
  assert(result === 'diplomat', `expected diplomat, got ${result}`)
}

{
  // Null spoke face → no exclusion
  const result = suggestFaceForComposer([], null)
  assert(result !== null, 'expected non-null suggestion')
}

console.log('face-exploration-scoring: OK')
