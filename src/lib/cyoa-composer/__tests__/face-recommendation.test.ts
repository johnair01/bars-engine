/**
 * Tests for CYOA Composer — Face Recommendation Resolver
 *
 * Validates:
 *  - Empty builds → all faces get exploration bonus, top recommendation is predictable
 *  - Used faces get recency penalty, unused faces get exploration bonus
 *  - Emotional vector affinity boosts matching faces
 *  - Balance bonus incentivizes all-6 coverage
 *  - Score clamping keeps values in [0, 1]
 *  - Convenience helpers (getTop, isTop, getForFace, progress)
 *  - Available faces subset filtering
 *  - Scoring determinism and sort stability
 */

import assert from 'node:assert'
import {
  resolveFaceRecommendations,
  getTopFaceRecommendations,
  isTopRecommendedFace,
  getRecommendationForFace,
  getFaceExplorationProgress,
  EXPLORATION_BONUS,
  RECENCY_PENALTY,
  EMOTIONAL_AFFINITY_BONUS,
  BALANCE_BONUS,
  BASE_SCORE,
  CHANNEL_FACE_AFFINITY,
} from '../face-recommendation'
import type { FaceRecommendationResult } from '../face-recommendation'
import type { CompletedBuildReceipt } from '@/lib/campaign-hub/types'
import type { GameMasterFace, EmotionalVector } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function makeBuild(
  face: GameMasterFace,
  overrides: Partial<CompletedBuildReceipt> = {},
): CompletedBuildReceipt {
  return {
    buildId: `build-${Math.random().toString(36).slice(2)}`,
    spokeIndex: 0,
    face,
    templateKind: 'quest',
    templateKey: 'test-template',
    emotionalVector: {
      channelFrom: 'Joy',
      altitudeFrom: 'neutral',
      channelTo: 'Joy',
      altitudeTo: 'satisfied',
    },
    chargeText: 'Test charge',
    terminalNodeId: 'node-end',
    blueprintKey: 'bp-test',
    barSummaries: [],
    totalVibeulons: 10,
    completedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeVector(channel: EmotionalVector['channelFrom']): EmotionalVector {
  return {
    channelFrom: channel,
    altitudeFrom: 'dissatisfied',
    channelTo: channel,
    altitudeTo: 'neutral',
  }
}

// ---------------------------------------------------------------------------
// No completed builds — all faces equally scored with exploration bonus
// ---------------------------------------------------------------------------

{
  const result = resolveFaceRecommendations([])

  // All 6 faces should be present
  assert.equal(result.recommendations.length, 6)
  assert.equal(result.totalBuilds, 0)
  assert.equal(result.exploredCount, 0)
  assert.equal(result.unexploredFaces.length, 6)

  // Every face should have the exploration bonus
  for (const rec of result.recommendations) {
    assert.equal(rec.explored, false)
    assert.equal(rec.timesUsed, 0)
    assert.equal(rec.breakdown.explorationBonus, EXPLORATION_BONUS)
    assert.equal(rec.breakdown.recencyPenalty, 0)
  }

  // All scores should be equal (base + exploration + max balance bonus)
  const firstScore = result.recommendations[0].score
  for (const rec of result.recommendations) {
    assert.equal(rec.score, firstScore)
  }

  console.log('✓ no builds — all faces equally recommended with exploration bonus')
}

// ---------------------------------------------------------------------------
// Single used face → that face penalized, others get bonus
// ---------------------------------------------------------------------------

{
  const builds = [makeBuild('regent')]
  const result = resolveFaceRecommendations(builds)

  // Regent should be explored
  const regent = result.recommendations.find((r) => r.face === 'regent')!
  assert.equal(regent.explored, true)
  assert.equal(regent.timesUsed, 1)
  assert.equal(regent.breakdown.explorationBonus, 0)
  assert.ok(regent.breakdown.recencyPenalty < 0, 'regent should have recency penalty')

  // Other faces should have exploration bonus
  const shaman = result.recommendations.find((r) => r.face === 'shaman')!
  assert.equal(shaman.explored, false)
  assert.equal(shaman.breakdown.explorationBonus, EXPLORATION_BONUS)
  assert.equal(shaman.breakdown.recencyPenalty, 0)

  // Unexplored faces should score higher than explored
  assert.ok(shaman.score > regent.score, 'unexplored face should score higher than explored')

  // Explored count
  assert.equal(result.exploredCount, 1)
  assert.equal(result.unexploredFaces.length, 5)
  assert.ok(!result.unexploredFaces.includes('regent'))

  // Top recommendation should NOT be regent
  assert.notEqual(result.topRecommendation.face, 'regent')

  console.log('✓ single used face is penalized, others get exploration bonus')
}

// ---------------------------------------------------------------------------
// Emotional vector affinity boost
// ---------------------------------------------------------------------------

{
  // Fear channel → shaman (primary) and diplomat (secondary) should get boost
  // Use some completed builds so scores aren't all clamped at 1.0
  const vector = makeVector('Fear')

  // All 6 faces explored so exploration/balance bonuses are zero — isolates affinity
  const builds = GAME_MASTER_FACES.map((f) => makeBuild(f))
  const result = resolveFaceRecommendations(builds, vector)

  const shaman = result.recommendations.find((r) => r.face === 'shaman')!
  const diplomat = result.recommendations.find((r) => r.face === 'diplomat')!
  const challenger = result.recommendations.find((r) => r.face === 'challenger')!

  // Shaman should have full affinity bonus (primary)
  assert.equal(shaman.breakdown.emotionalAffinity, EMOTIONAL_AFFINITY_BONUS)

  // Diplomat should have half affinity bonus (secondary)
  assert.equal(diplomat.breakdown.emotionalAffinity, EMOTIONAL_AFFINITY_BONUS * 0.5)

  // Challenger should have no affinity bonus for Fear
  assert.equal(challenger.breakdown.emotionalAffinity, 0)

  // Shaman should score higher than diplomat (other components being equal)
  assert.ok(shaman.score >= diplomat.score, 'primary affinity face should score >= secondary')

  // Both affinity faces should score higher than non-affinity faces (when recency is similar)
  // Note: we compare breakdown values since recency varies by position
  assert.ok(
    shaman.breakdown.emotionalAffinity > challenger.breakdown.emotionalAffinity,
    'affinity face should have higher emotional affinity score',
  )

  console.log('✓ emotional vector boosts affinity faces (primary > secondary)')
}

// ---------------------------------------------------------------------------
// All emotional channels produce correct affinity mappings
// ---------------------------------------------------------------------------

{
  const channels: EmotionalVector['channelFrom'][] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']

  for (const channel of channels) {
    const affineFaces = CHANNEL_FACE_AFFINITY[channel]
    assert.ok(affineFaces.length > 0, `${channel} should have affinity faces`)
    assert.ok(affineFaces.length <= 3, `${channel} should have at most 3 affinity faces`)

    const vector = makeVector(channel)
    const result = resolveFaceRecommendations([], vector)

    for (const face of affineFaces) {
      const rec = result.recommendations.find((r) => r.face === face)!
      assert.ok(
        rec.breakdown.emotionalAffinity > 0,
        `${face} should have affinity for ${channel}`,
      )
    }
  }

  console.log('✓ all emotional channels have correct face affinity mappings')
}

// ---------------------------------------------------------------------------
// Recency penalty scales with position
// ---------------------------------------------------------------------------

{
  // 3 builds: shaman (oldest), regent, challenger (most recent)
  const builds = [
    makeBuild('shaman'),
    makeBuild('regent'),
    makeBuild('challenger'),
  ]

  const result = resolveFaceRecommendations(builds)

  const shaman = result.recommendations.find((r) => r.face === 'shaman')!
  const regent = result.recommendations.find((r) => r.face === 'regent')!
  const challenger = result.recommendations.find((r) => r.face === 'challenger')!

  // Challenger (most recent) should have the strongest penalty
  assert.ok(
    challenger.breakdown.recencyPenalty < regent.breakdown.recencyPenalty,
    'most recent should have stronger penalty',
  )
  assert.ok(
    regent.breakdown.recencyPenalty < shaman.breakdown.recencyPenalty,
    'middle should have stronger penalty than oldest',
  )
  assert.ok(
    shaman.breakdown.recencyPenalty < 0,
    'even oldest used face should have some penalty',
  )

  console.log('✓ recency penalty scales with build position')
}

// ---------------------------------------------------------------------------
// Balance bonus — decreases as coverage grows
// ---------------------------------------------------------------------------

{
  // 0 faces explored → max balance bonus for unexplored
  const result0 = resolveFaceRecommendations([])
  const balance0 = result0.recommendations[0].breakdown.balanceBonus
  assert.ok(balance0 > 0, 'balance bonus should be positive with 0 explored')

  // 3 faces explored → lower balance bonus
  const builds3 = [makeBuild('shaman'), makeBuild('regent'), makeBuild('challenger')]
  const result3 = resolveFaceRecommendations(builds3)
  const unexplored3 = result3.recommendations.find((r) => !r.explored)!
  assert.ok(unexplored3.breakdown.balanceBonus > 0, 'unexplored should still get balance bonus')
  assert.ok(
    unexplored3.breakdown.balanceBonus < balance0,
    'balance bonus should decrease as coverage grows',
  )

  // 6 faces explored → zero balance bonus
  const builds6 = GAME_MASTER_FACES.map((f) => makeBuild(f))
  const result6 = resolveFaceRecommendations(builds6)
  for (const rec of result6.recommendations) {
    assert.equal(
      rec.breakdown.balanceBonus,
      0,
      `balance bonus should be 0 when all faces explored (${rec.face})`,
    )
  }

  console.log('✓ balance bonus decreases as face coverage grows')
}

// ---------------------------------------------------------------------------
// Score clamping — values stay in [0, 1]
// ---------------------------------------------------------------------------

{
  // Even with max bonuses, score should not exceed 1
  const result = resolveFaceRecommendations([], makeVector('Fear'))
  for (const rec of result.recommendations) {
    assert.ok(rec.score >= 0, `score should be >= 0, got ${rec.score} for ${rec.face}`)
    assert.ok(rec.score <= 1, `score should be <= 1, got ${rec.score} for ${rec.face}`)
  }

  // With many builds of same face, score should not go below 0
  const manyBuilds = Array.from({ length: 20 }, () => makeBuild('sage'))
  const result2 = resolveFaceRecommendations(manyBuilds)
  for (const rec of result2.recommendations) {
    assert.ok(rec.score >= 0, `score should be >= 0 even with heavy usage, got ${rec.score}`)
    assert.ok(rec.score <= 1, `score should be <= 1, got ${rec.score}`)
  }

  console.log('✓ scores are clamped to [0, 1]')
}

// ---------------------------------------------------------------------------
// Available faces subset filtering
// ---------------------------------------------------------------------------

{
  const subset: GameMasterFace[] = ['shaman', 'regent', 'sage']
  const result = resolveFaceRecommendations([], null, subset)

  assert.equal(result.recommendations.length, 3)
  const faces = result.recommendations.map((r) => r.face)
  assert.ok(faces.includes('shaman'))
  assert.ok(faces.includes('regent'))
  assert.ok(faces.includes('sage'))
  assert.ok(!faces.includes('challenger'))

  // Unexplored should only include faces in the available set
  for (const f of result.unexploredFaces) {
    assert.ok(subset.includes(f), `unexplored face ${f} should be in available set`)
  }

  console.log('✓ available faces subset filtering works')
}

// ---------------------------------------------------------------------------
// Sort stability — deterministic output for equal scores
// ---------------------------------------------------------------------------

{
  // No builds, no vector → all scores equal → sorted alphabetically
  const result = resolveFaceRecommendations([])
  for (let i = 1; i < result.recommendations.length; i++) {
    const prev = result.recommendations[i - 1]
    const curr = result.recommendations[i]
    if (prev.score === curr.score) {
      assert.ok(
        prev.face.localeCompare(curr.face) <= 0,
        `equal scores should sort alphabetically: ${prev.face} before ${curr.face}`,
      )
    }
  }

  console.log('✓ sort is deterministic for equal scores')
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

{
  const builds = [makeBuild('shaman'), makeBuild('regent')]
  const result = resolveFaceRecommendations(builds, makeVector('Fear'))

  // getTopFaceRecommendations
  const top3 = getTopFaceRecommendations(result, 3)
  assert.equal(top3.length, 3)
  assert.equal(top3[0].face, result.topRecommendation.face)

  const top1 = getTopFaceRecommendations(result, 1)
  assert.equal(top1.length, 1)

  // isTopRecommendedFace
  assert.equal(isTopRecommendedFace(result, result.topRecommendation.face), true)

  // getRecommendationForFace
  const shamanRec = getRecommendationForFace(result, 'shaman')
  assert.ok(shamanRec != null)
  assert.equal(shamanRec!.face, 'shaman')

  // getFaceExplorationProgress
  const progress = getFaceExplorationProgress(result)
  assert.equal(progress, Math.round((2 / 6) * 100)) // 33%
  assert.ok(progress > 0 && progress < 100)

  // Full exploration progress
  const fullResult = resolveFaceRecommendations(GAME_MASTER_FACES.map((f) => makeBuild(f)))
  assert.equal(getFaceExplorationProgress(fullResult), 100)

  // Zero exploration progress
  const emptyResult = resolveFaceRecommendations([])
  assert.equal(getFaceExplorationProgress(emptyResult), 0)

  console.log('✓ convenience helpers work correctly')
}

// ---------------------------------------------------------------------------
// Reason strings are populated
// ---------------------------------------------------------------------------

{
  // Unexplored face should have exploration reason
  const result = resolveFaceRecommendations([makeBuild('regent')], makeVector('Fear'))

  const shaman = result.recommendations.find((r) => r.face === 'shaman')!
  assert.ok(shaman.reason.length > 0, 'reason should be non-empty')
  assert.ok(
    shaman.reason.includes('Shaman') || shaman.reason.includes('shaman'),
    'reason should mention the face',
  )

  // Explored face with recency penalty
  const regent = result.recommendations.find((r) => r.face === 'regent')!
  assert.ok(regent.reason.length > 0, 'reason should be non-empty for explored face')

  console.log('✓ reason strings are populated for all recommendations')
}

// ---------------------------------------------------------------------------
// Combined scenario — realistic player journey
// ---------------------------------------------------------------------------

{
  // Player has completed 4 spokes: shaman, challenger, regent, regent
  // Currently feeling Fear (dissatisfied → neutral)
  const builds = [
    makeBuild('shaman', { spokeIndex: 0 }),
    makeBuild('challenger', { spokeIndex: 1 }),
    makeBuild('regent', { spokeIndex: 2 }),
    makeBuild('regent', { spokeIndex: 3 }),
  ]
  const vector = makeVector('Fear')
  const result = resolveFaceRecommendations(builds, vector)

  // Unexplored: architect, diplomat, sage
  assert.equal(result.exploredCount, 3)
  assert.ok(result.unexploredFaces.includes('architect'))
  assert.ok(result.unexploredFaces.includes('diplomat'))
  assert.ok(result.unexploredFaces.includes('sage'))

  // Diplomat should rank high: unexplored + secondary Fear affinity
  const diplomat = result.recommendations.find((r) => r.face === 'diplomat')!
  assert.ok(diplomat.breakdown.explorationBonus > 0)
  assert.ok(diplomat.breakdown.emotionalAffinity > 0)

  // Regent should rank low: explored, used twice, most recent, no Fear affinity
  const regent = result.recommendations.find((r) => r.face === 'regent')!
  assert.equal(regent.timesUsed, 2)
  assert.ok(regent.score < diplomat.score, 'overused regent should score below unexplored diplomat')

  // Shaman should have Fear affinity but is explored (mixed signals)
  const shaman = result.recommendations.find((r) => r.face === 'shaman')!
  assert.equal(shaman.breakdown.emotionalAffinity, EMOTIONAL_AFFINITY_BONUS) // primary Fear affinity
  assert.equal(shaman.breakdown.explorationBonus, 0) // already explored

  console.log('✓ combined scenario — realistic player journey scored correctly')
}

// ---------------------------------------------------------------------------
// Edge: repeated same face many times
// ---------------------------------------------------------------------------

{
  const builds = Array.from({ length: 8 }, (_, i) =>
    makeBuild('architect', { spokeIndex: i }),
  )
  const result = resolveFaceRecommendations(builds)

  const architect = result.recommendations.find((r) => r.face === 'architect')!
  assert.equal(architect.timesUsed, 8)
  assert.ok(architect.breakdown.recencyPenalty < 0)

  // Architect should be the lowest-scored face
  for (const rec of result.recommendations) {
    if (rec.face !== 'architect') {
      assert.ok(
        rec.score > architect.score,
        `${rec.face} should score higher than overused architect`,
      )
    }
  }

  console.log('✓ heavily overused face is scored lowest')
}

console.log('\n✓ All face-recommendation tests passed')
