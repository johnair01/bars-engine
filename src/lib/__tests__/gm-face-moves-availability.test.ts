/**
 * Run: npx tsx src/lib/__tests__/gm-face-moves-availability.test.ts
 */

import { assertGmFaceStageMoveRegistry } from '@/lib/gm-face-stage-moves'
import { getAvailableFaceMovesForStage } from '@/lib/gm-face-moves-availability'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  assertGmFaceStageMoveRegistry()

  const s1 = getAvailableFaceMovesForStage(1)
  assert(s1.length === 6, 'stage 1 has six moves')
  assert(s1.every((m) => m.kotterStage === 1), 'all stage 1')

  const s8 = getAvailableFaceMovesForStage(8)
  assert(s8.length === 6 && s8[0]!.id.startsWith('K8_'), 'stage 8')

  const clamped = getAvailableFaceMovesForStage(99)
  assert(clamped.length === 6 && clamped[0]!.kotterStage === 8, 'clamp high to 8')

  const low = getAvailableFaceMovesForStage(0)
  assert(low[0]!.kotterStage === 1, 'clamp low to 1')

  console.log('gm-face-moves-availability: ok')
}

run()
