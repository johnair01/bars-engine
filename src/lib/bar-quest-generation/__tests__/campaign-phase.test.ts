/**
 * Campaign phase keys — no DB.
 * Run: npx tsx src/lib/bar-quest-generation/__tests__/campaign-phase.test.ts
 */
import assert from 'node:assert/strict'
import { kotterStageToCampaignPhaseKey } from '../campaign-phase'

function testPhaseKeys() {
  assert.equal(kotterStageToCampaignPhaseKey(1), 'phase_1_opening_momentum')
  assert.match(kotterStageToCampaignPhaseKey(3), /^kotter_stage_3_/)
  assert.equal(kotterStageToCampaignPhaseKey(0), kotterStageToCampaignPhaseKey(1))
  assert.equal(kotterStageToCampaignPhaseKey(99), kotterStageToCampaignPhaseKey(8))
}

testPhaseKeys()
console.log('✓ campaign-phase (kotterStageToCampaignPhaseKey) OK')
