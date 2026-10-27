import assert from 'node:assert/strict'
import type { UnchosenLine } from '@/lib/tap-the-vein/unchosen'
import { planRead, toPitchViews, weekOf, type LivePitch } from '@/lib/tap-the-vein/unchosen-read'
import { UNCHOSEN_SAMPLE } from '@/lib/tap-the-vein/unchosen-sample'

const pile: UnchosenLine[] = [
  { day: '2026-10-20', text: 'Walk the garden before calls', fate: 'unpicked' },
  { day: '2026-10-17', text: 'Plant the garlic in the back garden', fate: 'raw' },
  { day: '2026-10-14', text: 'Garden beds need a plan', fate: 'composted' },
  { day: '2026-10-13', text: 'Record a podcast intro', fate: 'raw' },
]

const garden = (pitch = 'Put ten minutes in the back garden on the next dry morning.') => ({
  word: 'garden',
  face: 'shaman',
  kernel: 'The garden asks for hands in the morning.',
  pitch,
  quotes: [
    { day: '2026-10-20', text: 'Walk the garden before calls' },
    { day: '2026-10-17', text: 'plant the garlic in the back  garden' },
  ],
})

function problems(r: ReturnType<typeof planRead>): string[] {
  return 'problems' in r ? r.problems : []
}

function testWeekIsKeyedByMonday() {
  assert.equal(weekOf('2026-10-21'), '2026-10-19')
  assert.equal(weekOf('2026-10-19'), '2026-10-19')
  assert.equal(weekOf('2026-10-25'), '2026-10-19')
}

function testAGoodReadPlansOnePitch() {
  const r = planRead(pile, [], [garden()], '2026-10-21')
  assert.ok('plan' in r, problems(r).join('; '))
  assert.equal(r.plan.weekOf, '2026-10-19')
  assert.deepEqual(r.plan.create.map((p) => p.word), ['garden'])
  assert.deepEqual(r.plan.compost, [])
}

function testQuotesMustBeHisLinesFromTwoMornings() {
  const oneDay = { ...garden(), quotes: [garden().quotes[0]] }
  assert.match(problems(planRead(pile, [], [oneDay], '2026-10-21')).join(), /1 morning\(s\)/)
  const madeUp = { ...garden(), quotes: [...garden().quotes, { day: '2026-10-14', text: 'The garden is calling' }] }
  assert.match(problems(planRead(pile, [], [madeUp], '2026-10-21')).join(), /word for word/)
  const otherWord = { ...garden(), quotes: [...garden().quotes, { day: '2026-10-13', text: 'Record a podcast intro' }] }
  assert.match(problems(planRead(pile, [], [otherWord], '2026-10-21')).join(), /does not hold the word "garden"/)
}

function testAtMostFiveAndOnceAWeek() {
  assert.match(problems(planRead(pile, [], Array(6).fill(garden()), '2026-10-21')).join(), /at most 5/)
  assert.match(problems(planRead(pile, [], [garden()], '2026-10-21', true)).join(), /read already/)
}

function testVoiceAndNoConversion() {
  assert.match(problems(planRead(pile, [], [{ ...garden(), kernel: 'You keep avoiding the garden.' }], '2026-10-21')).join(), /speaks about him/)
  assert.match(problems(planRead(pile, [], [garden('Turn the garden lines into a spirit.')], '2026-10-21')).join(), /uc-links-by-hand/)
}

function testAReturningPatternGetsANewPitchAndCompostsTheOld() {
  const live: LivePitch[] = [{ id: 'old', word: 'garden', pitch: 'Sketch the garden beds on paper.', weekOf: '2026-10-12' }]
  assert.match(problems(planRead(pile, live, [garden('Sketch the garden beds on paper.')], '2026-10-21')).join(), /needs a new pitch/)
  const r = planRead(pile, live, [garden()], '2026-10-21')
  assert.ok('plan' in r)
  assert.deepEqual(r.plan.compost.map((c) => [c.id, c.word]), [['old', 'garden']])
}

function testViewsChainTheCompostedPitches() {
  const views = toPitchViews([
    { id: 'a', word: 'garden', face: 'sage', kernel: 'k', pitch: 'First', quotes: [], weekOf: '2026-10-05', status: 'composted', replacedById: 'b' },
    { id: 'b', word: 'garden', face: 'sage', kernel: 'k', pitch: 'Second', quotes: [], weekOf: '2026-10-12', status: 'composted', replacedById: 'c' },
    { id: 'c', word: 'garden', face: 'shaman', kernel: 'k', pitch: 'Third', quotes: [], weekOf: '2026-10-19', status: 'live', replacedById: null },
  ])
  assert.equal(views.length, 1)
  assert.equal(views[0].pitch, 'Third')
  assert.deepEqual(views[0].composted.map((c) => c.pitch), ['Second', 'First'])
}

function testTheSamplePassesItsOwnChecks() {
  const read = UNCHOSEN_SAMPLE.pitches.map(({ word, face, kernel, pitch, quotes }) => ({ word, face, kernel, pitch, quotes }))
  const r = planRead(UNCHOSEN_SAMPLE.lines, [], read, '2026-10-21')
  assert.ok('plan' in r, problems(r).join('; '))
}

testWeekIsKeyedByMonday(); testAGoodReadPlansOnePitch(); testQuotesMustBeHisLinesFromTwoMornings(); testAtMostFiveAndOnceAWeek()
testVoiceAndNoConversion(); testAReturningPatternGetsANewPitchAndCompostsTheOld(); testViewsChainTheCompostedPitches()
testTheSamplePassesItsOwnChecks()
console.log('unchosen read tests passed')
