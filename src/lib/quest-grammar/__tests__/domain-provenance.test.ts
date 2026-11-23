/**
 * Domain provenance is carried, never defaulted — pinned as a test rather than a probe.
 *
 * WHY THIS FILE EXISTS. The rule (Wendell, 2026-11-20: "a default here is exactly how Gather Resources silently
 * became every quest's answer") was being enforced by reading code and running throwaway probes, and it was found
 * broken five separate times in one day. Probes vanish; this does not.
 *
 * Two things are pinned here:
 *   1. A missing, empty, or unrecognised domain resolves to NULL — never to Gathering Resources.
 *   2. A campaign that declares a domain for itself (campaign-domain-declarations.ts) is the ONLY way Gathering
 *      Resources may be supplied without a person choosing it, and even then the declaration wins over nothing,
 *      not over a carried domain.
 *
 * Run: ./node_modules/.bin/tsx src/lib/quest-grammar/__tests__/domain-provenance.test.ts
 */
import assert from 'node:assert/strict'
import { clampCampaignAllyshipDomain } from '@/lib/campaign-instance-resolve'
import {
  campaignRefOf,
  declaredDomainFor,
  resolveCarriedDomain,
} from '@/lib/campaign-domain-declarations'

// ─── 1. Nothing to carry resolves to null, never to a default ────────────────────────────────────

for (const absent of [null, undefined, '', '   ', 'NOT_A_DOMAIN', 'gathering_resources']) {
  assert.equal(
    clampCampaignAllyshipDomain(absent),
    null,
    `clampCampaignAllyshipDomain(${JSON.stringify(absent)}) must be null — a default here is how Gather Resources ` +
      'silently became every quest\'s answer'
  )
  assert.equal(
    resolveCarriedDomain(absent, 'not-a-declared-campaign'),
    null,
    `resolveCarriedDomain(${JSON.stringify(absent)}, undeclared) must be null`
  )
}

// A real domain still carries.
assert.equal(clampCampaignAllyshipDomain('DIRECT_ACTION'), 'DIRECT_ACTION')

// ─── 2. A declared campaign domain is a stated fact, not a default ──────────────────────────────

assert.equal(
  declaredDomainFor('bruised-banana'),
  'GATHERING_RESOURCES',
  'bruised-banana declares Gather Resources as a property of the campaign, with a reason in the source'
)
assert.equal(declaredDomainFor('some-other-campaign'), null, 'an undeclared campaign declares nothing')
assert.equal(declaredDomainFor(null), null)
assert.equal(declaredDomainFor(''), null)

// Precedence: what an instance carries beats what a campaign declares. A declaration fills a gap; it does not override.
assert.equal(resolveCarriedDomain('RAISE_AWARENESS', 'bruised-banana'), 'RAISE_AWARENESS')
assert.equal(resolveCarriedDomain(null, 'bruised-banana'), 'GATHERING_RESOURCES')
assert.equal(resolveCarriedDomain(undefined, 'unknown'), null)

// ─── 3. Reading a campaignRef out of an untyped blob is a check, not a cast ─────────────────────

assert.equal(campaignRefOf({ campaignRef: 'bruised-banana' }), 'bruised-banana')
assert.equal(campaignRefOf({ campaignRef: '  spaced  ' }), 'spaced')
assert.equal(campaignRefOf({ campaignRef: 42 }), null, 'a non-string is not a campaign ref')
assert.equal(campaignRefOf({ campaignRef: '' }), null, 'an empty ref is no ref')
assert.equal(campaignRefOf({}), null)
assert.equal(campaignRefOf(null), null)
assert.equal(campaignRefOf('a string is not an object'), null)

console.log('domain-provenance: ok')
