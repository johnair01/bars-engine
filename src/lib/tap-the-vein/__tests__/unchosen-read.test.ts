import assert from 'node:assert/strict'
import { compostLineFor, planGoldRead, sharesRun, weekOf, type LivePitch } from '@/lib/tap-the-vein/unchosen-read'
import { itemsOf, toWholeContext, type WholeContext } from '@/lib/tap-the-vein/unchosen-whole'
import type { UnchosenLine } from '@/lib/tap-the-vein/unchosen'
import type { VeinHistoryExport } from '@/lib/tap-the-vein/vein-history'

// Sample words only: nothing here is his.
const FREE = 'The garden keeps asking for my hands.\nAsk Maya if she wants to co-host the podcast, and what a fair split of the sponsor money looks like.'
const history: VeinHistoryExport = {
  version: 1, readAt: '2026-11-03T00:00:00Z', since: '2026-09-04',
  days: [
    { date: '2026-11-02', status: 'sealed', sealedAt: '2026-11-02T09:00:00Z', freewrite: FREE, wordCount: 30, lensDomain: null,
      seeds: [{ id: 't1', text: 'Draft the grant outline', status: 'composted', lensGoalId: 'g1', barId: null, maturity: null, questId: null,
        chargeLevel: null, blocked: false, blockedAt: null, notes: 0, carryCount: 2, completedAt: null, compostReason: 'no_reason' }] },
    { date: '2026-11-03', status: 'open', sealedAt: null, freewrite: 'Today is still in progress.', wordCount: 5, lensDomain: null, seeds: [] },
  ],
}
const pile: UnchosenLine[] = [
  { key: '2026-11-02:b:0', day: '2026-11-02', text: 'Plant the garlic in the back garden', fate: 'raw' },
  { key: '2026-11-02:b:1', day: '2026-11-02', text: 'Fix the bike light', fate: 'composted' },
]
const pitch: LivePitch = { id: 'p1', word: 'garden', pitch: 'Ten minutes in the garden before the first call.', weekOf: '2026-10-26' }

function whole(handled: string[] = []): WholeContext {
  return toWholeContext({ pile, history, pitches: [pitch], lensGoals: [{ id: 'g1', title: 'Grow food' }], today: '2026-11-03', lastRead: null, handled: new Set(handled) })
}
const items = itemsOf(whole())

const gold = (over = {}) => ({
  itemKey: '2026-11-02:fw', quote: 'The garden keeps asking for my hands.', kind: 'idea', face: 'shaman',
  reason: 'The garden shows up in the first line of the free write, ahead of any plan.', title: 'The garden asks first',
  fate: 'kept', ...over,
})
const compost = (over = {}) => ({
  itemKey: '2026-11-02:b:1', salvage: ['A small repair that wants ten minutes.'], feeds: 'strand:home', lesson: 'Repairs fall away when the morning has no slack for them.', ...over,
})
const pitchCompost = { itemKey: 'pitch:p1', salvage: ['The garden stays; the word-count reading goes.'], feeds: 'lens:g1', lesson: 'A returning word is a weak signal when outreach lines share a verb.' }
const read = (body: object, readThisWeek = false) => planGoldRead(items, [pitch], { gold: [], compost: [pitchCompost], ...body }, '2026-11-03', readThisWeek)
const problems = (r: ReturnType<typeof read>) => ('problems' in r ? r.problems : [])

function testWholeContextJoinsFreeWritesLinesAndSeeds() {
  const w = whole()
  assert.equal(w.mornings.length, 1, 'today is left out')
  const m = w.mornings[0]
  assert.equal(m.freeWrite, FREE)
  assert.equal(m.sealed, true)
  assert.deepEqual(m.lines.map((l) => l.key), ['2026-11-02:b:0', '2026-11-02:b:1'])
  assert.deepEqual(m.seeds.map((s) => [s.key, s.carries, s.lensGoalId]), [['seed:t1', 2, 'g1']])
  assert.deepEqual(itemsOf(w).map((i) => i.key), ['2026-11-02:fw', '2026-11-02:b:0', '2026-11-02:b:1', 'seed:t1', 'pitch:p1'])
}

function testHandledItemsAreLeftOutAndUnhandledStay() {
  const keys = itemsOf(whole(['2026-11-02:fw', '2026-11-02:b:1', 'seed:t1'])).map((i) => i.key)
  assert.deepEqual(keys, ['2026-11-02:b:0', 'pitch:p1'])
}

function testAGoodReadIsPlanned() {
  const r = read({ gold: [gold(), gold({ itemKey: '2026-11-02:b:0', quote: 'Plant the garlic', fate: 'carried', strand: 'home', title: 'Garlic into the bed' })], compost: [compost(), pitchCompost] })
  assert.deepEqual(problems(r), [])
  if (!('plan' in r)) return
  assert.equal(r.plan.weekOf, '2026-11-02')
  assert.deepEqual(r.plan.gold.map((g) => [g.fate, g.strand, g.from, g.day]), [['kept', null, 'freeWrite', '2026-11-02'], ['carried', 'home', 'line', '2026-11-02']])
  assert.deepEqual(r.plan.pitchIds, ['p1'])
  assert.equal(r.plan.compostLine, '2 fragments composted, 1 feeding his lenses and 1 feeding the strands.')
}

