/**
 * Need → AllyshipCard view mapping (design handoff).
 * Run: npx tsx src/lib/superpowers/__tests__/card-view.test.ts
 */
import assert from 'node:assert/strict'
import type { MoveCard } from '../../allyship-deck/types'
import { buildCardData, buildMod, buildNeedView, formatAsk, resolveCardStatus, type NeedLike } from '../card-view'

const CARD: MoveCard = {
  id: 'WAKE-GR-DIPLOMAT',
  num: '005',
  kind: 'move',
  move: 'wake_up',
  operation: 'diplomat',
  domain: 'GATHERING_RESOURCES',
  outputBar: 'awareness',
  title: 'Who Holds the Purse',
  submovePrompt: 'Notice relationships.',
  primaryQuestion: 'Whose resources, trust, or permission actually shape this?',
  campaignQuestion: 'Who are the givers and gatekeepers?',
  defaultSubject: 'self',
  optimizesFor: 'Seeing the relational map.',
  forbiddenMoves: [],
  failureModes: [],
  remediation: 'List who must say yes.',
  capabilities: ['connection'],
  status: 'authored',
}

const NEED: NeedLike = {
  id: 'need-1',
  superpower: 'connector',
  orientation: 'external',
  cardId: 'WAKE-GR-DIPLOMAT',
  unit: 'action',
  value: 1,
  status: 'open',
  claimedByPlayerId: null,
  title: 'Broker a warm intro to someone who funds adaptive vehicles.',
}

function testCardData() {
  const c = buildCardData(CARD)
  assert.equal(c.move, 'wake', 'move key mapped (wake_up→wake)')
  assert.equal(c.face, 'diplomat')
  assert.equal(c.domain, 'gather', 'domain key mapped')
  assert.equal(c.el, 'earth', 'element from MOVE_ELEMENT')
  assert.ok(c.moveLabel.length > 0 && c.faceLabel.length > 0 && c.domainLabel.length > 0)
  assert.equal(c.q, CARD.primaryQuestion)
  assert.equal(c.num, '005')
}

function testOpenMoveMapsLiminal() {
  const c = buildCardData({ ...CARD, move: 'open_up' })
  assert.equal(c.move, 'open')
  assert.equal(c.el, 'liminal', 'open_up → liminal element')
}

function testFormatAsk() {
  assert.equal(formatAsk('action', 1), '1 action')
  assert.equal(formatAsk('currency', 50), '$50')
  assert.equal(formatAsk('hours', 2), '2 hrs')
  assert.equal(formatAsk('hours', 1), '1 hr')
}

function testStatusMatrix() {
  assert.equal(resolveCardStatus('done', { mine: true, signedIn: true }), 'done')
  assert.equal(resolveCardStatus('claimed', { mine: true, signedIn: true }), 'mine')
  assert.equal(resolveCardStatus('claimed', { mine: false, signedIn: true }), 'taken')
  assert.equal(resolveCardStatus('open', { mine: false, signedIn: true }), 'open')
  assert.equal(resolveCardStatus('open', { mine: false, signedIn: false }), 'signedout')
}

function testMod() {
  const m = buildMod(CARD, NEED)
  assert.equal(m.spKey, 'connector')
  assert.equal(m.spLabel, 'Connector')
  assert.equal(m.contribution, NEED.title, 'contribution = need.title when present')
  assert.ok(m.artifact.length > 0, 'artifact from translation')
  assert.equal(m.ask, '1 action')
  assert.equal(m.internal, false)
  // falls back to translation prompt when no title
  const m2 = buildMod(CARD, { ...NEED, title: null })
  assert.ok(m2.contribution.length > 0 && m2.contribution !== '')
}

function testNeedView() {
  const v = buildNeedView(CARD, NEED, { mine: false, signedIn: true })
  assert.equal(v.id, 'need-1')
  assert.equal(v.card.title, CARD.title)
  assert.equal(v.mod.spLabel, 'Connector')
  assert.equal(v.status, 'open')
}

const tests = [testCardData, testOpenMoveMapsLiminal, testFormatAsk, testStatusMatrix, testMod, testNeedView]
let passed = 0
for (const t of tests) {
  t()
  passed += 1
}
console.log(`✓ card-view mapping: ${passed}/${tests.length} tests passed`)
