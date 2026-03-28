/**
 * SCL-B6 — portal graph contract (automated half of Verification Quest steps 3–4).
 * Run: npm run test:scl-portal
 */
import assert from 'node:assert'
import {
  SCL_WAKE_GATHER_NEXT,
  SCL_POST_WAKE_NODE,
  assertPortalEntryMatchesContract,
  assertFacePickHasSixFaces,
  assertPostWakeChoices,
  buildPortalEntryChoices,
  buildFacePickChoices,
  buildPostWakeChoices,
} from '@/lib/campaign-portal/portal-graph-contract'

assertPortalEntryMatchesContract(buildPortalEntryChoices())

const wakeTargets = ['Gather_Wake', 'Gather_Clean', 'Gather_Show', 'schools'] as const
for (const target of wakeTargets) {
  assertFacePickHasSixFaces(buildFacePickChoices(target))
}

assertPostWakeChoices(buildPostWakeChoices())

assert.strictEqual(SCL_WAKE_GATHER_NEXT, 'WakeUp_Emit')
assert.strictEqual(SCL_POST_WAKE_NODE, 'PostWake_Library')

console.log('scl-portal-verification ok')
