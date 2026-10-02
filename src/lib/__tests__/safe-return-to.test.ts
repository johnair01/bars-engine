/**
 * Run: npx tsx src/lib/__tests__/safe-return-to.test.ts
 *
 * Guards the completion redirect. `buildOnboardingUrl` used to discard the
 * `returnTo` its callers pass, so finishing a CYOA launched from an NPC always
 * dumped the player on `/` instead of back where they came from.
 */

import assert from 'node:assert/strict'
import {
  buildOnboardingUrl,
  isSafeAppPath,
  resolvePostOnboardingRedirect,
} from '@/lib/safe-return-to'

function testIsSafeAppPath() {
  assert.equal(isSafeAppPath('/campaign/hub?ref=bruised-banana'), true)
  assert.equal(isSafeAppPath('/'), true)
  // Protocol-relative and absolute URLs are open-redirect vectors.
  assert.equal(isSafeAppPath('//evil.example.com'), false)
  assert.equal(isSafeAppPath('https://evil.example.com'), false)
  assert.equal(isSafeAppPath('javascript:alert(1)'), false)
  assert.equal(isSafeAppPath('campaign/hub'), false)
}

function testBuildOnboardingUrlHonoursReturnTo() {
  // The reported case: a CYOA launched from a room must return to that room.
  const room = '/world/bb-bday-001/spoke-0-clean-up'
  assert.equal(buildOnboardingUrl({ returnTo: room }), room)

  const hub = '/campaign/hub?ref=bruised-banana'
  assert.equal(buildOnboardingUrl({ returnTo: hub }), hub)

  // ritual/reset must not override an explicit returnTo.
  assert.equal(buildOnboardingUrl({ returnTo: hub, ritual: true }), hub)
  assert.equal(buildOnboardingUrl({ returnTo: hub, reset: true }), hub)
}

function testBuildOnboardingUrlFallback() {
  // Callers that pass nothing behave exactly as before the fix.
  assert.equal(buildOnboardingUrl(), '/')
  assert.equal(buildOnboardingUrl({}), '/')
  assert.equal(buildOnboardingUrl({ ritual: true }), '/')
  assert.equal(buildOnboardingUrl({ returnTo: undefined }), '/')

  // An unsafe returnTo must never be followed — fall back, don't redirect off-site.
  assert.equal(buildOnboardingUrl({ returnTo: '//evil.example.com' }), '/')
  assert.equal(buildOnboardingUrl({ returnTo: 'https://evil.example.com' }), '/')
  assert.equal(buildOnboardingUrl({ returnTo: '' }), '/')
}

function testResolvePostOnboardingRedirect() {
  assert.equal(resolvePostOnboardingRedirect('/vault', '/'), '/vault')
  assert.equal(resolvePostOnboardingRedirect(undefined, '/fallback'), '/fallback')
  assert.equal(resolvePostOnboardingRedirect('//evil.example.com', '/fallback'), '/fallback')
}

testIsSafeAppPath()
testBuildOnboardingUrlHonoursReturnTo()
testBuildOnboardingUrlFallback()
testResolvePostOnboardingRedirect()
console.log('safe-return-to tests passed')
