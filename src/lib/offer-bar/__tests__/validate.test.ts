#!/usr/bin/env npx tsx
/**
 * Offer BAR validation + docQuest round-trip (no DB).
 */
import assert from 'node:assert/strict'
import {
  OFFER_BAR_KIND,
  OFFER_BAR_PROTOCOL_VERSION,
  type OfferBarCreateInput,
  parseOfferBarFromDocQuest,
  serializeOfferBarDocQuest,
  validateAndBuildOfferBarMetadata,
} from '@/lib/offer-bar'

function testValidMinimal() {
  const r = validateAndBuildOfferBarMetadata({
    title: 'Dog walk buddy',
    description: 'I walk my dog daily; can add yours along the route.',
    skillBand: 'unskilled',
    campaignRef: 'bruised-banana',
    dswPath: 'time',
  })
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.equal(r.metadata.kind, OFFER_BAR_KIND)
  assert.equal(r.metadata.protocolVersion, OFFER_BAR_PROTOCOL_VERSION)
  assert.equal(r.metadata.skillBand, 'unskilled')
  assert.equal(r.metadata.source, 'dsw_wizard')
  assert.equal(r.metadata.campaignRef, 'bruised-banana')
  assert.equal(r.metadata.dswPath, 'time')
}

function testRoundTripDocQuest() {
  const r = validateAndBuildOfferBarMetadata({
    title: 'Batch cook',
    description: 'Weekly meal prep for someone recovering from surgery.',
    skillBand: 'skilled',
    estimatedHours: 2.5,
    sessionCount: 4,
    creativeOfferPattern: 'batch',
    dswPath: 'space',
  })
  assert.equal(r.ok, true)
  if (!r.ok) return
  const json = serializeOfferBarDocQuest(r.metadata)
  const parsed = parseOfferBarFromDocQuest(json)
  assert.ok(parsed)
  assert.equal(parsed!.skillBand, 'skilled')
  assert.equal(parsed!.estimatedHours, 2.5)
  assert.equal(parsed!.sessionCount, 4)
  assert.equal(parsed!.creativeOfferPattern, 'batch')
  assert.equal(parsed!.dswPath, 'space')
}

function testRejectEmptyTitle() {
  const r = validateAndBuildOfferBarMetadata({
    title: '   ',
    description: 'x',
    skillBand: 'either',
  })
  assert.equal(r.ok, false)
  if (r.ok) return
  assert.ok(r.error.includes('Title'))
}

function testRejectBadSkill() {
  const r = validateAndBuildOfferBarMetadata({
    title: 'T',
    description: 'D',
    skillBand: 'nope',
  } as unknown as OfferBarCreateInput)
  assert.equal(r.ok, false)
}

function testRejectHoursTooHigh() {
  const r = validateAndBuildOfferBarMetadata({
    title: 'T',
    description: 'D',
    skillBand: 'either',
    estimatedHours: 9999,
  })
  assert.equal(r.ok, false)
}

function testParseInvalidJson() {
  assert.equal(parseOfferBarFromDocQuest('not json'), null)
  assert.equal(parseOfferBarFromDocQuest('{}'), null)
}

function run() {
  testValidMinimal()
  testRoundTripDocQuest()
  testRejectEmptyTitle()
  testRejectBadSkill()
  testRejectHoursTooHigh()
  testParseInvalidJson()
  console.log('offer-bar validate tests: OK')
}

run()
