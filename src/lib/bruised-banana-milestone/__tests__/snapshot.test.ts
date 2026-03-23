/**
 * Pure milestone snapshot — no DB.
 */
import assert from 'node:assert/strict'
import { buildMilestoneSnapshot } from '@/lib/bruised-banana-milestone/snapshot'

function testProgressAndFundraising() {
  const s = buildMilestoneSnapshot({
    name: 'Test',
    campaignRef: 'bruised-banana',
    kotterStage: 2,
    goalAmountCents: 300_000,
    currentAmountCents: 150_000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-02-01'),
    allyshipDomain: 'GATHERING_RESOURCES',
  })
  assert.ok(s)
  assert.equal(s!.kotterStage, 2)
  assert.ok(s!.fundraisingLine?.includes('1,500'))
  assert.ok(s!.fundraisingLine?.includes('3,000'))
  assert.equal(s!.progress01, 0.5)
  assert.equal(s!.isBruisedBananaCampaign, true)
}

function testNullInstance() {
  assert.equal(buildMilestoneSnapshot(null), null)
}

testProgressAndFundraising()
testNullInstance()
console.log('bruised-banana-milestone: buildMilestoneSnapshot OK')
