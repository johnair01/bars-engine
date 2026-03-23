/**
 * Pure BBMT guided-action ordering — no DB.
 */
import assert from 'node:assert/strict'
import { computeGuidedActions } from '@/lib/bruised-banana-milestone/guided-actions'

function testOnboardingFirst() {
  const a = computeGuidedActions({
    campaignRef: 'bruised-banana',
    onboardingComplete: false,
    vaultDraftsAtCap: false,
    vaultUnplacedAtCap: false,
    hasGameboardParticipation: false,
    isEventMode: true,
  })
  assert.equal(a[0]?.kind, 'onboarding')
  assert.ok(a[0]?.href.includes('ref='))
}

function testVaultBeforeGameboard() {
  const a = computeGuidedActions({
    campaignRef: 'bruised-banana',
    onboardingComplete: true,
    vaultDraftsAtCap: true,
    vaultUnplacedAtCap: false,
    hasGameboardParticipation: false,
    isEventMode: true,
  })
  assert.equal(a[0]?.kind, 'vault')
  assert.ok(a[0]?.href.includes('/hand/compost'))
}

function testGameboardWhenNoParticipation() {
  const a = computeGuidedActions({
    campaignRef: 'bruised-banana',
    onboardingComplete: true,
    vaultDraftsAtCap: false,
    vaultUnplacedAtCap: false,
    hasGameboardParticipation: false,
    isEventMode: true,
  })
  assert.equal(a[0]?.kind, 'gameboard')
  assert.ok(a[0]?.href.includes('/campaign/board'))
}

function testHubWhenParticipating() {
  const a = computeGuidedActions({
    campaignRef: 'bruised-banana',
    onboardingComplete: true,
    vaultDraftsAtCap: false,
    vaultUnplacedAtCap: false,
    hasGameboardParticipation: true,
    isEventMode: true,
  })
  assert.equal(a[0]?.kind, 'hub')
  assert.ok(a[0]?.href.includes('/campaign/hub'))
}

function testMaxThree() {
  const a = computeGuidedActions({
    campaignRef: 'bruised-banana',
    onboardingComplete: true,
    vaultDraftsAtCap: false,
    vaultUnplacedAtCap: false,
    hasGameboardParticipation: true,
    isEventMode: true,
  })
  assert.ok(a.length <= 3)
}

testOnboardingFirst()
testVaultBeforeGameboard()
testGameboardWhenNoParticipation()
testHubWhenParticipating()
testMaxThree()
console.log('bruised-banana-milestone: computeGuidedActions OK')
