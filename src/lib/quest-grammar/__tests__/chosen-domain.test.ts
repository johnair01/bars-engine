/**
 * Domain provenance: a campaign with an empty domain is treated exactly like no campaign.
 * Run: npx tsx src/lib/quest-grammar/__tests__/chosen-domain.test.ts
 */
import assert from 'node:assert/strict'
import { resolveDomainSource, settleDomain, isDomainKey } from '../domain-source'

const nothing = resolveDomainSource(null, null)
assert.equal(nothing.requiresPick, true)
assert.equal(nothing.preselectedDomain, null)
assert.equal(nothing.domainSource, null)
assert.equal(nothing.availableDomains.length, 4)

assert.deepEqual(resolveDomainSource(undefined, undefined), nothing)
assert.deepEqual(resolveDomainSource('', 'DIRECT_ACTION'), nothing, 'no campaign carries nothing')

for (const empty of [null, undefined, '', '   ']) {
  // Does not refuse: an empty campaign domain resolves to "require a pick", never throws.
  assert.doesNotThrow(() => resolveDomainSource('camp_1', empty))
  const r = resolveDomainSource('camp_1', empty)
  assert.deepEqual(r, nothing, `campaign with domain ${JSON.stringify(empty)} behaves like no campaign`)
  assert.notEqual(r.preselectedDomain, 'GATHERING_RESOURCES')
}

// Unrecognised domain text is not carried either.
assert.deepEqual(resolveDomainSource('camp_1', 'NOT_A_DOMAIN'), nothing)

// A campaign with a domain still carries it.
const carried = resolveDomainSource('camp_1', 'DIRECT_ACTION')
assert.equal(carried.preselectedDomain, 'DIRECT_ACTION')
assert.equal(carried.requiresPick, false)
assert.equal(carried.domainSource, 'campaign')

// ─── settleDomain: the build either has a domain or stops ─────────────────────────────────────
//
// resolveDomainSource says what the FORM opens with; settleDomain is what the BUILD does. The seed's
// AC 2 needs both: "no campaign builds only once a domain is picked", and nothing gets built without one.

// 1. Nothing to carry and no pick: the build does NOT proceed and asks for a pick.
const mustPick = settleDomain(nothing)
assert.equal(mustPick.ok, false)
assert.equal(mustPick.ok === false && mustPick.requiresPick, true)
assert.equal(mustPick.ok === false && mustPick.availableDomains.length, 4)

// 2. An empty-domain campaign and no pick: identical — it does not build either.
const emptyCampaign = resolveDomainSource('camp_1', '')
assert.deepEqual(settleDomain(emptyCampaign), mustPick, 'empty campaign domain stops the build the same way')

// 3. No campaign, but a person picks: NOW it builds, and records the pick as the source.
const picked = settleDomain(nothing, 'RAISE_AWARENESS')
assert.equal(picked.ok, true)
assert.equal(picked.ok === true && picked.chosenDomain, 'RAISE_AWARENESS')
assert.equal(picked.ok === true && picked.domainSource, 'user_pick')

// 4. A campaign with a domain needs no pick and inherits exactly that domain.
const inherited = settleDomain(carried)
assert.equal(inherited.ok, true)
assert.equal(inherited.ok === true && inherited.chosenDomain, 'DIRECT_ACTION')
assert.equal(inherited.ok === true && inherited.domainSource, 'campaign')

// 5. A pick overrides what the campaign carries — a deliberate override, recorded as a pick.
const override = settleDomain(carried, 'GATHERING_RESOURCES')
assert.equal(override.ok, true)
assert.equal(override.ok === true && override.chosenDomain, 'GATHERING_RESOURCES')
assert.equal(override.ok === true && override.domainSource, 'user_pick')

// 6. A junk pick is not a pick: it falls through to the campaign, or to requiring one.
assert.deepEqual(settleDomain(carried, 'NOT_A_DOMAIN'), inherited)
assert.deepEqual(settleDomain(nothing, 'NOT_A_DOMAIN'), mustPick)

// 7. Nothing builds with GATHERING_RESOURCES unless a person chose it or a campaign carried it.
for (const r of [mustPick, settleDomain(emptyCampaign)]) {
  assert.equal(r.ok, false, 'no silent GATHERING_RESOURCES: the build stops instead')
}

// ─── isDomainKey: the guard every carry-site uses ────────────────────────────────────────────
//
// mintQuestFromText now REQUIRES a domain, and its callers (growQuestFromBar, tap-the-vein) refuse rather
// than default. That refusal is only as good as this predicate, so pin it: nothing that is not one of the
// four real keys may pass, or a junk/absent value would be carried into a quest as though it were a choice.

assert.equal(isDomainKey(null), false, 'null is not a domain')
assert.equal(isDomainKey(undefined), false, 'undefined is not a domain')
assert.equal(isDomainKey(''), false, 'the empty string is not a domain')
assert.equal(isDomainKey('   '), false, 'whitespace is not a domain')
assert.equal(isDomainKey('gathering_resources'), false, 'the key is case-sensitive')
assert.equal(isDomainKey('NOT_A_DOMAIN'), false, 'junk is not a domain')
assert.equal(isDomainKey(42), false, 'a number is not a domain')
for (const key of ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING']) {
  assert.equal(isDomainKey(key), true, `${key} is a domain`)
}

console.log('chosen-domain: ok')
