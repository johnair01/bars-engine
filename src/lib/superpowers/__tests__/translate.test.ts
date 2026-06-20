/**
 * Superpower translation + matrix + buildDeckSeed lens + descriptions
 * (campaign Phase 1 FR2-4; quiz-design Phase 2 FR5-6).
 * Run: npx tsx src/lib/superpowers/__tests__/translate.test.ts
 */
import assert from 'node:assert/strict'
import type { MoveCard } from '../../allyship-deck/types'
import { buildDeckSeed } from '../../allyship-deck/seed'
import { SUPERPOWER_TRANSLATION } from '../matrix'
import { translateCardForSuperpower } from '../translate'
import {
  SUPERPOWERS,
  orientationToMoveAspect,
  orientationToSubject,
  type Superpower,
  type SuperpowerOrientation,
} from '../types'
import {
  SUPERPOWER_DESCRIPTIONS,
  composeResultCopy,
  allSuperpowersDescribed,
  RESULT_FRAMING,
} from '../quiz/descriptions'
import { scoreQuiz } from '../quiz/score'

const ORIENTATIONS: SuperpowerOrientation[] = ['internal', 'external']

const CARD: MoveCard = {
  id: 'OPEN-GR-SHAMAN',
  num: '001',
  kind: 'move',
  move: 'open_up',
  operation: 'shaman',
  domain: 'GATHERING_RESOURCES',
  outputBar: 'experience',
  title: "What's Actually Scarce",
  submovePrompt: 'Notice the signal. What is here?',
  primaryQuestion: 'What is actually depleted in me right now?',
  campaignQuestion: 'What does this effort actually lack?',
  defaultSubject: 'self',
  optimizesFor: 'Seeing the real resource gap',
  forbiddenMoves: ['Assuming scarcity without looking'],
  failureModes: ["Confusing 'I'm tired' with 'we're broke'"],
  remediation: 'Name the one resource that, if present, would change everything.',
  capabilities: ['exploration', 'rest'],
  status: 'authored',
}

function testBridges() {
  assert.equal(orientationToMoveAspect('internal'), 'inner')
  assert.equal(orientationToMoveAspect('external'), 'outer')
  assert.equal(orientationToSubject('internal'), 'self')
  assert.equal(orientationToSubject('external'), 'campaign')
}

function testMatrixCompleteAndNonEmpty() {
  for (const sp of SUPERPOWERS) {
    for (const o of ORIENTATIONS) {
      const cell = SUPERPOWER_TRANSLATION[sp][o]
      assert.ok(cell.prompt.length > 0, `${sp}/${o} prompt non-empty`)
      assert.ok(cell.suggestedArtifact.length > 0, `${sp}/${o} artifact non-empty`)
    }
  }
}

function testTranslateUsesCardReadingPerOrientation() {
  for (const sp of SUPERPOWERS) {
    const internal = translateCardForSuperpower(CARD, sp, 'internal')
    assert.equal(internal.cardReading, CARD.primaryQuestion, `${sp} internal → primaryQuestion`)
    assert.equal(internal.prompt, SUPERPOWER_TRANSLATION[sp].internal.prompt)
    assert.equal(internal.baseCardId, CARD.id)
    assert.equal(internal.baseCardTitle, CARD.title)

    const external = translateCardForSuperpower(CARD, sp, 'external')
    assert.equal(external.cardReading, CARD.campaignQuestion, `${sp} external → campaignQuestion`)
    assert.equal(external.suggestedArtifact, SUPERPOWER_TRANSLATION[sp].external.suggestedArtifact)
  }
}

function testBuildDeckSeedBackwardCompatible() {
  const seed = buildDeckSeed(CARD, 'self')
  assert.equal(seed.rootId, 'deck_OPEN-GR-SHAMAN', 'unchanged rootId without lens')
  assert.equal(seed.provenance.superpower, undefined)
  assert.equal(seed.provenance.orientation, undefined)
  assert.ok(seed.description.includes(CARD.primaryQuestion))
  // empty opts behaves identically
  assert.deepEqual(buildDeckSeed(CARD, 'self', {}), seed)
}

function testBuildDeckSeedWithLens() {
  const seed = buildDeckSeed(CARD, 'campaign', { superpower: 'connector', orientation: 'external' })
  assert.equal(seed.rootId, 'deck_OPEN-GR-SHAMAN_connector_external', 'namespaced rootId')
  assert.equal(seed.provenance.superpower, 'connector')
  assert.equal(seed.provenance.orientation, 'external')
  const cell = SUPERPOWER_TRANSLATION.connector.external
  assert.ok(seed.description.includes(cell.prompt), 'description carries lens prompt')
  assert.ok(seed.description.includes(cell.suggestedArtifact), 'description carries artifact')
  assert.ok(seed.description.includes(CARD.campaignQuestion), 'description carries campaign reading')
}

function testPartialLensIgnored() {
  // superpower without orientation (or vice versa) → backward-compatible seed
  const a = buildDeckSeed(CARD, 'self', { superpower: 'coach' })
  assert.equal(a.rootId, 'deck_OPEN-GR-SHAMAN')
  assert.equal(a.provenance.superpower, undefined)
}

function testDescriptionsCompleteAndShadowed() {
  assert.ok(allSuperpowersDescribed(), 'every superpower described')
  for (const sp of SUPERPOWERS) {
    const d = SUPERPOWER_DESCRIPTIONS[sp]
    assert.ok(d.gift.length > 0 && d.shadow.length > 0 && d.atBest.length > 0, `${sp} full copy`)
    // anti-Barnum: each description carries a real shadow
    assert.ok(d.shadow.length > 20, `${sp} shadow is substantive`)
  }
}

function testComposeResultCopy() {
  const r = scoreQuiz([]) // tie → primary/secondary from TIE_ORDER
  const copy = composeResultCopy(r)
  assert.equal(copy.primary.superpower, r.primary)
  assert.equal(copy.secondary.superpower, r.secondary)
  assert.equal(copy.marginPct, Math.round(r.margin * 100))
  assert.equal(copy.framing, RESULT_FRAMING)
  assert.ok(copy.tryAdjacent.includes(r.secondary))
}

const tests = [
  testBridges,
  testMatrixCompleteAndNonEmpty,
  testTranslateUsesCardReadingPerOrientation,
  testBuildDeckSeedBackwardCompatible,
  testBuildDeckSeedWithLens,
  testPartialLensIgnored,
  testDescriptionsCompleteAndShadowed,
  testComposeResultCopy,
]

let passed = 0
for (const t of tests) {
  t()
  passed += 1
}
console.log(`✓ superpower translate/matrix/seed/descriptions: ${passed}/${tests.length} tests passed`)
