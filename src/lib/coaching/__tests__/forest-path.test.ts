/**
 * The forest's two ways in: what the visitor found reads back in their own words,
 * the strategy always includes Emotional Alchemy, and the ontology game's hand-off
 * carries a known channel and face and the belief (cf-game-handoff).
 */
import assert from 'node:assert/strict'
import { EMPTY_FOUND, FACES, composeFound, foundLines, readFromGame, strategy } from '../forest-path'

// Nothing found: no lines, the record is only its heading, and the strategy still names Emotional Alchemy.
assert.deepEqual(foundLines(EMPTY_FOUND), [])
assert.equal(composeFound(EMPTY_FOUND), 'What I found')
assert.match(strategy(EMPTY_FOUND).join(' '), /Emotional Alchemy/)

// The game's hand-off: only a known channel and face cross over, with the belief.
assert.deepEqual(readFromGame('#from-game?channel=Anger&face=Amber'), { feeling: 'Anger', face: 'Amber', belief: '', fromGame: true })
assert.deepEqual(readFromGame('#from-game?channel=Rage&face=Plaid'), { feeling: '', face: '', belief: '', fromGame: true })
// The belief crosses too (cf-game-belief overruled), trimmed and capped.
const carried = new URLSearchParams({ channel: 'Fear', face: 'Teal', belief: '  If I rest, it all falls apart.  ' })
assert.equal(readFromGame(`#from-game?${carried}`)?.belief, 'If I rest, it all falls apart.')
assert.equal(readFromGame(`#from-game?belief=${'x'.repeat(900)}`)?.belief.length, 500)
assert.equal(readFromGame('#book'), null)

// The six faces line up with the game's colours.
assert.deepEqual(
  FACES.map((f) => f.colour),
  ['Magenta', 'Red', 'Amber', 'Orange', 'Green', 'Teal'],
)

// A full walk reads back in the order of the walk, trimmed, with nothing invented.
const found = {
  ...EMPTY_FOUND,
  need: '  I want to stop avoiding the hard conversation with my co-founder. ',
  domain: 'career' as const,
  feeling: 'Fear' as const,
  answer: ' losing the company ',
  belief: ' If I push, they leave. ',
  face: 'Green' as const,
}
assert.deepEqual(
  foundLines(found).map((l) => l.label),
  ['What I want help with', 'Where in my life', 'What is in the way', 'The belief at play', 'The help I need'],
)
assert.equal(
  composeFound(found),
  [
    'What I found',
    '',
    'What I want help with: I want to stop avoiding the hard conversation with my co-founder.',
    'Where in my life: career',
    'What is in the way: Fear: losing the company',
    'The belief at play: If I push, they leave.',
    'The help I need: Perspectives (the Diplomat)',
  ].join('\n'),
)
const plan = strategy(found)
assert.equal(plan[0], 'When it comes to your career, we look at the relationships it lives in and what each person needs, you included.')
assert.match(plan[1], /^Underneath, we work your fear with Emotional Alchemy\. Fear’s job/)
assert.equal(plan[2], 'We meet the part of you that believes “If I push, they leave.” and find out what it is protecting.')

console.log('forest-path: ok')
