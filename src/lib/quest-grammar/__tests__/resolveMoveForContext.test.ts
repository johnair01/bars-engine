/**
 * resolveMoveForContext — campaign Kotter phase rotates domain move choice (FM T4.1).
 * Run: npx tsx src/lib/quest-grammar/__tests__/resolveMoveForContext.test.ts
 */
import assert from 'node:assert/strict'
import { resolveMoveForContext } from '../resolveMoveForContext'

function testPhaseRotationNoLens() {
  const a = resolveMoveForContext({
    allyshipDomain: 'GATHERING_RESOURCES',
    campaignPhase: 1,
  })
  const b = resolveMoveForContext({
    allyshipDomain: 'GATHERING_RESOURCES',
    campaignPhase: 2,
  })
  assert.ok(a && b, 'moves resolve')
  assert.notEqual(a!.id, b!.id, 'Kotter 1 vs 2 should pick different domain-preferred moves when no lens')
}

function testDefaultPhaseLikeOpening() {
  const explicit = resolveMoveForContext({
    allyshipDomain: 'DIRECT_ACTION',
    campaignPhase: 1,
  })
  const implicit = resolveMoveForContext({
    allyshipDomain: 'DIRECT_ACTION',
  })
  assert.ok(explicit && implicit)
  assert.equal(explicit!.id, implicit!.id, 'undefined campaignPhase defaults like stage 1')
}

testPhaseRotationNoLens()
testDefaultPhaseLikeOpening()
console.log('✓ resolveMoveForContext (campaign phase) OK')
