import assert from 'node:assert/strict'
import { LENS_DOMAINS, LENS_DOMAIN_KEYS, isLensDomainKey } from '@/lib/lenses/domains'
import { getPromptSeeds } from '@/lib/lenses/prompt-seeds'

function testFiveDomainContract() {
  assert.deepEqual(LENS_DOMAIN_KEYS, ['relationships', 'career', 'money', 'health', 'allyship'])
  assert.equal(LENS_DOMAINS.length, 5)
  assert.equal(isLensDomainKey('relationships'), true)
  assert.equal(isLensDomainKey('health'), true)
  assert.equal(isLensDomainKey('daily'), false)
}

function testDeterministicPromptSeeds() {
  const first = getPromptSeeds({ domain: 'relationships', superpower: 'connector', orientation: 'external' })
  const second = getPromptSeeds({ domain: 'relationships', superpower: 'connector', orientation: 'external' })

  assert.deepEqual(first, second)
  assert.equal(first.length, 3)
  assert.match(first[0], /recurring contact, repair, and invitation/)
  assert.match(first[0], /external focus/)
}

function testFallbackPromptSeeds() {
  const seeds = getPromptSeeds({ domain: 'allyship' })

  assert.equal(seeds.length, 3)
  assert.match(seeds[0], /practice container/)
  assert.doesNotMatch(seeds.join(' '), /undefined|null/)
}

testFiveDomainContract()
testDeterministicPromptSeeds()
testFallbackPromptSeeds()

console.log('lenses prompt seeds: five domains and deterministic seeds OK')