function testQuotesMustBeWordForWord() {
  assert.match(problems(read({ gold: [gold({ quote: 'The garden never stops asking.' })] })).join(), /not in 2026-11-02:fw, word for word/)
  assert.match(problems(read({ gold: [gold({ quote: '' })] })).join(), /needs the quote/)
  assert.match(problems(read({ gold: [gold({ itemKey: '2026-09-01:fw' })] })).join(), /not an item/)
  // line breaks in the free write do not break a quote that spans them
  assert.deepEqual(problems(read({ gold: [gold({ quote: 'hands. Ask Maya if she wants', fate: 'kept' })] })), [])
}

function testAtMostFiveAndEachItemOnce() {
  assert.match(problems(read({ gold: Array(6).fill(gold()) })).join(), /at most 5/)
  assert.match(problems(read({ gold: [gold(), gold()] })).join(), /read twice/)
  assert.match(problems(read({ gold: [gold()], compost: [compost({ itemKey: '2026-11-02:fw' }), pitchCompost] })).join(), /read twice/)
}

function testFatesFollowTheRules() {
  // FR-004: carried needs a live strand, or kind ask (which defaults to the morning menu); reserved is never carried
  assert.match(problems(read({ gold: [gold({ fate: 'carried' })] })).join(), /needs a live strand/)
  const ask = read({ gold: [gold({ fate: 'carried', kind: 'ask' })] })
  assert.ok('plan' in ask && ask.plan.gold[0].strand === 'morning-menu')
  assert.match(problems(read({ gold: [gold({ fate: 'carried', strand: 'x', reserved: true })] })).join(), /reserved gold .* is offered, never carried/)
  // FR-006: offered is reserved gold with one move and a strand
  assert.match(problems(read({ gold: [gold({ fate: 'offered', strand: 'x', move: 'Ask her.' })] })).join(), /only reserved gold is offered/)
  assert.match(problems(read({ gold: [gold({ fate: 'offered', reserved: true, strand: 'x' })] })).join(), /carries one move/)
  assert.match(problems(read({ gold: [gold({ fate: 'offered', reserved: true, move: 'Ask her.' })] })).join(), /names the strand/)
  const offered = read({ gold: [gold({ fate: 'offered', reserved: true, strand: 'podcast', move: 'Offer Maya one call about co-hosting.' })] })
  assert.ok('plan' in offered && offered.plan.gold[0].move === 'Offer Maya one call about co-hosting.')
  // kept has no live strand behind it
  assert.match(problems(read({ gold: [gold({ strand: 'home' })] })).join(), /kept gold has no live strand/)
  assert.match(problems(read({ gold: [gold({ fate: 'maybe' })] })).join(), /fate must be/)
}

function testWordsStayHisAndTheReadSpeaksAboutConditions() {
  assert.match(problems(read({ gold: [gold({ title: 'The garden keeps asking for my hands' })] })).join(), /6 words in a row/)
  assert.match(problems(read({ gold: [gold({ reason: 'You keep avoiding the garden.' })] })).join(), /speaks about him/)
  assert.match(problems(read({ gold: [gold({ reason: 'Turn this into a spirit.' })] })).join(), /uc-links-by-hand/)
  assert.match(problems(read({ compost: [compost({ lesson: 'You procrastinate on repairs.' }), pitchCompost] })).join(), /lesson speaks about him/)
}

function testCompostNeedsSalvageAFeedAndALesson() {
  const ps = problems(read({ compost: [compost({ salvage: [], feeds: 'somewhere', lesson: '' }), pitchCompost] })).join()
  assert.match(ps, /salvage/)
  assert.match(ps, /feeds names a lens or a strand/)
  assert.match(ps, /lesson is one sentence/)
}

function testLivePitchesAreCompostedInTheFirstRead() {
  assert.match(problems(read({ compost: [] })).join(), /live pitch "garden".*needs a compost entry/)
  assert.match(problems(read({ gold: [gold({ itemKey: 'pitch:p1', quote: 'Ten minutes' })] })).join(), /not an old pitch/)
}

function testOneReadPerWeek() {
  assert.match(problems(read({ gold: [] }, true)).join(), /read already/)
  assert.match(problems(read({ weekOf: '2026-10-26', gold: [] })).join(), /weekOf must be 2026-11-02/)
}

function testHelpers() {
  assert.equal(weekOf('2026-11-08'), '2026-11-02')
  assert.equal(sharesRun('one two three four five six seven', 'x two three four five six seven y'), true)
  assert.equal(sharesRun('one two three four five six', 'one two three four five'), false)
  assert.equal(compostLineFor([]), 'Nothing was composted this week.')
}

testWholeContextJoinsFreeWritesLinesAndSeeds(); testHandledItemsAreLeftOutAndUnhandledStay(); testAGoodReadIsPlanned()
testQuotesMustBeWordForWord(); testAtMostFiveAndEachItemOnce(); testFatesFollowTheRules()
testWordsStayHisAndTheReadSpeaksAboutConditions(); testCompostNeedsSalvageAFeedAndALesson()
testLivePitchesAreCompostedInTheFirstRead(); testOneReadPerWeek(); testHelpers()
console.log('unchosen read tests passed')
