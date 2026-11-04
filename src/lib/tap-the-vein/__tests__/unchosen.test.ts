import assert from 'node:assert/strict'
import { toUnchosen, type UnchosenSessionRow } from '@/lib/tap-the-vein/unchosen'

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
    { key: '2026-10-19:b:1', day: '2026-10-19', text: 'Write the grant', fate: 'unpicked' },
    { key: '2026-10-19:b:2', day: '2026-10-19', text: 'Clean the garage', fate: 'raw' },
    { key: '2026-10-19:b:3', day: '2026-10-19', text: 'Old idea', fate: 'composted' },
  ])
}

function testTodayIsNotJudged() {
  assert.deepEqual(toUnchosen([row('2026-10-21', [['Half formed', 'raw']])], '2026-10-21'), [])
}

function testNewestMorningFirstAndNoRepeatsWithinAMorning() {
  const lines = toUnchosen([row('2026-10-15', [['A', 'raw']]), row('2026-10-18', [['B', 'raw'], ['b', 'raw']])], '2026-10-21')
  assert.deepEqual(lines.map((l) => l.text), ['B', 'A'])
}

function testKeysAreDayFieldIndexAndStable() {
  // The key's index is the line's place in the brainstorm, so a chosen line before it does not shift the key.
  const lines = toUnchosen([row('2026-10-19', [['Call Tom', 'play'], ['Write the grant', 'play'], ['Clean the garage', 'raw']], ['call tom'])], '2026-10-21')
  assert.deepEqual(lines.map((l) => l.key), ['2026-10-19:b:1', '2026-10-19:b:2'])
}

testChosenLinesAreLeftOut(); testTodayIsNotJudged(); testNewestMorningFirstAndNoRepeatsWithinAMorning()
testKeysAreDayFieldIndexAndStable()
console.log('unchosen tests passed')
