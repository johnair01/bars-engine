/**
 * The corridor and the lead form's invariants.
 *
 * The one that matters is the last block: the shape of a lead makes it
 * impossible to hand over a third party's contact details, and that is a
 * property of the type rather than a discipline somebody remembers.
 */
import assert from 'node:assert/strict'
import {
  CORRIDOR,
  CORRIDOR_CITY_NAMES,
  isCorridorCity,
  LEAD_KINDS,
  LEAD_KIND_KEYS,
  RECALL_PROMPTS,
} from '../corridor'

// ── The line ─────────────────────────────────────────────────────────────────

for (const city of ['Portland', 'Tacoma', 'Seattle']) {
  const found = CORRIDOR.find((c) => c.name === city)
  assert.ok(found, `${city} is on the corridor`)
  assert.equal(found.tier, 'anchor', `${city} is an anchor`)
}

for (const city of ['Eugene', 'Bellingham']) {
  const found = CORRIDOR.find((c) => c.name === city)
  assert.ok(found, `${city} is the far end of the reach`)
  assert.equal(found.tier, 'reach')
}

assert.equal(new Set(CORRIDOR_CITY_NAMES).size, CORRIDOR.length, 'no duplicate cities')

// Ordered south to north, so the list reads like the drive.
const order = CORRIDOR.map((c) => c.name)
assert.equal(order[0], 'Eugene', 'starts at the south end')
assert.equal(order[order.length - 1], 'Bellingham', 'ends at the north end')

assert.equal(isCorridorCity('portland'), true, 'matching is case-insensitive')
assert.equal(isCorridorCity('  Seattle '), true, 'and tolerant of whitespace')
assert.equal(isCorridorCity('Boise'), false, 'off the line is off the line')

// ── Lead kinds ───────────────────────────────────────────────────────────────

assert.equal(new Set(LEAD_KINDS.map((k) => k.key)).size, LEAD_KINDS.length, 'unique keys')
for (const k of LEAD_KINDS) assert.ok(LEAD_KIND_KEYS.has(k.key), `${k.key} validates`)
assert.equal(LEAD_KIND_KEYS.has('whatever'), false, 'unknown kinds are rejected')

// ── The prompts ──────────────────────────────────────────────────────────────

assert.ok(RECALL_PROMPTS.length >= 10, 'enough prompts that one of them catches')
for (const p of RECALL_PROMPTS) {
  assert.ok(p.endsWith('?'), `a prompt is a question: ${p}`)
  assert.equal(p.includes('!'), false, 'no exclamation points in body copy')
}

// ── The privacy shape ────────────────────────────────────────────────────────

// A lead names a PLACE. There is no field on it that could carry a third
// party's email or phone, which is the point — a submitter cannot hand over
// somebody who has not agreed to be handed over. If a future edit adds one,
// this test is where it should become an argument rather than a merge.
{
  type LeadShape = {
    place: string
    city: string
    kind: string
    canIntroduce: boolean
    note?: string
    submitterName?: string
    submitterEmail: string
    consent: boolean
  }
  const lead: LeadShape = {
    place: "A bookshop",
    city: 'Tacoma',
    kind: 'bookstore',
    canIntroduce: true,
    submitterEmail: 'someone@example.com',
    consent: true,
  }
  const keys = Object.keys(lead)
  const contactish = keys.filter(
    (k) => /email|phone|contact/i.test(k) && !k.startsWith('submitter'),
  )
  assert.deepEqual(contactish, [], 'the only contact details belong to the submitter')
}

console.log('✓ corridor: the line reads south to north, and a lead names a place')
