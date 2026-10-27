import assert from 'node:assert/strict'
import { patternWords, toUnchosen, unchosenPatterns, type UnchosenSessionRow } from '@/lib/tap-the-vein/unchosen'

const row = (day: string, lines: [string, string][], tasks: string[] = [], sealed: string[] = []): UnchosenSessionRow => ({
  sessionDate: new Date(`${day}T00:00:00.000Z`),
  brainstormCandidates: lines.map(([text, fate]) => ({ text, fate })),
  morningMenu: { lines: {}, sealedAt: null, sealed: sealed.map((text) => ({ text })) },
  tasks: tasks.map((originalText) => ({ originalText })),
})

function testChosenLinesAreLeftOut() {
  const lines = toUnchosen(
    [row('2026-10-19', [['Call Tom', 'play'], ['Write the grant', 'play'], ['Clean the garage', 'raw'], ['Old idea', 'composted'], ['Kept line', 'play']], ['call tom'], ['Kept line'])],
    '2026-10-21',
  )
  assert.deepEqual(lines, [
    { day: '2026-10-19', text: 'Write the grant', fate: 'unpicked' },
    { day: '2026-10-19', text: 'Clean the garage', fate: 'raw' },
    { day: '2026-10-19', text: 'Old idea', fate: 'composted' },
  ])
}

function testTodayIsNotJudged() {
  assert.deepEqual(toUnchosen([row('2026-10-21', [['Half formed', 'raw']])], '2026-10-21'), [])
}

function testNewestMorningFirstAndNoRepeatsWithinAMorning() {
  const lines = toUnchosen([row('2026-10-15', [['A', 'raw']]), row('2026-10-18', [['B', 'raw'], ['b', 'raw']])], '2026-10-21')
  assert.deepEqual(lines.map((l) => l.text), ['B', 'A'])
}

function testWordsFoldAndSkipFiller() {
  assert.deepEqual(patternWords("Write the podcast's intro and stop writing emails"), ['write', 'podcast', 'intro', 'stop', 'writing', 'email'])
  assert.deepEqual(patternWords('do it now'), [])
}

function testPatternsCountMorningsNotMentions() {
  const lines = toUnchosen(
    [
      row('2026-10-14', [['Garden beds', 'raw'], ['garden fence', 'raw']]),
      row('2026-10-16', [['Podcast edit', 'raw']]),
      row('2026-10-18', [['Plant the garden', 'composted'], ['Podcast guests', 'raw']]),
      row('2026-10-19', [['Garden again', 'raw']]),
    ],
    '2026-10-21',
  )
  const patterns = unchosenPatterns(lines)
  assert.deepEqual(patterns.map((p) => [p.word, p.days.length]), [['garden', 3], ['podcast', 2]])
  assert.deepEqual(patterns[0].days, ['2026-10-19', '2026-10-18', '2026-10-14'])
  assert.equal(patterns[0].lines.length, 4)
}

function testOneMorningIsNotAPattern() {
  assert.deepEqual(unchosenPatterns(toUnchosen([row('2026-10-18', [['garden', 'raw'], ['garden beds', 'raw']])], '2026-10-21')), [])
}

testChosenLinesAreLeftOut(); testTodayIsNotJudged(); testNewestMorningFirstAndNoRepeatsWithinAMorning()
testWordsFoldAndSkipFiller(); testPatternsCountMorningsNotMentions(); testOneMorningIsNotAPattern()
console.log('unchosen tests passed')
