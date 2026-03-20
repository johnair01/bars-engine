/**
 * Branched path / generateBranchedPath
 * Run: npx tsx src/lib/quest-grammar/__tests__/branchedPath.test.ts
 */

import { generateBranchedPath } from '../branchedPath'
import type { UnpackingAnswers } from '../types'

const ANSWERS: UnpackingAnswers = {
  q1: 'I want people to donate to the Bruised Banana Residency',
  q2: 'I will feel triumphant and poignant and blissful',
  q3: "I haven't received any donations.",
  q4: "It's scary to be here. I'm frustrated.",
  q5: "To be anxious I'd have to be worried about the future.",
  q6: "I'm not ready",
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

async function testGenerateNoDb() {
  const packet = await generateBranchedPath(
    {
      unpackingAnswers: ANSWERS,
      alignedAction: 'Clean Up attachment to outcomes',
      segment: 'player',
      primaryBranchAxis: 'horizontal',
    },
    { maxDepth: 3, tokenBudget: 50000 }
  )
  assert(packet.nodes.length >= 6, 'nodes')
  assert(packet.branchedPathMeta.maxDepth === 3, 'meta depth')
  assert(packet.branchedPathMeta.primaryBranchAxis === 'horizontal', 'axis')
  assert(typeof packet.branchedPathMeta.withinBudget === 'boolean', 'budget flag')
  assert(packet.branchedPathMeta.estimatedTokens > 0, 'estimate')
}

async function run() {
  await testGenerateNoDb()
  console.log('branchedPath tests: ok')
}

run()
